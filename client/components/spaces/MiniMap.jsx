"use client";

import React from "react";
import { useTransformContext } from "react-zoom-pan-pinch";

const CANVAS_SIZE = 5000;
const MAP_SIZE = 150; // Size of the mini-map in pixels
const SCALE_FACTOR = MAP_SIZE / CANVAS_SIZE;

export default function MiniMap({ nodes }) {
    const { transformState, setTransform } = useTransformContext();
    const { positionX, positionY, scale } = transformState;

    // Viewport Calculations (What part of canvas is visible)
    // We assume viewport size is window size roughly (or container size)
    // ReactZoomPanPinch usually stores this in context, but for MVP we approximate based on generic screen
    // Better: Get wrapper dimensions if possible, or just default to 1920x1080 for calc
    const viewportWidth = (typeof window !== 'undefined' ? window.innerWidth : 1920) / scale;
    const viewportHeight = (typeof window !== 'undefined' ? window.innerHeight : 1080) / scale;

    const viewportX = -positionX / scale;
    const viewportY = -positionY / scale;

    const mapViewportX = viewportX * SCALE_FACTOR;
    const mapViewportY = viewportY * SCALE_FACTOR;
    const mapViewportW = viewportWidth * SCALE_FACTOR;
    const mapViewportH = viewportHeight * SCALE_FACTOR;

    const handleMapClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert map coord to canvas coord
        const targetX = x / SCALE_FACTOR;
        const targetY = y / SCALE_FACTOR;

        // Center on click
        const newX = -targetX * scale + (window.innerWidth / 2);
        const newY = -targetY * scale + (window.innerHeight / 2);

        setTransform(newX, newY, scale, 300, "easeOut");
    };

    return (
        <div
            className="absolute bottom-6 right-6 w-[150px] h-[150px] bg-gray-900/80 backdrop-blur border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden cursor-crosshair hover:border-purple-500/50 transition-colors"
            onClick={handleMapClick}
        >
            {/* Grid Preview */}
            <div className="absolute inset-0 opacity-20 bg-grid-pattern [background-size:2px_2px]" />

            {/* Nodes */}
            {nodes.map(node => (
                <div
                    key={node.id}
                    className={`absolute rounded-full shadow-sm ${node.type === 'video' ? 'bg-red-500 w-1.5 h-1.5' :
                            node.type === 'tweet' ? 'bg-blue-400 w-1.5 h-1.5' :
                                'bg-yellow-400 w-1 h-1'
                        }`}
                    style={{
                        left: node.position.x * SCALE_FACTOR,
                        top: node.position.y * SCALE_FACTOR,
                    }}
                />
            ))}

            {/* Viewport Rect (The User's Camera) */}
            <div
                className="absolute border-2 border-purple-500 bg-purple-500/10 transition-all duration-75"
                style={{
                    left: mapViewportX,
                    top: mapViewportY,
                    width: mapViewportW,
                    height: mapViewportH,
                }}
            />
        </div>
    );
}
