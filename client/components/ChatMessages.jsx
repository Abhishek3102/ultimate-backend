"use client"
import React, { useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

// Helper for fuzzy search if we don't install fuse.js, simple filter is okay for now
// or we can just assume filter by text include.

export default function ChatMessages({ messages }) {
    const scroll = useRef();
    const { user } = useAuth();

    useEffect(() => {
        scroll.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages?.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center opacity-50">
                    <p>No messages yet!</p>
                </div>
            ) : (
                messages.map((item, index) => {
                    // Normalize sender: could be populated obj or ID string
                    const senderId = item.sender?._id || item.sender;
                    const isMe = senderId === user?._id;
                    const senderAvatar = item.sender?.avatar || "/placeholder.svg";

                    return (
                        <div key={index} ref={index === messages.length - 1 ? scroll : null} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <img
                                    src={senderAvatar}
                                    className="w-8 h-8 rounded-full object-cover mt-1"
                                    alt="avatar"
                                />
                            )}

                            <div className={`p-3 rounded-2xl max-w-[80%] break-words ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-800 text-gray-200 rounded-bl-none'
                                }`}>
                                {item.content?.startsWith("http") && (item.content.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                    <Link href={item.content} target="_blank">
                                        <img src={item.content} alt="sent image" className="rounded-lg max-w-full" />
                                    </Link>
                                ) : (
                                    <p>{item.content}</p>
                                )}
                                <span className="text-[10px] opacity-70 mt-1 block text-right">
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
}
