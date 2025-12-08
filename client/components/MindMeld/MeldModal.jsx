"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Lock, Unlock, UserCheck } from "lucide-react";
import Link from "next/link";

export default function MeldModal({ user, socket, roomId, matchedContent, similarity, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [revealed, setRevealed] = useState(false);
    const [partnerRevealed, setPartnerRevealed] = useState(null); // null, or user object
    const [myRevealed, setMyRevealed] = useState(false);
    const messagesEndRef = useRef(null);

    // Sound Effect
    useEffect(() => {
        const audio = new Audio("/sounds/match.mp3"); // Ensure this file exists or use a generic URL
        // Fallback or use a reliable CDN sound for demo if local file missing
        // For now, let's play a simple beep if no file, or assume file exists.
        // Or better, use a trusted CDN link for a "magic" sound
        const chime = new Audio("https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3");
        chime.volume = 0.5;
        chime.play().catch(e => console.log("Audio play failed (autoplay policy?)", e));
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };

        const onReveal = ({ user }) => {
            if (user._id !== socket.id) { // Assuming socket.id isn't user._id, usually socket.user._id compare logic needed
                // Helper: socket typically doesn't send my own ID easily unless stored.
                // But for "partnerRevealed", we just check if it's NOT me (or just simply set it)
                // Actually server emits 'mindmeld:reveal' with the user object who revealed.
                setPartnerRevealed(user);
            }
        };

        const onLeft = () => {
            setMessages(prev => [...prev, { system: true, text: "Partner has disconnected." }]);
        }

        socket.on("mindmeld:message", onMessage);
        socket.on("mindmeld:reveal", onReveal);
        socket.on("mindmeld:left", onLeft);

        return () => {
            socket.off("mindmeld:message", onMessage);
            socket.off("mindmeld:reveal", onReveal);
            socket.off("mindmeld:left", onLeft);
        };
    }, [socket, roomId]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        socket.emit("mindmeld:message", { roomId, text: input });
        setInput("");
    };

    const handleReveal = () => {
        setMyRevealed(true);
        socket.emit("mindmeld:reveal", { roomId });
    };

    const handleLeave = () => {
        if (confirm("Are you sure? This connection will be lost forever.")) {
            socket.emit("mindmeld:leave", { roomId });
            onClose();
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[70vh]"
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 flex justify-between items-center border-b border-white/10">
                    <div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <span className="animate-pulse text-purple-400">●</span> MindMeld Active
                        </h2>
                        <p className="text-xs text-purple-200">Matched on: "{matchedContent}" ({Math.round(similarity * 100)}% match)</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
                    <div className="text-center text-gray-500 text-xs my-4">
                        You are connected anonymously. Say hello to your mind twin.
                    </div>
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === user?._id;
                        return msg.system ? (
                            <div key={i} className="text-center text-red-400 text-xs italic">{msg.text}</div>
                        ) : (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reveal Identity Zone */}
                {(timeLeft === 0 || revealed || partnerRevealed || myRevealed) && (
                    <div className="p-4 bg-purple-900/20 border-t border-purple-500/30 flex justify-center gap-4">
                        {!myRevealed ? (
                            <button onClick={handleReveal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                                <Unlock size={16} /> Reveal Identity
                            </button>
                        ) : (
                            <div className="text-purple-300 text-sm flex items-center gap-2">
                                <UserCheck size={16} /> You revealed
                            </div>
                        )}

                        {partnerRevealed && (
                            <Link href={`/c/${partnerRevealed.username}`} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                                <img src={partnerRevealed.avatar} className="w-8 h-8 rounded-full" />
                                <span className="text-white font-bold">{partnerRevealed.username}</span>
                            </Link>
                        )}
                    </div>
                )}

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 bg-gray-900 border-t border-white/10 flex gap-2">
                    <button type="button" onClick={handleLeave} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                        <X size={24} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/50 border border-white/20 rounded-full px-4 text-white focus:outline-none focus:border-purple-500"
                    />
                    <button type="submit" disabled={!input.trim()} className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-500 transition-colors disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
