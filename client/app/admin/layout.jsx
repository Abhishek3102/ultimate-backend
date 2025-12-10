"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Shield, LayoutDashboard, Swords, Users, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await api.getCurrentUser();
                if (user?.data?.role !== "admin") {
                    console.warn("Unauthorized: Not an admin");
                    router.push("/"); // Kick them out
                } else {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <Shield size={48} className="text-purple-500 mb-4" />
                    <p>Verifying Credentials...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Arena Manager", href: "/admin/arena/create", icon: Swords }, // Direct link to create for now
        // { name: "Users", href: "/admin/users", icon: Users },
        // { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col relative bg-black">
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3">
                    <img src="/images/logo 2 visual.png" alt="Logo" className="w-8 h-8 rounded-full" />
                    <span className="font-bold text-lg tracking-wider text-white">SocioVerse</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        // Exact match for dashboard to avoid highlighting it for child routes if we used startsWith (but href is exact here)
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Label & Exit - Moved to Bottom */}
                <div className="p-4 border-t border-white/10 space-y-4">
                    <div className="flex items-center gap-3 px-4 text-purple-400">
                        <Shield size={16} />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Admin Panel</span>
                    </div>

                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Exit Panel</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header (TODO) */}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-900/50 pt-24 md:pt-20">
                {children}
            </main>
        </div>
    );
}
