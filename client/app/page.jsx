"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Users, Video, MessageSquare, Heart, List, UserPlus, Settings, Activity, HelpCircle, ChevronDown } from "lucide-react"
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
          Socioverse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl"
        >
          Where every social world comes together.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl text-gray-400 text-lg mb-10 leading-relaxed font-light"
        >
          <p className="mb-4">
            Welcome to Socioverse - the world where your videos, posts, playlists, messages, and interactions come together in perfect harmony.
          </p>
          <p>
            Experience a unified platform built for creators, fans, friends, and communities. Whether you're sharing a moment, uploading a masterpiece, or discovering something new, Socioverse gives you the tools to express yourself effortlessly in a connected world.
          </p>
        </motion.div>

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
      <div className="relative z-10 px-6 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-center text-white mb-10"
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

      {/* Community Highlight Section */}
      <div className="relative z-10 px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-md rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-2xl font-bold text-white mb-4">A Universe of Possibilities</h3>
          <p className="text-lg text-gray-300 leading-relaxed italic">
            "Socioverse is more than a platform — it’s a space to express yourself, discover new voices, and bring your communities together.
            Whether you're here to create, connect, or explore, you’re part of a universe built for endless possibilities."
          </p>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 px-6 pb-20 pt-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-center text-white mb-10 flex items-center justify-center gap-3"
        >
          <HelpCircle className="w-10 h-10 text-cyan-400" />
          Frequently Asked Questions
        </motion.h2>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

const faqs = [
  {
    question: "What is Socioverse?",
    answer: "Socioverse is a comprehensive social video platform designed to bring creators and viewers together. It empowers you to upload, share, and discover high-quality video content while connecting with a vibrant community through tweets, likes, and comments."
  },
  {
    question: "How do I start uploading videos?",
    answer: "Uploading is simple! Once you create an account and log in, navigate to the 'Videos' section and click on the 'Upload Video' button. You can provide a title, description, and custom thumbnail to make your content stand out."
  },
  {
    question: "Can I organize videos into playlists?",
    answer: "Absolutely. You can create unlimited playlists to curate your favorite content. You have full control over your playlists, with options to keep them public for everyone to see or private for your personal collection."
  },
  {
    question: "How do I interact with other users?",
    answer: "Engagement is at the core of Socioverse. You can subscribe to channels, like and comment on videos, and even use our Tweet system to share short updates or thoughts with your followers."
  },
  {
    question: "What can I do in the Dashboard?",
    answer: "The Dashboard is your personal command center. It provides analytics on your channel's performance, including subscriber counts and video metrics. You can also manage your profile settings and view your content stats here."
  }
]

function FAQItem({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white/5 backdrop-blur-md rounded-2xl border transition-all cursor-pointer overflow-hidden ${isOpen ? "border-cyan-500/50 bg-white/10" : "border-white/10 hover:border-white/30"
          }`}
      >
        <div className="p-6 flex items-center justify-between gap-4">
          <h3 className={`text-lg font-semibold transition-colors ${isOpen ? "text-cyan-400" : "text-white group-hover:text-cyan-200"}`}>
            {faq.question}
          </h3>
          <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 ${isOpen ? "rotate-180 bg-cyan-500/20" : ""}`}>
            <ChevronDown className={`w-5 h-5 ${isOpen ? "text-cyan-400" : "text-gray-400"}`} />
          </div>
        </div>

        <Collapse isOpen={isOpen}>
          <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-white/5 pt-4">
            {faq.answer}
          </div>
        </Collapse>
      </div>
    </motion.div>
  )
}

function Collapse({ isOpen, children }) {
  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}
