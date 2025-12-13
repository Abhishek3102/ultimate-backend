"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Globe, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SpacesLobby() {
    const { user } = useAuth();
    const router = useRouter();
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const res = await api.getUserSpaces();
                setSpaces(res.data || []);
            } catch (error) {
                console.error("Failed to fetch spaces", error);
                if (error.message.includes("Session expired") || error.message.includes("Unauthorized")) {
                    // Redirect to login if session is invalid
                    router.push("/auth"); // Assuming /auth is the login page
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSpaces();
    }, []);

    const handleCreateSpace = async () => {
        setCreating(true);
        try {
            const res = await api.createSpace({
                name: `${user?.username || 'User'}'s Space`,
                isPublic: true
            });
            if (res.data && res.data._id) {
                router.push(`/spaces/${res.data._id}`);
            }
        } catch (error) {
            console.error("Failed to create space", error);
            setCreating(false);
            if (error.message.includes("Session expired") || error.message.includes("Unauthorized")) {
                router.push("/auth");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#020817] pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Socio-Spaces</h1>
                        <p className="text-gray-400">Your collaborative digital hangouts.</p>
                    </div>
                    <button
                        onClick={handleCreateSpace}
                        disabled={creating}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all custom-cursor-clickable active:scale-95 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        {creating ? "Creating..." : "Create New Space"}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-purple-500" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create Card */}
                        <button
                            onClick={handleCreateSpace}
                            disabled={creating}
                            className="group relative h-64 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-purple-500/50 hover:bg-white/10 transition-all custom-cursor-clickable"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={32} className="text-purple-400" />
                            </div>
                            <span className="text-lg font-medium text-gray-300 group-hover:text-white">Start a new Space</span>
                        </button>

                        {/* Active Spaces */}
                        {spaces.length > 0 ? (
                            spaces.map((space) => (
                                <Link key={space._id} href={`/spaces/${space._id}`}>
                                    <div className="group relative h-64 bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all custom-cursor-clickable">
                                        <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity rounded-2xl"
                                            style={{ backgroundImage: `url(${space.backgroundUrl || `https://source.unsplash.com/random/400x300?space`})` }}
                                        />
                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${space.isPublic ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                                {space.isPublic ? <Globe size={12} className="inline mr-1" /> : <Lock size={12} className="inline mr-1" />}
                                                {space.isPublic ? 'Public' : 'Private'}
                                            </span>
                                            {/* Member bubbles can be added later when we track active users */}
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{space.name}</h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                                <Users size={14} /> {space.members?.length || 1} members
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-gray-500">
                                Use the create button to start your first space!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
