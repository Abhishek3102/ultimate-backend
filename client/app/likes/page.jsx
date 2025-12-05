"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, ArrowLeft, Video, MessageSquare, Clock } from "lucide-react"
import Link from "next/link"

export default function LikesPage() {
  const [likedVideos, setLikedVideos] = useState([])
  const [likedTweets, setLikedTweets] = useState([])
  const [activeTab, setActiveTab] = useState("videos")

  useEffect(() => {
    fetchLikedVideos()
    fetchLikedTweets()
  }, [])

  const fetchLikedVideos = async () => {
    try {
      const response = await fetch("/api/v1/likes/videos", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const contentType = response.headers.get("content-type")

      if (!contentType || !contentType.includes("application/json")) {
        // Mock data for demo
        setLikedVideos([
          {
            _id: "1",
            video: {
              _id: "v1",
              title: "Amazing React Tutorial",
              description: "Learn React from scratch with this comprehensive tutorial",
              thumbnail: "/placeholder.svg?height=200&width=300",
              duration: 1800,
              views: 15000,
              owner: {
                _id: "owner1",
                username: "ReactMaster",
                avatar: "/placeholder.svg?height=40&width=40",
              },
              createdAt: "2024-01-15T10:30:00Z",
            },
            createdAt: "2024-01-16T14:20:00Z",
          },
          {
            _id: "2",
            video: {
              _id: "v2",
              title: "JavaScript ES6 Features",
              description: "Explore the latest JavaScript features and how to use them",
              thumbnail: "/placeholder.svg?height=200&width=300",
              duration: 1200,
              views: 8500,
              owner: {
                _id: "owner2",
                username: "JSExpert",
                avatar: "/placeholder.svg?height=40&width=40",
              },
              createdAt: "2024-01-14T16:45:00Z",
            },
            createdAt: "2024-01-15T09:15:00Z",
          },
        ])
        return
      }

      const data = await response.json()
      setLikedVideos(data.data || [])
    } catch (error) {
      console.error("Error fetching liked videos:", error)
      setLikedVideos([])
    }
  }

  const fetchLikedTweets = async () => {
    try {
      const response = await fetch("/api/v1/likes/tweets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const contentType = response.headers.get("content-type")

      if (!contentType || !contentType.includes("application/json")) {
        // Mock data for demo
        setLikedTweets([
          {
            _id: "1",
            tweet: {
              _id: "t1",
              content: "Just finished building an amazing React app! The new hooks are incredible 🚀",
              owner: {
                _id: "towner1",
                username: "DevEnthusiast",
                avatar: "/placeholder.svg?height=40&width=40",
              },
              createdAt: "2024-01-15T12:30:00Z",
            },
            createdAt: "2024-01-15T13:45:00Z",
          },
          {
            _id: "2",
            tweet: {
              _id: "t2",
              content: "Beautiful sunset today! Sometimes you need to step away from the code and enjoy nature 🌅",
              owner: {
                _id: "towner2",
                username: "NatureCoder",
                avatar: "/placeholder.svg?height=40&width=40",
              },
              createdAt: "2024-01-14T18:20:00Z",
            },
            createdAt: "2024-01-14T19:10:00Z",
          },
        ])
        return
      }

      const data = await response.json()
      setLikedTweets(data.data || [])
    } catch (error) {
      console.error("Error fetching liked tweets:", error)
      setLikedTweets([])
    }
  }

  const removeLike = async (type, itemId) => {
    try {
      const endpoint = type === "video" ? `/api/v1/likes/toggle/v/${itemId}` : `/api/v1/likes/toggle/t/${itemId}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        if (type === "video") {
          setLikedVideos((prev) => prev.filter((item) => item.video._id !== itemId))
        } else {
          setLikedTweets((prev) => prev.filter((item) => item.tweet._id !== itemId))
        }
      }
    } catch (error) {
      console.error("Remove like error:", error)
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return "now"
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}d`
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
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/90 via-rose-900/90 to-red-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-rose-400 to-red-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              <Heart className="w-8 h-8 text-pink-400" />
              <h1 className="text-3xl font-bold text-white">Liked Content</h1>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex mb-8 bg-white/10 rounded-2xl p-1 max-w-md"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("videos")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "videos"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Video className="w-4 h-4" />
            Videos ({likedVideos.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("tweets")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "tweets"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tweets ({likedTweets.length})
          </motion.button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "videos" ? (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {likedVideos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {likedVideos.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all"
                      >
                        {/* Video Thumbnail */}
                        <div className="relative">
                          <img
                            src={item.video.thumbnail || "/placeholder.svg"}
                            alt={item.video.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(item.video.duration)}
                          </div>
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={item.video.owner?.avatar || "/placeholder.svg"}
                              alt={item.video.owner?.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 line-clamp-2">{item.video.title}</h3>
                              <p className="text-gray-300 text-sm">{item.video.owner?.username}</p>
                            </div>
                          </div>

                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.video.description}</p>

                          <div className="flex items-center justify-between text-gray-400 text-sm mb-3">
                            <span>{formatViews(item.video.views)} views</span>
                            <span>Liked {formatTime(item.createdAt)} ago</span>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeLike("video", item.video._id)}
                            className="w-full py-2 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center justify-center gap-2"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                            Remove Like
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <Video className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Liked Videos</h3>
                  <p className="text-gray-300 mb-6">Start liking videos to see them here!</p>
                  <Link href="/videos">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                    >
                      Explore Videos
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tweets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {likedTweets.length > 0 ? (
                <div className="space-y-6 max-w-4xl">
                  <AnimatePresence>
                    {likedTweets.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
                      >
                        <div className="flex gap-4">
                          <img
                            src={item.tweet.owner?.avatar || "/placeholder.svg"}
                            alt={item.tweet.owner?.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold">{item.tweet.owner?.username}</h3>
                              <span className="text-gray-400 text-sm flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(item.tweet.createdAt)}
                              </span>
                            </div>

                            <p className="text-gray-200 mb-4 leading-relaxed">{item.tweet.content}</p>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Liked {formatTime(item.createdAt)} ago</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeLike("tweet", item.tweet._id)}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center gap-2"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                                Remove Like
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Liked Tweets</h3>
                  <p className="text-gray-300 mb-6">Start liking tweets to see them here!</p>
                  <Link href="/tweets">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                    >
                      Explore Tweets
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
