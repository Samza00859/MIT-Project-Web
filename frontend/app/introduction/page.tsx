"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/image/Logo.png";
import LogoBlack from "@/image/Logo_black.png";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Sun, Moon, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const TRANSLATIONS = {
    en: {
        viewDocs: "View Docs",
        headline: {
            part1: "INTELLIGENT",
            part2: "MULTI-AGENT AI",
            part3: "TRADING SYSTEM"
        },
        subheadline: "Autonomous AI agents that analyze, decide, and execute trades collaboratively — 24/7.",
        cta: {
            generate: "Go to Generate",
            start: "Get Started"
        }
    },
    th: {
        viewDocs: "คู่มือการใช้งาน",
        headline: {
            part1: "ระบบเทรด",
            part2: "MULTI-AGENT AI",
            part3: "อัจฉริยะ"
        },
        subheadline: "Agent AI อัตโนมัติที่ร่วมกันวิเคราะห์ ตัดสินใจ และส่งคำสั่งซื้อขาย — ตลอด 24/7",
        cta: {
            generate: "เริ่มใช้งาน",
            start: "เริ่มต้นใช้งาน"
        }
    }
};

export default function IntroductionPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const { language, toggleLanguage } = useLanguage();
    const [backgroundStars, setBackgroundStars] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number; twinkle: boolean }>>([]);
    const [midStars, setMidStars] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number; twinkle: boolean }>>([]);
    const [foregroundStars, setForegroundStars] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; delay: number; duration: number; twinkle: boolean }>>([]);

    const t = TRANSLATIONS[language];

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate enhanced stars for dark mode with layers (reduced count for performance)
    useEffect(() => {
        const generateStars = () => {
            // Background layer - small stars, slow movement (reduced from 120 to 60)
            const bgStars = [];
            for (let i = 0; i < 80; i++) {
                bgStars.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: 1, // Small stars
                    opacity: Math.random() * 0.2 + 0.4, // 0.4-0.6
                    delay: Math.random() * 5,
                    duration: 55 + Math.random() * 10, // 55-65s (slow)
                    twinkle: Math.random() < 0.15, // 15% twinkle
                });
            }
            setBackgroundStars(bgStars);

            // Mid layer - medium stars, medium movement (reduced from 80 to 40)
            const midStarsList = [];
            for (let i = 0; i < 60; i++) {
                const size = Math.random() < 0.7 ? 1.5 : 2; // Mostly 1.5px, some 2px
                midStarsList.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size,
                    opacity: size === 2 ? Math.random() * 0.2 + 0.6 : Math.random() * 0.2 + 0.6, // 0.6-0.8
                    delay: Math.random() * 5,
                    duration: 40 + Math.random() * 10, // 40-50s (medium)
                    twinkle: Math.random() < 0.2, // 20% twinkle
                });
            }
            setMidStars(midStarsList);

            // Foreground layer - bright stars, faster movement (reduced from 30 to 20)
            const fgStars = [];
            for (let i = 0; i < 40; i++) {
                const size = Math.random() < 0.5 ? 2.5 : 3; // Bright stars
                fgStars.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size,
                    opacity: 0.9, // Very bright
                    delay: Math.random() * 5,
                    duration: 25 + Math.random() * 10, // 25-35s (faster)
                    twinkle: Math.random() < 0.3, // 30% twinkle
                });
            }
            setForegroundStars(fgStars);
        };
        generateStars();
    }, []);

    return (
        <div className={`h-full w-full font-sans overflow-hidden relative ${isDarkMode ? 'bg-[#050B14] text-white' : 'bg-[#F5FAFF] text-[#0F172A]'}`}>
            {/* Dark Mode - Night Sky Background */}
            {isDarkMode && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    {/* Night Sky Gradient */}
                    <div className="night-sky-gradient" />

                    {/* Background Star Layer - Slow Movement */}
                    <div className="star-layer star-layer-bg">
                        {backgroundStars.map((star) => (
                            <div
                                key={`bg-${star.id}`}
                                className={`star star-small ${star.twinkle ? 'star-twinkle' : ''}`}
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

                    {/* Mid Star Layer - Medium Movement */}
                    <div className="star-layer star-layer-mid">
                        {midStars.map((star) => (
                            <div
                                key={`mid-${star.id}`}
                                className={`star star-medium ${star.twinkle ? 'star-twinkle' : ''}`}
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

                    {/* Foreground Star Layer - Fast Movement */}
                    <div className="star-layer star-layer-fg">
                        {foregroundStars.map((star) => (
                            <div
                                key={`fg-${star.id}`}
                                className={`star star-bright ${star.twinkle ? 'star-twinkle' : ''}`}
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

                    {/* Faint Nebula Gradient */}
                    <div className="nebula-gradient" />
                </div>
            )}

            {/* Light Mode - Ocean Waves Background */}
            {!isDarkMode && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                    {/* Ocean Base Gradient */}
                    <div className="ocean-base-gradient" />

                    {/* Wave Layer 1 */}
                    <div className="wave-layer wave-layer-1" />

                    {/* Wave Layer 2 */}
                    <div className="wave-layer wave-layer-2" />

                    {/* Wave Layer 3 */}
                    <div className="wave-layer wave-layer-3" />
                </div>
            )}

            {/* Navigation Bar - Blurred */}
            <nav className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-end px-8 py-4 backdrop-blur-xl border-b ${isDarkMode
                ? 'bg-black/10 border-white/5'
                : 'bg-white/15 border-[#E2E8F0]/20'
                }`}>
                <div className="flex gap-6 items-center">
                    {/* View Docs Link */}
                    <Link
                        href="/docs"
                        className={`text-sm font-medium transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${isDarkMode
                            ? 'text-white/80 hover:text-[#2df4c6] focus-visible:ring-[#2df4c6]'
                            : 'text-[#64748B] hover:text-[#2563EB] focus-visible:ring-[#2563EB]'
                            }`}
                    >
                        {t.viewDocs}
                    </Link>

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${isDarkMode
                            ? 'border-white/20 text-white/80 hover:bg-white/10 hover:border-[#2df4c6] hover:text-[#2df4c6]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-[#2563EB] hover:text-[#2563EB]'
                            }`}
                    >
                        <Languages size={14} />
                        {language === 'en' ? 'TH' : 'EN'}
                    </button>





                    {/* Theme Toggle */}
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={!isDarkMode}
                            onChange={toggleTheme}
                            className="peer sr-only"
                        />
                        <div className={`peer h-6 w-11 rounded-full relative after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 flex items-center justify-between px-1 ${isDarkMode
                            ? 'bg-gray-700 after:border-gray-300 after:bg-white peer-checked:bg-gray-300 peer-checked:after:border-white peer-focus:ring-[#2df4c6]'
                            : 'bg-[#CBD5E1] after:border-[#F1F5F9] after:bg-white peer-checked:bg-[#2563EB] peer-checked:after:border-white peer-focus:ring-[#2563EB]'
                            }`}>
                            <Moon size={12} className={`text-white transition-opacity ${!isDarkMode ? 'opacity-0' : 'opacity-100'} absolute right-1.5`} />
                            <Sun size={12} className={`text-white transition-opacity ${isDarkMode ? 'opacity-0' : 'opacity-100'} absolute left-1.5`} />
                        </div>
                    </label>
                </div>
            </nav>

            {/* Hero Section - Centered */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-40 md:pt-32 md:pb-64">
                <div className="w-full max-w-4xl mx-auto text-center">
                    {/* Logo */}
                    <div className={`mb-0 flex items-center justify-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className={`relative ${isDarkMode ? '' : ''}`}>
                            <Image
                                src={isDarkMode ? Logo : LogoBlack}
                                alt="Trading Agents Logo"
                                width={800}
                                height={300}
                                className="h-auto w-auto object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className={`-mt-12 mb-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                        <span className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>
                            {t.headline.part1}{" "}
                        </span>
                        <span className={`bg-clip-text text-transparent ${isDarkMode
                            ? 'bg-linear-to-r from-[#2df4c6] via-[#26dcb2] to-[#2df4c6]'
                            : 'bg-linear-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB]'
                            }`}>
                            {t.headline.part2}
                        </span>
                        <br />
                        <span className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>
                            {t.headline.part3}
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className={`mb-8 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed transition-all duration-700 ease-out delay-300 ${isDarkMode ? 'text-slate-300/90' : 'text-[#64748B]'} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                        {t.subheadline}
                    </p>

                    {/* CTA Button */}
                    <div className={`flex items-center justify-center mb-20 transition-all duration-700 ease-out delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                        {/* Get Started - Goes to Generate if logged in, otherwise Register */}
                        <Link
                            href={isAuthenticated ? "/" : "/Auth/register"}
                            className={`group relative flex items-center justify-center rounded-full px-10 py-5 text-lg font-medium transform-gpu transition-all duration-300 ease-in-out hover:scale-[1.05] hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDarkMode
                                ? 'bg-linear-to-r from-[#2df4c6] to-[#26dcb2] text-black shadow-md shadow-[#2df4c6]/30 hover:shadow-xl hover:shadow-[#2df4c6]/50 focus-visible:ring-[#2df4c6]'
                                : 'bg-linear-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-md shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/40 focus-visible:ring-[#2563EB]'
                                }`}
                        >
                            <span className="relative z-10">
                                {isAuthenticated ? t.cta.generate : t.cta.start}
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Styles */}
            <style jsx>{`
                /* ==================== DARK MODE - NIGHT SKY (ENHANCED) ==================== */
                .night-sky-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, #030712 0%, #050B14 50%, #0B1C2D 100%);
                    z-index: 0;
                }

                .star-layer {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                }

                .star {
                    position: absolute;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    will-change: transform, opacity;
                }

                /* Small Stars - Background Layer */
                .star-small {
                    background: rgba(255, 255, 255, 0.5);
                    filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
                    animation: starDriftSlow linear infinite;
                }

                /* Medium Stars - Mid Layer */
                .star-medium {
                    background: rgba(255, 255, 255, 0.7);
                    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4));
                    animation: starDriftMid linear infinite;
                }

                /* Bright Stars - Foreground Layer */
                .star-bright {
                    background: rgba(255, 255, 255, 0.9);
                    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2));
                    animation: starDriftFast linear infinite;
                }

                /* Parallax Drift Animations */
                @keyframes starDriftSlow {
                    0% {
                        transform: translate(-50%, -50%) translateY(0) translateX(0);
                    }
                    100% {
                        transform: translate(-50%, -50%) translateY(-15px) translateX(8px);
                    }
                }

                @keyframes starDriftMid {
                    0% {
                        transform: translate(-50%, -50%) translateY(0) translateX(0);
                    }
                    100% {
                        transform: translate(-50%, -50%) translateY(-20px) translateX(12px);
                    }
                }

                @keyframes starDriftFast {
                    0% {
                        transform: translate(-50%, -50%) translateY(0) translateX(0);
                    }
                    100% {
                        transform: translate(-50%, -50%) translateY(-25px) translateX(15px);
                    }
                }

                /* Subtle Twinkle Effect - Applied via inline style delay */
                .star-twinkle {
                    animation: twinkleOpacity 8s ease-in-out infinite;
                }

                /* Combine twinkle with drift for twinkling stars */
                .star-layer-bg .star-twinkle {
                    animation: starDriftSlow linear infinite, twinkleOpacity 8s ease-in-out infinite;
                }

                .star-layer-mid .star-twinkle {
                    animation: starDriftMid linear infinite, twinkleOpacity 8s ease-in-out infinite;
                }

                .star-layer-fg .star-twinkle {
                    animation: starDriftFast linear infinite, twinkleOpacity 8s ease-in-out infinite;
                }

                @keyframes twinkleOpacity {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.65;
                    }
                }

                .nebula-gradient {
                    position: absolute;
                    inset: 0;
                    background: 
                        radial-gradient(
                            ellipse at 20% 30%,
                            rgba(45, 244, 198, 0.04) 0%,
                            transparent 50%
                        ),
                        radial-gradient(
                            ellipse at 80% 70%,
                            rgba(56, 189, 248, 0.03) 0%,
                            transparent 50%
                        ),
                        radial-gradient(
                            ellipse at 50% 50%,
                            rgba(45, 244, 198, 0.02) 0%,
                            transparent 60%
                        );
                    z-index: 1;
                    filter: blur(40px);
                    opacity: 0.6;
                }

                /* ==================== LIGHT MODE - OCEAN WAVES ==================== */
                .ocean-base-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, #F5FAFF 0%, #E0F7FA 50%, #B2EBF2 100%);
                    z-index: 0;
                }

                .wave-layer {
                    position: absolute;
                    inset: 0;
                    background-size: 200% 100%;
                    background-repeat: repeat-x;
                    z-index: 1;
                    opacity: 0.4;
                }

                .wave-layer-1 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(128, 222, 234, 0.3) 25%,
                        rgba(178, 235, 242, 0.2) 50%,
                        rgba(224, 247, 250, 0.3) 75%,
                        transparent 100%
                    );
                    animation: waveFlow1 50s linear infinite;
                }

                .wave-layer-2 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(178, 235, 242, 0.25) 30%,
                        rgba(128, 222, 234, 0.2) 60%,
                        rgba(224, 247, 250, 0.25) 90%,
                        transparent 100%
                    );
                    animation: waveFlow2 60s linear infinite;
                    animation-delay: -10s;
                }

                .wave-layer-3 {
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(224, 247, 250, 0.2) 20%,
                        rgba(178, 235, 242, 0.25) 40%,
                        rgba(128, 222, 234, 0.2) 60%,
                        rgba(178, 235, 242, 0.2) 80%,
                        transparent 100%
                    );
                    animation: waveFlow3 70s linear infinite;
                    animation-delay: -20s;
                }

                @keyframes waveFlow1 {
                    0% {
                        background-position: 0% 0%;
                    }
                    100% {
                        background-position: 200% 0%;
                    }
                }

                @keyframes waveFlow2 {
                    0% {
                        background-position: 0% 0%;
                    }
                    100% {
                        background-position: -200% 0%;
                    }
                }

                @keyframes waveFlow3 {
                    0% {
                        background-position: 0% 0%;
                    }
                    100% {
                        background-position: 200% 0%;
                    }
                }

                /* Accessibility: Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .star,
                    .star-small,
                    .star-medium,
                    .star-bright,
                    .star-twinkle,
                    .wave-layer-1,
                    .wave-layer-2,
                    .wave-layer-3 {
                        animation: none !important;
                    }
                    .star-twinkle::after {
                        animation: none !important;
                    }
                    .star-small {
                        opacity: 0.5 !important;
                    }
                    .star-medium {
                        opacity: 0.6 !important;
                    }
                    .star-bright {
                        opacity: 0.7 !important;
                    }
                    .wave-layer {
                        opacity: 0.2 !important;
                    }
                    /* Disable button transform animations */
                    a[href*="/Auth/register"],
                    a[href*="/view-docs"],
                    a[href*="/contact-public"] {
                        transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s !important;
                    }
                    a[href*="/Auth/register"]:hover,
                    a[href*="/view-docs"]:hover,
                    a[href*="/contact-public"]:hover {
                        transform: none !important;
                    }
                    a[href*="/Auth/register"]:active,
                    a[href*="/view-docs"]:active,
                    a[href*="/contact-public"]:active {
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
