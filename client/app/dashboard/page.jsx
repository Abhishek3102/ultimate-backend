"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Mail,
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { useLocalStorage } from "@/hooks/useLocalStorage"

function DashboardPageContent() {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    username: "",
    email: "",
    fullName: "",
  })
  const [loading, setLoading] = useState(false)
  const [videos] = useLocalStorage("videos", [])
  const [tweets] = useLocalStorage("tweets", [])
  const [likedVideos] = useLocalStorage("likedVideos", [])
  const [likedTweets] = useLocalStorage("likedTweets", [])
  const [playlists] = useLocalStorage("playlists", [])
  const [subscriptions] = useLocalStorage("subscriptions", [])

  const router = useRouter()
  const { user, logout, updateUser, isAuthenticated } = useAuth()

  // Calculate real stats from user data
  const stats = {
    videos: videos.length,
    tweets: tweets.length,
    likes: likedVideos.length + likedTweets.length,
    playlists: playlists.length,
    subscribers: Math.floor(Math.random() * 10), // This would come from backend
    subscriptions: subscriptions.length,
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    setEditData({
      username: user.username || "",
      email: user.email || "",
      fullName: user.fullName || "",
    })
  }, [user, isAuthenticated, router])

  const handleLogout = async () => {
    logout()
  }

  const handleSaveProfile = async () => {
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedUser = { ...user, ...editData }
      updateUser(updatedUser)
      setIsEditing(false)
    } catch (error) {
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
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
        className="relative z-10 p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
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
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <Video className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.videos}</h3>
            <p className="text-gray-300 text-sm">Videos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.tweets}</h3>
            <p className="text-gray-300 text-sm">Tweets</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.likes}</h3>
            <p className="text-gray-300 text-sm">Likes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <List className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.playlists}</h3>
            <p className="text-gray-300 text-sm">Playlists</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <UserPlus className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.subscribers}</h3>
            <p className="text-gray-300 text-sm">Subscribers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
            <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{stats.subscriptions}</h3>
            <p className="text-gray-300 text-sm">Following</p>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-purple-400" />
              Profile Information
            </h3>

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
                        email: user.email || "",
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
                <Mail className="w-4 h-4" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              ) : (
                <div className="px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10">{user.email}</div>
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
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardPageContent />
    </AuthProvider>
  )
}
