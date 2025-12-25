"use client";

import React from "react";
import { ChevronDown, Mail, Phone, MessageCircle } from "lucide-react";

interface ContactContentProps {
    isDarkMode: boolean;
    expandedCards: Set<number>;
    onToggleCard: (index: number) => void;
}

export default function ContactContent({
    isDarkMode,
    expandedCards,
    onToggleCard,
}: ContactContentProps) {
    const contacts = [
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
    ];

    return (
        <main className="flex-1 p-6 md:p-10 lg:p-14 pt-20">
            <header className="mb-8 space-y-2">
                <h1 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Contact Us</h1>
                <p className={`text-sm md:text-base leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Connect with our team for partnerships, support, or product questions. We respond quickly.
                </p>
            </header>

            <section className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                {/* Contacts list */}
                <div className="flex flex-col gap-5">
                    {contacts.map((contact, index) => {
                        const isExpanded = expandedCards.has(index);
                        return (
                            <article
                                key={index}
                                className={`group flex flex-col gap-5 rounded-2xl p-6 md:p-7 transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.12)] cursor-pointer ${isDarkMode 
                                    ? "bg-[#131722] border border-white/5 hover:border-[#2df4c6]/40" 
                                    : "bg-white/80 backdrop-blur-sm border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 shadow-[0_20px_60px_rgba(245,158,11,0.1)]"
                                }`}
                                onClick={() => onToggleCard(index)}
                            >
                                {/* Top Section */}
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`h-16 w-16 flex-shrink-0 rounded-2xl ${isDarkMode ? "bg-white/10" : "bg-gray-100"} shadow-inner`} />
                                        <div className={`flex flex-col gap-1 text-sm tracking-wide flex-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                            <p className="font-semibold text-base">{contact.name}</p>
                                            <p>{contact.company}</p>
                                            <p className={`text-xs uppercase tracking-widest ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>{contact.position}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2 text-xs">
                                            <span className={`rounded-full px-3 py-1 ${isDarkMode ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#f59e0b]/15 text-[#d97706] border border-[#f59e0b]/30"}`}>
                                                Responsive
                                            </span>
                                            <span className={`rounded-full px-3 py-1 ${isDarkMode ? "bg-white/5 text-gray-300" : "bg-white/80 text-gray-700 border border-[#f59e0b]/20"}`}>
                                                Multi-channel
                                            </span>
                                        </div>
                                        <ChevronDown 
                                            size={20} 
                                            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}
                                        />
                                    </div>
                                </div>

                                {/* Details - Collapsible */}
                                <div 
                                    className={`grid grid-cols-1 gap-3 md:grid-cols-3 overflow-hidden transition-all duration-500 ease-in-out ${
                                        isExpanded 
                                            ? "max-h-[500px] opacity-100 mt-2" 
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    {[
                                        { label: contact.email, value: "____________________", icon: Mail },
                                        { label: contact.phone, value: "____________________", icon: Phone },
                                        { label: contact.other, value: "____________________", icon: MessageCircle },
                                    ].map((detail, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col gap-2 rounded-xl p-4 transition ${isDarkMode
                                                ? "bg-[#0f131c] border border-white/5"
                                                : "bg-white/80 backdrop-blur-sm border border-[#f59e0b]/30 hover:border-[#f59e0b]/50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <detail.icon size={16} className={isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"} />
                                                <span className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                                                    {detail.label}
                                                </span>
                                            </div>
                                            <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                {detail.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Quick contact panel */}
                <aside className={`rounded-2xl p-6 md:p-7 shadow-[0_14px_40px_rgba(0,0,0,0.12)] flex flex-col gap-5 ${isDarkMode ? "bg-[#131722] border border-white/5" : "bg-white/80 backdrop-blur-sm border border-[#f59e0b]/30 shadow-[0_20px_60px_rgba(245,158,11,0.1)]"}`}>
                    <div>
                        <p className={`text-xs font-semibold tracking-[0.08em] uppercase ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>Need help fast?</p>
                        <h3 className={`mt-2 text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Talk to us</h3>
                        <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-700"}`}>
                            Reach out via your preferred channel. We aim to respond within one business day.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 text-sm">
                        <a className={`group flex items-center justify-between rounded-xl border px-4 py-3 transition ${isDarkMode ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50" : "border-[#f59e0b]/30 bg-white/80 hover:border-[#f59e0b]/50"}`} href="mailto:support@tradingagents.ai">
                            <span className={isDarkMode ? "text-white" : "text-slate-800"}>support@tradingagents.ai</span>
                            <span className={`text-xs ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>Email</span>
                        </a>
                        <a className={`group flex items-center justify-between rounded-xl border px-4 py-3 transition ${isDarkMode ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50" : "border-[#f59e0b]/30 bg-white/80 hover:border-[#f59e0b]/50"}`} href="https://t.me/TradingAgentsBot" target="_blank">
                            <span className={isDarkMode ? "text-white" : "text-slate-800"}>@TradingAgentsBot</span>
                            <span className={`text-xs ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>Telegram</span>
                        </a>
                        <a className={`group flex items-center justify-between rounded-xl border px-4 py-3 transition ${isDarkMode ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50" : "border-[#f59e0b]/30 bg-white/80 hover:border-[#f59e0b]/50"}`} href="https://www.linkedin.com" target="_blank">
                            <span className={isDarkMode ? "text-white" : "text-slate-800"}>LinkedIn</span>
                            <span className={`text-xs ${isDarkMode ? "text-[#2df4c6]" : "text-[#d97706]"}`}>Connect</span>
                        </a>
                    </div>
                    <div className="mt-auto">
                        <button className={`w-full rounded-xl px-5 py-3 font-semibold transition transform hover:-translate-y-0.5 ${isDarkMode
                            ? "bg-[#2df4c6]/15 text-white border border-[#2df4c6]/40 hover:shadow-[0_10px_30px_rgba(45,244,198,0.25)]"
                            : "bg-gradient-to-r from-[#f59e0b] to-[#ec4899] text-white shadow-[0_12px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.5)]"
                        }`}>
                            Book a call
                        </button>
                    </div>
                </aside>
            </section>
        </main>
    );
}

