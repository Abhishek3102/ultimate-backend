"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, Play, Link as LinkIcon, ArrowRight, Film } from "lucide-react"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function CinemaLandingContent() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [joinCode, setJoinCode] = useState("")
    const [isJoining, setIsJoining] = useState(false)

    const handleJoin = (e) => {
        e.preventDefault()
        if (!joinCode.trim()) return

        // Extract code if full URL is pasted
        const code = joinCode.split('/').pop()
        setIsJoining(true)
        router.push(`/cinema/${code}`)
    }

    return (
        <div className="min-h-screen bg-[#020817] text-white pt-24 px-6 flex flex-col items-center">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-3xl mx-auto mb-16"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20">
                    <Film className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    Socio Cinema
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed">
                    Watch videos together with friends in real-time.
                    Synchronized playback, voice chat, and a shared theater experience.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Join Existing Party */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all group"
                >
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Join a Party</h2>
                    <p className="text-gray-400 mb-6">Have a code or link? Enter it here to jump into the theater.</p>

                    <form onSubmit={handleJoin} className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Room Code or Link..."
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
                        />
                        <button
                            type="submit"
                            disabled={!joinCode.trim() || isJoining}
                            className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                            {isJoining ? 'Joining...' : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                </motion.div>

                {/* Create New Party */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform relative z-10">
                        <Play className="w-6 h-6 ml-1" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">Host a Party</h2>
                    <p className="text-gray-300 mb-8 relative z-10">Choose a video from our library and create your own private theater.</p>

                    <button
                        onClick={() => router.push('/videos')}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 relative z-10"
                    >
                        Browse Videos <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>

            <div className="mt-20 text-center text-gray-500 text-sm">
                <p>Socioverse Cinema uses WebRTC and Socket.IO for low-latency synchronization.</p>
            </div>
        </div>
    )
}

export default function CinemaLandingPage() {
    return (
        <AuthProvider>
            <CinemaLandingContent />
        </AuthProvider>
    )
}
