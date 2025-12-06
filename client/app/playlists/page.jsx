"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { List, Plus, ArrowLeft, Video, Play, Edit, Trash2, Lock, Globe, X } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function PlaylistsPageContent() {
  const [playlists, setPlaylists] = useState([])
  const [videos, setVideos] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddVideoModal, setShowAddVideoModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [viewingPlaylist, setViewingPlaylist] = useState(null)
  const [editingPlaylist, setEditingPlaylist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [createData, setCreateData] = useState({
    name: "",
    description: "",
    isPublic: true,
    videos: [], // Array of video IDs
  })
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists()
      fetchVideos()
    }
  }, [isAuthenticated])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await api.getPlaylists(user?._id)
      setPlaylists(response.data || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const response = await api.getVideos()
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
    }
  }

  const createPlaylist = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.createPlaylist(createData)
      // The backend should return the created playlist. 
      // If we sent videos, the backend currently returns just the IDs in the 'videos' array (based on standard mongoose create).
      // But our frontend expects full objects for display.
      // So we might need to manually hydrate them or re-fetch.
      // For a quick UX wins, let's construct the object optimistically or just re-fetch.

      // Let's re-fetch to be safe and simple, or just add what we have.
      // Optimistic approach if backend returns the object:
      setPlaylists((prev) => [response.data, ...prev])

      setCreateData({ name: "", description: "", isPublic: true, videos: [] })
      setShowCreateModal(false)
      alert("Playlist created successfully!")
      // Fetch playlists again to ensure we have populated video objects
      fetchPlaylists()
    } catch (error) {
      console.error("Create playlist error:", error)
      alert(error.message || "Failed to create playlist")
    } finally {
      setLoading(false)
    }
  }

  const updatePlaylist = async (playlistId, updateData) => {
    try {
      const response = await api.updatePlaylist(playlistId, updateData)
      setPlaylists((prev) => prev.map((playlist) => (playlist._id === playlistId ? response.data : playlist)))
      setEditingPlaylist(null)
      alert("Playlist updated successfully!")
    } catch (error) {
      console.error("Update playlist error:", error)
      alert(error.message || "Failed to update playlist")
    }
  }

  const deletePlaylist = async (playlistId) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return

    try {
      await api.deletePlaylist(playlistId)
      setPlaylists((prev) => prev.filter((playlist) => playlist._id !== playlistId))
      alert("Playlist deleted successfully!")
    } catch (error) {
      console.error("Delete playlist error:", error)
      alert(error.message || "Failed to delete playlist")
    }
  }

  const addVideoToPlaylist = async (playlistId, videoId) => {
    try {
      await api.addVideoToPlaylist(playlistId, videoId)

      // Update local state
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist._id === playlistId
            ? {
              ...playlist,
              videos: [...(playlist.videos || []), videos.find((v) => v._id === videoId)],
            }
            : playlist,
        ),
      )

      // Update viewing playlist if it's the one being modified
      if (viewingPlaylist && viewingPlaylist._id === playlistId) {
        // We need the full video object to add it to viewingPlaylist
        // Since we just have Video ID, we find it in the global videos list which has owner info
        const videoToAdd = videos.find((v) => v._id === videoId);
        if (videoToAdd) {
          setViewingPlaylist(prev => ({
            ...prev,
            videos: [...(prev.videos || []), videoToAdd]
          }))
        }
      }

      setShowAddVideoModal(false)
      setSelectedPlaylist(null)
      alert("Video added to playlist!")
    } catch (error) {
      console.error("Add video error:", error)
      alert(error.message || "Failed to add video to playlist")
    }
  }

  const removeVideoFromPlaylist = async (playlistId, videoId) => {
    if (!confirm("Remove this video from the playlist?")) return

    try {
      await api.removeVideoFromPlaylist(playlistId, videoId)

      // Update local state
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist._id === playlistId
            ? {
              ...playlist,
              videos: playlist.videos?.filter((v) => v._id !== videoId) || [],
            }
            : playlist,
        ),
      )

      // Update viewing playlist if it's the one being modified
      if (viewingPlaylist && viewingPlaylist._id === playlistId) {
        setViewingPlaylist(prev => ({
          ...prev,
          videos: prev.videos?.filter((v) => v._id !== videoId) || []
        }))
      }

      // Update editing playlist if it's the one being modified
      if (editingPlaylist && editingPlaylist._id === playlistId) {
        setEditingPlaylist(prev => ({
          ...prev,
          videos: prev.videos?.filter((v) => v._id !== videoId) || []
        }))
      }

      alert("Video removed from playlist!")
    } catch (error) {
      console.error("Remove video error:", error)
      alert(error.message || "Failed to remove video from playlist")
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Mock data for non-authenticated users
  const mockPlaylists = [
    {
      _id: "mock_1",
      name: "My Favorite Tech Videos",
      description: "Collection of the best tech tutorials and reviews",
      videos: [
        {
          _id: "v1",
          title: "React Hooks Tutorial",
          thumbnail: "/placeholder.svg?height=120&width=200",
          duration: 1365,
        },
        {
          _id: "v2",
          title: "JavaScript ES6 Features",
          thumbnail: "/placeholder.svg?height=120&width=200",
          duration: 890,
        },
      ],
      owner: {
        _id: "user1",
        username: "You",
      },
      isPublic: true,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "mock_2",
      name: "Cooking Masterclass",
      description: "Learn to cook like a professional chef",
      videos: [
        {
          _id: "v3",
          title: "Italian Pasta Basics",
          thumbnail: "/placeholder.svg?height=120&width=200",
          duration: 1200,
        },
      ],
      owner: {
        _id: "user1",
        username: "You",
      },
      isPublic: false,
      createdAt: "2024-01-14T16:45:00Z",
      updatedAt: "2024-01-14T16:45:00Z",
    },
  ]

  const displayPlaylists = isAuthenticated ? playlists : mockPlaylists

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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-amber-900/90 to-yellow-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 pt-32 bg-white/10 backdrop-blur-sm border-b border-white/20"
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
              <List className="w-8 h-8 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">Playlists</h1>
            </div>
          </div>

          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Playlist
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && isAuthenticated && (
        <div className="relative z-10 flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Playlists Grid */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {displayPlaylists.map((playlist, index) => (
              <motion.div
                key={playlist._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all"
              >
                {/* Playlist Thumbnail Grid */}
                <div
                  className="relative h-48 bg-gradient-to-br from-orange-500/20 to-amber-500/20 cursor-pointer group"
                  onClick={() => {
                    setViewingPlaylist(playlist)
                    setShowViewModal(true)
                  }}
                >
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <div className="grid grid-cols-2 h-full">
                      {playlist.videos.slice(0, 4).map((video, videoIndex) => (
                        <div key={video._id} className="relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {videoIndex === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          )}
                          {isAuthenticated && (playlist.owner?._id === user?._id || playlist.owner === user?._id) && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                removeVideoFromPlaylist(playlist._id, video._id)
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-500 z-10"
                            >
                              <X className="w-3 h-3" />
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <List className="w-16 h-16 text-orange-400/50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {playlist.isPublic ? (
                      <Globe className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                    {playlist.videos?.length || 0} videos
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg line-clamp-2">{playlist.name}</h3>
                    {isAuthenticated && (playlist.owner?._id === user?._id || playlist.owner === user?._id) && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingPlaylist(playlist)}
                          className="p-2 bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deletePlaylist(playlist._id)}
                          className="p-2 bg-white/10 rounded-full text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{playlist.description}</p>

                  <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
                    <span>by {playlist.owner?.username}</span>
                    <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                  </div>

                  {isAuthenticated && (playlist.owner?._id === user?._id || playlist.owner === user?._id) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedPlaylist(playlist)
                        setShowAddVideoModal(true)
                      }}
                      className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Videos
                    </motion.button>
                  )}

                  {playlist.videos && playlist.videos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-orange-400" />
                        <span className="text-white text-sm font-medium">{playlist.videos[0].title}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{formatDuration(playlist.videos[0].duration)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayPlaylists.length === 0 && isAuthenticated && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <List className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Playlists Yet</h3>
            <p className="text-gray-300 mb-6">Create your first playlist to organize your videos!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Create Playlist
            </motion.button>
          </motion.div>
        )}

        {!isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <List className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Organize Your Content</h3>
              <p className="text-gray-300 mb-6">Login to create playlists and organize your favorite videos!</p>
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create Playlist</h2>

              <form onSubmit={createPlaylist} className="space-y-4">
                <input
                  type="text"
                  placeholder="Playlist Name"
                  value={createData.name}
                  onChange={(e) => setCreateData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={createData.description}
                  onChange={(e) => setCreateData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all h-24 resize-none"
                  required
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={createData.isPublic}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isPublic" className="text-white text-sm">
                    Make playlist public
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">Add Videos</label>
                  <div className="bg-white/5 rounded-xl border border-white/20 max-h-48 overflow-y-auto custom-scrollbar p-2">
                    {videos.length > 0 ? (
                      <div className="space-y-2">
                        {videos.map((video) => (
                          <div
                            key={video._id}
                            onClick={() => {
                              const isSelected = createData.videos.includes(video._id);
                              setCreateData(prev => ({
                                ...prev,
                                videos: isSelected
                                  ? prev.videos.filter(id => id !== video._id)
                                  : [...prev.videos, video._id]
                              }));
                            }}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${createData.videos.includes(video._id)
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'hover:bg-white/10 border-transparent'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${createData.videos.includes(video._id)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-gray-400'
                              }`}>
                              {createData.videos.includes(video._id) && <Video className="w-3 h-3 text-white" />}
                            </div>
                            <img src={video.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-8 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{video.title}</p>
                              <p className="text-gray-400 text-xs">by {video.owner?.username}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No videos available to add
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? "Creating..." : "Create"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Video to Playlist Modal */}
      <AnimatePresence>
        {showAddVideoModal && selectedPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Add Videos to "{selectedPlaylist.name}"</h2>

              <div className="grid gap-4">
                {videos
                  .filter((video) => !selectedPlaylist.videos?.some((pv) => pv._id === video._id))
                  .map((video) => (
                    <motion.div
                      key={video._id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{video.title}</h4>
                        <p className="text-gray-400 text-sm">{video.owner?.username}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addVideoToPlaylist(selectedPlaylist._id, video._id)}
                        className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg font-medium hover:bg-orange-500/30 transition-all"
                      >
                        Add
                      </motion.button>
                    </motion.div>
                  ))}
              </div>

              {videos.filter((video) => !selectedPlaylist.videos?.some((pv) => pv._id === video._id)).length === 0 && (
                <div className="text-center py-8">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No more videos to add</p>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Playlist Modal */}
      <AnimatePresence>
        {editingPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setEditingPlaylist(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Edit Playlist</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  updatePlaylist(editingPlaylist._id, {
                    name: formData.get("name"),
                    description: formData.get("description"),
                    isPublic: formData.get("isPublic") === "on",
                  })
                }}
                className="space-y-4"
              >
                <input
                  name="name"
                  type="text"
                  placeholder="Playlist Name"
                  defaultValue={editingPlaylist.name}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                  required
                />

                <textarea
                  name="description"
                  placeholder="Description"
                  defaultValue={editingPlaylist.description}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all h-24 resize-none"
                  required
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    name="isPublic"
                    defaultChecked={editingPlaylist.isPublic}
                    className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="editIsPublic" className="text-white text-sm">
                    Make playlist public
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">Manage Videos</label>
                  <div className="bg-white/5 rounded-xl border border-white/20 max-h-48 overflow-y-auto custom-scrollbar p-2">
                    {editingPlaylist.videos && editingPlaylist.videos.length > 0 ? (
                      <div className="space-y-2">
                        {editingPlaylist.videos.map((video) => (
                          <div
                            key={video._id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
                          >
                            <img src={video.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-8 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{video.title}</p>
                            </div>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeVideoFromPlaylist(editingPlaylist._id, video._id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No videos in this playlist
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingPlaylist(null)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Update
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Playlist Modal */}
      <AnimatePresence>
        {showViewModal && viewingPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{viewingPlaylist.name}</h2>
                  <p className="text-gray-300">{viewingPlaylist.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <span>By {viewingPlaylist.owner?.username}</span>
                    <span>•</span>
                    <span>{viewingPlaylist.videos?.length || 0} videos</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowViewModal(false)}
                  className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {viewingPlaylist.videos && viewingPlaylist.videos.length > 0 ? (
                  <div className="space-y-4">
                    {viewingPlaylist.videos.map((video, index) => (
                      <motion.div
                        key={`${video._id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
                      >
                        <div className="relative w-40 aspect-video shrink-0 bg-black/50 rounded-lg overflow-hidden">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="text-white font-semibold text-lg mb-1 truncate">{video.title}</h3>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-full">
                              <img
                                src={video.owner?.avatar || "/placeholder.svg"}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                              <span className="text-gray-300 text-xs font-medium">
                                {video.owner?.username || "Unknown User"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAuthenticated && user?._id === viewingPlaylist.owner?._id && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeVideoFromPlaylist(viewingPlaylist._id, video._id)}
                            className="self-center p-2 bg-red-500/10 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                            title="Remove from playlist"
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center">
                    <Video className="w-20 h-20 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">Empty Playlist</h3>
                    <p className="text-gray-500">No videos in this playlist yet.</p>
                  </div>
                )}
              </div>

              {isAuthenticated && user?._id === viewingPlaylist.owner?._id && (
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPlaylist(viewingPlaylist)
                      setShowAddVideoModal(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg hover:shadow-orange-500/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add More Videos
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlaylistsPage() {
  return (
    <AuthProvider>
      <PlaylistsPageContent />
    </AuthProvider>
  )
}
