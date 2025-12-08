"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { ThumbsUp, MessageCircle, Share2, Info } from "lucide-react";

const TweetCard = ({ tweet, type }) => {
    const borderColor =
        type === "pro"
            ? "border-blue-500/50"
            : type === "anti"
                ? "border-red-500/50"
                : "border-purple-500/50";

    return (
        <div className={`p-4 rounded-xl bg-white/5 border ${borderColor} mb-4 hover:bg-white/10 transition-colors`}>
            <div className="flex items-start gap-3">
                <img
                    src={tweet.owner?.avatar || "/placeholder.svg"}
                    alt={tweet.owner?.username}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                            {tweet.owner?.fullName || tweet.owner?.username}
                        </span>
                        <span className="text-xs text-gray-400">@{tweet.owner?.username}</span>
                    </div>
                    <p className="text-gray-200 text-sm mb-3">{tweet.content}</p>

                    {/* Metadata Badge */}
                    <div className="flex items-center gap-2 text-xs mb-3">
                        <span className={`px-2 py-0.5 rounded-full bg-opacity-20 ${type === 'pro' ? 'bg-blue-500 text-blue-300' : type === 'anti' ? 'bg-red-500 text-red-300' : 'bg-purple-500 text-purple-300'}`}>
                            Rationality: {tweet.prism_data?.rationality_score || "?"}/10
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 text-xs">
                        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                            <ThumbsUp size={14} /> {tweet.likesCount || 0}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function PrismFeed({ topic, type = 'hashtag' }) {
    const [feed, setFeed] = useState({ pro: [], anti: [], neutral: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            if (topic) {
                const res = await api.getPrismFeed(topic, type);
                if (res.data) {
                    setFeed(res.data);
                }
            }
            setLoading(false);
        };
        fetchFeed();
    }, [topic, type]);

    if (loading) {
        return <div className="text-center p-10 text-gray-400">Analyzing Perspectives...</div>;
    }

    const columns = [
        { type: "pro", title: "Support (Blue Reality)", data: feed.pro, color: "text-blue-400" },
        { type: "neutral", title: "Nuance (Purple Reality)", data: feed.neutral, color: "text-purple-400" },
        { type: "anti", title: "Dissent (Red Reality)", data: feed.anti, color: "text-red-400" },
    ];

    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400">
                    Perspective Prism: {topic}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Info size={16} />
                    <span>AI-Sorted by Sentiment</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-0">
                {columns.map((col) => (
                    <div key={col.type} className="flex flex-col h-full bg-black/20">
                        <div className={`p-3 text-center border-b border-white/5 font-semibold ${col.color} bg-white/5`}>
                            {col.title} ({col.data.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {col.data.length > 0 ? (
                                col.data.map((tweet) => (
                                    <TweetCard key={tweet._id} tweet={tweet} type={col.type} />
                                ))
                            ) : (
                                <div className="text-center text-gray-500 mt-10 text-sm">
                                    No posts in this spectrum yet.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
