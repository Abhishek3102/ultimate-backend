"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, MouseSensor, TouchSensor, useDroppable } from "@dnd-kit/core";
import { useSpaceStore } from "@/store/useSpaceStore";
import InfiniteCanvas from "@/components/spaces/InfiniteCanvas";
import ContentPortal from "@/components/spaces/ContentPortal";
import { Video, MessageSquare, StickyNote } from "lucide-react";

export default function SpacePage() {
    const { spaceId } = useParams();
    const { setActiveSpace, addNode } = useSpaceStore();
    const [activeDragItem, setActiveDragItem] = React.useState(null);
    const [toast, setToast] = React.useState(null); // { message: string }

    useEffect(() => {
        if (spaceId) {
            setActiveSpace(spaceId);
        }
    }, [spaceId, setActiveSpace]);

    const handleDragStart = (event) => {
        setActiveDragItem(event.active.data.current);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        // Accept drop if over canvas-droppable OR if using pointerWithin which just checks coordinate
        // But we rely on 'over' which requires a collision.
        // If 'over' is null, it means no DropZone was detected.

        if (active.data.current) {
            const data = active.data.current;
            // Drop anywhere logic: Random offset near center for now.
            // In future, map screen coordinates to canvas space.
            const randomOffset = () => (Math.random() - 0.5) * 400;

            addNode(
                data.type,
                data.contentId,
                { x: 400 + randomOffset(), y: 400 + randomOffset() },
                data.metadata // Pass metadata
            );
            setToast({ message: "Item dropped successfully!" });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 0, // Instant
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        })
    );

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={pointerWithin} // Robust detection
            sensors={sensors}
        >
            <div className="flex h-screen bg-[#050510] overflow-hidden pt-[110px]">
                {/* Sidebar Portal */}
                <ContentPortal />

                {/* Main Canvas Area */}
                <div className="flex-1 relative">
                    <GlobalDroppable>
                        <InfiniteCanvas />
                    </GlobalDroppable>

                    {/* Header Overlay */}
                    <div className="absolute top-4 left-4 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none select-none">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-white font-medium text-sm">Space ID: <span className="font-mono text-gray-400">{spaceId.slice(0, 8)}...</span></span>
                    </div>

                    {toast && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-6 py-2 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                            {toast.message}
                        </div>
                    )}
                </div>

                {/* Global Drag Overlay (Visual feedback while dragging) */}
                <DragOverlay dropAnimation={null} zIndex={99999}>
                    {activeDragItem ? (
                        <div className="flex items-center gap-3 p-3 bg-purple-600/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl skew-x-[-12deg] scale-105 pointer-events-none">
                            <div className="p-2 bg-white/10 rounded-md text-white">
                                {activeDragItem.type === 'video' && <Video size={20} />}
                                {activeDragItem.type === 'tweet' && <MessageSquare size={20} />}
                                {activeDragItem.type === 'note' && <StickyNote size={20} />}
                            </div>
                            <span className="text-white text-sm font-bold">Dropping...</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}


function GlobalDroppable({ children }) {
    const { setNodeRef } = useDroppable({
        id: 'global-dropzone',
    });

    return (
        <div ref={setNodeRef} className="absolute inset-0 z-0 select-none">
            {children}
        </div>
    );
}
