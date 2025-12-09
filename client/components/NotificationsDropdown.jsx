"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Heart, MessageSquare, UserPlus, Check, X, CheckCheck } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

export default function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)

    // Poll for notifications
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await api.getNotifications()
            const newNotifications = res.data || []

            setNotifications(prev => {
                // Keep local items that are "processed" (accepted/rejected) but missing from new list
                // This ensures they stay visible for "Follow Back" action
                const processedItems = prev.filter(n => n.localStatus === 'processed')

                // If a processed item is present in newNotifications (unlikely if backend removed it), prioritize the local one? 
                // No, prioritize new BUT if it's missing, add it back.

                // Actually, if we accepted it, it might be gone from 'newNotifications' (which only fetches pending).
                // So we append any processedItems that are NOT in newNotifications.

                const newIds = new Set(newNotifications.map(n => n._id))
                const keptItems = processedItems.filter(n => !newIds.has(n._id))

                // Also merge the "isFollowingBack" state if the user clicked "Follow Back"
                // For items that ARE in newNotifications, we might want to preserve local "isFollowingBack" if it changed?
                // But the poll should theoretically update isFollowingBack if the backend is fast enough.
                // Safest to preserve local changes if they are optimistic.

                return [...newNotifications, ...keptItems].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
            })
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    const handleRespond = async (subscriberId, action, notificationId) => {
        try {
            await api.respondToFollowRequest(subscriberId, action)
            // Update local state to show it's handled AND mark as locally processed
            setNotifications(prev => prev.map(n => {
                if (n._id === notificationId) {
                    return {
                        ...n,
                        status: action === 'accept' ? 'accepted' : 'rejected',
                        localStatus: 'processed' // Flag to persist this item
                    }
                }
                return n
            }))
        } catch (error) {
            console.error("Failed to respond", error)
        }
    }

    const handleFollowBack = async (channelId) => {
        try {
            await api.toggleSubscription(channelId)
            // Update local state to show following
            setNotifications(prev => prev.map(n => {
                if (n.subscriber?._id === channelId) {
                    return { ...n, isFollowingBack: !n.isFollowingBack }
                }
                return n
            }))
        } catch (error) {
            console.error("Failed to follow back", error)
        }
    }

    const [lastReadTime, setLastReadTime] = useState(null)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const storedTime = localStorage.getItem("lastReadTime")
        if (storedTime) {
            setLastReadTime(new Date(storedTime))
        }
    }, [])

    useEffect(() => {
        if (!notifications.length) {
            setUnreadCount(0)
            return
        }

        if (!lastReadTime) {
            setUnreadCount(notifications.length)
        } else {
            const count = notifications.filter(n => new Date(n.createdAt) > lastReadTime).length
            setUnreadCount(count)
        }
    }, [notifications, lastReadTime])

    const handleOpen = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            // Mark all as read
            const now = new Date()
            setLastReadTime(now)
            localStorage.setItem("lastReadTime", now.toISOString())
        }
    }

    const getLinkHref = (notification) => {
        if (notification.type === 'FOLLOW_REQUEST') {
            return `/c/${notification.subscriber?.username}`
        }
        if (notification.video) {
            const videoId = typeof notification.video === 'object' ? notification.video._id : notification.video
            return `/videos/${videoId}`
        }
        if (notification.tweet) {
            const tweetId = typeof notification.tweet === 'object' ? notification.tweet._id : notification.tweet
            return `/tweets/${tweetId}`
        }
        return '#'
    }

    // ... handleRespond and handleFollowBack ...

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed top-24 left-4 right-4 md:absolute md:top-full md:right-0 md:left-auto md:w-96 md:mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Notifications</h3>
                            <button onClick={() => {
                                const now = new Date()
                                setLastReadTime(now)
                                localStorage.setItem("lastReadTime", now.toISOString())
                            }} className="text-xs text-gray-400 hover:text-white">Mark all read</button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification._id}
                                            className="p-4 hover:bg-white/5 transition-colors relative cursor-pointer"
                                            onClick={(e) => {
                                                // Prevent navigation if clicking on buttons or links
                                                if (e.target.closest('button') || e.target.closest('a')) return

                                                const href = getLinkHref(notification)
                                                if (href && href !== '#') {
                                                    setIsOpen(false)
                                                    window.location.href = href
                                                }
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon based on type */}
                                                <div className="mt-1">
                                                    {notification.type === 'FOLLOW_REQUEST' && <UserPlus className="w-5 h-5 text-blue-400" />}
                                                    {notification.type === 'LIKE' && <Heart className="w-5 h-5 text-red-500 fill-current" />}
                                                    {notification.type === 'COMMENT' && <MessageSquare className="w-5 h-5 text-green-400" />}
                                                </div>

                                                <div className="flex-1">
                                                    {/* Content */}
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Link
                                                            href={`/c/${notification.type === 'FOLLOW_REQUEST' ? notification.subscriber?.username : notification.user?.username}`}
                                                            className="font-semibold text-white hover:underline relative z-20"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {notification.type === 'FOLLOW_REQUEST' ? notification.subscriber?.username : notification.user?.username}
                                                        </Link>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(notification.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-300 mb-2">
                                                        {notification.type === 'FOLLOW_REQUEST' && "wants to follow you"}
                                                        {notification.type === 'LIKE' && `liked your ${notification.tweet ? "tweet" : "video"}`}
                                                        {notification.type === 'COMMENT' && `commented on your ${notification.tweet ? "tweet" : "video"}`}
                                                    </p>

                                                    {/* Follow Request Actions */}
                                                    {notification.type === 'FOLLOW_REQUEST' && (
                                                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                            {notification.status === 'pending' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleRespond(notification.subscriber._id, 'accept', notification._id)}
                                                                        className="p-1 px-3 bg-green-500/20 text-green-400 rounded-full text-xs hover:bg-green-500/30 flex items-center gap-1"
                                                                    >
                                                                        <Check className="w-3 h-3" /> Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRespond(notification.subscriber._id, 'reject', notification._id)}
                                                                        className="p-1 px-3 bg-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500/30 flex items-center gap-1"
                                                                    >
                                                                        <X className="w-3 h-3" /> Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className={`text-xs px-2 py-1 rounded-full ${notification.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                    {notification.status === 'accepted' ? 'Accepted' : 'Rejected'}
                                                                </span>
                                                            )}

                                                            {/* Follow Back Button - Always visible if not following */}
                                                            {!notification.isFollowingBack && (
                                                                <button
                                                                    onClick={() => handleFollowBack(notification.subscriber._id)}
                                                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs hover:bg-purple-500/30 ml-auto"
                                                                >
                                                                    Follow Back
                                                                </button>
                                                            )}
                                                            {notification.isFollowingBack && (
                                                                <span className="text-xs text-purple-400 ml-auto flex items-center gap-1">
                                                                    <CheckCheck className="w-3 h-3" /> Following
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thumbnail for Like/Comment */}
                                                {(notification.type === 'LIKE' || notification.type === 'COMMENT') && (
                                                    <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                                                        {notification.videoDetails?.thumbnail ? (
                                                            <img src={notification.videoDetails.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                                                        ) : (
                                                            // Fallback or generic icon
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                                {notification.tweet ? <MessageSquare className="w-4 h-4 text-white/50" /> : <div />}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
