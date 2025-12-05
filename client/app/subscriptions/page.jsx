"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, ArrowLeft, Users, Video, Bell, Check } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function SubscriptionsPageContent() {
  const [subscriptions, setSubscriptions] = useState([])
  const [suggestedChannels, setSuggestedChannels] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions()
      fetchSuggestedChannels()
    }
  }, [isAuthenticated])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await api.getSubscriptions()
      setSubscriptions(response.data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestedChannels = async () => {
    try {
      const response = await api.getUsers()
      // Filter out current user and already subscribed channels
      const subscribedChannelIds = subscriptions.map((sub) => sub.channel._id)
      const suggested =
        response.data?.filter((user) => user._id !== user?._id && !subscribedChannelIds.includes(user._id)) || []
      setSuggestedChannels(suggested)
    } catch (error) {
      console.error("Error fetching suggested channels:", error)
      setSuggestedChannels([])
    }
  }

  const toggleSubscription = async (channelId) => {
    if (!isAuthenticated) {
      alert("Please login to subscribe to channels")
      return
    }

    try {
      await api.toggleSubscription(channelId)

      const isSubscribed = subscriptions.some((sub) => sub.channel._id === channelId)

      if (isSubscribed) {
        // Unsubscribe
        setSubscriptions((prev) => prev.filter((sub) => sub.channel._id !== channelId))
        // Move back to suggested
        const channel = subscriptions.find((sub) => sub.channel._id === channelId)?.channel
        if (channel) {
          setSuggestedChannels((prev) => [...prev, channel])
        }
      } else {
        // Subscribe
        const channel = suggestedChannels.find((ch) => ch._id === channelId)
        if (channel) {
          setSubscriptions((prev) => [
            ...prev,
            {
              _id: Date.now().toString(),
              channel,
              createdAt: new Date().toISOString(),
            },
          ])
          setSuggestedChannels((prev) => prev.filter((ch) => ch._id !== channelId))
        }
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert(error.message || "Failed to toggle subscription")
    }
  }

  const formatSubscribers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Mock data for non-authenticated users
  const mockSubscriptions = [
    {
      _id: "mock_1",
      channel: {
        _id: "channel1",
        username: "TechGuru",
        fullName: "Tech Guru Official",
        avatar: "/placeholder.svg?height=60&width=60",
        subscribersCount: 125000,
        videosCount: 89,
      },
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "mock_2",
      channel: {
        _id: "channel2",
        username: "CookingMaster",
        fullName: "Cooking Master Chef",
        avatar: "/placeholder.svg?height=60&width=60",
        subscribersCount: 89000,
        videosCount: 156,
      },
      createdAt: "2024-01-14T16:45:00Z",
    },
  ]

  const mockSuggestedChannels = [
    {
      _id: "suggested1",
      username: "NatureExplorer",
      fullName: "Nature Explorer",
      avatar: "/placeholder.svg?height=60&width=60",
      subscribersCount: 45000,
      videosCount: 67,
    },
    {
      _id: "suggested2",
      username: "FitnessCoach",
      fullName: "Fitness Coach Pro",
      avatar: "/placeholder.svg?height=60&width=60",
      subscribersCount: 78000,
      videosCount: 134,
    },
    {
      _id: "suggested3",
      username: "MusicProducer",
      fullName: "Music Producer Studio",
      avatar: "/placeholder.svg?height=60&width=60",
      subscribersCount: 92000,
      videosCount: 201,
    },
  ]

  const displaySubscriptions = isAuthenticated ? subscriptions : mockSubscriptions
  const displaySuggestedChannels = isAuthenticated ? suggestedChannels : mockSuggestedChannels

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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 pt-24 bg-white/10 backdrop-blur-sm border-b border-white/20"
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
              <UserPlus className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* My Subscriptions */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            My Subscriptions ({displaySubscriptions.length})
          </h2>

          {loading && isAuthenticated && (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {displaySubscriptions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displaySubscriptions.map((subscription, index) => (
                  <motion.div
                    key={subscription._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={subscription.channel.avatar || "/placeholder.svg"}
                        alt={subscription.channel.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">
                          {subscription.channel.fullName || subscription.channel.username}
                        </h3>
                        <p className="text-gray-300 text-sm">@{subscription.channel.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-gray-300 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatSubscribers(subscription.channel.subscribersCount || 0)} subscribers
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {subscription.channel.videosCount || 0} videos
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSubscription(subscription.channel._id)}
                        className="flex-1 py-2 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Subscribed
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : !loading && isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
            >
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Subscriptions Yet</h3>
              <p className="text-gray-300">Start following creators to see their content here!</p>
            </motion.div>
          ) : !isAuthenticated ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displaySubscriptions.map((subscription, index) => (
                <div
                  key={subscription._id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={subscription.channel.avatar || "/placeholder.svg"}
                      alt={subscription.channel.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        {subscription.channel.fullName || subscription.channel.username}
                      </h3>
                      <p className="text-gray-300 text-sm">@{subscription.channel.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-gray-300 text-sm mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formatSubscribers(subscription.channel.subscribersCount)} subscribers
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {subscription.channel.videosCount} videos
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 py-2 bg-red-500/20 text-red-300 rounded-xl font-medium border border-red-500/30 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Subscribed
                    </div>
                    <div className="p-2 bg-white/10 rounded-xl text-gray-300">
                      <Bell className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Suggested Channels */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-purple-400" />
            Suggested Channels
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {displaySuggestedChannels.map((channel, index) => (
                <motion.div
                  key={channel._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={channel.avatar || "/placeholder.svg"}
                      alt={channel.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{channel.fullName || channel.username}</h3>
                      <p className="text-gray-300 text-sm">@{channel.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-gray-300 text-sm mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formatSubscribers(channel.subscribersCount || 0)} subscribers
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {channel.videosCount || 0} videos
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      isAuthenticated ? toggleSubscription(channel._id) : alert("Please login to subscribe")
                    }
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Subscribe
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {displaySuggestedChannels.length === 0 && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
            >
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Suggestions Available</h3>
              <p className="text-gray-300">Check back later for new creators to follow!</p>
            </motion.div>
          )}
        </motion.div>

        {!isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <UserPlus className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Discover Amazing Creators</h3>
              <p className="text-gray-300 mb-6">
                Login to subscribe to your favorite channels and get personalized content!
              </p>
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div >
  )
}

export default function SubscriptionsPage() {
  return (
    <AuthProvider>
      <SubscriptionsPageContent />
    </AuthProvider>
  )
}
