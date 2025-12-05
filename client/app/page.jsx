"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Users, Video, MessageSquare, Heart, List, UserPlus, Settings, Activity } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import LogoutButton from "@/components/LogoutButton"

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const features = [
    {
      icon: Users,
      title: "User Management",
      desc: "Complete user registration and authentication system",
      href: "/auth",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      icon: Video,
      title: "Video Platform",
      desc: "Upload, share and discover amazing videos",
      href: "/videos",
      gradient: "from-red-500 to-pink-600",
    },
    {
      icon: MessageSquare,
      title: "Tweet System",
      desc: "Share thoughts and connect with others",
      href: "/tweets",
      gradient: "from-green-500 to-teal-600",
    },
    {
      icon: List,
      title: "Playlists",
      desc: "Create and manage video playlists",
      href: "/playlists",
      gradient: "from-orange-500 to-red-600",
    },
    {
      icon: UserPlus,
      title: "Subscriptions",
      desc: "Follow your favorite creators",
      href: "/subscriptions",
      gradient: "from-purple-500 to-indigo-600",
    },
    {
      icon: Heart,
      title: "Likes & Comments",
      desc: "Engage with content you love",
      href: "/likes",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: Settings,
      title: "Dashboard",
      desc: "Manage your profile and settings",
      href: "/dashboard",
      gradient: "from-gray-500 to-slate-600",
    },
    {
      icon: Activity,
      title: "Health Check",
      desc: "System status and monitoring",
      href: "/health",
      gradient: "from-emerald-500 to-green-600",
    },
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900" />
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 15,
            top: mousePosition.y / 15,
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl animate-bounce" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
        >
          ChaiTube
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl"
        >
          Your complete social media platform with videos, tweets, playlists, subscriptions and more
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {isAuthenticated ? (
            null
          ) : (
            <Link href="/auth">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)",
                  background: "linear-gradient(45deg, #8B5CF6, #EC4899, #06B6D4)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg flex items-center gap-2 hover:shadow-2xl transition-all"
              >
                Start Your Journey <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-6 py-20 pb-32">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-center text-white mb-16"
        >
          Platform Features
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{
                scale: 1.05,
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              }}
              className="group cursor-pointer"
            >
              <Link href={feature.href}>
                <div className="p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-white/40 transition-all h-full">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
