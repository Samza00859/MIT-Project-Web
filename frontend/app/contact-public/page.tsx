"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Linkedin, Phone, User, Building2, Briefcase } from "lucide-react";

export default function ContactPublicPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

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

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-animate-id');
                    if (id) {
                        setVisibleElements(prev => new Set([...prev, id]));
                    }
                }
            });
        }, observerOptions);

        // Observe all animated elements
        const elements = document.querySelectorAll('[data-animate-id]');
        elements.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className={`min-h-screen w-full font-['Inter','Montserrat',sans-serif] transition-colors duration-300 relative overflow-hidden ${isDarkMode ? "bg-[#0a0d14] text-[#f8fbff]" : "bg-[#F6F9FC] text-[#0F172A]"}`}>
            {/* Animated Gradient Background */}
            {isDarkMode && <div className="pointer-events-none absolute inset-0 animated-gradient-bg" />}
            
            {/* Animated Background Pattern */}
            <div className="pointer-events-none absolute inset-0">
                {isDarkMode ? (
                    <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_20%_30%,rgba(45,244,198,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.08),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(94,92,255,0.06),transparent_60%)] animate-[gradient_20s_ease_infinite] opacity-30" />
                ) : (
                    <>
                        {/* Light Mode Background - Subtle blue gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
                        <div 
                            className="absolute inset-[-40%] bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.03),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.04),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.05),transparent_60%)] animate-[gradient_20s_ease_infinite] opacity-60"
                        />
                    </>
                )}
            </div>
            
            {/* Background Depth Layer */}
            <div className="bg-depth pointer-events-none fixed inset-0 z-0" />
            <style jsx>{`
                .animated-gradient-bg {
                    background: linear-gradient(
                        135deg,
                        #10b981 0%,
                        #2dd4bf 25%,
                        #38bdf8 50%,
                        #3b82f6 75%,
                        #1e40af 100%
                    );
                    background-size: 400% 400%;
                    animation: gradient-shift 15s ease infinite;
                    opacity: 0.15;
                }
                @keyframes gradient-shift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                @keyframes gradient {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-2%, -2%) scale(1.05); }
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(45, 244, 198, 0.1); }
                    50% { box-shadow: 0 0 30px rgba(45, 244, 198, 0.2); }
                }
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes iconBounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-4px) rotate(-5deg); }
                    75% { transform: translateY(-4px) rotate(5deg); }
                }
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                @keyframes floatBg {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-5%, -5%) scale(1.1); }
                }
                .bg-depth {
                    z-index: 0;
                }
                .bg-depth::before {
                    content: "";
                    position: fixed;
                    inset: -20%;
                    background:
                        radial-gradient(circle at 30% 20%, rgba(0,255,200,.08), transparent 45%),
                        radial-gradient(circle at 70% 80%, rgba(0,150,255,.06), transparent 50%);
                    animation: floatBg 20s ease-in-out infinite;
                    z-index: -1;
                }
                .card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-6px) !important;
                    box-shadow:
                        0 20px 40px rgba(0,0,0,.4),
                        0 0 20px rgba(0,255,200,.15) !important;
                }
                .animate-slide-in {
                    animation: slideInUp 0.6s ease-out forwards;
                }
                .animate-icon-bounce {
                    animation: iconBounce 2s ease-in-out infinite;
                }
                .shimmer {
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    background-size: 1000px 100%;
                    animation: shimmer 3s infinite;
                }
            `}</style>
            
            {/* Navigation Bar */}
            <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center px-8 py-6 backdrop-blur-sm bg-black/5">
                <div className="flex items-center gap-4 text-sm font-medium tracking-wide">
                    {/* Home */}
                    <Link
                        href="/introduction"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_10px_30px_rgba(15,23,42,0.55)] ${
                            isDarkMode
                                ? "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:border-[#2563EB]/30 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                    >
                        Home
                    </Link>
                    {/* View Docs */}
                    <Link
                        href="/docs"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_10px_30px_rgba(15,23,42,0.55)] ${
                            isDarkMode
                                ? "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                : "bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm border border-[#E2E8F0] hover:border-[#2563EB]/30 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                    >
                        View Docs
                    </Link>
                    {/* Contact (active) */}
                    <Link
                        href="/contact-public"
                        className={`rounded-full px-6 py-2 transition-all hover:-translate-y-0.5 hover:scale-105 ${
                            isDarkMode
                                ? "bg-[#2df4c6] text-black border border-[#2df4c6] shadow-[0_16px_40px_rgba(45,244,198,0.4)] hover:shadow-[0_20px_50px_rgba(45,244,198,0.55)]"
                                : "bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white border border-[#2563EB] shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/30"
                        }`}
                    >
                        Contact
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 lg:p-14 pt-32">
                <div className="max-w-7xl mx-auto">
                    <header 
                        className={`mt-6 mb-12 space-y-4 relative transition-all duration-700 ease-out ${
                            visibleElements.has('header') 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-8'
                        }`}
                        data-animate-id="header"
                    >
                        <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${isDarkMode ? "from-white via-[#2df4c6] to-white" : "from-[#0F172A] via-[#2563EB] to-[#0F172A]"} bg-clip-text text-transparent`}>
                            Contact Us
                        </h1>
                        <p className={`text-base md:text-lg leading-relaxed max-w-2xl ${isDarkMode ? "text-gray-300" : "text-[#64748B]"}`}>
                            Connect with our team for partnerships, support, or product questions. 
                            We respond quickly.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                        {/* Contacts list */}
                        <div className="flex flex-col gap-6">
                            {contacts.map((contact, index) => (
                                <article
                                    key={index}
                                    data-animate-id={`contact-${index}`}
                                    className={`card group relative flex flex-col gap-6 rounded-3xl p-7 md:p-8 transition-all duration-700 ease-out backdrop-blur-sm ${
                                        visibleElements.has(`contact-${index}`)
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-12'
                                    } ${isDarkMode 
                                        ? "bg-gradient-to-br from-[#131722]/90 to-[#0f131c]/90 border border-white/10 hover:border-[#2df4c6]/50 shadow-[0_20px_60px_rgba(0,0,0,0.3)]" 
                                        : "bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 shadow-lg"
                                    }`}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    {/* Glow effect on hover */}
                                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${isDarkMode ? "bg-[#2df4c6]/10" : "bg-[#2563EB]/8"}`} />
                                    
                                    {/* Top Section */}
                                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isDarkMode ? "bg-gradient-to-br from-[#2df4c6]/20 to-[#2df4c6]/5" : "bg-gradient-to-br from-[#2563EB]/20 to-[#38BDF8]/15"} shadow-lg`}>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <User size={32} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                                </div>
                                                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            </div>
                                            <div className={`flex flex-col gap-2 text-sm tracking-wide ${isDarkMode ? "text-gray-200" : "text-[#334155]"}`}>
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                                                    <User size={14} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                                    <p className="font-bold text-lg">{contact.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 delay-75">
                                                    <Building2 size={14} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-gray-400" : "text-[#64748B]"}`} />
                                                    <p className="text-base">{contact.company}</p>
                                                </div>
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 delay-150">
                                                    <Briefcase size={14} className={`transition-all duration-300 group-hover:scale-125 animate-icon-bounce ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                                    <p className={`text-sm uppercase tracking-widest font-semibold ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`}>{contact.position}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <span className={`rounded-full px-4 py-1.5 font-semibold transition-all duration-300 hover:scale-110 ${isDarkMode ? "bg-[#2df4c6]/15 text-[#2df4c6] border border-[#2df4c6]/30" : "bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/40 shadow-sm"}`}>
                                                Responsive
                                            </span>
                                            <span className={`rounded-full px-4 py-1.5 font-semibold transition-all duration-300 hover:scale-110 ${isDarkMode ? "bg-white/10 text-gray-300 border border-white/20" : "bg-white text-[#334155] border border-[#E2E8F0] shadow-sm"}`}>
                                                Multi-channel
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 relative z-10">
                                        {[
                                            { label: contact.email, value: "____________________", icon: Mail },
                                            { label: contact.phone, value: "____________________", icon: Phone },
                                            { label: contact.other, value: "____________________", icon: MessageCircle },
                                        ].map((detail, idx) => (
                                            <div
                                                key={idx}
                                                className={`group/detail flex flex-col gap-3 rounded-xl p-5 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1 ${isDarkMode
                                                    ? "bg-[#0f131c]/80 border border-white/10 hover:border-[#2df4c6]/40 hover:bg-[#0f131c]"
                                                    : "bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] shadow-sm"
                                                    }`}
                                                style={{ transitionDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <detail.icon size={16} className={`transition-all duration-300 group-hover/detail:rotate-12 group-hover/detail:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-[#64748B]"}`}>
                                                        {detail.label}
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-[#64748B]"}`}>
                                                    {detail.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Quick contact panel */}
                        <aside 
                            data-animate-id="quick-contact"
                            className={`relative rounded-3xl p-7 md:p-8 shadow-2xl flex flex-col gap-6 backdrop-blur-sm transition-all duration-700 ease-out ${
                                visibleElements.has('quick-contact')
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 translate-x-8'
                            } ${isDarkMode 
                                ? "bg-gradient-to-br from-[#131722]/90 to-[#0f131c]/90 border border-white/10" 
                                : "bg-white border border-[#E2E8F0] shadow-lg"
                            }`}
                            style={{ transitionDelay: '300ms' }}
                        >
                            {/* Animated background glow */}
                            <div className={`absolute inset-0 rounded-3xl opacity-50 animate-pulse-glow ${isDarkMode ? "bg-[#2df4c6]/5" : "bg-[#2563EB]/6"}`} />
                            
                            <div className="relative z-10">
                                <p className={`text-xs font-bold tracking-[0.1em] uppercase mb-2 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`}>
                                    Need help fast?
                                </p>
                                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>Talk to us</h3>
                                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-300" : "text-[#64748B]"}`}>
                                    Reach out via your preferred channel. We aim to respond within one business day.
                                </p>
                            </div>
                            
                            <div className="flex flex-col gap-3 text-sm relative z-10">
                                <a 
                                    className={`group flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${isDarkMode 
                                        ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50 hover:bg-white/10" 
                                        : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] shadow-sm"
                                    }`} 
                                    href="mailto:support@tradingagents.ai"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isDarkMode ? "bg-[#2df4c6]/10 group-hover:bg-[#2df4c6]/20" : "bg-[#EFF6FF] group-hover:bg-[#DBEAFE]"}`}>
                                            <Mail size={18} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                        </div>
                                        <span className={`font-medium transition-all duration-300 group-hover:translate-x-1 ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>support@tradingagents.ai</span>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#EFF6FF] text-[#2563EB]"}`}>Email</span>
                                </a>
                                <a 
                                    className={`group flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${isDarkMode 
                                        ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50 hover:bg-white/10" 
                                        : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] shadow-sm"
                                    }`} 
                                    href="https://t.me/TradingAgentsBot" 
                                    target="_blank"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isDarkMode ? "bg-[#2df4c6]/10 group-hover:bg-[#2df4c6]/20" : "bg-[#EFF6FF] group-hover:bg-[#DBEAFE]"}`}>
                                            <MessageCircle size={18} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                        </div>
                                        <span className={`font-medium transition-all duration-300 group-hover:translate-x-1 ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>@TradingAgentsBot</span>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#EFF6FF] text-[#2563EB]"}`}>Telegram</span>
                                </a>
                                <a 
                                    className={`group flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${isDarkMode 
                                        ? "border-white/10 bg-white/5 hover:border-[#2df4c6]/50 hover:bg-white/10" 
                                        : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] shadow-sm"
                                    }`} 
                                    href="https://www.linkedin.com" 
                                    target="_blank"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isDarkMode ? "bg-[#2df4c6]/10 group-hover:bg-[#2df4c6]/20" : "bg-[#EFF6FF] group-hover:bg-[#DBEAFE]"}`}>
                                            <Linkedin size={18} className={`transition-all duration-300 group-hover:scale-125 ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`} />
                                        </div>
                                        <span className={`font-medium transition-all duration-300 group-hover:translate-x-1 ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>LinkedIn</span>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#EFF6FF] text-[#2563EB]"}`}>Connect</span>
                                </a>
                            </div>
                            
                            <div className="mt-auto relative z-10">
                                <button className={`w-full rounded-xl px-6 py-4 font-bold text-base transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${isDarkMode
                                    ? "bg-gradient-to-r from-[#2df4c6]/20 to-[#2df4c6]/10 text-white border-2 border-[#2df4c6]/40 hover:border-[#2df4c6] hover:shadow-[0_0_30px_rgba(45,244,198,0.4)]"
                                    : "bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/30"
                                    }`}>
                                    Book a call
                                </button>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>
        </div>
    );
}
















