"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, ArrowLeft, Users, Video, Bell, Check } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

function SubscriptionsPageContent() {
  const [subscriptions, setSubscriptions] = useState([])
  const [suggestedChannels, setSuggestedChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subsRes, usersRes] = await Promise.all([
        api.getSubscribedChannels(user._id),
        api.getUsers()
      ])

      const subs = subsRes.data || []
      setSubscriptions(subs)

      const allUsers = usersRes.data || []
      const subscribedIds = new Set(subs.map(s => s.channel._id))

      // Filter out self and already subscribed users
      const suggestions = allUsers.filter(u =>
        u._id !== user._id && !subscribedIds.has(u._id)
      )
      setSuggestedChannels(suggestions)

    } catch (error) {
      console.error("Error fetching data:", error)
      // toast.error("Failed to load subscriptions")
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscription = async (channelId) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe")
      return
    }

    try {
      await api.toggleSubscription(channelId)

      // Check if we are currently subscribed
      const isSubscribed = subscriptions.some(s => s.channel._id === channelId)

      if (isSubscribed) {
        // Unsubscribe: Move from Subscriptions -> Suggested
        const subscription = subscriptions.find(s => s.channel._id === channelId)
        if (subscription) {
          setSubscriptions(prev => prev.filter(s => s.channel._id !== channelId))
          setSuggestedChannels(prev => [...prev, subscription.channel])
          toast.success("Unsubscribed")
        }
      } else {
        // Subscribe: Move from Suggested -> Subscriptions
        const channel = suggestedChannels.find(u => u._id === channelId)
        if (channel) {
          const newSub = {
            _id: Date.now().toString(), // Temp ID until refresh
            channel: channel,
            createdAt: new Date().toISOString()
          }
          setSubscriptions(prev => [newSub, ...prev])
          setSuggestedChannels(prev => prev.filter(u => u._id !== channelId))
          toast.success("Subscribed")
        }
      }
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error("Failed to update subscription")
    }
  }

  const formatSubscribers = (count) => {
    if (!count) return "0"
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Mock data for non-authenticated view
  const mockSubscriptions = [
    { _id: "1", channel: { _id: "c1", username: "TechGuru", fullName: "Tech Guru", avatar: null, subscribersCount: 15400, videosCount: 42 } },
    { _id: "2", channel: { _id: "c2", username: "CookingMama", fullName: "Cooking Mama", avatar: null, subscribersCount: 8200, videosCount: 15 } }
  ]
  const mockSuggestions = [
    { _id: "s1", username: "TravelVlogs", fullName: "Travel With Me", avatar: null, subscribersCount: 5000, videosCount: 10 },
    { _id: "s2", username: "GymRat", fullName: "Fitness Pro", avatar: null, subscribersCount: 12000, videosCount: 88 }
  ]

  const displaySubscriptions = isAuthenticated ? subscriptions : mockSubscriptions
  const displaySuggestions = isAuthenticated ? suggestedChannels : mockSuggestions

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#121212] text-white font-sans selection:bg-purple-500/30">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 p-6 pt-32">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Subscriptions</h1>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-12">
        {/* My Subscriptions */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            My Subscriptions <span className="text-gray-500 text-lg">({displaySubscriptions.length})</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displaySubscriptions.map((sub) => (
                  <motion.div
                    key={sub._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Link href={`/c/${sub.channel.username}`}>
                        <img
                          src={sub.channel.avatar || "/placeholder.svg"}
                          alt={sub.channel.username}
                          className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500 transition-all"
                        />
                      </Link>
                      <div>
                        <Link href={`/c/${sub.channel.username}`} className="font-bold text-lg hover:text-purple-400 transition-colors">
                          {sub.channel.fullName}
                        </Link>
                        <p className="text-gray-400 text-sm">@{sub.channel.username}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 mb-6">
                      <span>{formatSubscribers(sub.channel.subscribersCount)} subscribers</span>
                      <span>{sub.channel.videosCount || 0} videos</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSubscription(sub.channel._id)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Subscribed
                      </button>
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {displaySubscriptions.length === 0 && !loading && (
                <div className="col-span-full py-12 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">You haven't subscribed to anyone yet.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Suggested Channels */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-400" />
            Suggested Channels
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {displaySuggestions.map((channel) => (
                <motion.div
                  key={channel._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Link href={`/c/${channel.username}`}>
                      <img
                        src={channel.avatar || "/placeholder.svg"}
                        alt={channel.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500 transition-all"
                      />
                    </Link>
                    <div>
                      <Link href={`/c/${channel.username}`} className="font-bold text-lg hover:text-purple-400 transition-colors">
                        {channel.fullName}
                      </Link>
                      <p className="text-gray-400 text-sm">@{channel.username}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500 mb-6">
                    <span>{formatSubscribers(channel.subscribersCount)} subscribers</span>
                    <span>{channel.videosCount || 0} videos</span>
                  </div>

                  <button
                    onClick={() => toggleSubscription(channel._id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Subscribe
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {displaySuggestions.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400">No suggestions available right now.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  return (
    <AuthProvider>
      <SubscriptionsPageContent />
    </AuthProvider>
  )
}
