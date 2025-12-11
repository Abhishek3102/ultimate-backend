"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ChallengeCard from "@/components/arena/ChallengeCard";
import { Swords, Trophy } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function ArenaPage() {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Get current user

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                // We need to add getChallenges to api lib first, but assuming we will
                const res = await api.getChallenges();
                if (res.data) {
                    setChallenges(res.data);
                }
            } catch (error) {
                console.error("Failed to load arena", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pb-20 md:pb-0 pt-32">
            {/* Hero Section */}
            {/* Hero Section */}
            {/* Hero Section */}
            <div className="relative min-h-[50vh] md:h-80 bg-gradient-to-b from-purple-900/40 via-black/80 to-black flex items-center justify-center overflow-hidden py-12 md:py-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="z-10 container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    <motion_h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 tracking-tighter drop-shadow-2xl text-center md:text-left">
                        THE ARENA
                    </motion_h1>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl max-w-lg w-full md:w-auto">
                        <ul className="text-gray-300 text-sm md:text-base space-y-2 list-disc pl-5">
                            <li>Compete in creative challenges (Memes, Videos, Photos)</li>
                            <li>Vote for the best entries & climb the leaderboard</li>
                            <li>Win exclusive digital badges & certificates</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Challenges Grid */}
            <div className="max-w-7xl mx-auto px-4 mt-8 md:-mt-10 z-20 relative">

                {/* Admin Actions */}
                {user?.role === "admin" && (
                    <div className="flex justify-end mb-8">
                        <Link href="/admin/arena/create">
                            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/20 transition-all transform hover:-translate-y-1">
                                <Trophy size={20} />
                                Create New Challenge
                            </button>
                        </Link>
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-gray-500 py-20">Summoning Challenges...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map(c => (
                            <ChallengeCard key={c._id} challenge={c} />
                        ))}

                        {/* Empty Realm State */}
                        {challenges.length === 0 && (
                            <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                <Swords size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">The Arena is Quiet</h3>
                                <p className="text-gray-600">No active battles right now. Check back soon.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple wrapper to avoid "motion is not defined" if framer-motion import missing in quick paste
const motion_h1 = ({ children, className }) => <h1 className={className}>{children}</h1>;
