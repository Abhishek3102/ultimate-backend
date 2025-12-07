"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/context/SocketContext"
import Peer from "simple-peer"
import { motion } from "framer-motion"
import { Video, Mic, MicOff, Users, ArrowLeft, Play, Pause, Volume2, Share2, Copy, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { api } from "@/lib/api"

function CinemaPageContent() {
    const { roomId } = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { socket } = useSocket()
    const videoRef = useRef(null)

    // State
    const [theater, setTheater] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)

    // 5. Chat State
    const [messages, setMessages] = useState([])
    const [msgText, setMsgText] = useState("")
    const chatEndRef = useRef(null)

    // Scroll to bottom on new message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Voice Chat State
    const [stream, setStream] = useState(null)
    const [peers, setPeers] = useState([])
    const [isMuted, setIsMuted] = useState(false)
    const peersRef = useRef([])

    // Derived state
    const isHost = theater?.host?._id && user?._id && theater.host._id.toString() === user._id.toString();

    // 1. Fetch Theater Details
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchTheater = async () => {
            try {
                const res = await api.getTheater(roomId)
                setTheater(res.data)
            } catch (error) {
                console.error("Failed to load theater", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTheater()
    }, [roomId, isAuthenticated])

    // 2. Cinema Logic using Global Socket
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!theater || !user || !socket) return;

        // -- Event Handlers --

        // 1. Connection Handler (CRITICAL FIX)
        const onConnect = () => {
            console.log("[CINEMA] Socket connected event. Joining room...");
            setIsConnected(true);
            socket.emit("cinema:join", { roomId });
            socket.emit("cinema:request_sync", { roomId });
        };

        // 2. Cinema Sync Listeners
        const onCinemaAction = ({ type, currentTime, senderId }) => {
            if (senderId === user._id) return;
            const video = videoRef.current;
            if (!video) return;

            if (Math.abs(video.currentTime - currentTime) > 1) {
                video.currentTime = currentTime;
            }

            if (type === "play") {
                video.play().catch(() => { });
                setIsPlaying(true);
            } else if (type === "pause") {
                video.pause();
                setIsPlaying(false);
            } else if (type === "seek") {
                video.currentTime = currentTime;
            }
        };

        const onHeartbeat = ({ hostId, currentTime, isPlaying: hostPlaying }) => {
            if (isHost) return;
            const video = videoRef.current;
            if (!video) return;

            const drift = Math.abs(video.currentTime - currentTime);
            if (hostPlaying) {
                if (video.paused) video.play().catch(console.warn);
                setIsPlaying(true);
            } else {
                if (!video.paused) video.pause();
                setIsPlaying(false);
            }
            if (drift > 2) video.currentTime = currentTime;
        };

        const onChatMessage = (msg) => {
            console.log("Chat received:", msg);
            // Ignore own messages from server (Optimistic Update handles them)
            // Robust comparison ensuring we don't block others
            if (String(msg.sender._id || msg.sender) === String(user._id)) return;

            setMessages(prev => [...prev, msg])
        };

        const onUserJoined = ({ userId, username }) => {
            const sysMsg = {
                sender: { _id: "system", username: "System" },
                text: `${username} joined the party!`,
                isSystem: true
            };
            setMessages(prev => [...prev, sysMsg]);
        };

        const onRequestSync = ({ requesterId }) => {
            if (isHost && videoRef.current) {
                socket.emit("cinema:sync_state", {
                    roomId,
                    currentTime: videoRef.current.currentTime,
                    isPlaying: !videoRef.current.paused,
                    requesterId
                });
            }
        };

        const onSyncState = ({ currentTime, isPlaying }) => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime;
                if (isPlaying) {
                    videoRef.current.play().catch(() => { });
                    setIsPlaying(true);
                }
            }
        };

        // Attach Listeners
        socket.on("connect", onConnect); // Attach FIRST
        socket.on("cinema:action", onCinemaAction);
        socket.on("cinema:heartbeat", onHeartbeat);
        socket.on("cinema:message", onChatMessage);
        socket.on("cinema:user-joined", onUserJoined);
        socket.on("cinema:request_sync", onRequestSync);
        socket.on("cinema:sync_state", onSyncState);

        // Initial Check: If already connected, manual trigger
        if (socket.connected) {
            console.log("[CINEMA] Socket already connected. Manual join.");
            onConnect(); // Reuse handler
        }

        // Cleanup
        return () => {
            socket.off("connect", onConnect);
            socket.off("cinema:action", onCinemaAction);
            socket.off("cinema:heartbeat", onHeartbeat);
            socket.off("cinema:message", onChatMessage);
            socket.off("cinema:user-joined", onUserJoined);
            socket.off("cinema:request_sync", onRequestSync);
            socket.off("cinema:sync_state", onSyncState);
        }
    }, [theater, user, roomId, isHost, socket]);

    // --- EFFECT: Heartbeat Emitter (Host Only) ---
    useEffect(() => {
        if (!isHost || !socket) return;

        const interval = setInterval(() => {
            const video = videoRef.current;
            if (!video) return;

            if (socket.connected) {
                socket.emit("cinema:heartbeat", {
                    roomId,
                    currentTime: video.currentTime,
                    isPlaying: !video.paused
                });
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isHost, roomId, socket]);


    // 3. Voice Chat Logic (WebRTC)
    const joinVoiceChat = async () => {
        if (!socket) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            setStream(stream)

            const onUserConnected = ({ userId }) => {
                const peer = createPeer(userId, socket.id, stream)
                peersRef.current.push({ peerID: userId, peer })
                setPeers(users => [...users, peer])
            }

            const onOffer = ({ from, offer }) => {
                const peer = addPeer(offer, from, stream)
                const existing = peersRef.current.find(p => p.peerID === from);
                if (!existing) {
                    peersRef.current.push({ peerID: from, peer })
                    setPeers(users => [...users, peer])
                }
            }

            const onAnswer = ({ from, answer }) => {
                const item = peersRef.current.find(p => p.peerID === from)
                if (item) item.peer.signal(answer)
            }

            const onIceCandidate = ({ from, candidate }) => {
                const item = peersRef.current.find(p => p.peerID === from)
                if (item) item.peer.signal(candidate)
            }

            socket.on("voice:user-connected", onUserConnected)
            socket.on("voice:offer", onOffer)
            socket.on("voice:answer", onAnswer)
            socket.on("voice:ice-candidate", onIceCandidate)

            socket.emit("voice:join", { roomId })
        } catch (error) {
            console.error("Voice chat error:", error)
            alert("Could not access microphone")
        }
    }

    const createPeer = (userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        })
        peer.on("signal", signal => {
            if (socket) socket.emit("voice:offer", { to: userToSignal, offer: signal })
        })
        peer.on("stream", stream => {
            const audio = document.createElement('audio')
            audio.srcObject = stream
            audio.play()
        })
        return peer
    }

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })
        peer.on("signal", signal => {
            if (socket) socket.emit("voice:answer", { to: callerID, answer: signal })
        })
        peer.on("stream", stream => {
            const audio = document.createElement('audio')
            audio.srcObject = stream
            audio.play()
        })
        peer.signal(incomingSignal)
        return peer
    }

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled
            setIsMuted(!stream.getAudioTracks()[0].enabled)
        }
    }

    const leaveVoice = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }

    // 4. Video Event Handlers (Host Only)
    const handlePlay = () => {
        if (!isHost || !socket) return;
        setIsPlaying(true);
        socket.emit("cinema:action", { type: "play", currentTime: videoRef.current.currentTime, roomId });
    }

    const handlePause = () => {
        if (!isHost || !socket) return;
        setIsPlaying(false);
        socket.emit("cinema:action", { type: "pause", currentTime: videoRef.current.currentTime, roomId });
    }

    const handleSeek = () => {
        if (!isHost || !socket) return;
        socket.emit("cinema:action", { type: "seek", currentTime: videoRef.current.currentTime, roomId });
    }

    const attemptPlay = async () => {
        if (!videoRef.current) return;
        try {
            await videoRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.warn("Autoplay blocked:", err);
        }
    }

    // Chat Functions with OPTIMISTIC UPDATES
    const sendMessage = (e) => {
        e.preventDefault()
        if (!msgText.trim()) return;

        if (socket && socket.connected) {

            // 1. Optimistic Update (Show immediately)
            const optimisticMsg = {
                sender: { _id: user._id, username: user.username, avatar: user.avatar },
                text: msgText,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, optimisticMsg]);

            // 2. Emit to server
            socket.emit("cinema:message", { roomId, text: msgText });
            setMsgText("");

        } else {
            console.error("Socket not connected");
            alert("Connection lost. Please refresh.")
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Theater...</div>
    }

    if (!theater) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Theater not found</div>
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col pt-24">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md relative z-40">
                <div className="flex items-center gap-4 min-w-0">
                    <Link href="/cinema" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-bold text-lg truncate pr-4">{theater.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-white/70">ID: {theater.roomId}</span>
                            <span className="truncate">Host: {theater.host?.username}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Voice Controls */}
                    {!stream ? (
                        <button
                            onClick={joinVoiceChat}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-green-900/20"
                        >
                            <Mic className="w-4 h-4" />
                            <span className="hidden sm:inline">Join Voice</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-full p-1 pr-4 border border-white/10">
                            <button
                                onClick={toggleMute}
                                className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white'}`}
                            >
                                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                            <span className="text-sm text-green-400 font-medium animate-pulse hidden sm:inline">Connected</span>
                            <button onClick={leaveVoice} className="text-xs text-white/40 hover:text-white ml-2">Leave</button>
                        </div>
                    )}

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    {/* Connection Status Dot */}
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} transition-colors duration-500`} title={isConnected ? "Socket Connected" : "Socket Disconnected"} />

                    {/* Copy Link */}
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            const btn = document.getElementById('copy-link-btn')
                            if (btn) btn.innerText = "Copied!"
                            setTimeout(() => { if (btn) btn.innerText = "Copy Link" }, 2000)
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                        title="Copy Full URL"
                    >
                        <Share2 className="w-4 h-4" />
                        <span id="copy-link-btn" className="hidden lg:inline">Copy Link</span>
                    </button>

                    {/* Copy Code */}
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(theater.roomId)
                            const btn = document.getElementById('copy-code-btn')
                            if (btn) btn.innerText = "Copied!"
                            setTimeout(() => { if (btn) btn.innerText = "Copy Code" }, 2000)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-purple-900/20"
                        title="Copy Room Code Only"
                    >
                        <Copy className="w-4 h-4" />
                        <span id="copy-code-btn" className="hidden sm:inline">Copy Code</span>
                    </button>
                </div>
            </div>

            {/* Main Stage - Centered with constrained height */}
            <div className="flex-1 flex max-h-[calc(100vh-6rem)] overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-4 bg-zinc-950/50">
                    <div className="flex w-full max-w-6xl h-full gap-4 items-center justify-center">

                        {/* Video Player Container */}
                        <div className="flex-1 aspect-video max-h-[70vh] relative shadow-2xl overflow-hidden bg-zinc-900 rounded-xl border border-white/5 group">
                            <video
                                ref={videoRef}
                                src={theater.video?.videoFile}
                                className="w-full h-full object-contain bg-black"
                                controls={isHost}
                                playsInline
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onSeeked={handleSeek}
                            />

                            {!isHost && <div className="absolute inset-0 z-20" />}

                            {!isHost && (
                                <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-mono border border-white/10 flex items-center gap-2 backdrop-blur-md ${isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                        {isPlaying ? 'Live Sync' : 'Paused by Host'}
                                    </div>
                                    {isPlaying && videoRef.current?.paused && (
                                        <button
                                            onClick={attemptPlay}
                                            className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-bounce flex items-center gap-2 pointer-events-auto"
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            Click to Sync
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Chat Sidebar */}
                        <div className="w-80 h-[70vh] bg-zinc-900 border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-xl shrink-0">
                            <div className="p-3 border-b border-white/10 font-bold flex items-center gap-2 bg-zinc-900/50 text-sm">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                                Live Chat
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-950/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-white/20 text-xs">
                                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No messages yet.<br />Start the conversation!</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i}>
                                        {msg.isSystem ? (
                                            <div className="text-center text-[10px] text-green-400 py-1 font-mono">{msg.text}</div>
                                        ) : (
                                            <div className={`flex gap-2 ${msg.sender._id === user._id ? 'flex-row-reverse' : ''}`}>
                                                <div title={msg.sender.username} className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden mt-1">
                                                    {msg.sender.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" /> : <span className="text-[10px]">{msg.sender.username[0]}</span>}
                                                </div>
                                                <div className={`flex-1 min-w-0 max-w-[85%] ${msg.sender._id === user._id ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-3 py-2 rounded-2xl text-xs break-words ${msg.sender._id === user._id ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-gray-200 rounded-tl-sm'}`}>
                                                        {msg.text}
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 mt-0.5 px-1">
                                                        {msg.sender.username}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={sendMessage} className="p-3 border-t border-white/10 bg-zinc-900">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={msgText}
                                        onChange={e => setMsgText(e.target.value)}
                                        placeholder="Type..."
                                        disabled={!socket || !socket.connected}
                                        className="flex-1 bg-zinc-950 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                                    />
                                    <button type="submit" disabled={!msgText.trim() || !socket || !socket.connected} className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CinemaPage() {
    return (
        <AuthProvider>
            <CinemaPageContent />
        </AuthProvider>
    )
}
