"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Image from "next/image";

export default function IntroductionPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const router = useRouter();

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div
            className={`min-h-screen w-full transition-colors duration-500 ${isDarkMode ? "bg-[#111111] text-white" : "bg-[#f0f0f0] text-gray-900"
                } font-sans overflow-hidden`}
        >
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

            <div className="grid h-screen w-full grid-cols-1 lg:grid-cols-[40%_60%]">
                {/* Left Section */}
                <div className={`relative flex flex-col justify-center px-8 lg:px-12 ${isDarkMode ? "bg-[#111111]" : "bg-[#f0f0f0]"}`}>
                    <div className="mx-auto w-full max-w-md flex flex-col justify-center h-full">
                        {/* Header */}
                        <div className="mb-12">
                            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                                Trading Agents
                            </h1>
                            <p className={`mt-2 text-lg ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                                Multi-Agents LLM Financial Trading
                            </p>
                        </div>

                        {/* Feature Bubbles */}
                        <div className="relative flex flex-col gap-6 py-8">
                            {/* Bubble 1 */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white" : "border-gray-300 bg-white text-gray-900"
                                }`}>
                                AI Market Analysis
                            </div>

                            {/* Bubble 2 - Indented */}
                            <div className={`ml-16 w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white" : "border-gray-300 bg-white text-gray-900"
                                }`}>
                                Autonomous Execution
                            </div>

                            {/* Bubble 3 */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white" : "border-gray-300 bg-white text-gray-900"
                                }`}>
                                Risk Management
                            </div>

                            {/* Bubble 4 - Indented */}
                            <div className={`ml-24 w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white" : "border-gray-300 bg-white text-gray-900"
                                }`}>
                                Backtesting Engine
                            </div>

                            {/* Bubble 5 */}
                            <div className={`w-fit rounded-full border px-6 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode ? "border-gray-700 bg-[#1a1a1a] text-white" : "border-gray-300 bg-white text-gray-900"
                                }`}>
                                Supported Markets
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-12 flex flex-col gap-4 sm:w-64">
                            <Link href="/Auth/register" className="flex items-center justify-center rounded-full bg-[#2df4c6] px-8 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(45,244,198,0.3)] transition-all hover:bg-[#26dcb2] hover:shadow-[0_0_30px_rgba(45,244,198,0.5)]">
                                Register
                            </Link>
                            <Link href="/Auth/login" className="flex items-center justify-center rounded-full bg-[white] px-8 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(45,244,198,0.3)] transition-all hover:bg-[white] hover:shadow-[0_0_30px_rgba(45,244,198,0.5)]">
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <div className="absolute bottom-8 left-12">
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
                    <div className="relative mb-12 flex h-64 w-64 items-center justify-center">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 animate-pulse rounded-full bg-[#2df4c6] opacity-20 blur-3xl"></div>

                        {/* Rings */}
                        <div className="absolute h-full w-full rounded-full border border-[#2df4c6]/30"></div>
                        <div className="absolute h-[80%] w-[80%] rounded-full border border-[#2df4c6]/50"></div>
                        <div className="absolute h-[60%] w-[60%] rounded-full border border-[#2df4c6]/70"></div>

                        {/* Center Icon/Chart */}
                        <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm overflow-hidden">
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
                    <h2 className="mb-6 text-3xl font-bold leading-tight md:text-4xl">
                        Elevate Your Trading with Intelligent AI<br />
                        Multi-Agents LLM Financial Trading
                    </h2>

                    <p className={`max-w-lg text-lg leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
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
