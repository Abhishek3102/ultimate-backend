"use client";

import { useState, useEffect } from "react";
import { Trophy, Share2, Eye, User, Download } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Certificate from "./Certificate";

// Helper to render content thumbnail
const ContentPreview = ({ entryDetails }) => {
    if (!entryDetails || !entryDetails.content) return null;

    const { type, content } = entryDetails;

    if (type === 'Tweet' || type === 'Image') {
        const hasImage = content.images && content.images.length > 0;
        return (
            <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden relative mb-3 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
                {hasImage ? (
                    <img src={content.images[0].replace('http://', 'https://')} alt="Entry" className="w-full h-full object-cover" />
                ) : (
                    <div className="p-3 text-[10px] text-gray-300 leading-tight">
                        {content.content?.substring(0, 100)}...
                    </div>
                )}
            </div>
        );
    }

    if (type === 'Video') {
        return (
            <div className="w-full h-32 bg-black rounded-lg overflow-hidden relative mb-3 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
                <img
                    src={(content.thumbnail || "/placeholder.svg").replace('http://', 'https://')}
                    alt={content.title}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="ml-1 w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent"></div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default function TrophyRoom({ userId }) {
    const [trophies, setTrophies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);

    useEffect(() => {
        const fetchTrophies = async () => {
            try {
                const res = await api.getUserTrophies(userId);
                setTrophies(res.data || []);
            } catch (error) {
                console.error("Failed to fetch trophies", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchTrophies();
    }, [userId]);

    if (loading) return <div className="text-center py-20 text-gray-500 animate-pulse">Loading accomplishments...</div>;

    if (trophies.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-400 mb-2">Trophy Room Empty</h3>
                <p className="text-gray-500 px-4">
                    Participate in Arena Challenges to earn badges and eternal glory.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trophies.map((cert) => (
                    <motion.div
                        layoutId={cert._id}
                        key={cert._id}
                        onClick={() => setSelectedCert(cert)}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20"
                    >
                        {/* Video Background */}
                        <div className="absolute inset-0 z-0">
                            <video
                                src="/images/award.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity"
                            />
                            {/* Overlay gradient to ensure text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        </div>

                        {/* Rank Color Accents (keep them subtle on top) */}
                        <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 z-0 mix-blend-overlay ${cert.rank === 1 ? 'bg-yellow-400' : cert.rank === 2 ? 'bg-gray-300' : 'bg-amber-600'}`} />

                        <div className="p-6 relative z-10 flex flex-col items-center text-center h-full">

                            {/* Header: Rank Icon */}
                            <div className="flex w-full justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${cert.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : cert.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' : 'bg-amber-600/20 text-amber-500 border border-amber-600/50'}`}>
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                                    {new Date(cert.date).getFullYear()}
                                </div>
                            </div>

                            {/* Main Title */}
                            <h3 className={`text-2xl font-black italic tracking-tighter mb-1 ${cert.rank === 1 ? 'text-yellow-400' : cert.rank === 2 ? 'text-gray-200' : 'text-amber-500'}`}>
                                {cert.rank === 1 ? 'CHAMPION' : cert.rank === 2 ? 'RUNNER UP' : 'BRONZE FINALIST'}
                            </h3>

                            <p className="text-gray-400 text-sm font-medium mb-4 line-clamp-1">
                                {cert.name ? cert.name.split(':')[1] : "Unknown Challenge"}
                            </p>

                            {/* Content Preview */}
                            {cert.entryDetails && (
                                <ContentPreview entryDetails={cert.entryDetails} />
                            )}

                            {/* Footer */}
                            <div className="mt-auto pt-4 border-t border-white/10 w-full flex justify-between items-center text-xs text-gray-500 capitalize">
                                <span>{cert.entryDetails?.type || "Entry"}</span>
                                <span className="group-hover:text-purple-400 transition-colors flex items-center gap-1">
                                    View Certificate <Trophy className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal for Full Certificate View */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-[100] overflow-y-auto flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setSelectedCert(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-5xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedCert(null)}
                                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                            >
                                Close X
                            </button>

                            {/* Reuse the Certificate Component logic but pass data */}
                            {/* We need to restructure selectedCert to match Certificate props */}
                            <Certificate
                                entry={{ rank: selectedCert.rank }}
                                challenge={{ title: selectedCert.name?.split(':')[1] || "Challenge" }}
                                user={{ fullName: "Winner" }} // We need to pass the user here, but TrophyRoom is viewed BY the user or visitor.
                            // Actually TrophyRoom is mostly for the profile owner. 
                            // Ideally we pass the profile owner's details.
                            // Let's fix this in the parent.
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
