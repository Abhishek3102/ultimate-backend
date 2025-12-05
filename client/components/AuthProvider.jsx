// "use client"

// import { createContext, useContext, useState, useEffect } from "react"
// import { api } from "@/lib/api"

// const AuthContext = createContext()

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider")
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [isClient, setIsClient] = useState(false)
//   const [initialized, setInitialized] = useState(false)

//   useEffect(() => {
//     setIsClient(true)
//     initializeAuth()
//   }, [])

//   const initializeAuth = async () => {
//     if (typeof window === "undefined") return

//     try {
//       const token = localStorage.getItem("accessToken")
//       const userData = localStorage.getItem("user")

//       if (token && userData) {
//         try {
//           // Parse stored user data first
//           const parsedUser = JSON.parse(userData)
//           setUser(parsedUser)

//           // Then verify with backend (optional, don't fail if it doesn't work)
//           try {
//             const currentUser = await api.getCurrentUser()
//             if (currentUser?.data) {
//               setUser(currentUser.data)
//               localStorage.setItem("user", JSON.stringify(currentUser.data))
//             }
//           } catch (verifyError) {
//             console.log("Token verification failed, using stored user data")
//             // Keep the stored user data, don't clear it
//           }
//         } catch (parseError) {
//           console.error("Error parsing stored user data:", parseError)
//           // Clear invalid stored data
//           localStorage.removeItem("accessToken")
//           localStorage.removeItem("refreshToken")
//           localStorage.removeItem("user")
//           setUser(null)
//         }
//       }
//     } catch (error) {
//       console.error("Auth initialization error:", error)
//       // Don't clear auth on initialization errors
//     } finally {
//       setLoading(false)
//       setInitialized(true)
//     }
//   }

//   const login = async (credentials) => {
//     try {
//       const response = await api.login(credentials)
//       const { user: userData, accessToken, refreshToken } = response.data || {}

//       if (userData) {
//         localStorage.setItem("user", JSON.stringify(userData))
//         setUser(userData)
//       }

//       if (accessToken) {
//         localStorage.setItem("accessToken", accessToken)
//       }

//       if (refreshToken) {
//         localStorage.setItem("refreshToken", refreshToken)
//       }

//       return { success: true, user: userData }
//     } catch (error) {
//       console.error("Login error:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   const logout = async () => {
//     try {
//       // Call logout API
//       await api.logout()
//     } catch (error) {
//       console.error("Logout API error:", error)
//     } finally {
//       // Always clear local state
//       localStorage.removeItem("accessToken")
//       localStorage.removeItem("refreshToken")
//       localStorage.removeItem("user")
//       setUser(null)
//     }
//   }

//   const register = async (userData) => {
//     try {
//       const response = await api.register(userData)
//       return { success: true, data: response.data }
//     } catch (error) {
//       console.error("Registration error:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   const updateUser = async (updatedUserData) => {
//     try {
//       const response = await api.updateProfile(updatedUserData)
//       const updatedUser = response.data
//       localStorage.setItem("user", JSON.stringify(updatedUser))
//       setUser(updatedUser)
//       return { success: true, user: updatedUser }
//     } catch (error) {
//       console.error("Update user error:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   const value = {
//     user,
//     login,
//     register,
//     logout,
//     updateUser,
//     loading: loading || !isClient || !initialized,
//     isAuthenticated: !!user && isClient && initialized,
//   }

//   // Show loading screen while initializing
//   if (!isClient || !initialized) {
//     return <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900" />
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }


"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { api } from "@/lib/api"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await api.getCurrentUser()
      if (response.data) {
        setUser(response.data)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(response.data))
      }
    } catch (error) {
      console.log("Auth check failed, using offline mode")
      setIsOfflineMode(true)

      // Check if we have stored user data for offline mode
      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("accessToken")

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        } catch (e) {
          console.error("Error parsing stored user:", e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials)

      if (response.data) {
        const { user, accessToken, refreshToken } = response.data

        setUser(user)
        setIsAuthenticated(true)

        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        localStorage.setItem("user", JSON.stringify(user))

        return { success: true }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.register(userData)

      if (response.data) {
        // For demo mode, auto-login after registration
        if (api.isOfflineMode) {
          const mockTokens = {
            accessToken: "mock_access_token_" + Date.now(),
            refreshToken: "mock_refresh_token_" + Date.now(),
          }

          setUser(response.data)
          setIsAuthenticated(true)

          localStorage.setItem("accessToken", mockTokens.accessToken)
          localStorage.setItem("refreshToken", mockTokens.refreshToken)
          localStorage.setItem("user", JSON.stringify(response.data))
        }

        return { success: true, data: response.data }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setIsOfflineMode(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    isOfflineMode,
    login,
    register,
    logout,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
