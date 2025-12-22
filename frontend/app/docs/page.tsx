"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mountain } from 'lucide-react';

export default function DocsPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);

    const docTutorialsSections = [
        {
            id: 'document',
            title: 'Document',
            href: '/view-docs/document',
        },
        {
            id: 'tutorials',
            title: 'Tutorials',
            href: '/view-docs/tutorials',
        },
        {
            id: 'learn-about',
            title: 'Learn about our Agent',
            href: '/view-docs/learn_about',
        },
    ];

    return (
        <div className={`min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111317] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
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

            {/* Main Content */}
            <main className="flex flex-col bg-[#161616] relative min-h-screen min-w-0">
                <div className="px-8 md:px-12 lg:px-16 py-12 max-w-6xl w-full mx-auto pt-24">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            View Docs
                        </h1>
                    </div>

                    {/* Document & Tutorials Section */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Document & Tutorials</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {docTutorialsSections.map((section) => (
                                <Link
                                    key={section.id}
                                    href={section.href}
                                    className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-cyan-500/50 transition-all"
                                >
                                    {/* Placeholder Image */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center">
                                            <Mountain size={40} className="text-zinc-600" />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-white mb-3 text-center">
                                        {section.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 text-center flex-1">
                                        Learn about how to use our website
                                    </p>

                                    {/* Get Start Button */}
                                    <div className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors">
                                        Get Start
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Download Document Section */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-8">Download Document</h2>
                        <div className="max-w-md">
                            <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6 flex flex-col">
                                {/* Placeholder Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        <Mountain size={40} className="text-zinc-600" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-3 text-center">
                                    Download Document
                                </h3>

                                {/* Description */}
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6 text-center flex-1">
                                    Learn about how to use our website
                                </p>

                                {/* Download Button */}
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}













