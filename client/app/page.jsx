"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Users, Video, MessageSquare, Heart, List, UserPlus, Settings, Activity, HelpCircle, ChevronDown } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import LogoutButton from "@/components/LogoutButton"
import PulseBar from "@/components/MindMeld/PulseBar"
import MeldModal from "@/components/MindMeld/MeldModal"
import { useSocket } from "@/context/SocketContext"

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const { socket } = useSocket()
  const [meldData, setMeldData] = useState(null)

  useEffect(() => {
    if (!socket) return

    const onFound = (data) => {
      setMeldData(data)
    }

    socket.on("mindmeld:found", onFound)

    return () => {
      socket.off("mindmeld:found", onFound)
    }
  }, [socket])

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
    return <div className="min-h-screen bg-[#020817]" />
  }

  return (
    <div className="min-h-screen bg-[#020817]">

      {/* Top Section Container: Video Background + Main Content */}
      <div className="relative overflow-hidden">

        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/images/homepage.mp4" type="video/mp4" />
          </video>
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
          {/* Gradient fade at bottom to blend with FAQ section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020817] to-transparent" />
        </div>

        {/* Animated Background Elements (Optional, can keep or remove if video is enough) */}
        <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-3xl animate-pulse"
            style={{
              left: mousePosition.x / 15,
              top: mousePosition.y / 15,
            }}
          />
        </div>

        {/* Main Content Wrapper */}
        <div className="relative z-10 pb-20 font-[Comic_Sans_MS,Comic_Sans,cursive]">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-32">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6"
            >
              <img
                src="/images/logo 2 visual.png"
                alt="Socioverse Visual"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-2xl shadow-purple-500/20"
              />
              <img
                src="/images/logo 2 text.png"
                alt="Socioverse Text"
                className="h-16 md:h-20 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>



            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="w-full mb-8"
            >
              <PulseBar socket={socket} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl text-gray-100 text-lg mb-10 leading-relaxed font-medium bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
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
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg flex items-center gap-2 hover:shadow-2xl transition-all font-sans"
                  >
                    Start Your Journey <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="px-6 py-12">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-4xl font-bold text-center text-white mb-10"
            >
              Platform Features
            </motion.h2>

            <div className="flex overflow-x-auto pb-6 gap-6 max-w-7xl mx-auto snap-x md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 md:overflow-visible no-scrollbar">
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
                  className="group cursor-pointer min-w-[260px] flex-shrink-0 snap-center"
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
          <div className="px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-md rounded-3xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-4">A Universe of Possibilities</h3>
              <p className="text-lg text-gray-300 leading-relaxed italic">
                "Socioverse is more than a platform - it’s a space to express yourself, discover new voices, and bring your communities together.
                Whether you're here to create, connect, or explore, you’re part of a universe built for endless possibilities."
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Outside video container, solid background */}
      <div className="relative z-10 px-6 py-20 bg-[#020817]">
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

      <AnimatePresence>
        {meldData && (
          <MeldModal
            user={user}
            socket={socket}
            roomId={meldData.roomId}
            matchedContent={meldData.matchedContent}
            similarity={meldData.similarity}
            onClose={() => setMeldData(null)}
          />
        )}
      </AnimatePresence>
    </div >
  )
}

const faqs = [
  {
    question: "What makes Socioverse unique?",
    answer: "Socioverse isn't just a video platform—it's a multi-dimensional social space. We combine traditional video sharing with spatial creativity (Socio-Spaces), high-energy discovery feeds (Prism), and immersive viewing modes (Cinema) to give you total control over how you consume and create content."
  },
  {
    question: "What are Socio-Spaces?",
    answer: "Socio-Spaces are infinite, collaborative canvases where you can drag and drop videos, tweets, and notes. Connect them to create visual playlists, meaningful clusters, or just a messy mood board. It's spatial organization for your digital life, breaking free from linear feeds."
  },
  {
    question: "What is Magic Layout?",
    answer: "Staring at a blank canvas? Magic Layout instantly generates a themed environment for you—complete with mood lighting, background visuals, and curated videos—with just a single click. It's the perfect starting point for your creative space."
  },
  {
    question: "Can I watch videos with friends?",
    answer: "Yes! In Socio-Spaces, you can connect videos with 'Sync Cables'. When you play, pause, or seek one video, all connected videos sync up perfectly. It's great for mashups, reaction setups, or simply watching multiple angles simultaneously."
  },
  {
    question: "What is Prism Mode?",
    answer: "Prism is our high-octane discovery feed. It uses a vertical, swipeable interface optimized for quick browsing, keeping you on the pulse of what's trending across the Socioverse. Think of it as your rapid-fire window into the community."
  },
  {
    question: "How does the Dashboard work?",
    answer: "Your personal command center. Access it via the profile menu to track your channel's performance, manage subscriber growth, and view detailed analytics on how your content is performing across all modes."
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
