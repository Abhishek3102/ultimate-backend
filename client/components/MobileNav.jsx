"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, TrendingUp, MessageSquare, User, Menu } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/AuthProvider"

export default function MobileNav() {
    const pathname = usePathname()
    const { user } = useAuth()

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/search", icon: Search, label: "Search" },
        { href: "/trending", icon: TrendingUp, label: "Prism" },
        { href: "/messages", icon: MessageSquare, label: "Chat" },
        { href: user ? "/dashboard" : "/auth", icon: User, label: "Profile" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />

            <div className="relative flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href} className="flex-1">
                            <div className="flex flex-col items-center justify-center py-2 relative group">
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="absolute -top-[1px] w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    />
                                )}
                                <item.icon
                                    className={`w-6 h-6 mb-1 transition-colors ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}
                                />
                                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-white" : "text-gray-500"}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
