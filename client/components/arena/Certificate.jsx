"use client";

import React, { useRef } from "react";
import { Trophy, Award, Medal, Share2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Certificate({ entry, challenge, user }) {
    const certRef = useRef(null);

    const downloadPDF = async () => {
        if (!certRef.current) return;

        try {
            await document.fonts.ready;

            // Fixes for PDF rendering:
            // 1. Scale 3 for high res
            // 2. White background
            // 3. No shadows/transparency that confuses html2canvas
            const canvas = await html2canvas(certRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("landscape", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, width, height);
            pdf.save(`Socioverse_Certificate_${(user?.fullName || "Winner").replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("Certificate generation failed", err);
            alert("Could not generate PDF. Please try again.");
        }
    };

    const rankColor = entry.rank === 1 ? "text-yellow-600"
        : entry.rank === 2 ? "text-gray-500"
            : "text-amber-700";

    const winnerName = user?.fullName || user?.username || "Champion";

    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 w-full max-w-lg mx-auto">
            {/* The Certificate Artboard */}
            <div
                ref={certRef}
                className="relative w-[1123px] h-[794px] bg-white text-black p-0 overflow-hidden shadow-2xl flex-shrink-0"
                style={{ fontFamily: "'Times New Roman', serif" }}
            >
                {/* Background - pure white with subtle border */}
                <div className="absolute inset-0 border-[20px] border-double border-gray-100 pointer-events-none z-10" />
                <div className="absolute inset-0 bg-white z-0" />

                {/* Content Container */}
                <div className="relative z-20 h-full flex flex-col p-16 justify-between">

                    {/* Header */}
                    <div className="w-full flex justify-between items-start pt-4">
                        {/* Custom Logo Implementation */}
                        <div className="flex flex-col items-start select-none">
                            <h1 className="text-5xl font-black tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>
                                <span className="text-[#3b82f6]">Socio</span>
                                <span className="text-[#8b5cf6]">Verse</span>
                            </h1>
                            <p className="text-sm font-serif italic text-yellow-600 mt-1 tracking-wide">
                                Where every social world comes together
                            </p>
                        </div>

                        <div className="text-right">
                            <h2 className="text-5xl font-serif font-bold text-gray-900 tracking-wider">CERTIFICATE</h2>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.4em] mt-2 mr-1">Of Excellence</p>
                        </div>
                    </div>

                    {/* Main Presentation */}
                    <div className="flex-1 flex flex-col items-center justify-center -mt-8">
                        <p className="text-gray-500 italic font-serif text-2xl mb-6">This is proudly presented to</p>

                        <div className="relative mb-6 text-center px-12 border-b-2 border-gray-100 pb-6 min-w-[60%]">
                            <h1
                                className={`text-8xl font-bold font-serif capitalize ${rankColor}`}
                                style={{ lineHeight: 1.2 }}
                            >
                                {winnerName}
                            </h1>
                        </div>

                        <p className="text-2xl text-gray-600 mt-4 max-w-4xl text-center leading-relaxed font-serif">
                            For demonstrating exceptional skill and creativity by securing <span className="font-bold text-black uppercase">{entry.rank === 1 ? "1st Place" : entry.rank === 2 ? "2nd Place" : "3rd Place"}</span> in the challenge
                        </p>
                        <h3 className="text-4xl font-bold text-black mt-4">"{challenge.title}"</h3>
                    </div>

                    {/* Footer */}
                    <div className="w-full grid grid-cols-3 items-end gap-12 pb-4">
                        <div className="text-center">
                            <div className="text-3xl font-script text-gray-400 mb-2 opacity-50" style={{ fontFamily: 'cursive' }}>SocioVerse</div>
                            <div className="border-b-2 border-gray-300 mb-2 mx-auto w-48"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Authorized Signature</p>
                        </div>

                        <div className="flex justify-center -mb-8">
                            <div className="relative">
                                <Medal size={130} className={rankColor} strokeWidth={0.8} fill="currentColor" fillOpacity={0.05} />
                                <div className="absolute inset-0 flex items-center justify-center pt-4 font-bold text-gray-700 text-lg">
                                    {new Date().getFullYear()}
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-serif font-bold text-gray-800 mb-2">{new Date().toLocaleDateString()}</div>
                            <div className="border-b-2 border-gray-300 mb-2 mx-auto w-48"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Date Awarded</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all mb-10"
                >
                    <Download size={20} /> Download Official PDF
                </button>
            </div>
        </div >
    );
}
