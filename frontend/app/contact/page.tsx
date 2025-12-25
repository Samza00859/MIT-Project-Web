"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ContactContent from "@/components/ContactContent";

export default function ContactPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const toggleCard = (index: number) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedCards(newExpanded);
    };

    return (
        <div className={`flex min-h-screen w-full font-['Inter','Montserrat',sans-serif] transition-colors duration-300 relative overflow-hidden ${isDarkMode ? "bg-[#0d1117] text-[#e8eefc]" : "bg-gradient-to-br from-[#e0f2fe] via-[#fef3c7] to-[#fce7f3] text-[#0f172a]"}`}>
            {/* Data Stream Background Depth Layer - Dark Mode */}
            {isDarkMode && (
                <>
                    <div className="pointer-events-none absolute inset-0 data-stream-layer" />
                    <div className="pointer-events-none absolute inset-0 data-stream-grid" />
                    <div className="pointer-events-none absolute inset-0 data-stream-lines" />
                    <style jsx>{`
                        .data-stream-layer {
                            background: 
                                radial-gradient(circle at 20% 30%, rgba(45, 244, 198, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 50% 50%, rgba(94, 92, 255, 0.06) 0%, transparent 60%);
                            background-size: 400% 400%;
                            animation: dataStreamMove 25s ease-in-out infinite;
                            opacity: 0.5;
                        }
                        .data-stream-grid {
                            background-image: 
                                repeating-linear-gradient(
                                    0deg,
                                    transparent,
                                    transparent 98px,
                                    rgba(45, 244, 198, 0.03) 98px,
                                    rgba(45, 244, 198, 0.03) 100px
                                ),
                                repeating-linear-gradient(
                                    90deg,
                                    transparent,
                                    transparent 98px,
                                    rgba(56, 189, 248, 0.03) 98px,
                                    rgba(56, 189, 248, 0.03) 100px
                                );
                            animation: dataStreamGridMove 40s linear infinite;
                            opacity: 0.3;
                        }
                        .data-stream-lines {
                            background-image: 
                                linear-gradient(45deg, transparent 30%, rgba(45, 244, 198, 0.1) 50%, transparent 70%),
                                linear-gradient(-45deg, transparent 30%, rgba(56, 189, 248, 0.1) 50%, transparent 70%);
                            background-size: 300% 300%;
                            animation: dataStreamLines 15s ease-in-out infinite;
                            opacity: 0.4;
                        }
                        @keyframes dataStreamMove {
                            0%, 100% {
                                background-position: 0% 0%, 0% 0%, 0% 0%;
                            }
                            33% {
                                background-position: 100% 50%, 50% 100%, 50% 50%;
                            }
                            66% {
                                background-position: 50% 100%, 100% 50%, 100% 0%;
                            }
                        }
                        @keyframes dataStreamGridMove {
                            0% {
                                transform: translate(0, 0);
                            }
                            100% {
                                transform: translate(100px, 100px);
                            }
                        }
                        @keyframes dataStreamLines {
                            0%, 100% {
                                background-position: 0% 0%, 100% 100%;
                            }
                            50% {
                                background-position: 100% 100%, 0% 0%;
                            }
                        }
                    `}</style>
                </>
            )}
            
            {/* Morning Sky Background - Light Mode */}
            {!isDarkMode && (
                <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fef3c7]/60 via-[#fce7f3]/40 to-[#e0f2fe]/50" />
                    <div 
                        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,237,153,0.4),rgba(255,200,87,0.2),transparent_70%)] rounded-full blur-3xl animate-[sunrise_20s_ease_infinite]"
                        style={{ transform: 'translate(-50%, -20%)' }}
                    />
                    <div
                        className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_20%_30%,rgba(255,237,153,0.25),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(255,200,87,0.20),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.15),transparent_60%),radial-gradient(circle_at_10%_70%,rgba(249,168,212,0.18),transparent_55%)] animate-[gradient_18s_ease_infinite] opacity-60"
                    />
                    <style jsx>{`
                        @keyframes gradient {
                            0%, 100% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                        }
                        @keyframes sunrise {
                            0%, 100% { 
                                transform: translate(-50%, -20%) scale(1);
                                opacity: 0.6;
                            }
                            50% { 
                                transform: translate(-50%, -15%) scale(1.1);
                                opacity: 0.8;
                            }
                        }
                    `}</style>
                </>
            )}

            {/* Sidebar */}
            <Sidebar
                activeId="contact"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navItems={[
                    { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
                    { id: "generate", icon: "🌐", label: "Generate", href: "/" },
                    { id: "history", icon: "📜", label: "History", href: "/history" },
                    { id: "contact", icon: "📬", label: "Contact", href: "/contact" },
                    { id: "docs", icon: "📄", label: "View Docs", href: "/view-docs" },
                ]}
            />

            {/* Main Content */}
            <ContactContent
                isDarkMode={isDarkMode}
                expandedCards={expandedCards}
                onToggleCard={toggleCard}
            />
        </div>
    );
}
