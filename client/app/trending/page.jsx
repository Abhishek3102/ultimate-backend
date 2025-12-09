"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import PrismFeed from "@/components/PrismFeed"; // Ensure this path is correct based on where you put it
import { TrendingUp, Hash } from "lucide-react";

export default function TrendingPage() {
    const [trends, setTrends] = useState({});
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            const res = await api.getTrendingTopics();
            if (res.data) {
                setTrends(res.data);
                // Select first trend (from first category) by default if available
                const categories = Object.keys(res.data);
                if (categories.length > 0 && res.data[categories[0]] && res.data[categories[0]].length > 0) {
                    setSelectedTopic(res.data[categories[0]][0]._id);
                }
            }
            setLoading(false);
        };
        fetchTrends();
    }, []);

    return (
        <div className="flex h-screen bg-black pt-24 overflow-hidden"> {/* Increased padding-top to pt-24 for safe area */}
            {/* Sidebar: Trending List (Desktop) */}
            <div className="hidden md:flex w-80 border-r border-white/10 flex-col bg-zinc-900/50">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-purple-500" /> Trending Topics
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading trends...</div>
                    ) : Object.keys(trends).length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No trending topics yet. Start chatting!</div>
                    ) : (
                        Object.entries(trends).map(([category, topics]) => (
                            <div key={category} className="mb-4">
                                <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    {category}
                                    <span className="bg-white/10 px-1.5 rounded-full text-[10px] text-gray-300">{topics.length}</span>
                                </h3>
                                <div className="space-y-1">
                                    {topics.map((trend) => (
                                        <button
                                            key={trend._id}
                                            onClick={() => setSelectedTopic(trend._id)}
                                            className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between group mx-2 w-[calc(100%-1rem)] ${selectedTopic === trend._id
                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <span className="font-medium flex items-center gap-2 truncate">
                                                <Hash size={13} className="opacity-50 flex-shrink-0" />
                                                {trend._id.replace('#', '')}
                                            </span>
                                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 group-hover:bg-white/10">
                                                {trend.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area: Prism Feed */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 to-black relative">
                {/* Mobile Trending Tabs (Horizontal Scroll) */}
                <div className="md:hidden overflow-x-auto p-4 flex gap-2 border-b border-white/10 bg-black/20 backdrop-blur-md">
                    {Object.values(trends).flat().map((trend) => (
                        <button
                            key={trend._id}
                            onClick={() => setSelectedTopic(trend._id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTopic === trend._id
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                : "bg-white/10 text-gray-400 border border-white/5"
                                }`}
                        >
                            #{trend._id.replace('#', '')}
                        </button>
                    ))}
                </div>

                {selectedTopic ? (
                    <PrismFeed topic={selectedTopic} />
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-gray-500">
                        <TrendingUp size={48} className="mb-4 opacity-20" />
                        <p>Select a trending topic to view the Prism.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
