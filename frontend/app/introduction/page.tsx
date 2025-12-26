"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/image/Logo.png";
import LogoBlack from "@/image/Logo_black.png";

export default function IntroductionPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([]);
    const [lightParticles, setLightParticles] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number; duration: number }>>([]);
    const cursorTrailRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

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

    // Generate light particles for light mode
    useEffect(() => {
        const generateLightParticles = () => {
            const particleCount = 120;
            const newParticles = [];
            for (let i = 0; i < particleCount; i++) {
                newParticles.push({
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.6 + 0.3,
                    delay: Math.random() * 4,
                    duration: 3 + Math.random() * 3,
                });
            }
            setLightParticles(newParticles);
        };
        generateLightParticles();
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

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

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

            {/* Light Particles for Light Mode */}
            {!isDarkMode && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {lightParticles.map((particle, index) => (
                        <div
                            key={index}
                            className="light-particle"
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                opacity: particle.opacity,
                                animationDelay: `${particle.delay}s`,
                                animationDuration: `${particle.duration}s`,
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

            {/* Wave Animation Background - Light Mode Only */}
            {!isDarkMode && (
                <div className="wave-background-container pointer-events-none absolute inset-0 overflow-hidden">
                    {/* Cursor-following wave layers */}
                    <div 
                        className="wave-layer wave-layer-1"
                        style={{
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                        }}
                    />
                    <div 
                        className="wave-layer wave-layer-2"
                        style={{
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                        }}
                    />
                    <div 
                        className="wave-layer wave-layer-3"
                        style={{
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                        }}
                    />
                    {/* Animated wave SVG */}
                    <svg className="wave-svg absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(37, 99, 235, 0.04)" />
                                <stop offset="50%" stopColor="rgba(56, 189, 248, 0.06)" />
                                <stop offset="100%" stopColor="rgba(37, 99, 235, 0.04)" />
                            </linearGradient>
                            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.03)" />
                                <stop offset="50%" stopColor="rgba(37, 99, 235, 0.05)" />
                                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.03)" />
                            </linearGradient>
                            <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(37, 99, 235, 0.02)" />
                                <stop offset="50%" stopColor="rgba(56, 189, 248, 0.04)" />
                                <stop offset="100%" stopColor="rgba(37, 99, 235, 0.02)" />
                            </linearGradient>
                        </defs>
                        <path 
                            className="wave-path wave-path-1"
                            fill="url(#waveGradient1)"
                            d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,133.3C672,117,768,107,864,112C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                        <path 
                            className="wave-path wave-path-2"
                            fill="url(#waveGradient2)"
                            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,197.3C960,192,1056,192,1152,186.7C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                        <path 
                            className="wave-path wave-path-3"
                            fill="url(#waveGradient3)"
                            d="M0,160L48,170.7C96,181,192,203,288,208C384,213,480,203,576,197.3C672,192,768,192,864,186.7C960,181,1056,171,1152,165.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                    </svg>
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
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(37, 99, 235, 0.08) !important;
                    border: 1px solid rgba(37, 99, 235, 0.1) !important;
                    transition: all 0.3s ease !important;
                    backdrop-filter: blur(10px);
                }
                :global(body[data-theme="light"]) .float-block:hover {
                    background: #FFFFFF !important;
                    color: #0F172A !important;
                    border-color: rgba(37, 99, 235, 0.2) !important;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), 0 10px 15px rgba(37, 99, 235, 0.12) !important;
                    transform: translateY(-2px) !important;
                }
                body[data-theme="light"] .subtitle {
                    color: #64748B;
                }
                /* Wave Animation - Light Mode Only */
                .wave-background-container {
                    z-index: 0;
                }
                .wave-layer {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(37, 99, 235, 0.06), rgba(56, 189, 248, 0.04), transparent 70%);
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    transition: transform 0.2s ease-out;
                    filter: blur(60px);
                    mix-blend-mode: multiply;
                }
                .wave-layer-1 {
                    animation: wavePulse1 4s ease-in-out infinite;
                    width: 600px;
                    height: 600px;
                }
                .wave-layer-2 {
                    animation: wavePulse2 5s ease-in-out infinite 0.5s;
                    opacity: 0.7;
                    width: 450px;
                    height: 450px;
                }
                .wave-layer-3 {
                    animation: wavePulse3 6s ease-in-out infinite 1s;
                    opacity: 0.5;
                    width: 350px;
                    height: 350px;
                }
                .wave-svg {
                    opacity: 0.5;
                    z-index: 1;
                }
                .wave-path {
                    transform-origin: center;
                }
                .wave-path-1 {
                    animation: waveMove1 12s ease-in-out infinite;
                }
                .wave-path-2 {
                    animation: waveMove2 15s ease-in-out infinite 2s;
                }
                .wave-path-3 {
                    animation: waveMove3 18s ease-in-out infinite 4s;
                }
                @keyframes wavePulse1 {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.3);
                        opacity: 0.8;
                    }
                }
                @keyframes wavePulse2 {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 0.7;
                    }
                }
                @keyframes wavePulse3 {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.4;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.15);
                        opacity: 0.6;
                    }
                }
                @keyframes waveMove1 {
                    0%, 100% {
                        transform: translateX(0) translateY(0);
                    }
                    25% {
                        transform: translateX(30px) translateY(-15px);
                    }
                    50% {
                        transform: translateX(0) translateY(-30px);
                    }
                    75% {
                        transform: translateX(-30px) translateY(-15px);
                    }
                }
                @keyframes waveMove2 {
                    0%, 100% {
                        transform: translateX(0) translateY(0);
                    }
                    25% {
                        transform: translateX(-25px) translateY(15px);
                    }
                    50% {
                        transform: translateX(0) translateY(25px);
                    }
                    75% {
                        transform: translateX(25px) translateY(15px);
                    }
                }
                @keyframes waveMove3 {
                    0%, 100% {
                        transform: translateX(0) translateY(0);
                    }
                    25% {
                        transform: translateX(20px) translateY(10px);
                    }
                    50% {
                        transform: translateX(0) translateY(20px);
                    }
                    75% {
                        transform: translateX(-20px) translateY(10px);
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
                /* Light particle animations for light mode */
                @keyframes sparkle {
                    0%, 100% { 
                        opacity: 0.3; 
                        transform: scale(0.8) rotate(0deg); 
                    }
                    50% { 
                        opacity: 0.8; 
                        transform: scale(1.2) rotate(180deg); 
                    }
                }
                .light-particle {
                    position: absolute;
                    background: radial-gradient(circle, rgba(37, 99, 235, 0.4), rgba(56, 189, 248, 0.3), transparent);
                    border-radius: 50%;
                    animation: sparkle 4s ease-in-out infinite;
                    box-shadow: 0 0 6px rgba(37, 99, 235, 0.2);
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
            `}</style>
            {/* Navigation Bar */}
            <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-2">
                    {/* Logo Placeholder */}
                </div>
                <div className="flex gap-4 text-sm font-medium tracking-wide">
                    <Link href="/docs" className={`rounded-full px-7 py-2.5 text-base font-medium transition-all ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-transparent shadow-lg hover:scale-105" : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:shadow-md hover:border-[#2563EB]/30 hover:-translate-y-0.5"}`}>View Docs</Link>
                    <Link href="/contact-public" className={`rounded-full px-7 py-2.5 text-base font-medium transition-all ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-transparent shadow-lg hover:scale-105" : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:shadow-md hover:border-[#2563EB]/30 hover:-translate-y-0.5"}`}>Contact</Link>
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
                            <Link href="/Auth/register" className={`group relative flex w-64 items-center justify-center rounded-full px-12 py-4 text-base font-semibold transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-r from-[#2df4c6] to-[#26f0ff] text-black shadow-[0_0_24px_rgba(45,244,198,0.45)] hover:shadow-[0_0_40px_rgba(45,244,198,0.75)] hover:-translate-y-0.5' : 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/30 hover:-translate-y-1'}`}>
                                <span className="relative z-10">Register</span>
                                <span className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isDarkMode ? 'bg-gradient-to-r from-[#40f9c9] to-[#4bfbff]' : 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]'}`} />
                            </Link>
                            <Link href="/Auth/login" className={`flex w-64 items-center justify-center rounded-full border-2 px-12 py-4 text-base font-semibold transition-all duration-200 ${isDarkMode ? 'border-[#2df4c6]/60 bg-[#2df4c6]/10 text-white hover:border-[#2df4c6] hover:bg-[#2df4c6]/20 shadow-[0_0_24px_rgba(45,244,198,0.4)] hover:shadow-[0_0_40px_rgba(45,244,198,0.6)] hover:-translate-y-0.5' : 'border-[#2563EB] bg-white text-[#2563EB] hover:border-[#2563EB] hover:bg-[#EFF6FF] shadow-md shadow-[#2563EB]/10 hover:shadow-lg hover:shadow-[#2563EB]/20 hover:-translate-y-1'}`}>
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
                        Discover Trading Agents that never stop evolving with Multi-Agents LLM Financial Trading architecture.
                        Our system is not just an ordinary bot, but a network of intelligent Agents that communicate,
                        exchange information, and learn from millions of trading experiences. The collaborative work of these AIs
                        enables your Agents to adapt, develop strategies,
                        and continuously improve profitability in every market condition.
                    </p>
                </div>
            </div>
        </div>
    );
}
