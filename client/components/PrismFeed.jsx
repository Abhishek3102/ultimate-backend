"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { ThumbsUp, MessageCircle, Share2, Info } from "lucide-react";

// ... (imports remain)

const TweetCard = ({ tweet, type, className = "" }) => {
    const borderColor =
        type === "pro"
            ? "border-blue-500/50"
            : type === "anti"
                ? "border-red-500/50"
                : "border-purple-500/50";

    return (
        <div className={`p-4 rounded-xl bg-white/5 border ${borderColor} hover:bg-white/10 transition-colors ${className}`}>
            <div className="flex items-start gap-3 h-full flex-col">
                <div className="flex items-center gap-3 w-full">
                    <img
                        src={tweet.owner?.avatar || "/placeholder.svg"}
                        alt={tweet.owner?.username}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm truncate">
                                {tweet.owner?.fullName || tweet.owner?.username}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 block truncate">@{tweet.owner?.username}</span>
                    </div>
                </div>

                <div className="flex-1 w-full overflow-y-auto custom-scrollbar my-2">
                    <p className="text-gray-200 text-sm whitespace-normal leading-relaxed">{tweet.content}</p>
                </div>

                {/* Metadata & Actions */}
                <div className="w-full pt-2 border-t border-white/5 mt-auto flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full bg-opacity-20 ${type === 'pro' ? 'bg-blue-500 text-blue-300' : type === 'anti' ? 'bg-red-500 text-red-300' : 'bg-purple-500 text-purple-300'}`}>
                            Rat: {tweet.prism_data?.rationality_score || "?"}/10
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
        { type: "pro", title: "Support (Blue Reality)", data: feed.pro, color: "text-blue-400", borderColor: "border-blue-500" },
        { type: "neutral", title: "Nuance (Purple Reality)", data: feed.neutral, color: "text-purple-400", borderColor: "border-purple-500" },
        { type: "anti", title: "Dissent (Red Reality)", data: feed.anti, color: "text-red-400", borderColor: "border-red-500" },
    ];

    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400">
                    Perspective Prism: {topic}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Info size={16} />
                    <span className="hidden md:inline">AI-Sorted by Sentiment</span>
                </div>
            </div>

            {/* Mobile: Stacked Horizontal Sliders (Netflix Style) */}
            <div className="flex md:hidden flex-col flex-1 overflow-y-auto no-scrollbar pb-20">
                {columns.map((col) => (
                    <div key={col.type} className="mb-6 pl-4 border-b border-white/5 pb-4 last:border-0">
                        <h3 className={`font-bold mb-3 ${col.color} text-sm uppercase tracking-wider flex items-center gap-2`}>
                            {col.title}
                            <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-xs">{col.data.length}</span>
                        </h3>

                        <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pr-4 no-scrollbar">
                            {col.data.length > 0 ? (
                                col.data.map((tweet) => (
                                    <TweetCard
                                        key={tweet._id}
                                        tweet={tweet}
                                        type={col.type}
                                        className="min-w-[260px] w-[260px] h-[280px] snap-center flex-shrink-0"
                                    />
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm italic py-4 pl-2">
                                    No posts in this spectrum yet.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Grid Layout (unchanged) */}
            <div className="hidden md:grid md:grid-cols-3 divide-x divide-white/10 min-h-0 relative flex-1">
                {columns.map((col) => (
                    <div
                        key={col.type}
                        className="flex flex-col h-full bg-black/20 w-full"
                    >
                        <div className={`p-3 text-center border-b border-white/5 font-semibold ${col.color} bg-white/5 mx-auto w-full`}>
                            {col.title} <span className="text-xs opacity-70">({col.data.length})</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {col.data.length > 0 ? (
                                col.data.map((tweet) => (
                                    <TweetCard key={tweet._id} tweet={tweet} type={col.type} className="mb-4" />
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
