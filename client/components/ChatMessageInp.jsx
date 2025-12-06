"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/components/AuthProvider';
import { useParams } from 'next/navigation';

export default function ChatMessageInp({ setMessages }) { // Renamed prop to match usage or context
    const { socket } = useSocket();
    const { userId: receiverId } = useParams();
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const sendImg = useRef();
    const typingTimerRef = useRef();

    const handleInpClick = () => {
        sendImg.current.click();
    };

    const handleMessageSend = async () => {
        if (!socket || !user) return;

        if (file) {
            // TODO: Implement file upload logic if backend supports it.
            // For now, we skip Cloudinary complexity unless explicitly configured.
            // If user has Cloudinary creds in .env, we could use them, but better to keep it simple first.
            toast.error("File upload not fully configured yet.");
            setFile(null);
            return;
        }

        if (message.trim().length === 0) {
            toast.error("Message cannot be empty");
            return;
        }

        const payload = {
            receiverId,
            content: message
        };

        // Optimistic update handled by socket 'message_sent' or manual append in parent
        // For accurate optimistic UI, we can call setMessages here passed from parent
        // or wait for socket echo. The user's code did fetch THEN emit.
        // My backend emits 'receive_message' to receiver and 'message_sent' to sender.

        socket.emit("send_message", payload);

        // Optimism
        setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            sender: user, // Full user object
            content: message,
            createdAt: new Date().toISOString()
        }]);

        setMessage("");
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    const handleTyping = (e) => {
        setFile(null);
        setMessage(e.target.value);
        // clearTimeout(typingTimerRef.current);
        // if (socket) {
        //     socket.emit('typing', { userId: user._id, room: receiverId });
        // }
        // typingTimerRef.current = setTimeout(() => {
        //     if (socket) {
        //         socket.emit('stopTyping', { userId: user._id, room: receiverId });
        //     }
        // }, 1000);
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-slate-900 border-t border-white/10 sticky bottom-0 z-10">
            <input
                type="text"
                placeholder="Enter Message..."
                className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleMessageSend();
                    }
                }}
            />

            <input
                ref={sendImg}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />

            <button
                className="p-2 text-gray-400 hover:text-white transition-colors"
                onClick={handleInpClick}
            >
                <Plus className='w-6 h-6' />
            </button>

            <button
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors disabled:opacity-50"
                onClick={handleMessageSend}
                disabled={loading}
            >
                {loading ? <Loader2 className='w-5 h-5 animate-spin' /> : <Send className='w-5 h-5' />}
            </button>
        </div>
    );
}
