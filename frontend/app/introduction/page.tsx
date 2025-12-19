"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Image from "next/image";

export default function IntroductionPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div
            className={`min-h-screen w-full transition-colors duration-500 ${isDarkMode ? "bg-[#111111] text-white" : "bg-[#f0f0f0] text-gray-900"
                } font-sans overflow-hidden relative`}
        >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, #2df4c6 0%, transparent 50%),
                                    radial-gradient(circle at 80% 80%, #2df4c6 0%, transparent 50%),
                                    radial-gradient(circle at 40% 20%, #2df4c6 0%, transparent 50%)`,
                    backgroundSize: '200% 200%',
                    animation: 'gradient 15s ease infinite'
                }}></div>
            </div>
            <style jsx>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
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
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .animate-spin-slow-reverse {
                    animation: spin-slow-reverse 10s linear infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
            {/* Navigation Bar */}
            <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-2">
                    {/* Logo Placeholder */}
                </div>
                <div className="flex gap-4 text-sm font-medium tracking-wide">
                    <Link href="/docs" className={`rounded-full px-6 py-2 transition-all hover:scale-105 ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525]" : "bg-white text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200"
                        }`}>View Docs</Link>
                    <Link href="/contact-public" className={`rounded-full px-6 py-2 transition-all hover:scale-105 ${isDarkMode ? "bg-[#1a1a1a] text-white hover:bg-[#252525]" : "bg-white text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200"
                        }`}>Contact</Link>
                </div>
            </nav>

            <div className="grid h-screen w-full grid-cols-1 lg:grid-cols-[30%_70%]">
                {/* Left Section */}
                <div className={`relative flex flex-col justify-center px-6 lg:px-8 ${isDarkMode ? "bg-[#111111]" : "bg-[#f0f0f0]"}`}>
                    <div className="mx-auto w-full max-w-sm flex flex-col justify-center h-full items-center">
                        {/* Header */}
                        <div className={`mb-12 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <h1 className="text-4xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-[#2df4c6] to-[#26dcb2] bg-clip-text text-transparent animate-pulse">
                                Trading Agents
                            </h1>
                            <p className={`mt-2 text-lg transition-all duration-1000 delay-200 ${isDarkMode ? "text-gray-500" : "text-gray-600"} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                Multi-Agents LLM Financial Trading
                            </p>
                        </div>

                        {/* Feature Bubbles */}
                        <div className="relative flex flex-col gap-4 py-8 w-full">
                            {/* Bubble 1 - Left */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-[#2df4c6]/50 hover:shadow-xl self-start ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white hover:border-[#2df4c6]" : "border-gray-300 bg-white text-gray-900 hover:border-[#2df4c6]"
                                }`} style={{ transitionDelay: '300ms' }}>
                                AI Market Analysis
                            </div>

                            {/* Bubble 2 - Right */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-[#2df4c6]/50 hover:shadow-xl self-end ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white hover:border-[#2df4c6]" : "border-gray-300 bg-white text-gray-900 hover:border-[#2df4c6]"
                                }`} style={{ transitionDelay: '400ms' }}>
                                Autonomous Execution
                            </div>

                            {/* Bubble 3 - Left */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-[#2df4c6]/50 hover:shadow-xl self-start ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white hover:border-[#2df4c6]" : "border-gray-300 bg-white text-gray-900 hover:border-[#2df4c6]"
                                }`} style={{ transitionDelay: '500ms' }}>
                                Risk Management
                            </div>

                            {/* Bubble 4 - Right */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-[#2df4c6]/50 hover:shadow-xl self-end ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white hover:border-[#2df4c6]" : "border-gray-300 bg-white text-gray-900 hover:border-[#2df4c6]"
                                }`} style={{ transitionDelay: '600ms' }}>
                                Backtesting Engine
                            </div>

                            {/* Bubble 5 - Left */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-[#2df4c6]/50 hover:shadow-xl self-start ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white hover:border-[#2df4c6]" : "border-gray-300 bg-white text-gray-900 hover:border-[#2df4c6]"
                                }`} style={{ transitionDelay: '700ms' }}>
                                Supported Markets
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`mt-12 flex flex-col gap-4 w-full max-w-xs items-center transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <Link href="/Auth/register" className="flex items-center justify-center rounded-full bg-[#2df4c6] px-8 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(45,244,198,0.3)] transition-all duration-300 hover:bg-[#26dcb2] hover:shadow-[0_0_30px_rgba(45,244,198,0.5)] hover:scale-105 w-full relative overflow-hidden group">
                                <span className="relative z-10">Register</span>
                                <span className="absolute inset-0 bg-gradient-to-r from-[#26dcb2] to-[#2df4c6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            </Link>
                            <Link href="/Auth/login" className="flex items-center justify-center rounded-full bg-[white] px-8 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(45,244,198,0.3)] transition-all duration-300 hover:bg-gray-50 hover:shadow-[0_0_30px_rgba(45,244,198,0.5)] hover:scale-105 w-full border-2 border-transparent hover:border-[#2df4c6]">
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" checked={!isDarkMode} onChange={toggleTheme} className="peer sr-only" />
                            <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2df4c6]"></div>
                            <span className={`ml-3 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                                {isDarkMode ? "Dark Mode" : "Light Mode"}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Right Section */}
                <div className={`relative flex flex-col items-center justify-center px-12 text-center lg:px-20 ${isDarkMode ? "bg-[#0c0c0c]" : "bg-[#e5e5e5]"
                    }`}>
                    {/* Circular Graphic */}
                    <div className={`relative mb-12 flex h-64 w-64 items-center justify-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                        {/* Outer Glow */}
                        <div className="absolute inset-0 animate-pulse rounded-full bg-[#2df4c6] opacity-20 blur-3xl"></div>
                        <div className="absolute inset-0 animate-ping rounded-full bg-[#2df4c6] opacity-10"></div>

                        {/* Rotating Rings */}
                        <div className="absolute h-full w-full rounded-full border border-[#2df4c6]/30 animate-spin-slow"></div>
                        <div className="absolute h-[80%] w-[80%] rounded-full border border-[#2df4c6]/50 animate-spin-slow-reverse" style={{ animationDuration: '8s' }}></div>
                        <div className="absolute h-[60%] w-[60%] rounded-full border border-[#2df4c6]/70"></div>

                        {/* Center Icon/Chart */}
                        <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm overflow-hidden hover:scale-110 transition-transform duration-300 animate-bounce-slow">
                            <Image
                                src="/Logo.png"
                                alt="Trading Agents Logo"
                                width={200}
                                height={200}
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Hero Text */}
                    <h2 className={`mb-6 text-3xl font-bold leading-relaxed md:text-4xl transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} text-balance`}>
                        Elevate Your Trading with Intelligent AI<br />
                        <span className="bg-gradient-to-r from-[#2df4c6] to-[#26dcb2] bg-clip-text text-transparent">Multi-Agents LLM Financial Trading</span>
                    </h2>

                    <p className={`max-w-lg text-lg leading-relaxed transition-all duration-1000 delay-500 text-balance ${isDarkMode ? "text-gray-400" : "text-gray-600"} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
