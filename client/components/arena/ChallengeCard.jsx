"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Clock, Users, ArrowRight } from "lucide-react";

export default function ChallengeCard({ challenge }) {
    const [timeLeft, setTimeLeft] = useState("");

    // Simple countdown logic
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(challenge.endDate).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft("Ended");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            setTimeLeft(days > 0 ? `${days}d ${hours}h left` : `${hours}h left`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [challenge.endDate]);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="relative bg-gray-900 border border-purple-500/20 rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col h-full"
        >
            {/* Banner Image */}
            <div className="h-40 bg-gray-800 relative overflow-hidden">
                {challenge.banner ? (
                    <img src={challenge.banner} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Trophy size={48} className="text-white/20" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${challenge.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400'}`}>
                        {challenge.status === 'active' ? 'LIVE' : 'ENDED'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{challenge.title}</h3>
                <p className="text-gray-400 text-xs mb-4 line-clamp-2 min-h-[32px]">{challenge.description}</p>

                <div className="mt-auto space-y-3">
                    {/* Metrics */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-purple-400" />
                            <span>{timeLeft}</span>
                        </div>
                        {/* If we had entry count, show it. Mongoose didn't include it in list view by default, but we can iterate later */}
                        {/* <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-blue-400" />
                            <span>{challenge.entryCount || 0} Entries</span> 
                        </div> */}
                    </div>

                    {/* Action */}
                    <Link href={`/arena/${challenge._id}`} className="block">
                        <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:border-transparent">
                            Enter Arena <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
