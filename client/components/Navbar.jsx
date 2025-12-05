"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Video, List, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import LogoutButton from "@/components/LogoutButton"

export default function Navbar() {
    const { isAuthenticated, user, isOfflineMode } = useAuth()

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center backdrop-blur-sm bg-black/10 border-b border-white/20"
        >
            <Link href="/">
                <motion.div whileHover={{ scale: 1.1 }} className="text-2xl font-bold text-white flex items-center gap-2 cursor-pointer">
                    <Video className="text-yellow-400" />
                    ChaiTube
                </motion.div>
            </Link>

            <div className="flex gap-4 items-center">
                {isOfflineMode && (
                    <span className="text-orange-400 text-sm font-medium border border-orange-400/50 px-2 py-1 rounded bg-orange-400/10">Demo Mode</span>
                )}

                {isAuthenticated && (
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar || "/placeholder.svg?height=32&width=32"}
                            alt={user?.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                        />
                        <span className="text-white font-medium hidden md:block">Hi, {user?.username}!</span>
                    </div>
                )}
                <Link href="/videos">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <Video className="w-4 h-4" />
                        <span className="hidden sm:inline">Videos</span>
                    </motion.button>
                </Link>
                <Link href="/playlists">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <List className="w-4 h-4" />
                        <span className="hidden sm:inline">Playlists</span>
                    </motion.button>
                </Link>
                {isAuthenticated ? (
                    <div className="flex gap-2">
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </motion.button>
                        </Link>
                        <LogoutButton />
                    </div>
                ) : (
                    <Link href="/auth">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(168, 85, 247, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                        >
                            Get Started
                        </motion.button>
                    </Link>
                )}
            </div>
        </motion.nav>
    )
}
