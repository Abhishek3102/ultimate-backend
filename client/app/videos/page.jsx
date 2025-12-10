"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Upload, Play, Heart, Share, ArrowLeft, Eye, Clock, MessageSquare, Plus, Send } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function VideosPageContent() {
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    videoFile: null,
    thumbnail: null,
  })
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (user?._id) {
      fetchVideos()
    } else if (!isAuthenticated) {
      // if not authenticated, maybe fetch all or empty? 
      // User requirement: "in videos section, only the user who is logged in should get their video"
      // If not logged in, they presumably see nothing or a "login" prompt.
      // Existing code fetched all. Let's stick to "authenticated user sees their videos".
      fetchVideos()
    }
  }, [user, isAuthenticated])

  const fetchVideos = async () => {
    try {
      setFetching(true)
      // Pass user ID to filter videos. If user is null, it passes undefined, returning all.
      // But user wants "only the user who is logged in should get their video".
      // So if logged in, pass ID.
      const response = await api.getVideos(user?._id)

      let videoList = []
      // Handle paginated response from backend { data: { videos: [...] } }
      if (response.data?.videos && Array.isArray(response.data.videos)) {
        videoList = response.data.videos
      }
      // Handle legacy/mock response { data: [...] }
      else if (Array.isArray(response.data)) {
        videoList = response.data
      }

      setVideos(videoList)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setFetching(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert("Please login to upload videos")
      return
    }
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", uploadData.title)
      formData.append("description", uploadData.description)
      if (uploadData.videoFile) formData.append("videoFile", uploadData.videoFile)
      if (uploadData.thumbnail) formData.append("thumbnail", uploadData.thumbnail)

      await api.uploadVideo(formData)

      setUploadData({ title: "", description: "", videoFile: null, thumbnail: null })
      setShowUploadModal(false)
      alert("Video uploaded successfully!")
      fetchVideos() // Refresh list
    } catch (error) {
      console.error("Upload error:", error)
      alert(error.message || "Failed to upload video")
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (videoId) => {
    if (!isAuthenticated) {
      alert("Please login to like videos")
      return
    }

    try {
      await api.toggleVideoLike(videoId)
      // Optimistic update or refresh
      fetchVideos()
    } catch (error) {
      console.error("Like error:", error)
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

  /* ... inside VideosPageContent ... */

  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoComments, setVideoComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

  const openVideo = async (video) => {
    setSelectedVideo(video) // Show immediately with list data
    fetchComments(video._id)

    // Fetch fresh details (isLiked, accurate counts)
    try {
      const response = await api.getVideoById(video._id)
      if (response.data) {
        setSelectedVideo(response.data)
      }
    } catch (e) {
      console.error("Failed to fetch fresh video details", e)
    }
  }

  const closeVideo = () => {
    setSelectedVideo(null)
    setVideoComments([])
    setCommentText("")
    fetchVideos() // Update list to reflect any changes like view counts if applicable
  }

  const fetchComments = async (videoId) => {
    setCommentsLoading(true)
    try {
      const response = await api.getVideoComments(videoId)
      // Check for array inside data.comments based on controller logic
      // Controller returns { data: { comments: [], ... } }
      const comments = response.data?.comments || []
      setVideoComments(comments)
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
      // Update comment count on local selected video object too if we want immediate feedback
      setSelectedVideo(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }))
    } catch (error) {
      console.error("Add comment error:", error)
      alert("Failed to post comment")
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
    if (!isAuthenticated) {
      alert("Please login to like videos")
      return
    }

    try {
      // Optimistic Update
      setVideos(prevVideos =>
        prevVideos.map(v => {
          if (v._id === videoId) {
            const isLiked = !v.isLiked;
            return {
              ...v,
              isLiked,
              likesCount: isLiked ? (v.likesCount || 0) + 1 : Math.max(0, (v.likesCount || 0) - 1)
            }
          }
          return v
        })
      )

      // Update modal if open
      if (selectedVideo && selectedVideo._id === videoId) {
        setSelectedVideo(prev => {
          const isLiked = !prev.isLiked;
          return {
            ...prev,
            isLiked,
            likesCount: isLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1)
          }
        })
      }

      await api.toggleVideoLike(videoId)
      // We don't need to re-fetch if optimistic update matches server logic

    } catch (error) {
      console.error("Like error:", error)
      // Revert optimistic update on error would be ideal here
      fetchVideos() // Fallback to sync
    }
  }


  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-900/90 via-pink-900/90 to-purple-900/90">
      {/* ... Backgrounds ... */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
        }}
      />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 pt-32"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* ... Header Content ... */}
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
      <div className="relative z-10 p-6 max-w-7xl mx-auto min-h-[50vh]">
        {/* ... Fetching state ... */}
        {fetching ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {videos.map((video, index) => (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all group flex flex-col"
                >
                  {/* Video Thumbnail - Click to Open */}
                  <div
                    onClick={() => openVideo(video)}
                    className="relative aspect-video bg-black/40 cursor-pointer"
                  >
                    <img
                      src={(video.thumbnail || "/placeholder.svg").replace('http://', 'https://')}
                      alt={video.title}
                      className="w-full h-full object-cover"
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

                  {/* Video Info - Click to Open */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={(video.owner?.avatar || "/placeholder.svg").replace('http://', 'https://')}
                        alt={video.owner?.username}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-white font-semibold mb-1 line-clamp-2 cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => openVideo(video)}
                        >{video.title}</h3>
                        <p className="text-gray-300 text-sm truncate">{video.owner?.username}</p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-3 line-clamp-2 h-10">{video.description}</p>

                    <div className="flex items-center justify-between text-gray-400 text-sm mb-3 mt-auto">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {formatViews(video.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVideoLike(video._id)
                          }}
                          className={`flex items-center gap-1 transition-colors hover:text-red-400 cursor-pointer ${video.likesCount > 0 ? "text-red-400" : "text-gray-400"
                            }`}
                        >
                          <Heart className={`w-4 h-4 ${video.likesCount > 0 ? "fill-current" : ""}`} />
                          <span className="text-sm">{video.likesCount || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openVideo(video)
                          }}
                          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">
                            {video.commentsCount ? `${video.commentsCount} comments` : "No comments"}
                          </span>
                        </button>
                      </div>
                      <button
                        onClick={() => openVideo(video)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Watch
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>



          </div >
        )
        }

        {/* ... Empty States ... */}
        {
          !fetching && videos.length === 0 && isAuthenticated && (
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
          )
        }

        {
          !fetching && !isAuthenticated && videos.length === 0 && ( /* ... */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 mt-8">
              {/* ... Login Prompt ... */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <Video className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Join Socioverse</h3>
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
          )
        }
      </div >

      {/* Video Player Modal */}
      < AnimatePresence >
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
                        <button onClick={() => toggleLike(selectedVideo._id)} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all ${selectedVideo.likesCount > 0 ? "text-red-400" : "text-white"}`}>
                          <Heart className={`w-5 h-5 ${selectedVideo.likesCount > 0 ? "fill-current" : ""}`} />
                          <span>{selectedVideo.likesCount || 0}</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (!isAuthenticated) return alert("Please login to create a watch party")
                            try {
                              const res = await api.createTheater(selectedVideo._id)
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
                            {user?._id === comment.owner?._id && (
                              <button onClick={() => handleDeleteVideoComment(comment._id)} className="text-red-400 text-xs mt-1 hover:underline">Delete</button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!commentsLoading && videoComments.length === 0 && <div className="text-center text-white/50 py-10">No comments yet. Be the first!</div>}
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
          </motion.div>
        )}
      </AnimatePresence >

      {/* Upload Modal existing ... */}


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
                    required
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
                    required
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Thumbnail</p>
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
    </div >
  )
}

export default function VideosPage() {
  return (
    <AuthProvider>
      <VideosPageContent />
    </AuthProvider>
  )
}
