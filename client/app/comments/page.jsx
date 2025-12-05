"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, ArrowLeft, Video, Clock, Heart, Reply, Trash2, Send } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { useLocalStorage } from "@/hooks/useLocalStorage"

function CommentsPageContent() {
  const [comments, setComments, isClient] = useLocalStorage("comments", [])
  const [likedComments, setLikedComments] = useLocalStorage("likedComments", [])
  const [activeTab, setActiveTab] = useState("video")
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Mock data for non-authenticated users
  const mockComments = [
    {
      _id: "mock_comment_1",
      content: "This is an amazing tutorial! Really helped me understand React hooks better.",
      owner: {
        _id: "mock_user1",
        username: "ReactLearner",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      video:
        activeTab === "video"
          ? {
              _id: "v1",
              title: "React Hooks Tutorial",
            }
          : null,
      tweet:
        activeTab === "tweet"
          ? {
              _id: "t1",
              content: "Just learned something new today!",
            }
          : null,
      likesCount: 12,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "mock_comment_2",
      content: "Great explanation! Could you make a follow-up video about useEffect?",
      owner: {
        _id: "mock_user2",
        username: "DevEnthusiast",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      video:
        activeTab === "video"
          ? {
              _id: "v1",
              title: "React Hooks Tutorial",
            }
          : null,
      tweet:
        activeTab === "tweet"
          ? {
              _id: "t1",
              content: "Just learned something new today!",
            }
          : null,
      likesCount: 8,
      createdAt: "2024-01-15T11:45:00Z",
      updatedAt: "2024-01-15T11:45:00Z",
    },
  ]

  const displayComments = isAuthenticated
    ? comments.filter((c) => (activeTab === "video" ? c.video : c.tweet))
    : mockComments

  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || loading) return

    if (!isAuthenticated) {
      alert("Please login to comment")
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newCommentObj = {
        _id: Date.now().toString(),
        content: newComment,
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || "/placeholder.svg?height=40&width=40",
        },
        video:
          activeTab === "video"
            ? {
                _id: "v1",
                title: "Sample Video",
              }
            : null,
        tweet:
          activeTab === "tweet"
            ? {
                _id: "t1",
                content: "Sample Tweet",
              }
            : null,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setComments((prev) => [newCommentObj, ...prev])
      setNewComment("")
    } catch (error) {
      alert("Failed to add comment")
    } finally {
      setLoading(false)
    }
  }

  const deleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    setComments((prev) => prev.filter((comment) => comment._id !== commentId))
  }

  const toggleLike = async (commentId) => {
    if (!isAuthenticated) {
      alert("Please login to like comments")
      return
    }

    const isLiked = likedComments.includes(commentId)

    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? {
              ...comment,
              likesCount: isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
            }
          : comment,
      ),
    )

    if (isLiked) {
      setLikedComments((prev) => prev.filter((id) => id !== commentId))
    } else {
      setLikedComments((prev) => [...prev, commentId])
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return "now"
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}d`
  }

  if (!isClient) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-900/90 via-indigo-900/90 to-purple-900/90" />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/90 to-purple-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </Link>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Comments</h1>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex mb-8 bg-white/10 rounded-2xl p-1 max-w-md"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "video"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Video className="w-4 h-4" />
            Video Comments
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("tweet")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "tweet"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tweet Comments
          </motion.button>
        </motion.div>

        {/* Comment Composer */}
        {isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl mb-8"
          >
            <form onSubmit={addComment} className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={user?.avatar || "/placeholder.svg?height=48&width=48"}
                  alt={user?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Add a comment to this ${activeTab}...`}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none h-24"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-gray-400 text-sm">{newComment.length} characters</span>
                    <motion.button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Posting..." : "Comment"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8 text-center"
          >
            <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Join the Discussion</h3>
            <p className="text-gray-300 mb-6">Login to comment and engage with the community</p>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                Login to Comment
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          <AnimatePresence>
            {displayComments.map((comment, index) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex gap-4">
                  <img
                    src={comment.owner?.avatar || "/placeholder.svg"}
                    alt={comment.owner?.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{comment.owner?.username}</h3>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      {isAuthenticated && user?._id === comment.owner?._id && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteComment(comment._id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* Context Info */}
                    {comment.video && (
                      <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-300 text-sm flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Commented on: {comment.video.title}
                        </p>
                      </div>
                    )}

                    {comment.tweet && (
                      <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-300 text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Replied to: "{comment.tweet.content.substring(0, 50)}..."
                        </p>
                      </div>
                    )}

                    <p className="text-gray-200 mb-4 leading-relaxed">{comment.content}</p>

                    <div className="flex items-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLike(comment._id)}
                        className={`flex items-center gap-2 transition-colors ${
                          isAuthenticated && likedComments.includes(comment._id)
                            ? "text-red-400"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isAuthenticated && likedComments.includes(comment._id) ? "fill-current" : ""}`}
                        />
                        <span className="text-sm">{comment.likesCount}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setReplyingTo(comment._id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <span className="text-sm">Reply</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayComments.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Comments Yet</h3>
            <p className="text-gray-300 mb-6">
              {isAuthenticated ? "Be the first to share your thoughts!" : "Login to see and add comments!"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CommentsPage() {
  return (
    <AuthProvider>
      <CommentsPageContent />
    </AuthProvider>
  )
}
