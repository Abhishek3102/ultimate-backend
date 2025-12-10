"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle, Type, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { api } from "@/lib/api";

export default function SubmitEntryModal({ challengeId, challengeType = "mixed", isOpen, onClose, onSuccess }) {
    const [certificateName, setCertificateName] = useState("");
    // Default contentType based on allowed type
    const [contentType, setContentType] = useState(
        challengeType === "image" ? "Image" :
            challengeType === "video" ? "Video" :
                challengeType === "text" ? "Tweet" : "Tweet"
    );

    // Inputs
    const [tweetContent, setTweetContent] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [videoDesc, setVideoDesc] = useState("");

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!certificateName) return alert("Certificate Name is required");
        if (contentType === "Tweet" && !tweetContent) return alert("Tweet content is required");
        if ((contentType === "Video" || contentType === "Image") && !videoFile) return alert("File is required");

        setLoading(true);
        setStatus("Processing...");

        try {
            let contentId = "";

            // 1. Create Content First
            if (contentType === "Tweet") {
                setStatus("Posting Tweet...");
                // Pass empty array for images
                const res = await api.createTweet(tweetContent, []);
                contentId = res.data._id;

            } else if (contentType === "Image") {
                setStatus("Uploading Image...");

                // Use createTweet for Image (as Tweet with Image)
                // Use description as content or default
                const content = videoDesc || "Arena Entry";
                const res = await api.createTweet(content, [videoFile]);
                contentId = res.data._id;

            } else if (contentType === "Video") {
                setStatus("Uploading Video...");
                const formData = new FormData();
                formData.append("videoFile", videoFile);
                if (videoTitle) formData.append("title", videoTitle);
                if (videoDesc) formData.append("description", videoDesc);

                // Add dummy thumbnail
                const dummyThumb = new File([""], "thumbnail.jpg", { type: "image/jpeg" });
                formData.append("thumbnail", dummyThumb);

                const res = await api.uploadVideo(formData);
                contentId = res.data._id;
            }

            if (!contentId) throw new Error("Failed to create content ID");

            // 2. Submit to Arena
            setStatus("Entering Arena...");
            await api.enterChallenge(challengeId, {
                contentId,
                contentType,
                certificateName
            });

            setStatus("Success!");
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (error) {
            console.error(error);
            alert(error.message || "Submission failed");
            setStatus("");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to check if type is allowed
    const isTypeAllowed = (type) => {
        if (!challengeType || challengeType === "mixed") return true;
        if (challengeType === type.toLowerCase()) return true;
        return false;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Submit Your Entry
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* 1. Identity */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name on Certificate</label>
                            <input
                                type="text"
                                value={certificateName}
                                onChange={e => setCertificateName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                            />
                        </div>

                        {/* 2. Content Type */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Entry Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={!isTypeAllowed('text')}
                                    onClick={() => isTypeAllowed('text') && setContentType("Tweet")}
                                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${contentType === 'Tweet' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'} ${!isTypeAllowed('text') && 'opacity-30 cursor-not-allowed text-gray-600'}`}
                                >
                                    <Type size={16} />
                                    Text
                                </button>
                                <button
                                    type="button"
                                    disabled={!isTypeAllowed('image')}
                                    onClick={() => isTypeAllowed('image') && setContentType("Image")}
                                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${contentType === 'Image' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'} ${!isTypeAllowed('image') && 'opacity-30 cursor-not-allowed text-gray-600'}`}
                                >
                                    <ImageIcon size={16} />
                                    Image
                                </button>
                                <button
                                    type="button"
                                    disabled={!isTypeAllowed('video')}
                                    onClick={() => isTypeAllowed('video') && setContentType("Video")}
                                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${contentType === 'Video' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'} ${!isTypeAllowed('video') && 'opacity-30 cursor-not-allowed text-gray-600'}`}
                                >
                                    <VideoIcon size={16} />
                                    Video
                                </button>
                            </div>
                        </div>

                        {/* 3. Dynamic Content Input */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            {contentType === "Tweet" ? (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-purple-300">Write your Post</label>
                                    <textarea
                                        value={tweetContent}
                                        onChange={e => setTweetContent(e.target.value)}
                                        placeholder="What's on your mind? #ArenaChallenger"
                                        rows={4}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none resize-none"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-purple-300">
                                        {contentType === "Image" ? "Upload Image" : "Upload Video"}
                                    </label>

                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors bg-black/20 group">
                                        <input
                                            type="file"
                                            accept={contentType === "Image" ? "image/*" : "video/*"}
                                            onChange={e => setVideoFile(e.target.files[0])}
                                            className="hidden"
                                            id="file-upload"
                                            key={contentType}
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                            <span className="text-sm text-gray-400 group-hover:text-white">
                                                {videoFile ? videoFile.name : `Click to select ${contentType}`}
                                            </span>
                                        </label>
                                    </div>

                                    {(videoFile || contentType === "Image") && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            {contentType === "Video" && (
                                                <input
                                                    type="text"
                                                    placeholder="Video Title"
                                                    value={videoTitle}
                                                    onChange={e => setVideoTitle(e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                                />
                                            )}
                                            <textarea
                                                placeholder={contentType === "Image" ? "Caption (optional)" : "Description (optional)"}
                                                value={videoDesc}
                                                onChange={e => setVideoDesc(e.target.value)}
                                                rows={2}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] shadow-xl shadow-purple-900/20'}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{status}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    <span>Submit Entry</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
