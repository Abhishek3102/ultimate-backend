"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Certificate from "@/components/arena/Certificate";
import { Loader2 } from "lucide-react";

export default function CertificatePage() {
    const { id } = useParams(); // This is the ArenaEntry ID, not Challenge ID
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // We need a new endpoint to get Entry details + Challenge details by EntryID
    // Let's assume we can fetch it or we add a helper method. 
    // For now, let's fetch leaderboard of the challenge and find the entry? 
    // No, efficient way: GET /arena/entry/:id 

    // I need to add this endpoint to backend Controller first? 
    // Or I can just look it up if I have the challenge context. 
    // Let's create a quick API method `getEntryDetails`

    useEffect(() => {
        const fetchEntry = async () => {
            // Temporary fallback if direct endpoint doesn't exist: 
            // We can't easily get it without an endpoint.
            // I will add `getEntryById` to the controller.
            try {
                const res = await api.getArenaEntry(id);
                if (res.data) setData(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEntry();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <Loader2 className="animate-spin" size={48} />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
            Certificate Not Found
        </div>
    );

    return (
        <div className="min-h-screen bg-black py-20 px-4 flex flex-col items-center">
            <h1 className="text-white text-3xl font-bold mb-10">Digital Artifact</h1>
            <Certificate
                entry={data.entry}
                challenge={data.challenge}
                user={data.user}
            />
        </div>
    );
}
