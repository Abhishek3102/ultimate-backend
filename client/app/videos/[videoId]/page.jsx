"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Play, Heart, Share, ArrowLeft, Eye, Clock, MessageSquare, Send } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function VideoPlayerContent() {
    const { videoId } = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [video, setVideo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [commentsLoading, setCommentsLoading] = useState(false)

    useEffect(() => {
        if (videoId) {
            fetchVideo()
            fetchComments()
        }
    }, [videoId])

    const fetchVideo = async () => {
        try {
            const res = await api.getVideoById(videoId)
            setVideo(res.data)
        } catch (error) {
            console.error("Failed to fetch video", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchComments = async () => {
        setCommentsLoading(true)
        try {
            const response = await api.getVideoComments(videoId)
            // Controller returns { data: { comments: [], ... } }
            const commentsList = response.data?.comments || []
            setComments(commentsList)
        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setCommentsLoading(false)
        }
    }

    const toggleVideoLike = async () => {
        if (!isAuthenticated) {
            alert("Please login to like videos")
            return
        }

        try {
            // Optimistic update
            setVideo(prev => {
                const isLiked = !prev.isLiked
                return {
                    ...prev,
                    isLiked,
                    likesCount: isLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1)
                }
            })
            await api.toggleVideoLike(videoId)
        } catch (error) {
            console.error("Like error:", error)
            fetchVideo() // Revert/Sync on error
        }
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if (!commentText.trim()) return

        try {
            const response = await api.addVideoComment(videoId, commentText)
            setComments(prev => [response.data, ...prev])
            setCommentText("")
            setVideo(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
        } catch (error) {
            console.error("Add comment error:", error)
            alert("Failed to post comment")
        }
    }

    const handleDeleteVideoComment = async (commentId) => {
        if (!confirm("Delete this comment?")) return
        try {
            await api.deleteComment(commentId)
            setComments(prev => prev.filter(c => c._id !== commentId))
            setVideo(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }))
        } catch (error) {
            console.error("Delete comment error:", error)
        }
    }

    const formatViews = (views) => {
        if (!views) return "0"
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
        return views.toString()
    }

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (!video) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90 flex justify-center items-center flex-col text-white">
                <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
                <Link href="/videos" className="text-red-300 hover:text-white underline">Back to Videos</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90">
            {/* Backgrounds */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                style={{ backgroundImage: "url('/placeholder.svg?height=1080&width=1920')" }}
            />
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl animate-bounce" />
            </div>

            <div className="relative z-10 pt-24 px-6 min-h-screen">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Player & Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/videos" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                            <ArrowLeft className="w-6 h-6" /> Back to Videos
                        </Link>

                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                            <video
                                src={video.videoFile}
                                controls
                                autoPlay
                                className="w-full h-full"
                            />
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                            <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={video.owner?.avatar || "/placeholder.svg"} className="w-12 h-12 rounded-full object-cover" alt={video.owner?.username} />
                                    <div>
                                        <h3 className="text-white font-medium">{video.owner?.username}</h3>
                                        <p className="text-white/60 text-sm">Owner</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={toggleVideoLike} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all ${video.isLiked || video.likesCount > 0 ? "text-red-400" : "text-white"}`}>
                                        <Heart className={`w-5 h-5 ${video.isLiked ? "fill-current" : ""}`} />
                                        <span>{video.likesCount || 0}</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!isAuthenticated) return alert("Please login to create a watch party")
                                            try {
                                                const res = await api.createTheater(video._id)
                                                router.push(`/cinema/${res.data.roomId}`)
                                            } catch (error) {
                                                console.error("Failed to create watch party", error)
                                                alert("Failed to create watch party")
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        <Eye className="w-5 h-5" /> Watch Party
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                                        <Share className="w-5 h-5" /> Share
                                    </button>
                                </div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-4">
                                <div className="flex gap-4 text-sm text-white/70 mb-2">
                                    <span>{formatViews(video.views)} views</span>
                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white/90 whitespace-pre-wrap">{video.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Comments */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 h-[calc(100vh-8rem)] flex flex-col sticky top-24">
                            <h2 className="text-xl font-bold text-white mb-4">Comments ({comments.length})</h2>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                {commentsLoading && <div className="text-center text-white/50">Loading comments...</div>}
                                {!commentsLoading && comments.map(comment => (
                                    <div key={comment._id} className="flex gap-3">
                                        <img src={comment.owner?.avatar || "/placeholder.svg"} className="w-8 h-8 rounded-full shrink-0 object-cover" alt="avatar" />
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-white font-medium text-sm">{comment.owner?.username}</span>
                                                <span className="text-white/40 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-white/80 text-sm mt-1">{comment.content}</p>
                                            {user?._id === comment.owner?._id && (
                                                <button onClick={() => handleDeleteVideoComment(comment._id)} className="text-red-400 text-xs mt-1 hover:underline">Delete</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {!commentsLoading && comments.length === 0 && <div className="text-center text-white/50 py-10">No comments yet. Be the first!</div>}
                            </div>

                            {isAuthenticated ? (
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
        </div>
    )
}

export default function VideoPlayerPage() {
    return (
        <AuthProvider>
            <VideoPlayerContent />
        </AuthProvider>
    )
}
