"use client";

import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Link from "next/link";


interface DocCardProps {
    title: string;
    description: string;
    buttonText: string;
    buttonColor: "green" | "blue";
    imageIcon?: React.ReactNode;
    href?: string;
    isDarkMode: boolean;
}

const DocCard: React.FC<DocCardProps> = ({ title, description, buttonText, buttonColor, imageIcon, href, isDarkMode }) => {
    const buttonClasses = `mt-2 w-full rounded-md py-2 text-xs font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] ${buttonColor === "green"
        ? "bg-[#00e33d] hover:bg-[#00c936]"
        : "bg-[#0ea5e9] hover:bg-[#0284c7]"
        }`;

    return (
        <div className={`flex flex-col overflow-hidden rounded-2xl border shadow-lg w-full max-w-[380px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? "bg-[#1e2330] border-white/5" : "bg-white border-gray-200"}`}>
            {/* Image Placeholder */}
            <div className={`flex h-52 w-full items-center justify-center ${isDarkMode ? "bg-[#252b3b]" : "bg-gray-100"}`}>
                {imageIcon || (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-10 w-10 text-gray-500"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                    </svg>
                )}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-4 p-6 border-t ${isDarkMode ? "bg-[#212634] border-white/5" : "bg-white border-gray-100"}`}>
                <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {description}
                    </p>
                </div>
                {href ? (
                    <Link href={href} className={`${buttonClasses} block text-center text-sm py-2.5`}>
                        {buttonText}
                    </Link>
                ) : (
                    <button className={`${buttonClasses} text-sm py-2.5`}>
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default function ViewDocsPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111317] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
            <Sidebar
                activeId="docs"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            >
                <div
                    className={`mb-3 flex cursor-pointer select-none items-center gap-2 font-medium text-[#8b94ad] hover:text-[#f8fbff] ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    onClick={() => setIsDebugCollapsed(!isDebugCollapsed)}
                >
                    <span>🐛</span>
                    <span>Debug Panel</span>
                    <button className="ml-auto p-1 text-xs transition-transform">
                        {isDebugCollapsed ? "▶" : "▼"}
                    </button>
                </div>
            </Sidebar >

            <main className="flex-1 flex flex-col px-10 py-8 pb-12 overflow-y-auto h-screen">
                <header className="mb-10">
                    <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>View Docs</h1>
                </header>


                <div className="flex flex-col gap-12">
                    {/* Document & Tutorials Section */}
                    <section className="flex flex-col gap-8 items-center">
                        <h2 className={`text-2xl font-bold self-start px-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Document & Tutorials</h2>
                        <div className="flex flex-wrap gap-8 justify-center w-full">
                            <DocCard
                                title="Document"
                                description="Learn about how to use our website"
                                buttonText="Get Start"
                                buttonColor="green"
                                href="/view-docs/document"
                                isDarkMode={isDarkMode}
                            />
                            <DocCard
                                title="Tutorials"
                                description="Learn about how to use our website"
                                buttonText="Get Start"
                                buttonColor="green"
                                href="/view-docs/tutorials"
                                isDarkMode={isDarkMode}
                            />
                            <DocCard
                                title="Learn about our Agent"
                                description="Learn about how to use our website"
                                buttonText="Get Start"
                                buttonColor="green"
                                href="/view-docs/learn_about"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </section>


                </div>
            </main>
        </div >
    );
}
