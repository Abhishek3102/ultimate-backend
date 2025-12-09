import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';

export const useSpaceStore = create((set, get) => ({
    activeSpaceId: null,
    backgroundUrl: null,
    nodes: [],
    connections: [],
    isLoading: false,

    setActiveSpace: async (spaceId) => {
        set({ activeSpaceId: spaceId, isLoading: true });
        
        try {
            // Attempt to fetch from API
            const res = await api.getSpaceById(spaceId).catch(err => null);

            if (res && res.data) {
                set({
                    nodes: res.data.canvasState || [],
                    connections: res.data.connections || [], // Load connections
                    backgroundUrl: res.data.backgroundUrl || null,
                    isLoading: false
                });
            } else {
                console.warn("Space not found or loading error, starting fresh/empty");
                set({ nodes: [], connections: [], backgroundUrl: null, isLoading: false });
            }
        } catch (error) {
            console.error("Error loading space:", error);
            set({ nodes: [], connections: [], backgroundUrl: null, isLoading: false });
        }
    },

    addNode: (type, contentId, position = { x: 0, y: 0 }, data = {}) => {
        const newNode = {
            id: uuidv4(),
            type,
            contentId,
            position,
            scale: 1,
            rotation: 0,
            zIndex: get().nodes.length + 1,
            data
        };
        
        const newNodes = [...get().nodes, newNode];
        set({ nodes: newNodes });
        get().saveSpace();
    },

    updateNode: (id, updates) => {
        const newNodes = get().nodes.map((node) =>
            node.id === id ? { ...node, ...updates } : node
        );
        set({ nodes: newNodes });
        get().saveSpace();
    },

    removeNode: (id) => {
        const newNodes = get().nodes.filter((node) => node.id !== id);
        // Also remove associated connections
        const newConnections = get().connections.filter(c => c.from !== id && c.to !== id);
        set({ nodes: newNodes, connections: newConnections });
        get().saveSpace();
    },

    addConnection: (fromId, toId) => {
        const newConn = { id: Date.now(), from: fromId, to: toId };
        // Check for duplicates
        const exists = get().connections.some(c => 
            (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
        );
        if (exists) return;

        set(state => ({ connections: [...state.connections, newConn] }));
        get().saveSpace();
    },

    removeConnection: (connId) => {
        set(state => ({ connections: state.connections.filter(c => c.id !== connId) }));
        get().saveSpace();
    },

    setBackground: (prompt) => {
         // Using Pollinations.ai for free generation
        const encoded = encodeURIComponent(prompt);
        // Add random seed to ensure uniqueness and force reload
        const seed = Math.floor(Math.random() * 10000);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1920&height=1080&nologo=true&seed=${seed}`;
        
        set({ backgroundUrl: url });
        get().saveSpace();
    },

    saveSpace: async () => {
        const { activeSpaceId, nodes, connections, backgroundUrl } = get();
        if (!activeSpaceId) {
            console.warn("Skipping save: No activeSpaceId");
            return;
        }

        console.log("Saving Space...", { activeSpaceId, nodesCount: nodes.length, connectionsCount: connections.length }); // Debug

        try {
            await api.updateSpaceState(activeSpaceId, {
                nodes, // Kept as 'nodes' in common logic, 'canvasState' in DB if needed mapping
                // We might need to ensure backend accepts 'connections' field if strict schema.
                // Assuming it stores flexible JSON or we'll pack it.
                // If backend only has 'canvasState', we might need to pack updates.
                // But for now, let's assume updateSpaceState passes body directly.
                canvasState: nodes, // redundant mapping based on prior observation
                connections,
                backgroundUrl
            });
            console.log("Space saved successfully!");
        } catch (error) {
            console.error("Failed to save space state", error);
        }
    }
}));
