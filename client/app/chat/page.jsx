"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ArrowLeft, Users, Smile, Paperclip } from "lucide-react"
import Link from "next/link"

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [activeUsers, setActiveUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Fetch initial messages
    fetchMessages()
    fetchActiveUsers()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat/messages")

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, use mock data
        setMessages([
          {
            id: 1,
            content: "Welcome to the chat room!",
            username: "System",
            timestamp: new Date().toISOString(),
            isOwn: false,
          },
          {
            id: 2,
            content: "Hello everyone! 👋",
            username: "User1",
            timestamp: new Date().toISOString(),
            isOwn: false,
          },
        ])
        return
      }

      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      // Set mock data on error
      setMessages([
        {
          id: 1,
          content: "Welcome to the chat room!",
          username: "System",
          timestamp: new Date().toISOString(),
          isOwn: false,
        },
      ])
    }
  }

  const fetchActiveUsers = async () => {
    try {
      const response = await fetch("/api/users/active")

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, use mock data
        setActiveUsers([
          { id: 1, username: "Alice", status: "online" },
          { id: 2, username: "Bob", status: "online" },
          { id: 3, username: "Charlie", status: "online" },
        ])
        return
      }

      const data = await response.json()
      if (response.ok) {
        setActiveUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching active users:", error)
      // Set mock data on error
      setActiveUsers([
        { id: 1, username: "Alice", status: "online" },
        { id: 2, username: "Bob", status: "online" },
        { id: 3, username: "Charlie", status: "online" },
      ])
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    setLoading(true)

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          userId: "current-user-id",
        }),
      })

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, simulate message sending
        const newMsg = {
          id: Date.now(),
          content: newMessage,
          username: "You",
          timestamp: new Date().toISOString(),
          isOwn: true,
        }
        setMessages((prev) => [...prev, newMsg])
        setNewMessage("")
        setLoading(false)
        return
      }

      const data = await response.json()

      if (response.ok) {
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
      } else {
        alert(data.message || "Failed to send message")
      }
    } catch (error) {
      // Simulate message sending on error
      const newMsg = {
        id: Date.now(),
        content: newMessage,
        username: "You",
        timestamp: new Date().toISOString(),
        isOwn: true,
      }
      setMessages((prev) => [...prev, newMsg])
      setNewMessage("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-bounce" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              </Link>
              <h2 className="text-xl font-bold text-white">Chat Room</h2>
            </div>
          </div>

          {/* Active Users */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-medium">Active Users ({activeUsers.length})</h3>
            </div>

            <div className="space-y-3">
              {activeUsers.map((user, index) => (
                <motion.div
                  key={user.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.username || "Anonymous"}</p>
                    <p className="text-green-400 text-sm">Online</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.isOwn
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
                    }`}
                  >
                    {!message.isOwn && (
                      <p className="text-xs text-purple-300 mb-1">{message.username || "Anonymous"}</p>
                    )}
                    <p>{message.content || message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : "Now"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm"
          >
            <form onSubmit={sendMessage} className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !newMessage.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
