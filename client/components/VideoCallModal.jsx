"use client"
import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function VideoCallModal({
    isOpen,
    onClose,
    localStream,
    remoteStream,
    isCaller,
    status, // "calling", "incoming", "connected", "ended"
    callerDetails, // { name, avatar } for incoming calls
    onAnswer,
    onReject,
    onEndCall,
    isVideoEnabled = true
}) {
    const { user } = useAuth();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideoEnabled);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Handle Local Stream
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(e => console.warn("Local video play failed", e));
        }
    }, [localStream, isOpen, isVideoOff]);

    // Handle Remote Stream
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.warn("Remote video play failed", e));
        }
    }, [remoteStream, isOpen]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl h-full md:h-[90vh] md:w-[90vw] md:rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex flex-col">

                {/* Header / Status */}
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent z-10 flex justify-between items-start pointer-events-none">
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <div className={`w-3 h-3 rounded-full ${status === "connected" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                        <span className="text-white/90 font-medium drop-shadow-md">
                            {status === "calling" && "Calling..."}
                            {status === "incoming" && "Incoming Call..."}
                            {status === "connected" && "Connected"}
                            {status === "ended" && "Call Ended"}
                        </span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">

                    {/* Incoming Call UI */}
                    {status === "incoming" && (
                        <div className="text-center z-10 p-8 flex flex-col items-center">
                            <img
                                src={callerDetails?.avatar || "/placeholder.svg"}
                                alt={callerDetails?.name}
                                className="w-32 h-32 rounded-full border-4 border-purple-500 mb-6 shadow-xl object-cover animate-bounce"
                            />
                            <h2 className="text-3xl font-bold text-white mb-2">{callerDetails?.name}</h2>
                            <p className="text-gray-400 mb-8">is calling you...</p>

                            <div className="flex items-center justify-center gap-8">
                                <button
                                    onClick={onReject}
                                    className="p-6 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg shadow-red-500/20"
                                >
                                    <PhoneOff className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={onAnswer}
                                    className="p-6 bg-green-500 rounded-full text-white hover:bg-green-600 transition-all animate-pulse transform hover:scale-110 shadow-lg shadow-green-500/20"
                                >
                                    <Video className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Call UI */}
                    {(status === "connected" || status === "calling") && (
                        <>
                            {/* Remote Stream Layer (Full Screen) */}
                            <div className="absolute inset-0 z-0 bg-slate-800">
                                {remoteStream ? (
                                    <>
                                        <video
                                            key={remoteStream.id} // Re-mount if stream ID changes
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Remote User Name Label */}
                                        <div className="absolute top-20 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white font-medium border border-white/10">
                                            {callerDetails?.name || "Remote User"}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>

                            {/* Audio Mode Placeholder (Overlay over Remote Video if needed) */}
                            {(!isVideoEnabled || (remoteStream && !remoteStream.getVideoTracks().some(t => t.enabled))) && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                                        <img
                                            src={callerDetails?.avatar || "/placeholder.svg"}
                                            alt={callerDetails?.name}
                                            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-slate-700 shadow-2xl relative z-10 object-cover"
                                        />
                                    </div>
                                    <h3 className="mt-8 text-2xl font-bold text-white tracking-wide">{callerDetails?.name || "User"}</h3>
                                    <p className="text-purple-400 font-medium animate-pulse mt-2">
                                        Voice Call Active
                                    </p>
                                </div>
                            )}

                            {/* Local Video (PiP) */}
                            {isVideoEnabled && (
                                <div className="absolute right-4 top-4 md:right-8 md:top-8 w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 transition-transform hover:scale-105 group">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                                    />
                                    {/* Local User Name Label */}
                                    <div className="absolute bottom-2 left-0 right-0 text-center">
                                        <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-white/90 text-sm font-medium border border-white/10">
                                            {user?.fullName || "You"}
                                        </span>
                                    </div>

                                    {isVideoOff && (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                            <User className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Controls Bar */}
                {status !== "incoming" && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-slate-950/80 backdrop-blur-xl p-4 px-8 rounded-full border border-white/10 shadow-2xl z-30">
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full transition-all ${isMuted ? "bg-red-500 text-white" : "bg-slate-700/50 text-white hover:bg-slate-700"}`}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all ${isVideoOff ? "bg-red-500 text-white" : "bg-slate-700/50 text-white hover:bg-slate-700"}`}
                        >
                            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={onEndCall}
                            className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
