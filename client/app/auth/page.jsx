"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, User, Mail, Lock, Upload, ArrowLeft, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    avatar: null,
    coverImage: null,
  })

  const { login, register, isOfflineMode } = useAuth()
  const router = useRouter()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    setFormData((prev) => ({ ...prev, [name]: files[0] }))
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setLoading(true)
  //   setError("")
  //   setSuccess("")

  //   try {
  //     if (isLogin) {
  //       const result = await login({
  //         email: formData.email,
  //         password: formData.password,
  //       })

  //       if (result.success) {
  //         setSuccess("Login successful! Redirecting...")
  //         setTimeout(() => router.push("/"), 1500)
  //       } else {
  //         setError(result.error || "Login failed")
  //       }
  //     } else {
  //       // Validation for registration
  //       if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
  //         setError("Please fill in all required fields")
  //         setLoading(false)
  //         return
  //       }

  //       if (formData.password.length < 6) {
  //         setError("Password must be at least 6 characters long")
  //         setLoading(false)
  //         return
  //       }

  //       const result = await register(formData)

  //       if (result.success) {
  //         setSuccess("Registration successful! Redirecting...")
  //         setTimeout(() => router.push("/"), 1500)
  //       } else {
  //         setError(result.error || "Registration failed")
  //       }
  //     }
  //   } catch (error) {
  //     setError("An unexpected error occurred");
  //     console.log(error);

  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isLogin) {
        const result = await login({
          email: formData.email,
          password: formData.password,
        })

        if (result.success) {
          setSuccess("Login successful! Redirecting...")
          // Global AuthProvider will detect change and re-render Navbar
          setTimeout(() => router.push("/"), 500)
        } else {
          setError(result.error || "Login failed")
        }
      } else {
        // Validation for registration
        if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
          setError("Please fill in all required fields")
          setLoading(false)
          return
        }

        if (!formData.avatar) {
          setError("Avatar is required")
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long")
          setLoading(false)
          return
        }

        const result = await register(formData)

        if (result.success) {
          setSuccess("Registration successful! Redirecting...")
          setTimeout(() => router.push("/"), 1500)
        } else {
          setError(result.error || "Registration failed")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.log(error);

    } finally {
      setLoading(false)
    }
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-pink-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">{isLogin ? "Welcome Back" : "Join Us"}</h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
            {isOfflineMode ? (
              <>
                <WifiOff className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-sm">Demo Mode</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Online</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Mode Toggle */}
            <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsLogin(true)
                  setError("")
                  setSuccess("")
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${isLogin ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:text-white"
                  }`}
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsLogin(false)
                  setError("")
                  setSuccess("")
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${!isLogin ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:text-white"
                  }`}
              >
                Register
              </motion.button>
            </div>

            {/* Demo Mode Notice */}
            {isOfflineMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-2xl"
              >
                <div className="flex items-center gap-2 text-orange-300">
                  <WifiOff className="w-5 h-5" />
                  <span className="font-medium">Demo Mode Active</span>
                </div>
                <p className="text-orange-200 text-sm mt-1">
                  Backend not available. You can still test all features with mock data.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* Full Name */}
                    <div>
                      <label className="block text-white font-medium mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                          placeholder="Enter your full name"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-white font-medium mb-2">Username *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                          placeholder="Choose a username"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-white font-medium mb-2">Avatar (Optional)</label>
                      <div className="relative">
                        <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="file"
                          name="avatar"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:border-blue-400 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-white font-medium mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder={isOfflineMode ? "any@email.com (demo)" : "Enter your email"}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-white font-medium mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder={isOfflineMode ? "any password (demo)" : "Enter your password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl text-green-300"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>

            {/* Demo Instructions */}
            {isOfflineMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl"
              >
                <h4 className="text-blue-300 font-medium mb-2">Demo Mode Instructions:</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Use any email and password to login</li>
                  <li>• All features work with mock data</li>
                  <li>• Data persists during your session</li>
                  <li>• Perfect for testing the interface</li>
                </ul>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
