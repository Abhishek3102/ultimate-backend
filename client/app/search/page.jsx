"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { api } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"

export default function SearchPage() {
    const { isAuthenticated } = useAuth()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setHasSearched(true)
        try {
            const res = await api.searchUsers(query)
            setResults(res.data)
        } catch (error) {
            console.error(error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch({ preventDefault: () => { } })
            } else {
                setResults([])
                setHasSearched(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-gray-200 font-sans selection:bg-purple-500/30">
            <Navbar />

            <main className="pt-24 px-6 max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                        Find People
                    </h1>
                    <p className="text-gray-400">Search for users by name or username</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-gray-500"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6" />
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {loading && (
                        <div className="text-center py-10">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    )}

                    {!loading && hasSearched && results.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No users found matching "{query}"
                        </div>
                    )}

                    <AnimatePresence>
                        {results.map((user) => (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="group"
                            >
                                <Link href={`/c/${user.username}`}>
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={(user.avatar || "/placeholder.svg?height=50&width=50").replace('http://', 'https://')}
                                                    alt={user.username}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                {user.isPrivate && (
                                                    <div className="absolute -bottom-1 -right-1 bg-black/50 p-1 rounded-full backdrop-blur-sm border border-white/10">
                                                        <Lock className="w-3 h-3 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                                                    {user.fullName}
                                                </h3>
                                                <p className="text-sm text-gray-400">@{user.username}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
