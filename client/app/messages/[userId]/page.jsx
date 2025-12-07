"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/context/SocketContext"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import { Send, ArrowLeft, MoreVertical, Phone, Video, Mic, Check, Trash2, Forward as ForwardIcon, Info, ChevronDown, CheckCheck, X, Copy } from "lucide-react"

export default function ChatPage() {
    const { userId } = useParams()
    const router = useRouter()
    const { socket } = useSocket()
    const { user: currentUser } = useAuth()

    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [otherUser, setOtherUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [isUploadingAudio, setIsUploadingAudio] = useState(false)

    // UI States
    const [activeMessageId, setActiveMessageId] = useState(null) // For dropdown
    const [infoMessage, setInfoMessage] = useState(null) // For info modal

    // Forward / Copy States
    const [forwardModalOpen, setForwardModalOpen] = useState(false)
    const [conversations, setConversations] = useState([])
    const [messageToForward, setMessageToForward] = useState(null)

    const messagesEndRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

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

            // Mark visible messages as read
            const unreadMsgIds = messagesRes.data
                .filter(m => (m.sender?._id || m.sender) === userId && !m.readBy?.some(r => (r.user?._id || r.user) === currentUser?._id))
                .map(m => m._id)

            if (unreadMsgIds.length > 0 && socket) {
                socket.emit("mark_read", { messageIds: unreadMsgIds, otherUserId: userId })
            }

        } catch (error) {
            console.error("Failed to fetch chat details", error)
        }
    }

    useEffect(() => {
        if (userId && currentUser) {
            fetchDetails()
        }
    }, [userId, currentUser])

    useEffect(() => {
        if (!socket) return

        socket.on("receive_message", (message) => {
            const senderId = message.sender?._id || message.sender;
            if (senderId === userId) {
                setMessages(prev => [...prev, message])
                setTimeout(scrollToBottom, 50)

                // Mark this new message as read immediately since we are viewing the chat
                socket.emit("mark_read", { messageIds: [message._id], otherUserId: userId })
            }
        })

        socket.on("messages_read", ({ messageIds, readBy, readAt }) => {
            setMessages(prev => prev.map(msg => {
                if (messageIds.includes(msg._id)) {
                    // Avoid duplicate entries
                    const existing = msg.readBy || [];
                    if (existing.some(r => (r.user?._id || r.user || r) === readBy)) return msg;

                    return {
                        ...msg,
                        readBy: [...existing, { user: readBy, readAt: readAt || new Date() }]
                    }
                }
                return msg
            }))
        })

        socket.on("message_deleted", ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId))
        })

        socket.on("user_status_change", ({ userId: changedUserId, isOnline, lastActive }) => {
            if (changedUserId === userId) {
                setOtherUser(prev => prev ? { ...prev, isOnline, lastActive } : null)
            }
        })

        return () => {
            socket.off("receive_message")
            socket.off("messages_read")
            socket.off("message_deleted")
            socket.off("user_status_change")
        }
    }, [socket, userId, currentUser])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }) // webm is common
                await sendAudioMessage(audioBlob)
                const tracks = stream.getTracks()
                tracks.forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
        } catch (error) {
            console.error("Error accessing microphone:", error)
            alert("Could not access microphone")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const sendAudioMessage = async (audioBlob) => {
        setIsUploadingAudio(true)
        try {
            const formData = new FormData()
            // Append with filename for multer
            formData.append("audio", audioBlob, "voice-message.webm")

            const res = await api.uploadMessageAudio(formData)
            const { audioUrl } = res.data

            if (audioUrl) {
                const payload = {
                    receiverId: userId,
                    audioUrl
                }
                socket.emit("send_message", payload)

                setMessages(prev => [...prev, {
                    _id: Date.now().toString(),
                    sender: currentUser,
                    audioUrl: audioUrl,
                    createdAt: new Date().toISOString(),
                    readBy: []
                }])
                setTimeout(scrollToBottom, 50)
            }
        } catch (error) {
            console.error("Failed to send audio", error)
        } finally {
            setIsUploadingAudio(false)
        }
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !socket) return

        const payload = {
            receiverId: userId,
            content: newMessage
        }

        socket.emit("send_message", payload)

        setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            sender: currentUser,
            content: newMessage,
            createdAt: new Date().toISOString(),
            readBy: []
        }])

        setNewMessage("")
        setTimeout(scrollToBottom, 50)
    }

    // Message Action Handlers
    const handleDeleteMessage = async (msgId) => {
        try {
            await api.deleteMessage(msgId)
            setMessages(prev => prev.filter(m => m._id !== msgId)) // Optimistic
            setActiveMessageId(null)
        } catch (error) {
            console.error("Failed to delete", error)
        }
    }

    const handleCopyMessage = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
            setActiveMessageId(null);
            alert("Message copied to clipboard");
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    }

    const openForwardModal = async (msg) => {
        setMessageToForward(msg);
        setForwardModalOpen(true);
        setActiveMessageId(null);
        try {
            const res = await api.getUserConversations();
            setConversations(res.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    }

    const handleForwardToUser = (targetUserId) => {
        if (!messageToForward || !socket) return;

        const payload = {
            receiverId: targetUserId,
            content: messageToForward.content,
            audioUrl: messageToForward.audioUrl
        }

        socket.emit("send_message", payload);
        alert("Message forwarded!");

        setForwardModalOpen(false);
        setMessageToForward(null);
    }

    const getLastSeenText = () => {
        if (otherUser?.isOnline) return "Online"
        if (!otherUser?.lastActive) return "Offline"

        const last = new Date(otherUser.lastActive)
        const now = new Date()
        const diffMins = Math.floor((now - last) / 60000)

        if (diffMins < 1) return "Last seen just now"
        if (diffMins < 60) return `Last seen ${diffMins}m ago`
        if (diffMins < 1440) {
            const hours = Math.floor(diffMins / 60);
            return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`
        }
        return `Last seen ${last.toLocaleDateString()} at ${last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside any message dropdown
            if (activeMessageId && !event.target.closest('.message-dropdown-container')) {
                setActiveMessageId(null);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMessageId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col pt-20 relative">
            {/* Info Modal */}
            {infoMessage && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Message Info</h3>
                            <button onClick={() => setInfoMessage(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm mb-1">Content</p>
                                <p className="text-lg">{infoMessage.content || "Audio Message"}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Sent</span>
                                    <span className="font-mono text-sm">{new Date(infoMessage.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Viewed</span>
                                    {(() => {
                                        const readEntry = infoMessage.readBy?.find(r => (r.user?._id || r.user || r) === otherUser?._id);
                                        return (
                                            <span className="font-mono text-sm text-blue-400">
                                                {readEntry?.readAt ? new Date(readEntry.readAt).toLocaleString() : (readEntry ? "Read (Old)" : "Not viewed yet")}
                                            </span>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Forward Modal */}
            {forwardModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Forward to...</h3>
                            <button onClick={() => setForwardModalOpen(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                            {conversations.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No recent conversations found</p>
                            ) : (
                                conversations.map(conv => {
                                    // Find the other participant in this conservation
                                    // Assuming conversations have 'participants' populated
                                    const other = conv.participants?.find(p => p._id !== currentUser?._id);
                                    if (!other) return null;

                                    return (
                                        <button
                                            key={conv._id}
                                            onClick={() => handleForwardToUser(other._id)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group"
                                        >
                                            <img src={other.avatar || "/placeholder.svg"} className="w-10 h-10 rounded-full object-cover" alt={other.fullName} />
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-200 group-hover:text-white">{other.fullName}</p>
                                                <p className="text-xs text-gray-500">@{other.username}</p>
                                            </div>
                                            <ForwardIcon className="w-4 h-4 ml-auto text-gray-600 group-hover:text-purple-400" />
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 p-4 sticky top-20 z-10 flex items-center justify-between">
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
                        {otherUser?.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#020817]"></div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-none">{otherUser?.fullName}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">@{otherUser?.username}</span>
                            <span className="text-xs text-gray-500">• {getLastSeenText()}</span>
                        </div>
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
                    const isMe = (msg.sender?._id || msg.sender) === currentUser?._id
                    // Refined 'read' check for object or ID
                    const isRead = msg.readBy?.some(r => {
                        const uId = r.user?._id || r.user || r;
                        return uId === otherUser?._id
                    });

                    return (
                        <div key={msg._id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} group relative`}>
                            {!isMe && (
                                <img src={otherUser?.avatar || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover self-end mb-1" />
                            )}

                            <div className={`relative max-w-[70%] p-3 rounded-2xl ${isMe
                                ? "bg-purple-600 text-white rounded-br-none"
                                : "bg-slate-800 text-gray-200 rounded-bl-none"
                                } message-dropdown-container`}> {/* Added class for click outside */}
                                {/* Message Dropdown Trigger */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msg._id ? null : msg._id) }}
                                    className={`absolute top-1 right-1 p-1 rounded-full bg-black/20 hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity ${activeMessageId === msg._id ? 'opacity-100' : ''}`}
                                >
                                    <ChevronDown className="w-3 h-3 text-white" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMessageId === msg._id && (
                                    <div className="absolute top-6 right-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 z-20 min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                                        <button onClick={() => { setInfoMessage(msg); setActiveMessageId(null); }} className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                                            <Info className="w-4 h-4" /> Info
                                        </button>
                                        <button onClick={() => openForwardModal(msg)} className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                                            <ForwardIcon className="w-4 h-4" /> Forward
                                        </button>
                                        {!msg.audioUrl && (
                                            <button onClick={() => handleCopyMessage(msg.content)} className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                                                <Copy className="w-4 h-4" /> Copy
                                            </button>
                                        )}
                                        {isMe && (
                                            <button onClick={() => handleDeleteMessage(msg._id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 flex items-center gap-2 text-sm text-red-400">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        )}
                                    </div>
                                )}

                                {msg.audioUrl ? (
                                    <audio controls src={msg.audioUrl} className="max-w-[240px] h-10 mt-2" />
                                ) : (
                                    <p className="text-sm pr-6 leading-relaxed">{msg.content}</p>
                                )}

                                <div className={`flex items-center justify-end gap-1 mt-1 opacity-70`}>
                                    <span className="text-[10px]">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        <span>
                                            {isRead ? (
                                                <CheckCheck className="w-4 h-4 text-blue-400" />
                                            ) : (
                                                <CheckCheck className="w-4 h-4 text-gray-400" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/10 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800 border-none rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-500"
                    />

                    {/* Mic Button */}
                    <button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording} // Stop if dragged out
                        className={`p-3 rounded-full transition-all flex-shrink-0 ${isRecording ? "bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg" : "bg-slate-800 text-gray-400 hover:text-white"
                            }`}
                        title="Hold to record"
                    >
                        {isUploadingAudio ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>

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
