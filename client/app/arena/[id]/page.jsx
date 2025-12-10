"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Clock, Upload, ThumbsUp } from "lucide-react";
import SubmitEntryModal from "@/components/arena/SubmitEntryModal";
import Certificate from "@/components/arena/Certificate";

export default function ChallengeDetailPage() {
    const { id } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); // Current User
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, lRes, uRes] = await Promise.all([
                    api.getChallengeDetails(id),
                    api.getLeaderboard(id),
                    api.getCurrentUser().catch(() => ({ data: null }))
                ]);

                if (cRes.data) setChallenge(cRes.data);
                if (lRes.data) setLeaderboard(lRes.data);
                if (uRes?.data) setUser(uRes.data);
            } catch (error) {
                console.error("Failed to load challenge details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const handleVote = async (entryId) => {
        if (!user) return alert("Please login to vote!");
        try {
            await api.voteEntry(entryId);
            // Optimistic update or refetch
            const lRes = await api.getLeaderboard(id);
            setLeaderboard(lRes.data);
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const handleEntrySuccess = async () => {
        alert("Entry Submitted Successfully!");
        const lRes = await api.getLeaderboard(id);
        setLeaderboard(lRes.data);
    };

    if (loading) return <div className="text-center p-20 text-white">Loading Arena...</div>;
    if (!challenge) return <div className="text-center p-20 text-red-500">Challenge Not Found</div>;

    const isActive = challenge.status === 'active';
    const isWinner = !isActive && challenge.winnerIds?.some(w => w.user?._id === user?._id || w.user === user?._id);
    const winnerRank = isWinner ? challenge.winnerIds.find(w => w.user?._id === user?._id || w.user === user?._id).rank : null;
    const winningEntry = isWinner ? challenge.winnerIds.find(w => w.user?._id === user?._id || w.user === user?._id) : null;

    return (
        <div className="min-h-screen bg-black text-white pb-20 pt-20">
            {/* Submit Modal */}
            <SubmitEntryModal
                isOpen={isSubmitOpen}
                onClose={() => setIsSubmitOpen(false)}
                challengeId={id}
                challengeType={challenge.type}
                onSuccess={handleEntrySuccess}
            />

            {/* Header / Banner */}
            <div className="relative h-60 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                {challenge.banner ? (
                    <img src={challenge.banner} alt={challenge.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-900" />
                )}

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20 container mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className={`inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider rounded-full ${isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                {isActive ? 'LIVE COMPETITION' : 'COMPETITION ENDED'}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black mb-2">{challenge.title}</h1>
                            <p className="text-gray-300 max-w-xl text-sm md:text-base">{challenge.description}</p>
                        </div>

                        {isActive && (
                            <button
                                onClick={() => setIsSubmitOpen(true)}
                                className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-purple-400 hover:text-white transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
                            >
                                <Upload size={18} /> Submit Entry
                            </button>
                        )}

                        {isWinner && (
                            <div className="bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-md p-4 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
                                    #{winnerRank}
                                </div>
                                <div>
                                    <h3 className="font-bold text-yellow-400">You Won!</h3>
                                    <button
                                        className="text-xs underline hover:text-white"
                                        onClick={() => setShowCertificate(true)}
                                    >
                                        Download Certificate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Rules & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Rewards
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-center gap-3">
                                <span className="text-2xl">🥇</span>
                                <div>
                                    <strong className="block text-white">Gold Certificate</strong>
                                    Permanent "Champion" Badge
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-2xl">🥈</span>
                                <div>
                                    <strong className="block text-white">Silver Certificate</strong>
                                    Runner-up Honors
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Clock className="text-blue-500" /> Timeline
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Ends:</span>
                                <span className="text-white">{new Date(challenge.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: "70%" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Leaderboard</h2>
                        <div className="text-sm text-gray-400">Vote for your favorites</div>
                    </div>

                    <div className="space-y-4">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-10 opacity-50 italic">No entries yet. Be the first!</div>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-purple-500/30 transition-colors"
                                >
                                    {/* Rank */}
                                    <div className={`w-10 h-10 flex items-center justify-center font-black text-xl rounded-full ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-600 text-black' : 'bg-white/5 text-gray-500'}`}>
                                        {index + 1}
                                    </div>

                                    {/* Content Preview (simplified) */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <img src={entry.userId?.avatar || "/placeholder.svg"} className="w-5 h-5 rounded-full" />
                                            <span className="text-sm font-bold truncate">{entry.certificateName}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            Entry ID: {entry.contentId}
                                        </div>
                                    </div>

                                    {/* Vote Button */}
                                    <button
                                        onClick={() => handleVote(entry._id)}
                                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${entry.voters?.includes(user?._id) ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        <ThumbsUp size={18} className={entry.voters?.includes(user?._id) ? "fill-current" : ""} />
                                        <span className="text-xs font-bold">{entry.votes}</span>
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Certificate Modal */}
            {showCertificate && isWinner && winningEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowCertificate(false)}>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCertificate(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300">Close</button>
                        <Certificate
                            entry={winningEntry}
                            challenge={challenge}
                            user={user}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
