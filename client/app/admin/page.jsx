"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Search, Shield, Calendar, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.getUsers();
                if (res.data) {
                    setUsers(res.data);
                }
            } catch (error) {
                console.error("Failed to load users", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">User Management</h1>
                    <p className="text-gray-400">Total Members: <span className="text-white font-mono">{users.length}</span></p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500 animate-pulse">Scanning SocioVerse Registry...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-bold">
                                    <th className="p-4 pl-6">User</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Joined</th>
                                    <th className="p-4 text-right pr-6">Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="p-4 pl-6 flex items-center gap-3">
                                            <img
                                                src={user.avatar || "/placeholder.svg"}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-purple-500/50 transition-colors"
                                            />
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {user.fullName || "User"}
                                                    {user.role === 'admin' && <Shield className="w-3 h-3 text-purple-400" />}
                                                </div>
                                                <div className="text-xs text-gray-500">@{user.username}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 opacity-50" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${user.isPrivate ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                                                {user.isPrivate ? "Private" : "Public"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 font-mono">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                                                <span title="Subscribers">{user.subscribersCount || 0} subs</span>
                                                <span title="Videos">{user.videosCount || 0} vids</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredUsers.length === 0 && (
                            <div className="p-10 text-center text-gray-500 text-sm">No users found matching "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
