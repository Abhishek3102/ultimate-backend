"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, User, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const { user, logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push("/")
    }

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (!user) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative z-10 block"
            >
                <img
                    src={(user?.avatar || "/placeholder.svg?height=40&width=40").replace('http://', 'https://')}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20 hover:border-purple-500 transition-colors"
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-3 border-b border-white/10 bg-white/5">
                            <p className="text-white font-medium truncate">{user.fullName}</p>
                            <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                        </div>

                        <div className="p-1">
                            <Link href={user.role === 'admin' ? "/admin" : "/dashboard"}>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                                    <LayoutDashboard className="w-4 h-4" />
                                    {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                </button>
                            </Link>
                        </div>

                        <div className="p-1 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
