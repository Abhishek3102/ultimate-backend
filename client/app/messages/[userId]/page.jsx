"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/context/SocketContext"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import { Send, ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"

export default function ChatPage() {
    const { userId } = useParams()
    const router = useRouter()
    const { socket } = useSocket()
    const { user: currentUser } = useAuth()

    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [otherUser, setOtherUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch other user details
                const userRes = await api.getUserById(userId)
                setOtherUser(userRes.data)

                // Fetch message history
                const messagesRes = await api.getMessages(userId)
                setMessages(messagesRes.data)
                setLoading(false)
                setTimeout(scrollToBottom, 100)
            } catch (error) {
                console.error("Failed to fetch chat details", error)
            }
        }

        if (userId && currentUser) {
            fetchDetails()
        }
    }, [userId, currentUser])

    useEffect(() => {
        if (!socket) return

        socket.on("receive_message", (message) => {
            console.log("Frontend received message:", message);
            // Check if message is from the user we are chatting with
            const senderId = message.sender._id || message.sender;
            if (senderId === userId) {
                setMessages(prev => [...prev, message])
                setTimeout(scrollToBottom, 50)
            } else {
                console.log("Message ignored. Sender:", senderId, "Current View:", userId);
            }
        })

        socket.on("message_sent", (message) => {
            // We optimistically added it, but here we could replace or verify
            // For simplicity, we might handle optimistic updates in handleSend
            // If we rely on this event to display own message, there's a lag.
            // We'll update local state immediately in handleSend
        })

        return () => {
            socket.off("receive_message")
            socket.off("message_sent")
        }
    }, [socket, userId])

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !socket) return

        const payload = {
            receiverId: userId,
            content: newMessage
        }

        socket.emit("send_message", payload)

        // Optimistic update
        setMessages(prev => [...prev, {
            _id: Date.now().toString(), // temp ID
            sender: currentUser,
            content: newMessage,
            createdAt: new Date().toISOString()
        }])

        setNewMessage("")
        setTimeout(scrollToBottom, 50)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col pt-24">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 p-4 sticky top-24 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white lg:hidden">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <img
                            src={otherUser?.avatar || "/placeholder.svg"}
                            alt={otherUser?.username}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#020817]"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-none">{otherUser?.fullName}</h2>
                        <span className="text-sm text-gray-400">@{otherUser?.username}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="hover:text-purple-400 transition-colors"><Phone className="w-5 h-5" /></button>
                    <button className="hover:text-purple-400 transition-colors"><Video className="w-5 h-5" /></button>
                    <button className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                    // Check if sender is current user (handle both populated object and ID string)
                    const isMe = (msg.sender?._id || msg.sender) === currentUser?._id
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id && messages[idx - 1]?.sender !== msg.sender)

                    return (
                        <div key={msg._id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                            {!isMe && (
                                <div className="w-8 h-8 flex-shrink-0 flex flex-col justify-end">
                                    {showAvatar ? (
                                        <img src={otherUser?.avatar || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" />
                                    ) : <div className="w-8" />}
                                </div>
                            )}

                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                ? "bg-purple-600 text-white rounded-br-none"
                                : "bg-slate-800 text-gray-200 rounded-bl-none"
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-[10px] opacity-70 mt-1 block text-right">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/10 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800 border-none rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all shadow-lg shadow-purple-900/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
