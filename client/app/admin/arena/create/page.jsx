"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Swords, Calendar, Image as ImageIcon, Type, Award, Save } from "lucide-react";

export default function CreateChallengePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "image",
        startDate: "",
        endDate: "",
        banner: "",
        badgeName: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.title || !formData.endDate) {
            alert("Title and End Date are required!");
            setLoading(false);
            return;
        }

        try {
            await api.createChallenge(formData);
            alert("Challenge Created Successfully! ⚔️");
            router.push("/arena"); // Go to Arena to see it
        } catch (error) {
            console.error("Creation failed", error);
            alert("Failed to create challenge. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Swords className="text-purple-500" />
                    Create New Challenge
                </h1>
                <p className="text-gray-400">Launch a new battle for the community.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-sm">

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Challenge Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Best Sunset Photography"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Explain the rules and what to submit..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                    />
                </div>

                {/* Grid for details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Type size={16} /> Submission Type
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                        >
                            <option value="image" className="bg-gray-900">Image Upload</option>
                            <option value="video" className="bg-gray-900">Video Upload</option>
                            <option value="text" className="bg-gray-900">Text / Code</option>
                        </select>
                    </div>

                    {/* Badge */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Award size={16} /> Reward Badge Name
                        </label>
                        <input
                            type="text"
                            name="badgeName"
                            value={formData.badgeName}
                            onChange={handleChange}
                            placeholder="e.g. Sunset Chaser"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> Start Date
                        </label>
                        <input
                            type="datetime-local"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar size={16} /> End Date
                        </label>
                        <input
                            type="datetime-local"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Banner URL (Temporary until file upload is strictly enforced) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <ImageIcon size={16} /> Banner Image URL
                    </label>
                    <input
                        type="text"
                        name="banner"
                        value={formData.banner}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <p className="text-xs text-gray-500">Provide an Unsplash URL for now.</p>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-purple-900/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : (
                            <>
                                <Save size={20} />
                                Compute Challenge
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
