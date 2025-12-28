"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ContactContent from "@/components/ContactContent";
import { useTheme } from "@/context/ThemeContext";

export default function ContactPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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
        <div className={`flex h-screen w-full font-['Inter','Montserrat',sans-serif] transition-colors duration-300 relative overflow-x-hidden overflow-y-auto no-scrollbar ${isDarkMode ? "bg-[#0d1117] text-[#e8eefc]" : "bg-[#F6F9FC] text-[#0F172A]"}`}>
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
            
            {/* Light Mode Background - Enhanced Effects */}
            {!isDarkMode && (
                <>
                    <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
                    <div 
                        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.06),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.07),transparent_60%),radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.05),transparent_50%)] animate-[gradient_18s_ease_infinite] opacity-70 transform-gpu scale-[1.8] origin-center"
                    />
                    {/* Additional shimmer layer */}
                    <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_8s_ease_infinite]" />
                    
                    {/* Floating Gradient Orbs */}
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, index) => {
                            const orbColors = [
                                'rgba(37, 99, 235, 0.10)',
                                'rgba(56, 189, 248, 0.08)',
                                'rgba(99, 102, 241, 0.07)',
                                'rgba(139, 92, 246, 0.06)',
                                'rgba(37, 99, 235, 0.09)',
                                'rgba(14, 165, 233, 0.08)',
                            ];
                            return (
                                <div
                                    key={index}
                                    className={`light-orb light-orb-${index % 3}`}
                                    style={{
                                        left: `${10 + (index * 15) + Math.random() * 10}%`,
                                        top: `${15 + Math.random() * 70}%`,
                                        width: `${280 + Math.random() * 180}px`,
                                        height: `${280 + Math.random() * 180}px`,
                                        background: `radial-gradient(circle, ${orbColors[index % orbColors.length]}, transparent 70%)`,
                                        animationDelay: `${index * 2}s`,
                                        animationDuration: `${18 + Math.random() * 12}s`,
                                        filter: 'blur(40px)',
                                    }}
                                />
                            );
                        })}
                    </div>
                    
                    {/* Animated Light Rays */}
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                        <div className="light-ray light-ray-1" />
                        <div className="light-ray light-ray-2" />
                        <div className="light-ray light-ray-3" />
                    </div>
                    
                    {/* Floating Particles */}
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                        {Array.from({ length: 15 }).map((_, index) => (
                            <div
                                key={`particle-${index}`}
                                className="floating-particle"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${15 + Math.random() * 10}s`,
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Wave Animation */}
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                        <div className="wave-animation wave-1" />
                        <div className="wave-animation wave-2" />
                    </div>
                    
                    {/* Glowing Accent Circles */}
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                        <div className="glow-circle glow-circle-1" />
                        <div className="glow-circle glow-circle-2" />
                    </div>
                    
                    {/* Geometric Grid Background */}
                    <div className="pointer-events-none fixed inset-0 z-0 geometric-grid-container">
                        <div className="geometric-grid" />
                        <div className="accent-line accent-line-1" />
                        <div className="accent-line accent-line-2" />
                    </div>
                    
                    <style jsx>{`
                        @keyframes gradient {
                            0%, 100% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                        }
                        @keyframes shimmer {
                            0% { background-position: -1000px 0; }
                            100% { background-position: 1000px 0; }
                        }
                        
                        /* Floating Gradient Orbs */
                        .light-orb {
                            position: absolute;
                            border-radius: 50%;
                            pointer-events: none;
                            will-change: transform, opacity;
                        }
                        .light-orb-0 {
                            animation: orbFloat0 20s ease-in-out infinite;
                        }
                        .light-orb-1 {
                            animation: orbFloat1 24s ease-in-out infinite;
                        }
                        .light-orb-2 {
                            animation: orbFloat2 22s ease-in-out infinite;
                        }
                        @keyframes orbFloat0 {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.7;
                            }
                            25% {
                                transform: translate(30px, -20px) scale(1.05);
                                opacity: 0.9;
                            }
                            50% {
                                transform: translate(-10px, 25px) scale(0.95);
                                opacity: 0.6;
                            }
                            75% {
                                transform: translate(-25px, -15px) scale(1.02);
                                opacity: 0.8;
                            }
                        }
                        @keyframes orbFloat1 {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.6;
                            }
                            33% {
                                transform: translate(-35px, 20px) scale(1.08);
                                opacity: 0.85;
                            }
                            66% {
                                transform: translate(20px, -30px) scale(0.92);
                                opacity: 0.55;
                            }
                        }
                        @keyframes orbFloat2 {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.65;
                            }
                            50% {
                                transform: translate(25px, 35px) scale(1.1);
                                opacity: 0.85;
                            }
                        }
                        
                        /* Animated Light Rays */
                        .light-ray {
                            position: absolute;
                            width: 2px;
                            height: 100%;
                            background: linear-gradient(
                                to bottom,
                                transparent,
                                rgba(37, 99, 235, 0.12),
                                rgba(56, 189, 248, 0.10),
                                transparent
                            );
                            transform-origin: center;
                            opacity: 0.5;
                            filter: blur(1px);
                        }
                        .light-ray-1 {
                            left: 20%;
                            animation: rayRotate1 25s ease-in-out infinite;
                        }
                        .light-ray-2 {
                            left: 50%;
                            animation: rayRotate2 30s ease-in-out infinite 5s;
                        }
                        .light-ray-3 {
                            left: 80%;
                            animation: rayRotate3 28s ease-in-out infinite 10s;
                        }
                        @keyframes rayRotate1 {
                            0%, 100% {
                                transform: rotate(0deg) translateY(0);
                                opacity: 0.3;
                            }
                            50% {
                                transform: rotate(5deg) translateY(-20px);
                                opacity: 0.7;
                            }
                        }
                        @keyframes rayRotate2 {
                            0%, 100% {
                                transform: rotate(0deg) translateY(0);
                                opacity: 0.25;
                            }
                            50% {
                                transform: rotate(-4deg) translateY(15px);
                                opacity: 0.6;
                            }
                        }
                        @keyframes rayRotate3 {
                            0%, 100% {
                                transform: rotate(0deg) translateY(0);
                                opacity: 0.3;
                            }
                            50% {
                                transform: rotate(3deg) translateY(-10px);
                                opacity: 0.65;
                            }
                        }
                        
                        /* Floating Particles */
                        .floating-particle {
                            position: absolute;
                            width: 3px;
                            height: 3px;
                            background: radial-gradient(circle, rgba(37, 99, 235, 0.5), transparent);
                            border-radius: 50%;
                            pointer-events: none;
                            will-change: transform, opacity;
                            animation: particleFloat ease-in-out infinite;
                        }
                        @keyframes particleFloat {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.3;
                            }
                            25% {
                                transform: translate(20px, -30px) scale(1.2);
                                opacity: 0.5;
                            }
                            50% {
                                transform: translate(-15px, -50px) scale(0.8);
                                opacity: 0.35;
                            }
                            75% {
                                transform: translate(30px, -20px) scale(1.1);
                                opacity: 0.6;
                            }
                        }
                        
                        /* Wave Animation */
                        .wave-animation {
                            position: absolute;
                            width: 100%;
                            height: 200px;
                            background: linear-gradient(
                                90deg,
                                transparent,
                                rgba(37, 99, 235, 0.06),
                                rgba(56, 189, 248, 0.05),
                                transparent
                            );
                            opacity: 0.4;
                            filter: blur(40px);
                        }
                        .wave-1 {
                            top: 10%;
                            animation: waveMove1 20s ease-in-out infinite;
                        }
                        .wave-2 {
                            top: 60%;
                            animation: waveMove2 25s ease-in-out infinite 7s;
                        }
                        @keyframes waveMove1 {
                            0%, 100% {
                                transform: translateX(-100%) scaleY(1);
                                opacity: 0.25;
                            }
                            50% {
                                transform: translateX(100%) scaleY(1.2);
                                opacity: 0.5;
                            }
                        }
                        @keyframes waveMove2 {
                            0%, 100% {
                                transform: translateX(100%) scaleY(1);
                                opacity: 0.2;
                            }
                            50% {
                                transform: translateX(-100%) scaleY(0.9);
                                opacity: 0.45;
                            }
                        }
                        
                        /* Glowing Accent Circles */
                        .glow-circle {
                            position: absolute;
                            border-radius: 50%;
                            pointer-events: none;
                            filter: blur(60px);
                            will-change: transform, opacity;
                        }
                        .glow-circle-1 {
                            width: 400px;
                            height: 400px;
                            background: radial-gradient(circle, rgba(37, 99, 235, 0.10), transparent 70%);
                            top: 5%;
                            left: 5%;
                            animation: glowPulse1 18s ease-in-out infinite;
                        }
                        .glow-circle-2 {
                            width: 350px;
                            height: 350px;
                            background: radial-gradient(circle, rgba(56, 189, 248, 0.08), transparent 70%);
                            bottom: 10%;
                            right: 8%;
                            animation: glowPulse2 22s ease-in-out infinite 6s;
                        }
                        @keyframes glowPulse1 {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.4;
                            }
                            50% {
                                transform: translate(30px, -20px) scale(1.2);
                                opacity: 0.7;
                            }
                        }
                        @keyframes glowPulse2 {
                            0%, 100% {
                                transform: translate(0, 0) scale(1);
                                opacity: 0.35;
                            }
                            50% {
                                transform: translate(-25px, 25px) scale(1.15);
                                opacity: 0.65;
                            }
                        }
                        
                        /* Geometric Grid Background */
                        .geometric-grid-container {
                            z-index: 0;
                        }
                        .geometric-grid {
                            position: absolute;
                            inset: 0;
                            background-image: 
                                linear-gradient(rgba(37, 99, 235, 0.04) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(37, 99, 235, 0.04) 1px, transparent 1px),
                                linear-gradient(rgba(56, 189, 248, 0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(56, 189, 248, 0.02) 1px, transparent 1px);
                            background-size: 60px 60px, 60px 60px, 120px 120px, 120px 120px;
                            opacity: 0.8;
                            animation: gridPulse 15s ease-in-out infinite;
                        }
                        @keyframes gridPulse {
                            0%, 100% {
                                opacity: 0.6;
                            }
                            50% {
                                opacity: 1;
                            }
                        }
                        .accent-line {
                            position: absolute;
                            background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.06), rgba(56, 189, 248, 0.05), transparent);
                            height: 1px;
                            width: 40%;
                            will-change: transform, opacity;
                        }
                        .accent-line-1 {
                            top: 25%;
                            left: 10%;
                            animation: lineSlide1 16s ease-in-out infinite;
                        }
                        .accent-line-2 {
                            top: 65%;
                            right: 5%;
                            width: 35%;
                            animation: lineSlide2 20s ease-in-out infinite 3s;
                        }
                        @keyframes lineSlide1 {
                            0%, 100% {
                                transform: translateX(0);
                                opacity: 0.3;
                            }
                            50% {
                                transform: translateX(60px);
                                opacity: 0.7;
                            }
                        }
                        @keyframes lineSlide2 {
                            0%, 100% {
                                transform: translateX(0);
                                opacity: 0.25;
                            }
                            50% {
                                transform: translateX(-50px);
                                opacity: 0.6;
                            }
                        }
                        
                        /* Accessibility: Reduced motion support */
                        @media (prefers-reduced-motion: reduce) {
                            .light-orb,
                            .light-ray,
                            .floating-particle,
                            .wave-animation,
                            .glow-circle,
                            .geometric-grid,
                            .accent-line {
                                animation: none !important;
                                transition: none !important;
                            }
                            .light-orb {
                                opacity: 0.5 !important;
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
            <div className="flex-1 min-w-0 relative z-10 md:ml-[280px]">
            <ContactContent
                isDarkMode={isDarkMode}
                expandedCards={expandedCards}
                onToggleCard={toggleCard}
            />
            </div>
        </div>
    );
}
