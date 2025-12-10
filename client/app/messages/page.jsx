"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import { MessageSquare, Search } from "lucide-react"

export default function MessagesDashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.getConversations()
                setConversations(res.data)
            } catch (error) {
                console.error("Failed to fetch conversations", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchConversations()
        }
    }, [user])

    const filteredConversations = conversations.filter(c => {
        const otherParticipant = c.participants.find(p => p._id !== user._id)
        return otherParticipant?.fullName.toLowerCase().includes(search.toLowerCase()) ||
            otherParticipant?.username.toLowerCase().includes(search.toLowerCase())
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white pt-20">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020817] text-white pt-24 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Messages
                    </h1>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5">
                            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400">No conversations found</h3>
                            <p className="text-gray-500 mt-2">Start a chat from a user's profile!</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const otherParticipant = conv.participants.find(p => p._id !== user._id)
                            const lastMsg = conv.lastMessage

                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => router.push(`/messages/${otherParticipant?._id}`)}
                                    className="p-4 bg-slate-900/50 border border-white/10 rounded-2xl hover:bg-slate-800/80 transition-all cursor-pointer flex items-center gap-4 group"
                                >
                                    <img
                                        src={(otherParticipant?.avatar || "/placeholder.svg").replace('http://', 'https://')}
                                        alt={otherParticipant?.username}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500 transition-colors"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-semibold text-lg truncate pr-2">{otherParticipant?.fullName}</h3>
                                            {lastMsg && (
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(lastMsg.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm truncate">
                                            {lastMsg ? (
                                                <span className={lastMsg.sender === user._id ? "text-purple-400" : ""}>
                                                    {lastMsg.sender === user._id ? "You: " : ""}{lastMsg.content}
                                                </span>
                                            ) : (
                                                <span className="italic text-gray-600">No messages yet</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
