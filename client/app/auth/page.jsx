"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/components/AuthProvider"

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const userData = {
        _id: `user_${Date.now()}`,
        username: formData.username || formData.email.split("@")[0],
        email: formData.email,
        fullName: formData.fullName || formData.username || "User",
        avatar: "/placeholder.svg?height=40&width=40",
        createdAt: new Date().toISOString(),
      }

      const tokens = {
        accessToken: `token_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
      }

      setMessage({
        type: "success",
        text: isLogin ? "Login successful!" : "Registration successful!",
      })

      if (isLogin) {
        login(userData, tokens)
        setTimeout(() => router.push("/dashboard"), 1500)
      } else {
        setTimeout(() => setIsLogin(true), 1500)
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-3/4 left-3/4 w-72 h-72 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-10"
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        </Link>
      </motion.div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
              <p className="text-gray-300">{isLogin ? "Sign in to your account" : "Join our platform today"}</p>
            </motion.div>

            {/* Toggle Buttons */}
            <div className="flex mb-8 bg-white/10 rounded-2xl p-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLogin(true)
                  setMessage({ type: "", text: "" })
                }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  isLogin
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Login
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLogin(false)
                  setMessage({ type: "", text: "" })
                }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  !isLogin
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Register
              </motion.button>
            </div>

            {/* Message Display */}
            <AnimatePresence>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === "success"
                      ? "bg-green-500/20 border border-green-500/30 text-green-300"
                      : "bg-red-500/20 border border-red-500/30 text-red-300"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {!isLogin && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                        required={!isLogin}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                        required={!isLogin}
                      />
                    </motion.div>
                  </>
                )}

                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    required
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    required
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  )
}
