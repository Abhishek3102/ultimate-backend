"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import Link from "next/link"

export default function FollowListModal({ isOpen, onClose, userId, type, title }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (isOpen && userId) {
            fetchUsers()
        }
    }, [isOpen, userId, type])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            let res;
            if (type === "followers") {
                res = await api.getChannelSubscribers(userId)
            } else {
                res = await api.getSubscribedChannels(userId)
            }
            // subscribers endpoint returns { subscriber: {...} } objects
            // subscribedTo endpoint returns { channel: {...} } objects
            // normalization:
            const rawList = res.data || []
            const normalized = rawList.map(item => {
                if (type === "followers") return item.subscriber
                return item.channel
            })
            setUsers(normalized)
        } catch (error) {
            console.error("Failed to fetch users", error)
        } finally {
            setLoading(false)
        }
    }

    const { user: currentUser } = useAuth()
    const isOwner = currentUser?._id === userId

    const handleUnfollow = async (channelId) => {
        if (!confirm("Are you sure you want to unfollow?")) return
        try {
            await api.toggleSubscription(channelId)
            setUsers(prev => prev.filter(u => u._id !== channelId))
        } catch (error) {
            console.error("Failed to unfollow", error)
        }
    }

    const handleRemoveFollower = async (subscriberId) => {
        if (!confirm("Remove this follower?")) return
        try {
            await api.removeFollower(subscriberId)
            setUsers(prev => prev.filter(u => u._id !== subscriberId))
        } catch (error) {
            console.error("Failed to remove follower", error)
        }
    }

    const handleFollowBack = async (channelId) => {
        try {
            await api.toggleSubscription(channelId)
            // Just refresh or show "Following" state? 
            // Ideally we should know if we are already following them.
            // But the list itself doesn't provide that info easily without extra lookups.
            // For now, simple "Follow Back" -> "Following" toggle in UI or just toast.
            // To do it properly, we'd need `isSubscribed` status for each user in the list.
            // Given the complexity of fetching that for a list, we might assume "Follow Back" just toggles.
            // But "Follow Back" implies we weren't following.
            // Ideally we need to fetch "isSubscribed" status for each user in the list... 
            // OR we can just rely on the button changing text after click if we maintain local state.
            // Since we can't easily sync "isFollowing" for every user without N+1 or big aggregation,
            // We will just optimistically disable the button or change text.
            setUsers(prev => prev.map(u => {
                if (u._id === channelId) return { ...u, isFollowing: !u.isFollowing }
                return u
            }))
        } catch (error) {
            console.error("Failed to follow back", error)
        }
    }

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
                >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white capitalize">{title || type}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="space-y-4">
                                {filteredUsers.map(user => (
                                    <div key={user._id} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors group">
                                        <Link href={`/c/${user.username}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                                            <img
                                                src={user.avatar || "/placeholder.svg"}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-white truncate">{user.fullName}</h3>
                                                <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                                            </div>
                                        </Link>

                                        {/* Actions */}
                                        {isOwner && (
                                            <div className="flex items-center gap-2 ml-4">
                                                {/* Common Action: Message */}
                                                <Link href={`/messages/${user._id}`} className="px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                                    Message
                                                </Link>

                                                {/* Specific Actions */}
                                                {type === "following" && (
                                                    <button
                                                        onClick={() => handleUnfollow(user._id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors"
                                                    >
                                                        Unfollow
                                                    </button>
                                                )}

                                                {type === "followers" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRemoveFollower(user._id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors"
                                                        >
                                                            Remove
                                                        </button>

                                                        {/* Follow Back (Simplified: show if not following? We don't know state. Show generic or rely on user knowing) 
                                                            Actually, sticking to "Follow Back" might be confusing if already following.
                                                            Perhaps just "Follow" which toggles?
                                                            Or ideally we fetch "isFollowing" for each. 
                                                            Let's assume we want to offer the ability to follow back. 
                                                         */}
                                                        <button
                                                            onClick={() => handleFollowBack(user._id)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${user.isFollowing ? 'text-green-400 bg-green-500/10' : 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'}`}
                                                        >
                                                            {user.isFollowing ? "Following" : "Follow Back"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No users found
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
