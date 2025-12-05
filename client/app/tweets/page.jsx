"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Heart, Share, ArrowLeft, Clock, Repeat, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { useLocalStorage } from "@/hooks/useLocalStorage"

function TweetsPageContent() {
  const [tweets, setTweets, isClient] = useLocalStorage("tweets", [])
  const [likedTweets, setLikedTweets] = useLocalStorage("likedTweets", [])
  const [newTweet, setNewTweet] = useState("")
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

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

  const handleTweet = async (e) => {
    e.preventDefault()
    if (!newTweet.trim() || loading) return

    if (!isAuthenticated) {
      alert("Please login to post tweets")
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newTweetObj = {
        _id: Date.now().toString(),
        content: newTweet,
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || "/placeholder.svg?height=40&width=40",
        },
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTweets((prev) => [newTweetObj, ...prev])
      setNewTweet("")
    } catch (error) {
      alert("Failed to post tweet")
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (tweetId) => {
    if (!isAuthenticated) {
      alert("Please login to like tweets")
      return
    }

    const isLiked = likedTweets.includes(tweetId)

    if (isAuthenticated) {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet._id === tweetId
            ? {
                ...tweet,
                likesCount: isLiked ? tweet.likesCount - 1 : tweet.likesCount + 1,
              }
            : tweet,
        ),
      )

      if (isLiked) {
        setLikedTweets((prev) => prev.filter((id) => id !== tweetId))
      } else {
        setLikedTweets((prev) => [...prev, tweetId])
      }
    }
  }

  const deleteTweet = async (tweetId) => {
    if (!confirm("Are you sure you want to delete this tweet?")) return

    setTweets((prev) => prev.filter((tweet) => tweet._id !== tweetId))
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
    return <div className="min-h-screen bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90" />
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
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400 to-teal-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl animate-bounce" />
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
                      disabled={loading || !newTweet.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? "Posting..." : "Tweet"}
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
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteTweet(tweet._id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>

                    <p className="text-gray-200 mb-4 leading-relaxed">{tweet.content}</p>

                    <div className="flex items-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLike(tweet._id)}
                        className={`flex items-center gap-2 transition-colors ${
                          isAuthenticated && likedTweets.includes(tweet._id)
                            ? "text-red-400"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${isAuthenticated && likedTweets.includes(tweet._id) ? "fill-current" : ""}`}
                        />
                        <span className="text-sm">{tweet.likesCount}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{tweet.commentsCount}</span>
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
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayTweets.length === 0 && isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Tweets Yet</h3>
            <p className="text-gray-300 mb-6">Share your first thought with the world!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function TweetsPage() {
  return (
    <AuthProvider>
      <TweetsPageContent />
    </AuthProvider>
  )
}
