"use client";

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { useDroppable } from "@dnd-kit/core";
import { useSpaceStore } from "@/store/useSpaceStore";
import { Video, MessageSquare, StickyNote, PlaySquare, Move, Sparkles, Loader2, Play, Pause, Volume2, VolumeX, Trash2, Wand2, Radio } from "lucide-react";
import { api } from "@/lib/api";
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import MiniMap from "./MiniMap";

// Context to manage video refs for spatial audio optimization
const VideoAudioContext = createContext({
    registerVideo: (id, ref) => { },
    unregisterVideo: (id) => { }
});

export default function InfiniteCanvas() {
    const { nodes, connections, addConnection, backgroundUrl } = useSpaceStore();
    const { setNodeRef } = useDroppable({
        id: 'canvas-droppable',
    });

    // Registry for video elements to update volume imperatively
    const videoRefs = useRef(new Map());

    const registerVideo = useCallback((id, ref) => {
        if (ref) videoRefs.current.set(id, ref);
    }, []);

    const unregisterVideo = useCallback((id) => {
        videoRefs.current.delete(id);
    }, []);

    // Magic Layout & Broadcast Logic
    const [broadcastId, setBroadcastId] = useState(null);
    const { addNode, setBackground } = useSpaceStore(); // Need access to actions

    const handleGenerateLayout = () => {
        // "Magic Layout" Logic
        const theme = "lofi";

        // 1. Set Mood
        setBackground("lo-fi study room raining night neon");

        // 2. Clear existing (optional, but let's just append for now to be safe)
        // 3. Add Curated Content
        const collectionId = Date.now();

        // Central Video
        addNode('video', null, { x: 0, y: 0 }, {
            url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Lofi Girl
            title: "Lo-Fi Girl Live",
            description: "Curated: Focus Stream"
        });

        // Ambient Video 1
        setTimeout(() => {
            addNode('video', null, { x: -400, y: -100 }, {
                url: "https://www.youtube.com/watch?v=5qap5aO4i9A", // Lofi Hip Hop
                title: "Chill Beats",
                description: "Curated: Background"
            });
        }, 200);

        // Sticky Note Quote
        setTimeout(() => {
            addNode('note', null, { x: 350, y: 50 }, {
                title: "“The quieter you become, the more you are able to hear.”\n\n- Rumi"
            });
        }, 400);
    };

    // Connections State
    // connections are now in store
    const [connectionMode, setConnectionMode] = useState(false);
    const [connectionStart, setConnectionStart] = useState(null); // { nodeId, x, y }

    // Start connecting from a node
    const startConnection = (nodeId, x, y) => {
        if (!connectionMode) return;
        setConnectionStart({ nodeId, x, y });
    };

    // Complete connection to another node
    const completeConnection = (targetNodeId) => {
        if (!connectionStart || connectionStart.nodeId === targetNodeId) return;

        addConnection(connectionStart.nodeId, targetNodeId);

        setConnectionStart(null);
        // setConnectionMode(false); // Keep mode on for rapid connecting
    };

    // Render Connections (SVG Layer)
    const renderConnections = () => {
        return connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            // Simple center-to-center for now. 
            // Better: Edge-to-edge calculation.
            const fromX = fromNode.position.x + 150; // Center of 300px
            const fromY = fromNode.position.y + 100; // Center of 200px
            const toX = toNode.position.x + 150;
            const toY = toNode.position.y + 100;

            return (
                <line
                    key={conn.id}
                    x1={fromX} y1={fromY}
                    x2={toX} y2={toY}
                    stroke="#a855f7"
                    strokeWidth="4"
                    strokeDasharray="5,5"
                    className="opacity-50 animate-pulse"
                    markerEnd="url(#arrowhead)"
                />
            );
        });
    };

    // Sync Logic: Coordinate playback between connected nodes
    const handleSyncAction = useCallback((sourceId, action, payload) => {
        // Find all nodes connected to the source
        const connectedNodes = [];
        connections.forEach(conn => {
            if (conn.from === sourceId) connectedNodes.push(conn.to);
            if (conn.to === sourceId) connectedNodes.push(conn.from);
        });

        // unique nodes
        const uniqueTargets = [...new Set(connectedNodes)];

        uniqueTargets.forEach(targetId => {
            const videoEl = videoRefs.current.get(targetId);
            if (!videoEl) return;

            // Prevent infinite loops by checking current state
            if (action === 'play' && videoEl.paused) {
                videoEl.play().catch(e => console.error("Sync play error:", e));
            } else if (action === 'pause' && !videoEl.paused) {
                videoEl.pause();
            } else if (action === 'seek') {
                const diff = Math.abs(videoEl.currentTime - payload);
                if (diff > 0.5) { // Only seek if difference is significant > 0.5s
                    videoEl.currentTime = payload;
                }
            }
        });
    }, [connections]);

    // Imperative Volume Update Logic
    const handleTransform = useCallback((ref) => {
        if (!ref.state) return;
        const { positionX, positionY, scale } = ref.state;

        // Viewport Center in Canvas Coords
        const vpCenterX = (-positionX + window.innerWidth / 2) / scale;
        const vpCenterY = (-positionY + window.innerHeight / 2) / scale;

        const maxDist = 1500;
        const minDist = 300;

        videoRefs.current.forEach((videoEl, id) => {
            if (!videoEl) return;

            // Get node position from store (not super efficient but okay for <50 nodes)
            const node = useSpaceStore.getState().nodes.find(n => n.id === id);
            if (!node) return;

            const nodeWidth = 300;
            const nodeHeight = 200;
            const nodeCenterX = node.position.x + (nodeWidth / 2);
            const nodeCenterY = node.position.y + (nodeHeight / 2);

            const dist = Math.sqrt(Math.pow(vpCenterX - nodeCenterX, 2) + Math.pow(vpCenterY - nodeCenterY, 2));

            let vol = 0;
            if (dist < minDist) vol = 1;
            else if (dist > maxDist) vol = 0;
            else {
                vol = 1 - ((dist - minDist) / (maxDist - minDist));
            }

            // Imperatively update volume
            videoEl.volume = vol;
        });

    }, []);

    return (
        <VideoAudioContext.Provider value={{ registerVideo, unregisterVideo }}>
            <div
                ref={setNodeRef}
                className="w-full h-screen bg-[#050510] relative overflow-hidden transition-all duration-500"
                style={{
                    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={0.1}
                    maxScale={4}
                    centerOnInit={true}
                    limitToBounds={false}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ disabled: true }}
                    panning={{ velocityDisabled: true }}
                    onTransformed={handleTransform} // Trigger audio update on every move
                    onPanning={handleTransform}
                    onZooming={handleTransform}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            {/* Overlay Controls */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
                                <button
                                    onClick={() => setConnectionMode(!connectionMode)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-2 ${connectionMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50 scale-105 ring-2 ring-purple-400' : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800 hover:scale-105 hover:text-white'}`}
                                >
                                    {connectionMode ? <Sparkles size={18} className="animate-spin-slow" /> : <Move size={18} />}
                                    {connectionMode ? "Connecting..." : "Draw Connection"}
                                </button>

                                <button
                                    onClick={handleGenerateLayout}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Wand2 size={18} />
                                    Magic Layout
                                </button>
                            </div>

                            <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 select-none">
                                <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 text-white">+</button>
                                <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 text-white">-</button>
                                <button onClick={() => resetTransform()} className="px-3 h-8 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 text-white text-xs">Reset</button>
                            </div>

                            <TransformComponent
                                wrapperClass="w-full h-full"
                                contentClass="w-full h-full"
                            >
                                <div
                                    className="w-[5000px] h-[5000px] relative" // Large virtual space
                                    style={{
                                        // Subtle grid pattern overlay
                                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                        backgroundSize: '40px 40px'
                                    }}
                                >
                                    {/* Link Layer (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                        <defs>
                                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                                <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
                                            </marker>
                                        </defs>
                                        {renderConnections()}
                                    </svg>

                                    {nodes.map((node) => (
                                        <CanvasNode
                                            key={node.id}
                                            node={node}
                                            connectionMode={connectionMode}
                                            onConnectStart={startConnection}
                                            onConnectEnd={completeConnection}
                                            onSyncAction={handleSyncAction}
                                            isBroadcasting={broadcastId === node.id}
                                            isDimmed={broadcastId !== null && broadcastId !== node.id}
                                            onToggleBroadcast={() => setBroadcastId(broadcastId === node.id ? null : node.id)}
                                        />
                                    ))}
                                </div>
                            </TransformComponent>

                            {/* Visual Navigation Radar */}
                            <MiniMap nodes={nodes} />
                        </>
                    )}
                </TransformWrapper>
            </div>
        </VideoAudioContext.Provider>
    );
}

// Sub-component for individual nodes
function CanvasNode({ node, connectionMode, onConnectStart, onConnectEnd, onSyncAction, isBroadcasting, isDimmed, onToggleBroadcast }) {
    const { updateNode, addNode, removeNode } = useSpaceStore();
    const { transformState } = useTransformContext(); // Access scale
    const [isDragging, setIsDragging] = useState(false);

    // Sticky Note Editing
    const [isEditing, setIsEditing] = useState(false);
    const [noteContent, setNoteContent] = useState(node.data?.title || "");

    // Audio Context
    const { registerVideo, unregisterVideo } = useContext(VideoAudioContext);
    const audioRef = useRef(null);

    const nodeRef = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 }); // Mouse pos
    const initialNodePos = useRef({ x: 0, y: 0 }); // Node pos on start

    // Register video for spatial audio
    useEffect(() => {
        if (node.type === 'video' && audioRef.current) {
            registerVideo(node.id, audioRef.current);
            return () => unregisterVideo(node.id);
        }
    }, [node.type, node.id, registerVideo, unregisterVideo]);

    // Auto-Heal: Fetch missing video URL if needed
    useEffect(() => {
        if (node.type === 'video' && (!node.data?.url && !node.data?.videoFile)) {
            const fetchVideoDetails = async () => {
                if (!node.contentId) return;
                try {
                    const res = await api.getVideoById(node.contentId);
                    if (res.data) {
                        // Auto-update the node with correct data
                        updateNode(node.id, {
                            data: {
                                ...node.data,
                                url: res.data.videoFile,
                                thumbnail: res.data.thumbnail,
                                title: res.data.title,
                                description: res.data.description
                            }
                        });
                    }
                } catch (err) {
                    console.error("Failed to auto-heal video node:", err);
                }
            };
            fetchVideoDetails();
        }
    }, [node.type, node.data, node.contentId, node.id, updateNode]);


    // Simple pointer drag handler
    const handlePointerDown = (e) => {
        e.stopPropagation();

        // CONNECTION LOGIC
        if (connectionMode) {
            onConnectStart(node.id, node.position.x, node.position.y);
            onConnectEnd(node.id); // Try completing if we are the second node
            return;
        }

        // If editing a note, don't drag
        if (isEditing) return;

        e.preventDefault();

        // Capture initial state
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialNodePos.current = { x: node.position.x, y: node.position.y };

        // Bring to front
        updateNode(node.id, { zIndex: Date.now() });

        // Add global listeners
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
        // Calculate delta
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        // Apply scale correction
        const scale = transformState.scale || 1;

        const newX = initialNodePos.current.x + (deltaX / scale);
        const newY = initialNodePos.current.y + (deltaY / scale);

        updateNode(node.id, { position: { x: newX, y: newY } });
        // NOTE: updateNode saves to store, which triggers re-render.
        // We rely on this re-render to update the handleTransform state in parent?
        // Actually, handleTransform reads from store state directly via getState().
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        removeNode(node.id);
    };

    const handleSaveNote = () => {
        setIsEditing(false);
        if (node.type === 'note') {
            updateNode(node.id, { data: { ...node.data, title: noteContent } });
        }
    };

    // Metadata extraction
    const title = node.data?.title || node.data?.content || "Untitled";
    const thumbnail = node.data?.thumbnail;
    const owner = node.data?.owner;

    // Video Event Handlers for Sync
    const handlePlay = () => onSyncAction && onSyncAction(node.id, 'play');
    const handlePause = () => onSyncAction && onSyncAction(node.id, 'pause');
    const handleSeeked = (e) => onSyncAction && onSyncAction(node.id, 'seek', e.target.currentTime);

    // Determine video source
    const videoSrc = node.data?.url || node.data?.videoFile;

    return (
        <div
            ref={nodeRef}
            className="absolute group"
            style={{
                left: node.position.x,
                top: node.position.y,
                zIndex: node.zIndex,
                transform: `scale(${node.scale}) rotate(${node.rotation}deg)`,
                cursor: connectionMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
                opacity: isDimmed ? 0.3 : 1,
                filter: isDimmed ? 'grayscale(80%) blur(1px)' : 'none',
                transition: 'all 0.5s ease-in-out'
            }}
        >
            {/* Broadcast Halo */}
            {isBroadcasting && (
                <div className="absolute inset-0 -m-8 border-4 border-red-500/50 rounded-3xl animate-pulse pointer-events-none z-0" />
            )}

            {/* Selection/Hover Halo */}
            <div className={`absolute inset-0 -m-2 border-2 rounded-xl transition-all pointer-events-none ${isDragging ? 'border-purple-500' : 'border-transparent group-hover:border-purple-500/30'} ${connectionMode ? 'group-hover:border-green-400 group-hover:scale-105' : ''}`} />

            {/* Content Container */}
            <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl relative select-none max-w-[320px]">

                {/* Drag Handle & Controls */}
                <div
                    onPointerDown={handlePointerDown}
                    className={`h-8 flex items-center justify-between px-3 transition-colors cursor-move border-b border-white/5 ${connectionMode ? 'bg-purple-900/50 hover:bg-purple-800/50 cursor-crosshair' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    </div>

                    {/* Broadcast Button */}
                    {node.type === 'video' && (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={onToggleBroadcast}
                            className={`p-1 rounded-md transition-all mr-2 ${isBroadcasting ? 'text-red-400 bg-red-900/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            title="Broadcast Mode"
                        >
                            <Radio size={14} />
                        </button>
                    )}

                    {/* Delete Button */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleDelete}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-all"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Media Content */}
                <div className="p-0">
                    {node.type === 'video' && (
                        <div className="flex flex-col">
                            {/* Video Player Wrapper */}
                            <div
                                className="aspect-video w-full bg-black relative group flex items-center justify-center"
                                onPointerDown={(e) => e.stopPropagation()} // Stop propagation so click on video doesn't drag node
                            >
                                {videoSrc ? (
                                    <>
                                        <video
                                            ref={audioRef}
                                            src={videoSrc}
                                            className="w-full h-full object-cover"
                                            controls
                                            playsInline
                                            crossOrigin="anonymous"
                                            onPlay={handlePlay}
                                            onPause={handlePause}
                                            onSeeked={handleSeeked}
                                        />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Loader2 className="animate-spin" />
                                        <span className="text-xs">Repairing Video...</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-[#050510]">
                                <span className="text-sm font-medium text-gray-200 line-clamp-1">{title}</span>
                                <span className="text-xs text-gray-500 block truncate mt-0.5">{node.data?.description || "No description"}</span>
                            </div>
                        </div>
                    )}

                    {node.type === 'tweet' && (
                        <div className="p-4 flex flex-col gap-2 min-w-[250px]">
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare size={16} className="text-blue-400" />
                                <span className="text-xs text-blue-300 font-medium">@{owner || 'user'}</span>
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed font-normal">"{title}"</p>
                        </div>
                    )}

                    {node.type === 'note' && (
                        <div
                            className="w-[220px] min-h-[180px] bg-[#fff9c4] text-gray-800 font-handwriting relative group"
                            onDoubleClick={() => setIsEditing(true)}
                        >
                            {isEditing ? (
                                <textarea
                                    autoFocus
                                    onPointerDown={(e) => e.stopPropagation()}
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    onBlur={handleSaveNote}
                                    className="w-full h-full p-4 bg-transparent border-none focus:outline-none resize-none text-base leading-relaxed placeholder-gray-500/50 font-sans"
                                    placeholder="Type your note here..."
                                    style={{ fontFamily: 'inherit' }}
                                />
                            ) : (
                                <div className="w-full h-full p-4 whitespace-pre-wrap text-base leading-relaxed">
                                    {title && title !== "Untitled" ? title : <span className="text-gray-400 italic">Double click to edit...</span>}
                                </div>
                            )}

                            {/* Note Corner Fold Visual */}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-black/5 -translate-x-full -translate-y-full origin-bottom-right rotate-45 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
