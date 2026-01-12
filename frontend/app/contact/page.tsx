"use client";

import React, { useState, useEffect } from "react";
import ContactContent from "@/components/ContactContent";
import { useTheme } from "@/context/ThemeContext";

export default function ContactPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [stars, setStars] = useState<any[]>([]);

    useEffect(() => {
        const generatedStars = Array.from({ length: 150 }).map((_, i) => {
            const size = Math.random() * 2 + 0.5;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            const opacity = Math.random() * 0.8 + 0.2;

            return {
                id: i,
                size,
                left,
                top,
                delay,
                duration,
                opacity,
            };
        });
        setStars(generatedStars);
    }, []);

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
        <div className={`w-full min-h-full font-['Inter','Montserrat',sans-serif] transition-colors duration-300 relative ${isDarkMode ? "bg-[#0d1117] text-[#e8eefc]" : "bg-[#F6F9FC] text-[#0F172A]"}`}>
            {/* Starry Night Sky Effect - Dark Mode */}
            {isDarkMode && (
                <>
                    <div className="fixed inset-0 pointer-events-none z-0">
                        {stars.map((star) => (
                            <div
                                key={star.id}
                                className="absolute rounded-full bg-white"
                                style={{
                                    width: `${star.size}px`,
                                    height: `${star.size}px`,
                                    left: `${star.left}%`,
                                    top: `${star.top}%`,
                                    opacity: star.opacity,
                                    animation: `twinkle ${star.duration}s ease-in-out infinite`,
                                    animationDelay: `${star.delay}s`,
                                    boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                                }}
                            />
                        ))}
                    </div>
                    <style jsx>{`
                        @keyframes twinkle {
                            0%, 100% {
                                opacity: 0.2;
                                transform: scale(1);
                            }
                            50% {
                                opacity: 1;
                                transform: scale(1.5);
                            }
                        }
                    `}</style>
                </>
            )}

            {/* Simple Light Mode Background (matching Generate page style) */}
            {!isDarkMode && (
                <>
                    <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
                    <div
                        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.03),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.04),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.05),transparent_60%)] animate-[gradient_18s_ease_infinite] opacity-60"
                    />
                    <style jsx>{`
                        @keyframes gradient {
                            0%, 100% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                        }
                    `}</style>
                </>
            )}



            {/* Main Content */}
            <div className="flex-1 min-w-0 relative z-10 pt-20 lg:pt-0">
                <ContactContent
                    isDarkMode={isDarkMode}
                    expandedCards={expandedCards}
                    onToggleCard={toggleCard}
                />
            </div>
        </div>
    );
}
