"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Heart, Share, ArrowLeft, Clock, Send, Trash2 } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function TweetDetailContent() {
    const { tweetId } = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [tweet, setTweet] = useState(null)
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState([])
    const [replyContent, setReplyContent] = useState("")
    const [commentsLoading, setCommentsLoading] = useState(false)

    useEffect(() => {
        if (tweetId) {
            fetchTweet()
            fetchComments()
        }
    }, [tweetId])

    const fetchTweet = async () => {
        try {
            const res = await api.getTweetById(tweetId)
            setTweet(res.data)
        } catch (error) {
            console.error("Failed to fetch tweet", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchComments = async () => {
        setCommentsLoading(true)
        try {
            const res = await api.getTweetComments(tweetId)
            // Controller: { data: { comments: [...] } } or { data: [...] } ?
            // api.js says: return this.request(...)
            // Controller `getTweetComments`: returns { data: { comments: [] } }
            setComments(res.data?.comments || [])
        } catch (error) {
            console.error("Failed to fetch comments", error)
        } finally {
            setCommentsLoading(false)
        }
    }

    const toggleLike = async () => {
        if (!isAuthenticated) return alert("Please login to like tweets")

        try {
            setTweet(prev => {
                const isLiked = !prev.isLiked
                return {
                    ...prev,
                    isLiked,
                    likesCount: isLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1)
                }
            })
            await api.toggleTweetLike(tweetId)
        } catch (error) {
            console.error("Like error", error)
            fetchTweet()
        }
    }

    const handleReply = async () => {
        if (!replyContent.trim()) return

        try {
            const res = await api.addTweetComment(tweetId, replyContent)
            setComments(prev => [res.data, ...prev])
            setReplyContent("")
            setTweet(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
        } catch (error) {
            console.error("Reply error", error)
            alert("Failed to reply")
        }
    }

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Delete this comment?")) return
        try {
            await api.deleteComment(commentId)
            setComments(prev => prev.filter(c => c._id !== commentId))
            setTweet(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }))
        } catch (error) {
            console.error("Delete comment error", error)
        }
    }

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (!tweet) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90 flex justify-center items-center flex-col text-white">
                <h1 className="text-2xl font-bold mb-4">Tweet Not Found</h1>
                <Link href="/tweets" className="text-green-300 hover:text-white underline">Back to Tweets</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90">
            {/* Backgrounds - consistent with TweetsPage */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                style={{ backgroundImage: "url('/placeholder.svg?height=1080&width=1920')" }}
            />
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400 to-teal-400 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl animate-bounce" />
            </div>

            <div className="relative z-10 pt-24 px-6 min-h-screen max-w-4xl mx-auto">
                <Link href="/tweets" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-6 h-6" /> Back to Tweets
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl"
                >
                    {/* Tweet Header */}
                    <div className="flex gap-4 mb-6">
                        <img
                            src={tweet.owner?.avatar || "/placeholder.svg"}
                            alt={tweet.owner?.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-white">{tweet.owner?.username}</h1>
                            <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(tweet.createdAt)}
                            </div>
                        </div>
                    </div>

                    {/* Tweet Content */}
                    <p className="text-xl text-white/90 leading-relaxed mb-8 whitespace-pre-wrap">
                        {tweet.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-8 border-t border-b border-white/10 py-4 mb-6">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-2 transition-colors ${tweet.isLiked || tweet.likesCount > 0 ? "text-red-400" : "text-gray-400 hover:text-red-400"}`}
                        >
                            <Heart className={`w-6 h-6 ${tweet.isLiked ? "fill-current" : ""}`} />
                            <span className="text-lg">{tweet.likesCount || 0}</span>
                        </button>
                        <div className="flex items-center gap-2 text-blue-400">
                            <MessageSquare className="w-6 h-6" />
                            <span className="text-lg">{tweet.commentsCount || 0}</span>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors ml-auto">
                            <Share className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Replies */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white mb-4">Replies</h3>

                        {/* Reply Input */}
                        {isAuthenticated ? (
                            <div className="flex gap-4 mb-8">
                                <img
                                    src={user?.avatar || "/placeholder.svg"}
                                    alt={user?.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Tweet your reply..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:bg-white/10 transition-all resize-none h-24"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleReply}
                                            disabled={!replyContent.trim()}
                                            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" /> Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-xl p-4 text-center text-white/60 mb-6">
                                <Link href="/auth" className="text-green-400 hover:underline">Login</Link> to reply
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                            {commentsLoading && <div className="text-center text-white/50">Loading comments...</div>}
                            {!commentsLoading && comments.map(comment => (
                                <div key={comment._id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={comment.owner?.avatar || "/placeholder.svg"}
                                                className="w-10 h-10 rounded-full object-cover"
                                                alt={comment.owner?.username}
                                            />
                                            <div>
                                                <span className="text-white font-semibold block">{comment.owner?.username}</span>
                                                <span className="text-white/40 text-xs">{formatTime(comment.createdAt)}</span>
                                            </div>
                                        </div>
                                        {user?._id === comment.owner?._id && (
                                            <button onClick={() => handleDeleteComment(comment._id)} className="text-gray-400 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-white/80 pl-13">{comment.content}</p>
                                </div>
                            ))}
                            {!commentsLoading && comments.length === 0 && (
                                <div className="text-center text-white/40 py-8">
                                    No replies yet. Be the first to start the conversation!
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default function TweetDetailPage() {
    return (
        <AuthProvider>
            <TweetDetailContent />
        </AuthProvider>
    )
}
