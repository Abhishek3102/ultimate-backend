"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { User, Video, List, MessageSquare, Lock, UserPlus, UserCheck, UserX, Heart, Play, Eye, Clock, Share, ArrowLeft, Send, Check, X, Trophy } from "lucide-react"
import TrophyRoom from "@/components/arena/TrophyRoom"
import { api } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import toast from "react-hot-toast"
import FollowListModal from "@/components/FollowListModal"
import Link from "next/link"

export default function ChannelProfile() {
    const params = useParams()
    const { user: currentUser, isAuthenticated } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("videos")
    const [videos, setVideos] = useState([])
    const [tweets, setTweets] = useState([])
    const [playlists, setPlaylists] = useState([])
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)

    // Derived state
    const isOwner = currentUser?.username === params.username
    const isPrivate = profile?.isPrivate
    const subscriptionStatus = profile?.subscriptionStatus // pending, accepted, rejected, or undefined
    const isSubscribed = profile?.isSubscribed // boolean (true if accepted)

    // Access Control: Public OR Owner OR Subscribed (Accepted)
    const hasAccess = !isPrivate || isOwner || isSubscribed

    // Video Interaction States
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [videoComments, setVideoComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [commentsLoading, setCommentsLoading] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [params.username])

    const fetchProfile = async () => {
        try {
            const res = await api.getUserChannelProfile(params.username)
            setProfile(res.data)
        } catch (error) {
            console.error("Failed to fetch profile", error)
            toast.error("User not found")
        } finally {
            setLoading(false)
        }
    }

    // Fetch Content when Tab changes and User has access
    useEffect(() => {
        if (!profile?._id || !hasAccess) return;

        const fetchContent = async () => {
            try {
                if (activeTab === "videos") {
                    const res = await api.getUserVideos(profile._id)
                    const videoList = Array.isArray(res.data) ? res.data : (res.data?.videos || [])
                    setVideos(videoList)
                } else if (activeTab === "tweets") {
                    const res = await api.getUserTweets(profile._id)
                    setTweets(res.data || [])
                } else if (activeTab === "playlists") {
                    const res = await api.getPlaylists(profile._id)
                    setPlaylists(res.data || [])
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab}`, error)
            }
        }

        fetchContent()
    }, [activeTab, profile, hasAccess])

    const handleSubscribe = async () => {
        if (!currentUser) {
            toast.error("Please login to follow")
            return
        }
        try {
            const res = await api.toggleSubscription(profile._id)
            toast.success(res.message)
            fetchProfile() // Refresh to update status
        } catch (error) {
            console.error(error)
            toast.error("Failed to update subscription")
        }
    }

    const handleRespond = async (action) => {
        try {
            await api.respondToFollowRequest(profile._id, action)
            toast.success(action === 'accept' ? "Request accepted" : "Request rejected")
            // Update profile state
            setProfile(prev => ({ ...prev, isFollowingMeStatus: action === 'accept' ? 'accepted' : 'rejected' }))
        } catch (error) {
            console.error(error)
            toast.error("Failed to respond")
        }
    }

    // Video Modal Handlers
    const openVideo = async (video) => {
        setSelectedVideo(video)
        fetchComments(video._id)
        if (currentUser) {
            try {
                const response = await api.getVideoById(video._id)
                if (response.data) setSelectedVideo(response.data)
            } catch (e) { console.error(e) }
        }
    }

    const closeVideo = () => {
        setSelectedVideo(null)
        setVideoComments([])
        setCommentText("")
        // Refresh videos to update views/likes if changed
        if (hasAccess && activeTab === "videos") {
            api.getUserVideos(profile._id).then(res => {
                const videoList = Array.isArray(res.data) ? res.data : (res.data?.videos || [])
                setVideos(videoList)
            })
        }
    }

    const fetchComments = async (videoId) => {
        setCommentsLoading(true)
        try {
            const response = await api.getVideoComments(videoId)
            setVideoComments(response.data?.comments || [])
        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setCommentsLoading(false)
        }
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if (!commentText.trim()) return

        try {
            const response = await api.addVideoComment(selectedVideo._id, commentText)
            setVideoComments(prev => [response.data, ...prev])
            setCommentText("")
            setSelectedVideo(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
        } catch (error) {
            toast.error("Failed to post comment")
        }
    }

    const handleDeleteVideoComment = async (commentId) => {
        if (!confirm("Delete this comment?")) return
        try {
            await api.deleteComment(commentId)
            setVideoComments(prev => prev.filter(c => c._id !== commentId))
            setSelectedVideo(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }))
        } catch (error) {
            console.error("Delete comment error:", error)
        }
    }

    const toggleVideoLike = async (videoId) => {
        if (!isAuthenticated) return toast.error("Please login to like")

        try {
            // Optimistic update
            setVideos(prev => prev.map(v => {
                if (v._id === videoId) {
                    const isLiked = !v.isLiked
                    return { ...v, isLiked, likesCount: isLiked ? (v.likesCount || 0) + 1 : Math.max(0, (v.likesCount || 0) - 1) }
                }
                return v
            }))

            if (selectedVideo?._id === videoId) {
                setSelectedVideo(prev => {
                    const isLiked = !prev.isLiked
                    return { ...prev, isLiked, likesCount: isLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1) }
                })
            }

            await api.toggleVideoLike(videoId)
        } catch (error) {
            console.error(error)
            toast.error("Failed to like")
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "0:00"
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const formatViews = (views) => {
        if (!views) return "0"
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
        return views.toString()
    }


    // Determine Button State
    const renderFollowButton = () => {
        if (isOwner) return null;

        if (subscriptionStatus === "pending") {
            return (
                <button
                    onClick={handleSubscribe}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors"
                >
                    <UserCheck className="w-4 h-4" />
                    Requested
                </button>
            )
        }

        if (isSubscribed) {
            return (
                <button
                    onClick={handleSubscribe}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors"
                >
                    <UserCheck className="w-4 h-4" />
                    Following
                </button>
            )
        }

        return (
            <button
                onClick={handleSubscribe}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
            >
                <UserPlus className="w-4 h-4" />
                {isPrivate ? "Request" : "Follow"}
            </button>
        )
    }

    if (loading) return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <div className="flex justify-center items-center h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        </div>
    )

    if (!profile) return (
        <div className="min-h-screen bg-[#1a1a1a] text-white">
            <div className="flex justify-center items-center h-[80vh]">User not found</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-gray-200 font-sans selection:bg-purple-500/30">

            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900 relative">
                {profile.coverImage && (
                    <img
                        src={profile.coverImage.replace('http://', 'https://')}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-60"
                    />
                )}
            </div>

            <div className="max-w-6xl mx-auto px-6 pb-20">
                {/* Profile Header */}
                <div className="relative -mt-20 mb-8 flex flex-col md:flex-row items-end md:items-end gap-6 text-center md:text-left">
                    <div className="relative">
                        <img
                            src={(profile.avatar || "/placeholder.svg?height=160&width=160").replace('http://', 'https://')}
                            alt={profile.username}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#1a1a1a] object-cover"
                        />
                        {isPrivate && (
                            <div className="absolute bottom-2 right-2 bg-black/70 p-2 rounded-full border border-white/10">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl font-bold text-white">{profile.fullName}</h1>
                        <p className="text-gray-400 font-medium">@{profile.username}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-400">
                            <button
                                onClick={() => setShowFollowersModal(true)}
                                className="hover:text-white transition-colors cursor-pointer"
                            >
                                <strong className="text-white">{profile.subscribersCount}</strong> Followers
                            </button>
                            <button
                                onClick={() => setShowFollowingModal(true)}
                                className="hover:text-white transition-colors cursor-pointer"
                            >
                                <strong className="text-white">{profile.channelsSubscribedToCount}</strong> Following
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 mb-4">
                        {/* Admin Privacy Check */}
                        {profile.role === 'admin' && currentUser?.role !== 'admin' ? (
                            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-2 cursor-not-allowed">
                                <Lock className="w-4 h-4" /> Checks & Balances Active
                            </div>
                        ) : (
                            <>
                                {renderFollowButton()}

                                {/* Message Button */}
                                {!isOwner && (
                                    <Link
                                        href={`/messages/${profile._id}`}
                                        className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Message
                                    </Link>
                                )}

                                {/* Status Message for Incoming Request */}
                                {profile.isFollowingMeStatus === 'pending' && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300">
                                        <button
                                            onClick={() => handleRespond('accept')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 rounded-full text-sm font-medium transition-all"
                                        >
                                            <Check className="w-4 h-4" /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleRespond('reject')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 rounded-full text-sm font-medium transition-all"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {!hasAccess ? (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center mt-8">
                        <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">This Account is Private</h3>
                        <p className="text-gray-400">Follow this account to see their videos and tweets.</p>
                    </div>
                ) : (
                    <div className="mt-8">
                        {/* Tabs */}
                        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("videos")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === "videos"
                                    ? "text-purple-400 border-purple-400"
                                    : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4" /> Videos
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("tweets")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === "tweets"
                                    ? "text-purple-400 border-purple-400"
                                    : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Tweets
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("playlists")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === "playlists"
                                    ? "text-purple-400 border-purple-400"
                                    : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4" /> Playlists
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("arena")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === "arena"
                                    ? "text-purple-400 border-purple-400"
                                    : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4" /> Trophy Room
                                </div>
                            </button>
                        </div>

                        {/* Content Area */}

                        {/* Videos Tab */}
                        {activeTab === "videos" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {videos.map((video, index) => (
                                        <motion.div
                                            key={video._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors group flex flex-col"
                                        >
                                            <div
                                                className="relative aspect-video bg-black/50 cursor-pointer"
                                                onClick={() => openVideo(video)}
                                            >
                                                <img
                                                    src={(video.thumbnail || "/placeholder.svg").replace('http://', 'https://')}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <Play className="w-6 h-6 text-white ml-1" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                                                    {formatDuration(video.duration)}
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 onClick={() => openVideo(video)} className="text-white font-semibold line-clamp-2 mb-2 cursor-pointer hover:text-purple-400">{video.title}</h3>
                                                <div className="flex items-center justify-between text-sm text-gray-400 mt-auto mb-3">
                                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(video.views)}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(video.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => toggleVideoLike(video._id)} className={`flex items-center gap-1 text-sm ${video.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                                                            <Heart className={`w-4 h-4 ${video.isLiked ? 'fill-current' : ''}`} /> {video.likesCount}
                                                        </button>
                                                        <button onClick={() => openVideo(video)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
                                                            <MessageSquare className="w-4 h-4" /> {video.commentsCount || 0}
                                                        </button>
                                                    </div>
                                                    <button onClick={() => openVideo(video)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white transition-colors">
                                                        Watch
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {videos.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        No videos found.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tweets Tab */}
                        {activeTab === "tweets" && (
                            <div className="space-y-4 max-w-2xl mx-auto">
                                {tweets.map((tweet) => (
                                    <div key={tweet._id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={(profile.avatar || "/placeholder.svg").replace('http://', 'https://')}
                                                    alt={profile.username}
                                                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <h3 className="font-semibold text-white">{profile.fullName}</h3>
                                                    <span className="text-sm text-gray-400">@{profile.username}</span>
                                                    <span className="text-xs text-gray-500">• {new Date(tweet.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-200 whitespace-pre-wrap">{tweet.content}</p>
                                                <div className="flex items-center gap-6 mt-4 text-gray-400 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="w-4 h-4" /> {tweet.likesCount || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {tweets.length === 0 && (
                                    <div className="text-center py-20 text-gray-500">
                                        No tweets found.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Playlists Tab */}
                        {activeTab === "playlists" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {playlists.map((playlist) => (
                                    <div key={playlist._id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                        <div className="flex items-center gap-3 mb-4 text-purple-400">
                                            <List className="w-6 h-6" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Playlist</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{playlist.name}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">{playlist.description}</p>
                                        <div className="text-xs text-gray-500">
                                            {playlist.videos?.length || 0} videos • Updated {new Date(playlist.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {playlists.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        No playlists found.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trophy Room Tab (Arena) */}
                        {activeTab === "arena" && (
                            <TrophyRoom userId={profile._id} />
                        )}
                    </div>
                )}
            </div>

            <FollowListModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                userId={profile?._id}
                type="followers"
            />
            <FollowListModal
                isOpen={showFollowingModal}
                onClose={() => setShowFollowingModal(false)}
                userId={profile?._id}
                type="following"
            />

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
                        onClick={closeVideo}
                    >
                        <div className="min-h-screen p-6" onClick={e => e.stopPropagation()}>
                            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Player & Info */}
                                <div className="lg:col-span-2 space-y-4">
                                    <motion.button
                                        onClick={closeVideo}
                                        className="mb-4 flex items-center gap-2 text-white/80 hover:text-white"
                                    >
                                        <ArrowLeft className="w-6 h-6" /> Back to Videos
                                    </motion.button>

                                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                                        <video
                                            src={(selectedVideo.videoFile || "").replace('http://', 'https://')}
                                            controls
                                            autoPlay
                                            className="w-full h-full"
                                        />
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                                        <h1 className="text-2xl font-bold text-white mb-2">{selectedVideo.title}</h1>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <img src={(selectedVideo.owner?.avatar || "/placeholder.svg").replace('http://', 'https://')} className="w-12 h-12 rounded-full" />
                                                <div>
                                                    <h3 className="text-white font-medium">{selectedVideo.owner?.username}</h3>
                                                    <p className="text-white/60 text-sm">Owner</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => toggleVideoLike(selectedVideo._id)} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all ${selectedVideo.isLiked ? 'text-red-500' : 'text-white'}`}>
                                                    <Heart className={`w-5 h-5 ${selectedVideo.isLiked ? 'fill-current' : ''}`} />
                                                    <span>{selectedVideo.likesCount || 0}</span>
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                                                    <Share className="w-5 h-5" /> Share
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-4">
                                            <div className="flex gap-4 text-sm text-white/70 mb-2">
                                                <span>{formatViews(selectedVideo.views)} views</span>
                                                <span>{new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-white/90 whitespace-pre-wrap">{selectedVideo.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Comments */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 h-[calc(100vh-4rem)] flex flex-col">
                                        <h2 className="text-xl font-bold text-white mb-4">Comments ({videoComments.length})</h2>

                                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                            {commentsLoading && <div className="text-center text-white/50">Loading comments...</div>}
                                            {!commentsLoading && videoComments.map(comment => (
                                                <div key={comment._id} className="flex gap-3">
                                                    <img src={(comment.owner?.avatar || "/placeholder.svg").replace('http://', 'https://')} className="w-8 h-8 rounded-full shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-white font-medium text-sm">{comment.owner?.username}</span>
                                                            <span className="text-white/40 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-white/80 text-sm mt-1">{comment.content}</p>
                                                        {currentUser?._id === comment.owner?._id && (
                                                            <button onClick={() => handleDeleteVideoComment(comment._id)} className="text-red-400 text-xs mt-1 hover:underline">Delete</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {!commentsLoading && videoComments.length === 0 && <div className="text-center text-white/50 py-10">No comments yet. Be the first!</div>}
                                        </div>

                                        {currentUser ? (
                                            <form onSubmit={handleAddComment} className="mt-auto pt-4 border-t border-white/10">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={e => setCommentText(e.target.value)}
                                                        placeholder="Add a comment..."
                                                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-red-400"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!commentText.trim()}
                                                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                                                    >
                                                        <Send className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="text-center text-white/60 text-sm py-4 border-t border-white/10">
                                                Please <Link href="/auth" className="text-red-400 hover:underline">login</Link> to comment
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}


