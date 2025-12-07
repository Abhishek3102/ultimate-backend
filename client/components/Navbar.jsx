"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Video, List, Settings, Search, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import LogoutButton from "@/components/LogoutButton"
import NotificationsDropdown from "@/components/NotificationsDropdown"
import ProfileDropdown from "@/components/ProfileDropdown"

export default function Navbar() {
    const { isAuthenticated, user, isOfflineMode } = useAuth()
    const pathname = usePathname()
    const isHomePage = pathname === "/"

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center transition-all duration-300 ${isHomePage
                ? "bg-black/20 backdrop-blur-md border-b border-white/5"
                : "backdrop-blur-md bg-black/30 border-b border-white/5"
                }`}
        >
            <Link href="/">
                <motion.div whileHover={{ scale: 1.1 }} className="text-2xl font-bold text-white flex items-center gap-2 cursor-pointer">
                    <Video className="text-yellow-400" />
                    Socioverse
                </motion.div>
            </Link>

            <div className="flex gap-4 items-center">
                {isOfflineMode && (
                    <span className="text-orange-400 text-sm font-medium border border-orange-400/50 px-2 py-1 rounded bg-orange-400/10">Demo Mode</span>
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
                <Link href="/search">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden sm:inline">Search</span>
                    </motion.button>
                </Link>
                <Link href="/cinema">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <Video className="w-4 h-4 text-purple-400" />
                        <span className="hidden sm:inline">Cinema</span>
                    </motion.button>
                </Link>
                <Link href="/messages">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Messages</span>
                    </motion.button>
                </Link>
                {isAuthenticated ? (
                    <div className="flex gap-2 items-center">
                        <NotificationsDropdown />
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
                        <ProfileDropdown />
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
