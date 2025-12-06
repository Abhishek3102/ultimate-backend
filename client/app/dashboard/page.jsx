"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Calendar,
  LogOut,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Video,
  MessageSquare,
  Heart,
  List,
  UserPlus,
  Eye,
  TrendingUp,
  Lock,
  Unlock,
  Check,
  Bell
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import FollowListModal from "@/components/FollowListModal"

function DashboardPageContent() {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    username: "",
    fullName: "",
  })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    videos: 0,
    tweets: 0,
    likes: 0,
    playlists: 0,
    subscribers: 0,
    subscriptions: 0,
    totalViews: 0,
    totalLikes: 0,
  })

  const [requests, setRequests] = useState([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)

  const router = useRouter()
  const { user, logout, updateUser, isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth")
      return
    }

    if (user) {
      setEditData({
        username: user.username || "",
        fullName: user.fullName || "",
      })
      setIsPrivate(user.isPrivate || false)
      fetchDashboardStats()
      if (user.isPrivate) {
        fetchFollowRequests()
      }
    }
  }, [user, isAuthenticated, authLoading, router])

  const fetchFollowRequests = async () => {
    try {
      const res = await api.getFollowRequests()
      setRequests(res.data)
    } catch (error) {
      console.error("Failed to fetch requests", error)
    }
  }

  const handlePrivacyToggle = async () => {
    try {
      const res = await api.togglePrivacy()
      setIsPrivate(res.data.isPrivate)
      if (res.data.isPrivate) {
        fetchFollowRequests()
      }
    } catch (error) {
      console.error("Failed to toggle privacy", error)
    }
  }

  const handleRequestResponse = async (subscriberId, action) => {
    try {
      await api.respondToFollowRequest(subscriberId, action)
      setRequests(prev => prev.filter(r => r.subscriber._id !== subscriberId))
      // Update subscriber count in stats potentially
      fetchDashboardStats()
    } catch (error) {
      console.error("Failed to respond to request", error)
    }
  }

  const [followedBack, setFollowedBack] = useState({}) // { [userId]: true }

  const handleFollowBack = async (subscriberId) => {
    try {
      const res = await api.toggleSubscription(subscriberId)
      // Update local state to show "Requested" or "Following"
      setFollowedBack(prev => ({ ...prev, [subscriberId]: true }))
      toast.success(res.message || "Request sent")
    } catch (error) {
      toast.error("Failed to follow back")
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch real stats from multiple endpoints with error handling
      const [videosRes, tweetsRes, likesRes, playlistsRes, subscriptionsRes, profileRes] = await Promise.allSettled([
        api.getUserVideos(user._id),
        api.getUserTweets(user._id),
        api.getLikedVideos(),
        api.getPlaylists(user._id),
        api.getSubscribedChannels(user._id),
        api.getUserChannelProfile(user.username)
      ])

      const videosData = videosRes.status === "fulfilled" ? videosRes.value.data || [] : []
      const videos = Array.isArray(videosData) ? videosData : (videosData.videos || [])
      const tweets = tweetsRes.status === "fulfilled" ? tweetsRes.value.data || [] : []
      const likedVideos = likesRes.status === "fulfilled" ? likesRes.value.data || [] : []
      const playlists = playlistsRes.status === "fulfilled" ? playlistsRes.value.data || [] : []
      const subscriptions = subscriptionsRes.status === "fulfilled" ? subscriptionsRes.value.data || [] : []
      const profile = profileRes.status === "fulfilled" ? profileRes.value.data : {}

      // Calculate total views and likes from user's videos
      const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)
      const totalLikes = videos.reduce((sum, video) => sum + (video.likesCount || 0), 0)

      setStats({
        videos: videos.length,
        tweets: tweets.length,
        likes: likedVideos.length,
        playlists: playlists.length,
        subscribers: profile.subscribersCount || 0,
        subscriptions: subscriptions.length,
        totalViews,
        totalLikes,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout()
      router.push("/")
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)

    try {
      const result = await updateUser(editData)

      if (result.success) {
        setIsEditing(false)
        alert("Profile updated successfully!")
      } else {
        alert(result.error || "Failed to update profile")
      }
    } catch (error) {
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-3/4 right-3/4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 pt-32"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full font-medium flex items-center gap-2 hover:bg-red-500/30 transition-all border border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src={user.avatar || "/placeholder.svg?height=80&width=80"}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
            />
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Welcome back, {user.fullName || user.username}!</h2>
              <p className="text-gray-300 text-lg">@{user.username}</p>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <button
              onClick={() => setShowFollowersModal(true)}
              className="flex flex-col items-center hover:bg-white/5 p-4 rounded-xl transition-all cursor-pointer group"
            >
              <span className="text-2xl font-bold text-white group-hover:text-purple-400">{stats.subscribers}</span>
              <span className="text-gray-400 text-sm group-hover:text-white">Followers</span>
            </button>
            <button
              onClick={() => setShowFollowingModal(true)}
              className="flex flex-col items-center hover:bg-white/5 p-4 rounded-xl transition-all cursor-pointer group"
            >
              <span className="text-2xl font-bold text-white group-hover:text-purple-400">{stats.subscriptions}</span>
              <span className="text-gray-400 text-sm group-hover:text-white">Following</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <Video className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.videos}</h3>
            <p className="text-gray-300 text-sm">Videos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.tweets}</h3>
            <p className="text-gray-300 text-sm">Tweets</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.likes}</h3>
            <p className="text-gray-300 text-sm">Likes Given</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <List className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.playlists}</h3>
            <p className="text-gray-300 text-sm">Playlists</p>
          </div>
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <UserPlus className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.subscribers}</h3>
            <p className="text-gray-300 text-sm">Subscribers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.subscriptions}</h3>
            <p className="text-gray-300 text-sm">Following</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.totalViews}</h3>
            <p className="text-gray-300 text-sm">Total Views</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white mb-1">{stats.totalLikes}</h3>
            <p className="text-gray-300 text-sm">Total Likes</p>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-purple-400" />
              Profile Information
            </h3>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrivacyToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isPrivate
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-white/10 text-gray-300 border border-white/20"
                  }`}
              >
                {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {isPrivate ? "Private" : "Public"}
              </button>
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.button
                    key="edit"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-all border border-purple-500/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      key="save"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full font-medium flex items-center gap-2 hover:bg-green-500/30 transition-all border border-green-500/30 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? "Saving..." : "Save"}
                    </motion.button>
                    <motion.button
                      key="cancel"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditing(false)
                        setEditData({
                          username: user.username || "",
                          fullName: user.fullName || "",
                        })
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full font-medium flex items-center gap-2 hover:bg-red-500/30 transition-all border border-red-500/30"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
              <label className="text-gray-300 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => setEditData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              ) : (
                <div className="px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10">
                  {user.fullName || "Not set"}
                </div>
              )}
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
              <label className="text-gray-300 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              ) : (
                <div className="px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10">{user.username}</div>
              )}
            </motion.div>



            <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
              <label className="text-gray-300 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </label>
              <div className="px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Follow Requests Section */}
        {isPrivate && requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8"
          >
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
              <Bell className="w-8 h-8 text-yellow-400" />
              Follow Requests ({requests.length})
            </h3>
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request._id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <img
                      src={request.subscriber.avatar || "/placeholder.svg?height=50&width=50"}
                      alt={request.subscriber.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-white">{request.subscriber.fullName}</h4>
                      <p className="text-gray-400 text-sm">@{request.subscriber.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestResponse(request.subscriber._id, "accept")}
                      className="p-2 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRequestResponse(request.subscriber._id, "reject")}
                      className="p-2 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {!followedBack[request.subscriber._id] ? (
                      <button
                        onClick={() => handleFollowBack(request.subscriber._id)}
                        className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm hover:bg-purple-500/30 transition-colors"
                      >
                        Follow Back
                      </button>
                    ) : (
                      <span className="text-purple-400 text-sm px-2">Requested</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Link href="/videos">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center cursor-pointer hover:border-red-400/40 transition-all"
            >
              <Video className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Manage Videos</h4>
              <p className="text-gray-300 text-sm">Upload and manage your video content</p>
            </motion.div>
          </Link>

          <Link href="/tweets">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center cursor-pointer hover:border-green-400/40 transition-all"
            >
              <MessageSquare className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Your Tweets</h4>
              <p className="text-gray-300 text-sm">View and manage your tweets</p>
            </motion.div>
          </Link>

          <Link href="/playlists">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center cursor-pointer hover:border-orange-400/40 transition-all"
            >
              <List className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Playlists</h4>
              <p className="text-gray-300 text-sm">Organize your video collections</p>
            </motion.div>
          </Link>

          <Link href="/subscriptions">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center cursor-pointer hover:border-purple-400/40 transition-all"
            >
              <UserPlus className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Subscriptions</h4>
              <p className="text-gray-300 text-sm">Manage your subscriptions</p>
            </motion.div>
          </Link>
        </motion.div>

        {/* Modals */}
        <FollowListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={user._id}
          type="followers"
          title="Followers"
        />
        <FollowListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          userId={user._id}
          type="following"
          title="Following"
        />
      </div>
    </div >
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardPageContent />
    </AuthProvider>
  )
}
