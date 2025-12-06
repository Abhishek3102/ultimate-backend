"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Heart, Share, ArrowLeft, Clock, Repeat, Edit, Trash2, Send } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function TweetsPageContent() {
  const [tweets, setTweets] = useState([])
  const [likedTweets, setLikedTweets] = useState([])
  const [newTweet, setNewTweet] = useState("")
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [processingLikes, setProcessingLikes] = useState(new Set())
  const { user, isAuthenticated } = useAuth()

  // New state for comments
  const [activeTweetId, setActiveTweetId] = useState(null)
  const [tweetComments, setTweetComments] = useState({}) // Map tweetId -> comments[]
  const [commentLoading, setCommentLoading] = useState({})

  /* ... existing methods ... */

  const loadComments = async (tweetId) => {
    if (tweetComments[tweetId]) return

    setCommentLoading(prev => ({ ...prev, [tweetId]: true }))
    try {
      const response = await api.getTweetComments(tweetId)
      setTweetComments(prev => ({ ...prev, [tweetId]: response.data?.comments || [] }))
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setCommentLoading(prev => ({ ...prev, [tweetId]: false }))
    }
  }

  const toggleComments = (tweetId) => {
    if (activeTweetId === tweetId) {
      setActiveTweetId(null)
    } else {
      setActiveTweetId(tweetId)
      loadComments(tweetId)
    }
  }

  const handleUpdateComment = async (tweetId, commentId, content) => {
    try {
      await api.updateComment(commentId, content)
      setTweetComments(prev => ({
        ...prev,
        [tweetId]: prev[tweetId].map(c => c._id === commentId ? { ...c, content } : c)
      }))
    } catch (error) {
      alert("Failed to update comment")
    }
  }

  const handleDeleteComment = async (tweetId, commentId) => {
    if (!confirm("Delete this comment?")) return
    try {
      await api.deleteComment(commentId)
      setTweetComments(prev => ({
        ...prev,
        [tweetId]: prev[tweetId].filter(c => c._id !== commentId)
      }))
      setTweets(prev => prev.map(t => t._id === tweetId ? { ...t, commentsCount: Math.max(0, t.commentsCount - 1) } : t))
    } catch (error) {
      alert("Failed to delete comment")
    }
  }

  /* Update handleReply to refresh comments */
  const handleReply = async (tweetId) => {
    if (!replyContent.trim()) return

    try {
      const res = await api.addTweetComment(tweetId, replyContent)

      setTweets((prev) =>
        prev.map((tweet) => (tweet._id === tweetId ? { ...tweet, commentsCount: tweet.commentsCount + 1 } : tweet)),
      )

      // Add new comment to state
      setTweetComments(prev => ({
        ...prev,
        [tweetId]: [res.data, ...(prev[tweetId] || [])]
      }))

      setReplyingTo(null)
      setReplyContent("")
      setActiveTweetId(tweetId) // Auto expand
    } catch (error) {
      console.error("Reply error:", error)
      alert(error.message || "Failed to post reply")
    }
  }

  /* ... Render loop ... */
  /* This replace is tricky. I need to inject these functions. */


  useEffect(() => {
    if (isAuthenticated) {
      fetchTweets()
      fetchLikedTweets()
    }
  }, [isAuthenticated])

  const fetchTweets = async () => {
    try {
      setLoading(true)
      const response = await api.getUserTweets(user._id)
      setTweets(response.data || [])
    } catch (error) {
      console.error("Error fetching tweets:", error)
      setTweets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedTweets = async () => {
    try {
      const response = await api.getLikedTweets()
      const likedTweetIds = response.data?.map((item) => item.tweet._id) || []
      setLikedTweets(likedTweetIds)
    } catch (error) {
      console.error("Error fetching liked tweets:", error)
    }
  }

  const handleTweet = async (e) => {
    e.preventDefault()
    if (!newTweet.trim() || posting) return

    if (!isAuthenticated) {
      alert("Please login to post tweets")
      return
    }

    setPosting(true)

    try {
      const response = await api.createTweet(newTweet)
      setTweets((prev) => [response.data, ...prev])
      setNewTweet("")
    } catch (error) {
      console.error("Tweet error:", error)
      alert(error.message || "Failed to post tweet")
    } finally {
      setPosting(false)
    }
  }

  const handleUpdateTweet = async (tweetId, content) => {
    try {
      const response = await api.updateTweet(tweetId, content)
      setTweets((prev) => prev.map((tweet) => (tweet._id === tweetId ? response.data : tweet)))
      setEditingTweet(null)
      setEditContent("")
    } catch (error) {
      console.error("Update error:", error)
      alert(error.message || "Failed to update tweet")
    }
  }

  const handleDeleteTweet = async (tweetId) => {
    if (!confirm("Are you sure you want to delete this tweet?")) return

    try {
      await api.deleteTweet(tweetId)
      setTweets((prev) => prev.filter((tweet) => tweet._id !== tweetId))
    } catch (error) {
      console.error("Delete error:", error)
      alert(error.message || "Failed to delete tweet")
    }
  }



  const toggleLike = async (tweetId) => {
    if (!isAuthenticated) {
      alert("Please login to like tweets")
      return
    }

    if (processingLikes.has(tweetId)) return

    try {
      setProcessingLikes(prev => new Set(prev).add(tweetId))
      await api.toggleTweetLike(tweetId)

      const isLiked = likedTweets.includes(tweetId)

      setTweets((prev) =>
        prev.map((tweet) =>
          tweet._id === tweetId
            ? { ...tweet, likesCount: isLiked ? tweet.likesCount - 1 : tweet.likesCount + 1 }
            : tweet,
        ),
      )

      if (isLiked) {
        setLikedTweets((prev) => prev.filter((id) => id !== tweetId))
      } else {
        setLikedTweets((prev) => [...prev, tweetId])
      }
    } catch (error) {
      console.error("Like error:", error)
      alert(error.message || "Failed to toggle like")
    } finally {
      setProcessingLikes(prev => {
        const newSet = new Set(prev)
        newSet.delete(tweetId)
        return newSet
      })
    }
  }



  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Mock data for non-authenticated users
  const mockTweets = [
    {
      _id: "mock_tweet_1",
      content: "Just launched my new project! Excited to share it with the world 🚀",
      owner: {
        _id: "mock_user1",
        username: "TechEnthusiast",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      likesCount: 24,
      commentsCount: 5,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "mock_tweet_2",
      content: "Beautiful sunset today! Nature never fails to amaze me 🌅 #photography #nature",
      owner: {
        _id: "mock_user2",
        username: "NaturePhotographer",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      likesCount: 156,
      commentsCount: 18,
      createdAt: "2024-01-15T08:15:00Z",
      updatedAt: "2024-01-15T08:15:00Z",
    },
  ]

  const displayTweets = isAuthenticated ? tweets : mockTweets

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
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400 to-teal-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 pt-32"
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
              <MessageSquare className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">Tweets</h1>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Tweet Composer */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl mb-8"
          >
            <form onSubmit={handleTweet} className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={user?.avatar || "/placeholder.svg?height=48&width=48"}
                  alt={user?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder="What's happening?"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all resize-none h-24"
                    maxLength={280}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-gray-400 text-sm">{newTweet.length}/280</span>
                    <motion.button
                      type="submit"
                      disabled={posting || !newTweet.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {posting ? "Posting..." : "Tweet"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8 text-center"
          >
            <MessageSquare className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Join the Conversation</h3>
            <p className="text-gray-300 mb-6">Login to post tweets and engage with the community</p>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                Login to Tweet
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && isAuthenticated && (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Tweets Feed */}
        <div className="space-y-6">
          <AnimatePresence>
            {displayTweets.map((tweet, index) => (
              <motion.div
                key={tweet._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex gap-4">
                  <img
                    src={tweet.owner?.avatar || "/placeholder.svg"}
                    alt={tweet.owner?.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{tweet.owner?.username}</h3>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(tweet.createdAt)}
                        </span>
                      </div>
                      {isAuthenticated && user?._id === tweet.owner?._id && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditingTweet(tweet._id)
                              setEditContent(tweet.content)
                            }}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTweet(tweet._id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {editingTweet === tweet._id ? (
                      <div className="mb-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-all resize-none h-20"
                          maxLength={280}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-400 text-sm">{editContent.length}/280</span>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setEditingTweet(null)
                                setEditContent("")
                              }}
                              className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpdateTweet(tweet._id, editContent)}
                              className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                            >
                              Update
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 mb-4 leading-relaxed">{tweet.content}</p>
                    )}

                    <div className="flex items-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLike(tweet._id)}
                        className={`flex items-center gap-2 transition-colors ${isAuthenticated && likedTweets.includes(tweet._id)
                          ? "text-red-400"
                          : "text-gray-400 hover:text-red-400"
                          }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${isAuthenticated && likedTweets.includes(tweet._id) ? "fill-current" : ""}`}
                        />
                        <span className="text-sm">{tweet.likesCount || 0}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleComments(tweet._id)}
                        className={`flex items-center gap-2 transition-colors ${activeTweetId === tweet._id ? "text-blue-400" : "text-gray-400 hover:text-blue-400"}`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{tweet.commentsCount || 0}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
                      >
                        <Repeat className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-gray-400 hover:text-white transition-colors ml-auto"
                      >
                        <Share className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Comments Section & Reply Form */}
                    {activeTweetId === tweet._id && isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10"
                      >
                        {/* Reply Input */}
                        <div className="flex gap-3 mb-6">
                          <img
                            src={user?.avatar || "/placeholder.svg?height=32&width=32"}
                            alt={user?.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Tweet your reply..."
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none h-16"
                              maxLength={280}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-gray-400 text-xs">{replyContent.length}/280</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReply(tweet._id)}
                                disabled={!replyContent.trim()}
                                className="px-4 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Reply
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Comments List */}
                        {commentLoading[tweet._id] ? (
                          <div className="flex justify-center p-4">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="space-y-4 pl-4 border-l-2 border-white/10">
                            {tweetComments[tweet._id]?.map(comment => (
                              <div key={comment._id} className="bg-white/5 rounded-xl p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2 mb-1">
                                    <img
                                      src={comment.owner?.avatar || "/placeholder.svg"}
                                      className="w-6 h-6 rounded-full"
                                      alt={comment.owner?.username}
                                    />
                                    <span className="text-white font-medium text-sm">{comment.owner?.username}</span>
                                    <span className="text-gray-500 text-xs">{formatTime(comment.createdAt)}</span>
                                  </div>
                                  {user?._id === comment.owner?._id && (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleDeleteComment(tweet._id, comment._id)} className="text-gray-400 hover:text-red-400">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                              </div>
                            ))}
                            {(!tweetComments[tweet._id] || tweetComments[tweet._id].length === 0) && (
                              <p className="text-gray-500 text-center text-sm py-2">No comments yet</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayTweets.length === 0 && isAuthenticated && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Tweets Yet</h3>
            <p className="text-gray-300 mb-6">Share your first thought with the world!</p>
          </motion.div>
        )}
      </div>
    </div >
  )
}

export default function TweetsPage() {
  return (
    <AuthProvider>
      <TweetsPageContent />
    </AuthProvider>
  )
}
