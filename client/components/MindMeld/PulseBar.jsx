"use client";
import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Ensure you have a way to access the socket instance. 
// Assuming it's passed via props or context.
// For now, I'll assume a prop 'socket' is available or we use a hook.

export default function PulseBar({ socket }) {
    const [thought, setThought] = useState("");
    const [status, setStatus] = useState("idle"); // idle, scanning, sent

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!thought.trim() || !socket) return;

        setStatus("scanning");
        socket.emit("pulse:submit", { content: thought });

        // Reset after a delay if no immediate match (handled by socket event usually)
        // ideally socket emits 'pulse:saved'
    };

    useEffect(() => {
        if (!socket) return;

        const onPulseSaved = () => {
            setStatus("sent");
            setTimeout(() => {
                setStatus("idle");
                setThought("");
            }, 3000);
        };

        socket.on("pulse:saved", onPulseSaved);
        return () => {
            socket.off("pulse:saved", onPulseSaved);
        }
    }, [socket]);

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
            <AnimatePresence mode="wait">
                {status === "scanning" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-md rounded-full p-4 flex items-center justify-center gap-3 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                            <Zap className="w-6 h-6 text-cyan-400 relative z-10" />
                        </div>
                        <span className="text-cyan-100 font-medium tracking-wide animate-pulse">
                            Scanning the Noosphere...
                        </span>
                    </motion.div>
                ) : status === "sent" ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-cyan-300 font-medium bg-cyan-950/50 rounded-full py-3 border border-cyan-500/20"
                    >
                        Pulse sent. The universe is listening.
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                        className="relative group"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-black rounded-full leading-none">
                            <div className="pl-6">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <input
                                type="text"
                                value={thought}
                                onChange={(e) => setThought(e.target.value)}
                                placeholder="What's on your mind right now?"
                                className="w-full p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none font-medium"
                                maxLength={140}
                            />
                            <button
                                type="submit"
                                disabled={!thought.trim()}
                                className="mr-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold transform hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                Pulse
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
