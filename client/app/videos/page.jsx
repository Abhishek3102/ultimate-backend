"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Upload, Play, Heart, Share, ArrowLeft, Eye, Clock, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { useLocalStorage } from "@/hooks/useLocalStorage"

function VideosPageContent() {
  const [videos, setVideos, isClient] = useLocalStorage("videos", [])
  const [likedVideos, setLikedVideos] = useLocalStorage("likedVideos", [])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    videoFile: null,
    thumbnail: null,
  })
  const { user, isAuthenticated } = useAuth()

  // Mock data for non-authenticated users
  const mockVideos = [
    {
      _id: "mock_1",
      title: "Amazing Nature Documentary",
      description: "Explore the wonders of nature in this breathtaking documentary",
      thumbnail: "/placeholder.svg?height=200&width=300",
      videoFile: "/placeholder.svg",
      duration: 930,
      views: 1250,
      isPublished: true,
      owner: {
        _id: "mock_user1",
        username: "NatureExplorer",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      createdAt: "2024-01-15T10:30:00Z",
      likesCount: 89,
      commentsCount: 12,
    },
    {
      _id: "mock_2",
      title: "Tech Tutorial: React Hooks",
      description: "Learn React Hooks with practical examples and best practices",
      thumbnail: "/placeholder.svg?height=200&width=300",
      videoFile: "/placeholder.svg",
      duration: 1365,
      views: 3420,
      isPublished: true,
      owner: {
        _id: "mock_user2",
        username: "CodeMaster",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      createdAt: "2024-01-14T16:45:00Z",
      likesCount: 156,
      commentsCount: 23,
    },
  ]

  const displayVideos = isAuthenticated ? videos : mockVideos

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert("Please login to upload videos")
      return
    }
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newVideo = {
        _id: Date.now().toString(),
        title: uploadData.title,
        description: uploadData.description,
        thumbnail: "/placeholder.svg?height=200&width=300",
        videoFile: "/placeholder.svg",
        duration: Math.floor(Math.random() * 1800) + 300,
        views: 0,
        isPublished: true,
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || "/placeholder.svg?height=40&width=40",
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
      }
      setVideos((prev) => [newVideo, ...prev])
      setUploadData({ title: "", description: "", videoFile: null, thumbnail: null })
      setShowUploadModal(false)
      alert("Video uploaded successfully!")
    } catch (error) {
      alert("Failed to upload video")
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (videoId) => {
    if (!isAuthenticated) {
      alert("Please login to like videos")
      return
    }

    const isLiked = likedVideos.includes(videoId)

    if (isAuthenticated) {
      setVideos((prev) =>
        prev.map((video) =>
          video._id === videoId
            ? {
                ...video,
                likesCount: isLiked ? video.likesCount - 1 : video.likesCount + 1,
              }
            : video,
        ),
      )

      if (isLiked) {
        setLikedVideos((prev) => prev.filter((id) => id !== videoId))
      } else {
        setLikedVideos((prev) => [...prev, videoId])
      }
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

  if (!isClient) {
    return <div className="min-h-screen bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90" />
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
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl animate-bounce" />
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
              <Video className="w-8 h-8 text-red-400" />
              <h1 className="text-3xl font-bold text-white">Videos</h1>
            </div>
          </div>

          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Upload className="w-5 h-5" />
              Upload Video
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Videos Grid */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {displayVideos.map((video, index) => (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                {/* Video Thumbnail */}
                <div className="relative group">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </motion.button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={video.owner?.avatar || "/placeholder.svg"}
                      alt={video.owner?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">{video.title}</h3>
                      <p className="text-gray-300 text-sm">{video.owner?.username}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{video.description}</p>

                  <div className="flex items-center justify-between text-gray-400 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViews(video.views)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLike(video._id)}
                        className={`flex items-center gap-1 transition-colors ${
                          isAuthenticated && likedVideos.includes(video._id)
                            ? "text-red-400"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isAuthenticated && likedVideos.includes(video._id) ? "fill-current" : ""}`}
                        />
                        <span className="text-sm">{video.likesCount}</span>
                      </motion.button>
                      <span className="flex items-center gap-1 text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{video.commentsCount}</span>
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Share className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayVideos.length === 0 && isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Video className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Videos Yet</h3>
            <p className="text-gray-300 mb-6">Upload your first video to get started!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Upload Video
            </motion.button>
          </motion.div>
        )}

        {!isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <Video className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Join ChaiTube</h3>
              <p className="text-gray-300 mb-6">Login to upload videos and start your journey!</p>
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Upload Video</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="text"
                  placeholder="Video Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-all"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-all h-24 resize-none"
                  required
                />

                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadData((prev) => ({ ...prev, videoFile: e.target.files[0] }))}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300">Click to select video file</p>
                    {uploadData.videoFile && <p className="text-green-400 mt-2">{uploadData.videoFile.name}</p>}
                  </label>
                </div>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadData((prev) => ({ ...prev, thumbnail: e.target.files[0] }))}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Thumbnail (optional)</p>
                    {uploadData.thumbnail && <p className="text-green-400 mt-2">{uploadData.thumbnail.name}</p>}
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function VideosPage() {
  return (
    <AuthProvider>
      <VideosPageContent />
    </AuthProvider>
  )
}
