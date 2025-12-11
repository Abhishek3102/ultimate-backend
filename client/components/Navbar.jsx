"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Video, List, Settings, Search, MessageSquare, TrendingUp, Trophy, Menu, X, Home } from "lucide-react"
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 right-0 z-[1000] p-6 flex justify-between items-center transition-all duration-300 ${isHomePage
                    ? "bg-black/20 backdrop-blur-md border-b border-white/5"
                    : "backdrop-blur-md bg-black/30 border-b border-white/5"
                    }`}
            >
                <Link href="/">
                    <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-0 cursor-pointer">
                        <img
                            src="/images/logo 2 visual.png"
                            alt="Socioverse Visual"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <img
                            src="/images/logo 2 text.png"
                            alt="Socioverse Text"
                            className="h-8 w-auto object-contain -ml-1"
                        />
                    </motion.div>
                </Link>

                <div className="flex gap-4 items-center">
                    {isOfflineMode && (
                        <span className="text-orange-400 text-sm font-medium border border-orange-400/50 px-2 py-1 rounded bg-orange-400/10">Demo Mode</span>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex gap-4 items-center">
                        <Link href="/arena">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-gradient-to-r from-red-600/30 to-orange-600/30 border border-orange-500/50 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4 text-orange-400" />
                                <span className="hidden sm:inline">Arena</span>
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
                        <Link href="/trending">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-500/50 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                                <span className="hidden sm:inline">Prism</span>
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
                        <Link href="/spaces">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-purple-500/50 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4 text-purple-400" />
                                <span className="hidden sm:inline">Spaces</span>
                            </motion.button>
                        </Link>
                        <Link href="/tweets">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">Tweets</span>
                            </motion.button>
                        </Link>
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
                    </div>
                    {isAuthenticated ? (
                        <div className="hidden md:flex gap-2 items-center">
                            <NotificationsDropdown />
                            <ProfileDropdown />
                        </div>
                    ) : (
                        <Link href="/auth" className="hidden md:block">
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

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1001] md:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[280px] bg-black/80 backdrop-blur-xl border-l border-white/10 z-[1002] p-6 md:hidden overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                    Menu
                                </span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link href="/arena" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <Trophy className="w-5 h-5 text-orange-400" />
                                        <span className="text-white font-medium">Arena</span>
                                    </div>
                                </Link>
                                <Link href="/cinema" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <Video className="w-5 h-5 text-purple-400" />
                                        <span className="text-white font-medium">Cinema</span>
                                    </div>
                                </Link>
                                <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                        <span className="text-white font-medium">Messages</span>
                                    </div>
                                </Link>
                                <Link href="/trending" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <TrendingUp className="w-5 h-5 text-pink-400" />
                                        <span className="text-white font-medium">Prism</span>
                                    </div>
                                </Link>
                                <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <Search className="w-5 h-5 text-green-400" />
                                        <span className="text-white font-medium">Search</span>
                                    </div>
                                </Link>
                                <Link href="/spaces" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <Settings className="w-5 h-5 text-yellow-400" />
                                        <span className="text-white font-medium">Spaces</span>
                                    </div>
                                </Link>
                                <Link href="/tweets" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                                        <span className="text-white font-medium">Tweets</span>
                                    </div>
                                </Link>
                                <Link href="/videos" onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <Video className="w-5 h-5 text-red-400" />
                                        <span className="text-white font-medium">Videos</span>
                                    </div>
                                </Link>

                                {!isAuthenticated && (
                                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl font-bold shadow-lg">
                                            Get Started
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
