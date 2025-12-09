"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/context/SocketContext"
import { useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"
import { Send, ArrowLeft, MoreVertical, Phone, Video, Mic, Check, Trash2, Forward as ForwardIcon, Info, ChevronDown, CheckCheck, X, Copy } from "lucide-react"
import VideoCallModal from "@/components/VideoCallModal"

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" } // Backup free STUN
    ]
};

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

    // --- WebRTC / Call States ---
    const [callModalOpen, setCallModalOpen] = useState(false)
    const [callStatus, setCallStatus] = useState("idle") // idle, calling, incoming, connected, ended
    const [localStream, setLocalStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)
    const [incomingCallDetails, setIncomingCallDetails] = useState(null) // { from,callerName, offer, isVideo }
    const [isVideoCall, setIsVideoCall] = useState(true)

    const messagesEndRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    // WebRTC Refs
    const peerConnectionRef = useRef(null)
    const localStreamRef = useRef(null)
    const iceCandidatesQueue = useRef([]) // Store candidates before PC is ready

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

    // --- Socket Event Listeners ---
    // Keep track of callStatus in a ref for socket listeners without triggering re-runs
    const callStatusRef = useRef(callStatus);

    useEffect(() => {
        callStatusRef.current = callStatus;
    }, [callStatus]);

    // --- Socket Event Listeners ---
    useEffect(() => {
        if (!socket) return

        socket.on("receive_message", (message) => {
            const senderId = message.sender?._id || message.sender;
            if (senderId === userId) {
                setMessages(prev => [...prev, message])
                setTimeout(scrollToBottom, 50)
                socket.emit("mark_read", { messageIds: [message._id], otherUserId: userId })
            }
        })

        socket.on("messages_read", ({ messageIds, readBy, readAt }) => {
            setMessages(prev => prev.map(msg => {
                if (messageIds.includes(msg._id)) {
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

        // --- Call Signaling Events ---
        socket.on("call:invite", async ({ from, callerName, callerAvatar, offer, isVideo }) => {
            if (callStatusRef.current !== "idle") {
                return; // Busy
            }
            console.log("Incoming call from:", callerName, "Video:", isVideo);
            setIncomingCallDetails({ from, callerName, callerAvatar, offer, isVideo });
            setCallStatus("incoming");
            setCallModalOpen(true);
            setIsVideoCall(isVideo);
            iceCandidatesQueue.current = []; // Reset queue
        });

        socket.on("call:answer", async ({ from, answer }) => {
            console.log("Call answered by:", from);
            if (callStatusRef.current === "calling" && peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    setCallStatus("connected");
                    // Process any queued candidates that arrived before the answer
                    await processIceQueue();
                } catch (err) {
                    console.error("Error setting remote description", err);
                }
            }
        });

        socket.on("call:ice-candidate", async ({ candidate }) => {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate", err);
                }
            } else {
                console.log("Queueing ICE candidate (PC not ready)");
                iceCandidatesQueue.current.push(candidate);
            }
        });

        socket.on("call:end", () => {
            console.log("Call ended by peer");
            endCallCleanup();
        });

        socket.on("call:reject", () => {
            alert("Call declined");
            endCallCleanup();
        });


        return () => {
            socket.off("receive_message")
            socket.off("messages_read")
            socket.off("message_deleted")
            socket.off("user_status_change")
            socket.off("call:invite")
            socket.off("call:answer")
            socket.off("call:ice-candidate")
            socket.off("call:end")
            socket.off("call:reject")

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        }
    }, [socket, userId, currentUser]); // Removed callStatus to prevent cleanup on status change

    // --- WebRTC Logic ---

    const processIceQueue = async () => {
        if (!peerConnectionRef.current) return;
        while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("Added queued ICE candidate");
            } catch (err) {
                console.error("Error processing queued ICE", err);
            }
        }
    };

    const initializePeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Target ID logic: if calling, target is userId. If answering, target is incoming caller.
                const targetId = incomingCallDetails ? incomingCallDetails.from : userId;
                socket.emit("call:ice-candidate", {
                    to: targetId,
                    candidate: event.candidate
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", pc.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log("Signaling State:", pc.signalingState);
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            console.log("Remote track received:", stream.id, event.track.kind);
            // Create a new MediaStream to ensure React state updates even if the reference hasn't changed
            setRemoteStream(new MediaStream(stream.getTracks()));
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    const getLocalStream = async (video = true) => {
        // Return existing stream ONLY if it is active and tracks are live
        if (localStreamRef.current && localStreamRef.current.active) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            const audioTracks = localStreamRef.current.getAudioTracks();

            const hasVideo = videoTracks.length > 0;
            const videoTrackLive = hasVideo ? videoTracks[0].readyState === "live" : false;
            const audioTrackLive = audioTracks.length > 0 ? audioTracks[0].readyState === "live" : false;

            // If we want video, we must have a live video track.
            // If we only want audio, we must have a live audio track.
            // Also ensure we aren't returning an audio-only stream when video is requested.
            if (hasVideo === video && (video ? videoTrackLive : true) && audioTrackLive) {
                console.log("Reusing existing local stream");
                return localStreamRef.current;
            }
        }

        try {
            console.log("Requesting new local stream...");
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error("Error accessing media devices", err);
            alert("Could not access camera/microphone");
            return null;
        }
    };

    const startCall = async (video = true) => {
        setIsVideoCall(video);
        setCallStatus("calling");
        setCallModalOpen(true);

        const stream = await getLocalStream(video);
        if (!stream) {
            endCallCleanup();
            return;
        }

        const pc = initializePeerConnection();
        // Add tracks
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:invite", {
            to: userId,
            offer,
            isVideo: video
        });
    };

    const answerCall = async () => {
        if (!incomingCallDetails) return;

        setCallStatus("connected");
        const { offer, from, isVideo } = incomingCallDetails;

        // Use caller's video preference for stream constraints or default to matching
        const stream = await getLocalStream(isVideo);

        const pc = initializePeerConnection();
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // IMPORTANT: Process queue AFTER setting remote description
        await processIceQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("call:answer", {
            to: from,
            answer
        });
    };

    const rejectCall = () => {
        if (incomingCallDetails) {
            socket.emit("call:reject", { to: incomingCallDetails.from });
        }
        endCallCleanup();
    };

    const endCall = () => {
        const targetId = incomingCallDetails ? incomingCallDetails.from : userId;
        socket.emit("call:end", { to: targetId });
        endCallCleanup();
    };

    const endCallCleanup = () => {
        setCallStatus("ended");
        setTimeout(() => {
            setCallModalOpen(false);
            setCallStatus("idle");
            setIncomingCallDetails(null);
        }, 1000); // Show "Ended" for 1s

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            localStreamRef.current = null;
        }
        setRemoteStream(null);
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
    };


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
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
            formData.append("audio", audioBlob, "voice-message.webm")
            const res = await api.uploadMessageAudio(formData)
            const { audioUrl } = res.data

            if (audioUrl) {
                const payload = { receiverId: userId, audioUrl }
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
        const payload = { receiverId: userId, content: newMessage }
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
            setMessages(prev => prev.filter(m => m._id !== msgId))
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
        socket.emit("send_message", payload)
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

    useEffect(() => {
        const handleClickOutside = (event) => {
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
            <VideoCallModal
                isOpen={callModalOpen}
                onClose={() => { if (callStatus === 'ended') setCallModalOpen(false); else endCall(); }}
                localStream={localStream}
                remoteStream={remoteStream}
                isCaller={callStatus === 'calling'}
                status={callStatus}
                callerDetails={
                    callStatus === 'incoming'
                        ? { name: incomingCallDetails?.callerName, avatar: incomingCallDetails?.callerAvatar }
                        : { name: otherUser?.fullName, avatar: otherUser?.avatar }
                }
                onAnswer={answerCall}
                onReject={rejectCall}
                onEndCall={endCall}
                isVideoEnabled={isVideoCall}
            />

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
                    <button
                        onClick={() => startCall(false)} // Audio only
                        className="hover:text-purple-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => startCall(true)} // Video
                        className="hover:text-purple-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                    const isMe = (msg.sender?._id || msg.sender) === currentUser?._id
                    const isRead = msg.readBy?.some(r => {
                        const uId = r.user?._id || r.user || r;
                        return uId === otherUser?._id
                    });

                    return (
                        <div key={msg._id || idx} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} group relative`}>
                            {!isMe && (
                                <img src={otherUser?.avatar || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover self-end mb-1" />
                            )}

                            <div className={`relative max-w-[70%] p-3 rounded-2xl ${isMe
                                ? "bg-purple-600 text-white rounded-br-none"
                                : "bg-slate-800 text-gray-200 rounded-bl-none"
                                } message-dropdown-container`}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msg._id ? null : msg._id) }}
                                    className={`absolute top-1 right-1 p-1 rounded-full bg-black/20 hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity ${activeMessageId === msg._id ? 'opacity-100' : ''}`}
                                >
                                    <ChevronDown className="w-3 h-3 text-white" />
                                </button>

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
            <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20 mb-[64px] md:mb-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800 border-none rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-500"
                    />

                    <button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
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
