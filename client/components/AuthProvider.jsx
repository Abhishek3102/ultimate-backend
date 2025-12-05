"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Only run on client side
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("accessToken")
        const userData = localStorage.getItem("user")

        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
        }
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, tokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", tokens.accessToken)
      localStorage.setItem("refreshToken", tokens.refreshToken)
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
    }
  }

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
      // Clear all user data
      localStorage.removeItem("videos")
      localStorage.removeItem("tweets")
      localStorage.removeItem("comments")
      localStorage.removeItem("likedVideos")
      localStorage.removeItem("likedTweets")
      localStorage.removeItem("likedComments")
      localStorage.removeItem("playlists")
      localStorage.removeItem("subscriptions")
    }
    setUser(null)
  }

  const updateUser = (updatedUserData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUserData))
      setUser(updatedUserData)
    }
  }

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading: loading || !isClient,
    isAuthenticated: !!user && isClient,
  }

  if (!isClient) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900" />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
