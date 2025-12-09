"use client";

import React, { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Video, MessageSquare, StickyNote, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { useSpaceStore } from "@/store/useSpaceStore";
import { api } from "@/lib/api";

export default function ContentPortal() {
    const [activeTab, setActiveTab] = useState("media"); // 'media', 'ai'
    const { setBackground } = useSpaceStore();
    const [prompt, setPrompt] = useState("");
    const [items, setItems] = useState({ videos: [], tweets: [] });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState({ type: null, message: "" }); // { type: 'success'|'error', message: '' }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [videosRes, tweetsRes] = await Promise.all([
                    api.getLikedVideos(),
                    api.getLikedTweets()
                ]);

                // If API returns {data: [...]}, extract it. Or if mock returns array directly.
                // Assuming standard { data: [...] } structure based on api.js
                setItems({
                    videos: videosRes.data || [],
                    tweets: tweetsRes.data || []
                });
            } catch (error) {
                console.error("Failed to load portal content:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        setStatus({ type: null, message: "" });

        const encoded = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 10000);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1920&height=1080&nologo=true&seed=${seed}`;

        try {
            const res = await fetch(url);

            if (!res.ok) {
                let errorMsg = "Generation Failed.";
                if (res.status === 502) errorMsg = "Magic Service is Overloaded/Down (502).";
                else if (res.status === 429) errorMsg = "Too many requests. Slow down.";
                else if (res.status === 403 || res.status === 500) errorMsg = "Safety Filter triggered or Server Error.";

                throw new Error(errorMsg);
            }

            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);

            setBackground(objectUrl);
            setGenerating(false);
            setStatus({ type: 'success', message: "World Generated Successfully!" });
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);

        } catch (error) {
            console.error("❌ Magic Generation Error:", error.message);
            console.error("URL:", url);

            setGenerating(false);
            setStatus({ type: 'error', message: error.message || "Failed. See console." });
        }
    };

    return (
        <div className="w-80 h-full bg-[#0f111a] border-r border-white/10 flex flex-col z-20 shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab("media")}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "media" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-white"}`}
                >
                    My Collection
                </button>
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "ai" ? "text-pink-400 border-b-2 border-pink-400" : "text-gray-400 hover:text-white"}`}
                >
                    Magic Atmosphere
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === "media" ? (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Drag to Canvas</p>

                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="animate-spin text-purple-500" />
                            </div>
                        ) : (
                            <>
                                {/* Sticky Note (Always available) */}
                                <DraggableItem type="note" id="new-note" label="New Sticky Note" icon={StickyNote} color="text-yellow-400" />

                                {/* Videos */}
                                {items.videos.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-600 font-semibold mt-4">Liked Videos</p>
                                        {items.videos.map((vid) => {
                                            if (!vid.video) return null;
                                            return (
                                                <DraggableItem
                                                    key={vid._id}
                                                    type="video"
                                                    id={vid.video._id}
                                                    label={vid.video.title || "Untitled Video"}
                                                    icon={Video}
                                                    color="text-red-400"
                                                    metadata={{
                                                        title: vid.video.title,
                                                        thumbnail: vid.video.thumbnail,
                                                        url: vid.video.videoFile || vid.video.url, // Corrected field name
                                                        description: vid.video.description
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Tweets */}
                                {items.tweets.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-600 font-semibold mt-4">Liked Tweets</p>
                                        {items.tweets.map((tweet) => {
                                            if (!tweet.tweet) return null;
                                            return (
                                                <DraggableItem
                                                    key={tweet._id}
                                                    type="tweet"
                                                    id={tweet.tweet._id}
                                                    label={(tweet.tweet.content || "").substring(0, 30) + "..."}
                                                    icon={MessageSquare}
                                                    color="text-blue-400"
                                                    metadata={{
                                                        content: tweet.tweet.content,
                                                        owner: tweet.tweet.owner?.username
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {items.videos.length === 0 && items.tweets.length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-4">
                                        No liked items found. Go browse and like some content!
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-3 text-pink-300">
                                <Sparkles size={18} />
                                <h3 className="font-semibold">Atmosphere Generator</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                Describe the vibe you want for this space. The Magic Engine will create a unique atmosphere.
                            </p>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Cyberpunk loft with neon lights, cozy rainy cafe in Tokyo..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 min-h-[100px] mb-3 resize-none"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-medium hover:shadow-lg hover:shadow-pink-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                {generating ? "Generating World..." : "Generate Magic"}
                            </button>

                            {status.message && (
                                <div className={`text-xs text-center p-2 rounded border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                    {status.message}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableItem({ type, id, label, icon: Icon, color, metadata = {} }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `portal-${type}-${id}`,
        data: { type, contentId: id, metadata } // Pass metadata
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 9999, // Ensure it floats above everything
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-grab hover:bg-white/10 hover:border-white/20 active:cursor-grabbing transition-all select-none"
        >
            <div className={`p-2 bg-white/5 rounded-md ${color}`}>
                <Icon size={20} />
            </div>
            <span className="text-gray-300 text-sm font-medium">{label}</span>
        </div>
    );
}
