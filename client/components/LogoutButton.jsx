"use client"

import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { useRouter } from "next/navigation"

export default function LogoutButton({ className = "" }) {
  const { logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout()
      router.push("/")
    }
  }

  if (!isAuthenticated) return null

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-500/20 text-red-300 rounded-full font-medium flex items-center gap-2 hover:bg-red-500/30 transition-all border border-red-500/30 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      Logout
    </motion.button>
  )
}
