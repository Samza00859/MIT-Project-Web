"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/image/Logo.png";
import LogoBlack from "@/image/Logo_black.png";
import { useTheme } from "@/context/ThemeContext";

export default function IntroductionPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([]);
    const [floatingOrbs, setFloatingOrbs] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number; duration: number; color: string }>>([]);
    const cursorTrailRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate stars
    useEffect(() => {
        const generateStars = () => {
            const starCount = 150;
            const newStars = [];
            for (let i = 0; i < starCount; i++) {
                newStars.push({
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 2 + 0.5,
                    opacity: Math.random() * 0.8 + 0.2,
                    delay: Math.random() * 3,
                    duration: 2 + Math.random() * 2,
                });
            }
            setStars(newStars);
        };
        generateStars();
    }, []);

    // Generate floating orbs for light mode
    useEffect(() => {
        const generateFloatingOrbs = () => {
            const orbColors = [
                'rgba(37, 99, 235, 0.08)',   // Blue
                'rgba(56, 189, 248, 0.06)',  // Sky blue
                'rgba(99, 102, 241, 0.05)',  // Indigo
                'rgba(139, 92, 246, 0.04)', // Violet
                'rgba(37, 99, 235, 0.06)',   // Blue lighter
                'rgba(14, 165, 233, 0.05)',  // Cyan
            ];
            const orbCount = 6;
            const newOrbs = [];
            for (let i = 0; i < orbCount; i++) {
                newOrbs.push({
                    x: 10 + (i * 15) + Math.random() * 10,
                    y: 15 + Math.random() * 70,
                    size: 280 + Math.random() * 180,
                    opacity: 0.6 + Math.random() * 0.4,
                    delay: i * 2,
                    duration: 18 + Math.random() * 12,
                    color: orbColors[i % orbColors.length],
                });
            }
            setFloatingOrbs(newOrbs);
        };
        generateFloatingOrbs();
    }, []);

    // Mouse movement effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            
            // Create cursor trail particles
            if (cursorTrailRef.current) {
                const particle = document.createElement('div');
                particle.className = 'cursor-particle';
                particle.style.left = `${e.clientX}px`;
                particle.style.top = `${e.clientY}px`;
                cursorTrailRef.current.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    particle.remove();
                }, 1000);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className={`min-h-screen w-full font-sans overflow-hidden relative ${isDarkMode ? 'bg-gradient-to-b from-[#050811] via-[#050811] to-[#101522] text-white' : 'bg-[#F6F9FC] text-[#0F172A]'}`}>
            {/* Animated Background Pattern */}
            <div className="pointer-events-none absolute inset-0">
                {isDarkMode ? (
                    <div
                        className="absolute inset-[-40%] bg-[radial-gradient(circle_at_10%_20%,rgba(45,244,198,0.10),transparent_55%),radial-gradient(circle_at_80%_0,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(94,92,255,0.18),transparent_60%)] animate-[gradient_18s_ease_infinite] opacity-40"
                    />
                ) : (
                    <>
                        {/* Light Mode Background - Subtle blue gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
                        <div
                            className="absolute inset-[-40%] bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.03),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.04),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.05),transparent_60%)] animate-[gradient_18s_ease_infinite] opacity-60"
                        />
                    </>
                )}
            </div>

            {/* Night Star Field */}
            {isDarkMode && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {stars.map((star, index) => (
                        <div
                            key={index}
                            className="star"
                            style={{
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                opacity: star.opacity,
                                animationDelay: `${star.delay}s`,
                                animationDuration: `${star.duration}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Floating Gradient Orbs for Light Mode */}
            {!isDarkMode && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {floatingOrbs.map((orb, index) => (
                        <div
                            key={index}
                            className={`floating-orb floating-orb-${index % 3}`}
                            style={{
                                left: `${orb.x}%`,
                                top: `${orb.y}%`,
                                width: `${orb.size}px`,
                                height: `${orb.size}px`,
                                background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
                                animationDelay: `${orb.delay}s`,
                                animationDuration: `${orb.duration}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Cursor Trail Container */}
            <div ref={cursorTrailRef} className="cursor-trail-container" />

            {/* Cursor Glow Effect */}
            <div
                className={`cursor-glow ${isDarkMode ? 'cursor-glow-dark' : 'cursor-glow-light'}`}
                style={{
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                }}
            />

            {/* Geometric Grid Background - Light Mode Only */}
            {!isDarkMode && (
                <div className="geometric-grid-container pointer-events-none absolute inset-0 overflow-hidden">
                    {/* Subtle grid pattern */}
                    <div className="geometric-grid" />
                    {/* Animated accent lines */}
                    <div className="accent-line accent-line-1" />
                    <div className="accent-line accent-line-2" />
                    <div className="accent-line accent-line-3" />
                </div>
            )}

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
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-slow-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes floatX {
                    0%   { transform: translateX(-6px); }
                    50%  { transform: translateX(6px); }
                    100% { transform: translateX(-6px); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .animate-spin-slow-reverse {
                    animation: spin-slow-reverse 10s linear infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                .feature-column {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    align-items: stretch;
                    width: 100%;
                    position: relative;
                }
                .float-block {
                    min-width: 240px;
                    max-width: 280px;
                    padding: 14px 22px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    color: #fff;
                    cursor: pointer;
                    animation: floatX 5s ease-in-out infinite;
                    transition: background 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
                    text-align: center;
                }
                .float-block:hover {
                    background: rgba(0, 255, 200, 0.18);
                    transform: scale(1.05) !important;
                }
                .float-block.left {
                    align-self: flex-start;
                    margin-left: -20px;
                    margin-right: auto;
                }
                .float-block.right {
                    align-self: flex-end;
                    margin-left: auto;
                    margin-right: -20px;
                    animation-direction: reverse;
                }
                .float-block:nth-child(odd) {
                    animation-delay: 0.6s;
                }
                .float-block:nth-child(even) {
                    animation-delay: 1.2s;
                }
                /* =========================
                   LIGHT MODE
                ========================= */
                body[data-theme="light"] {
                    background: #F6F9FC;
                    color: #334155;
                }
                body[data-theme="light"] h1,
                body[data-theme="light"] h2 {
                    color: #0F172A;
                }
                body[data-theme="light"] .bg-gradient-to-r {
                    background-image: linear-gradient(to right, #2563EB, #38BDF8);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                :global(body[data-theme="light"]) .float-block {
                    background: #FFFFFF !important;
                    color: #0F172A !important;
                    box-shadow: 
                        0 1px 3px rgba(0, 0, 0, 0.06),
                        0 1px 2px rgba(0, 0, 0, 0.04),
                        0 4px 6px rgba(37, 99, 235, 0.06) !important;
                    border: 1px solid rgba(37, 99, 235, 0.08) !important;
                    transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out !important;
                    will-change: transform;
                }
                :global(body[data-theme="light"]) .float-block:hover {
                    background: #FFFFFF !important;
                    color: #0F172A !important;
                    border-color: rgba(37, 99, 235, 0.15) !important;
                    box-shadow: 
                        0 4px 8px rgba(0, 0, 0, 0.06),
                        0 2px 4px rgba(0, 0, 0, 0.03),
                        0 12px 20px -4px rgba(37, 99, 235, 0.1) !important;
                    transform: translateY(-2px) !important;
                }
                body[data-theme="light"] .subtitle {
                    color: #64748B;
                }
                /* Floating Gradient Orbs - Light Mode */
                .floating-orb {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    will-change: transform, opacity;
                }
                .floating-orb-0 {
                    animation: orbFloat0 20s ease-in-out infinite;
                }
                .floating-orb-1 {
                    animation: orbFloat1 24s ease-in-out infinite;
                }
                .floating-orb-2 {
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
                
                /* Geometric Grid Background - Light Mode */
                .geometric-grid-container {
                    z-index: 0;
                }
                .geometric-grid {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(37, 99, 235, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                    opacity: 0.8;
                }
                .accent-line {
                    position: absolute;
                    background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.08), rgba(56, 189, 248, 0.06), transparent);
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
                    top: 55%;
                    right: 5%;
                    width: 35%;
                    animation: lineSlide2 20s ease-in-out infinite 3s;
                }
                .accent-line-3 {
                    top: 80%;
                    left: 20%;
                    width: 25%;
                    animation: lineSlide3 18s ease-in-out infinite 6s;
                }
                @keyframes lineSlide1 {
                    0%, 100% {
                        transform: translateX(0);
                        opacity: 0.4;
                    }
                    50% {
                        transform: translateX(60px);
                        opacity: 0.8;
                    }
                }
                @keyframes lineSlide2 {
                    0%, 100% {
                        transform: translateX(0);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translateX(-50px);
                        opacity: 0.7;
                    }
                }
                @keyframes lineSlide3 {
                    0%, 100% {
                        transform: translateX(0);
                        opacity: 0.35;
                    }
                    50% {
                        transform: translateX(40px);
                        opacity: 0.65;
                    }
                }
                
                /* Animated Wave Background - Light Mode Only */
                .wave-animation-container {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    height: 350px;
                    z-index: 0;
                    overflow: hidden;
                    clip-path: inset(0 0 0 0);
                }
                .wave-svg {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    will-change: transform;
                    overflow: hidden;
                }
                .wave-svg-1 {
                    animation: waveFloat1 12s ease-in-out infinite;
                }
                .wave-svg-2 {
                    animation: waveFloat2 15s ease-in-out infinite 1.5s;
                    opacity: 0.9;
                }
                .wave-svg-3 {
                    animation: waveFloat3 18s ease-in-out infinite 3s;
                    opacity: 0.8;
                }
                @keyframes waveFloat1 {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-25px);
                    }
                }
                @keyframes waveFloat2 {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                @keyframes waveFloat3 {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }
                /* Star animations */
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle 3s ease-in-out infinite;
                }
                /* Cursor trail particles */
                .cursor-particle {
                    position: fixed;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    transform: translate(-50%, -50%);
                    animation: particleFade 1s ease-out forwards;
                }
                body[data-theme="dark"] .cursor-particle {
                    background: radial-gradient(circle, rgba(45, 244, 198, 0.8), rgba(45, 244, 198, 0));
                }
                body[data-theme="light"] .cursor-particle {
                    background: radial-gradient(circle, rgba(37, 99, 235, 0.8), rgba(56, 189, 248, 0.6), transparent);
                }
                @keyframes particleFade {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0) translateY(-20px);
                    }
                }
                /* Cursor glow effect */
                .cursor-glow {
                    position: fixed;
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9998;
                    transform: translate(-50%, -50%);
                    transition: opacity 0.3s ease;
                }
                .cursor-glow-dark {
                    background: radial-gradient(circle, rgba(45, 244, 198, 0.1), transparent 70%);
                }
                .cursor-glow-light {
                    background: radial-gradient(circle, rgba(37, 99, 235, 0.08), rgba(56, 189, 248, 0.05), transparent 70%);
                }
                .cursor-trail-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                    overflow: hidden;
                }
                
                /* Accessibility: Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .float-block,
                    .star,
                    .floating-orb,
                    .cursor-particle,
                    .accent-line,
                    .wave-svg {
                        animation: none !important;
                        transition: none !important;
                    }
                    .floating-orb {
                        opacity: 0.5 !important;
                    }
                    .wave-svg {
                        opacity: 0.4 !important;
                    }
                    .cursor-glow,
                    .cursor-trail-container {
                        display: none !important;
                    }
                }
            `}</style>
            {/* Navigation Bar */}
            <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-2">
                    {/* Logo Placeholder */}
                </div>
                <div className="flex gap-4 text-sm font-medium tracking-wide">
                    <Link href="/docs" className={`btn-interact btn-secondary-light rounded-full px-7 py-2.5 text-base font-medium ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-transparent shadow-lg hover:scale-105" : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:border-[#2563EB]/30"}`}>View Docs</Link>
                    <Link href="/contact-public" className={`btn-interact btn-secondary-light rounded-full px-7 py-2.5 text-base font-medium ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-transparent shadow-lg hover:scale-105" : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:border-[#2563EB]/30"}`}>Contact</Link>
                </div>
            </nav>

            <div className="relative z-10 grid h-screen w-full grid-cols-1 lg:grid-cols-[30%_70%]">
                {/* Left Section */}
                <div className={`relative flex flex-col justify-start px-6 pt-16 pb-16 lg:px-10 ${isDarkMode
                    ? "bg-gradient-to-b from-[#0f1216]/40 to-[#141922]/50 backdrop-blur-2xl"
                    : "bg-[#F1F5F9] border-r border-[#E2E8F0]"
                    }`}>
                    <div className="mx-auto w-full max-w-sm flex flex-col h-full items-stretch">
                        {/* Header */}
                        <div className={`mb-10 text-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
                            <h1 className={`text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl ${isDarkMode ? 'bg-gradient-to-r from-[#2df4c6] to-[#26dcb2] bg-clip-text text-transparent' : 'text-[#0F172A]'}`}>
                                Trading Agents
                            </h1>
                            <p className={`subtitle mt-3 text-sm md:text-base leading-relaxed transition-all duration-700 ease-out delay-150 ${isDarkMode ? 'text-slate-300/80' : 'text-[#64748B]'} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                Multi-Agents LLM Financial Trading
                            </p>
                        </div>

                        {/* Feature floating list */}
                        <div className="feature-column py-6 w-full overflow-visible">
                            <div className="float-block left">AI Market Analysis</div>
                            <div className="float-block right">Autonomous Execution</div>
                            <div className="float-block left">Risk Management</div>
                            <div className="float-block right">Backtesting Engine</div>
                            <div className="float-block left">Supported Markets</div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`mt-14 flex flex-col gap-3 items-center transition-all duration-700 ease-out delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                            <Link href="/Auth/register" className={`btn-primary-light group relative flex w-64 items-center justify-center rounded-full px-12 py-4 text-base font-semibold ${isDarkMode ? 'bg-gradient-to-r from-[#2df4c6] to-[#26f0ff] text-black shadow-[0_0_24px_rgba(45,244,198,0.45)] hover:shadow-[0_0_40px_rgba(45,244,198,0.75)] hover:-translate-y-0.5 transition-all duration-200' : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-lg shadow-[#2563EB]/25'}`}>
                                <span className="relative z-10">Register</span>
                                <span className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isDarkMode ? 'bg-gradient-to-r from-[#40f9c9] to-[#4bfbff]' : 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]'}`} />
                            </Link>
                            <Link href="/Auth/login" className={`btn-secondary-light flex w-64 items-center justify-center rounded-full border-2 px-12 py-4 text-base font-semibold ${isDarkMode ? 'border-[#2df4c6]/60 bg-[#2df4c6]/10 text-white hover:border-[#2df4c6] hover:bg-[#2df4c6]/20 shadow-[0_0_24px_rgba(45,244,198,0.4)] hover:shadow-[0_0_40px_rgba(45,244,198,0.6)] hover:-translate-y-0.5 transition-all duration-200' : 'border-[#2563EB] bg-white text-[#2563EB] hover:bg-[#EFF6FF] shadow-md shadow-[#2563EB]/10'}`}>
                                <span className="relative z-10">Login</span>
                            </Link>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" checked={!isDarkMode} onChange={toggleTheme} className="peer sr-only" />
                            <div className={`peer h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 ${isDarkMode ? 'bg-gray-700 after:border-gray-300 after:bg-white peer-checked:bg-gray-300 peer-checked:after:border-white peer-focus:ring-[#2df4c6]' : 'bg-[#CBD5E1] after:border-[#F1F5F9] after:bg-white peer-checked:bg-[#2563EB] peer-checked:after:border-white peer-focus:ring-[#2563EB]'}`}></div>
                            <span className={`ml-3 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-[#64748B]"}`}>
                                {isDarkMode ? "Dark Mode" : "Light Mode"}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Right Section */}
                <div className={`relative flex flex-col items-center justify-center px-8 py-20 text-center lg:px-20 ${isDarkMode ? "bg-transparent" : "bg-gradient-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]"
                    }`}>
                    {/* Animated Wave Background - Light Mode Only */}
                    {!isDarkMode && (
                        <div className="wave-animation-container pointer-events-none">
                            <svg className="wave-svg wave-svg-1" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path 
                                    fill="rgba(37, 99, 235, 0.25)"
                                    d="M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,197.3C672,192,768,192,864,197.3C960,203,1056,213,1152,213.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                />
                            </svg>
                            <svg className="wave-svg wave-svg-2" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path 
                                    fill="rgba(56, 189, 248, 0.22)"
                                    d="M0,224L48,218.7C96,213,192,203,288,197.3C384,192,480,192,576,197.3C672,203,768,213,864,213.3C960,213,1056,203,1152,197.3C1248,192,1344,192,1392,197.3L1440,203L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                />
                            </svg>
                            <svg className="wave-svg wave-svg-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path 
                                    fill="rgba(37, 99, 235, 0.18)"
                                    d="M0,256L48,250.7C96,245,192,235,288,229.3C384,224,480,224,576,229.3C672,235,768,245,864,245C960,245,1056,235,1152,229.3C1248,224,1344,224,1392,229.3L1440,235L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                />
                            </svg>
                        </div>
                    )}
                    {/* Logo with subtle glow accent */}
                    <div className={`relative mb-4 flex items-center justify-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className={`pointer-events-none absolute -inset-x-16 -inset-y-8 rounded-[32px] blur-3xl ${isDarkMode ? 'bg-gradient-to-r from-[#2df4c6]/10 via-transparent to-[#26dcb2]/10' : 'bg-gradient-to-r from-[#2563EB]/5 via-transparent to-[#38BDF8]/5'}`} />
                        <div className={`relative rounded-[28px] inline-block ${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`}>
                            <Image
                                src={isDarkMode ? Logo : LogoBlack}
                                alt="Trading Agents Logo"
                                width={640}
                                height={240}
                                className="h-auto w-auto object-contain block"
                                priority
                            />
                        </div>
                    </div>

                    {/* Hero Text */}
                    <h2 className={`mb-5 max-w-2xl text-2xl font-semibold leading-snug md:text-3xl lg:text-4xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} text-balance`}>
                        Elevate Your Trading with Intelligent AI<br />
                        <span className={`bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-[#2df4c6] to-[#26dcb2]' : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8]'}`}>Multi-Agents LLM Financial Trading</span>
                    </h2>

                    <p className={`max-w-xl text-sm md:text-base leading-relaxed transition-all duration-700 ease-out delay-300 ${isDarkMode ? 'text-slate-300/85' : 'text-[#334155]'} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} text-balance`}>
                        Multi-Agent LLM Trading is a network of intelligent AI agents that communicate and learn together from vast trading experience, continuously adapting strategies to improve profitability in all market conditions.
                    </p>
                </div>
            </div>
        </div>
    );
}

