"use client";

import React, { useState, useEffect } from 'react';
import {
    Home,
    Aperture,
    Users,
    FileText,
    Menu,
    LineChart,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// --- 1. Content Data (Consolidated from sub-pages) ---
const SECTIONS = [
    {
        id: 'introduction',
        title: 'Introduction',
        content: (
            <div className="space-y-3 opacity-60">
                <SkeletonLine width="100%" />
                <SkeletonLine width="92%" />
                <SkeletonLine width="98%" />
                <SkeletonLine width="45%" />
                <div className="h-4"></div>
                <SkeletonLine width="95%" />
                <SkeletonLine width="60%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="88%" />
                <SkeletonLine width="94%" />
                <SkeletonLine width="30%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="90%" />
            </div>
        )
    },
    {
        id: 'related-work',
        title: 'Related Work',
        content: (
            <div className="space-y-3 opacity-60">
                <SkeletonLine width="100%" />
                <SkeletonLine width="92%" />
                <SkeletonLine width="98%" />
                <SkeletonLine width="45%" />
                <div className="h-4"></div>
                <SkeletonLine width="95%" />
                <SkeletonLine width="60%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="88%" />
                <SkeletonLine width="94%" />
                <SkeletonLine width="30%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="90%" />
            </div>
        )
    },
    {
        id: 'role-specialization',
        title: 'Role Specialization',
        content: (
            <div className="space-y-3 opacity-60">
                <SkeletonLine width="100%" />
                <SkeletonLine width="92%" />
                <SkeletonLine width="98%" />
                <SkeletonLine width="45%" />
                <div className="h-4"></div>
                <SkeletonLine width="95%" />
                <SkeletonLine width="60%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="88%" />
                <SkeletonLine width="94%" />
                <SkeletonLine width="30%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="90%" />
            </div>
        )
    },
    {
        id: 'agent-workflow',
        title: 'Agent Workflow',
        content: (
            <div className="space-y-3 opacity-60">
                <SkeletonLine width="100%" />
                <SkeletonLine width="92%" />
                <SkeletonLine width="98%" />
                <SkeletonLine width="45%" />
                <div className="h-4"></div>
                <SkeletonLine width="95%" />
                <SkeletonLine width="60%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="88%" />
                <SkeletonLine width="94%" />
                <SkeletonLine width="30%" />
                <div className="h-4"></div>
                <SkeletonLine width="100%" />
                <SkeletonLine width="90%" />
            </div>
        )
    },
];

import Sidebar from '@/components/Sidebar';

export default function DashboardDocumentPage() {
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // --- 2. Scroll Spy Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200; // Offset

            for (const section of SECTIONS) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section.id);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#111317] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
            {/* ================= LEFT SIDEBAR (Global) ================= */}
            <Sidebar
                activeId="docs"
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navItems={[
                    { id: "intro", icon: "👋", label: "Intro", href: "/introduction" },
                    { id: "generate", icon: "🌐", label: "Generate", href: "/" },
                    { id: "contact", icon: "📬", label: "Contact", href: "/dashboard/contact" },
                    { id: "docs", icon: "📄", label: "View Docs", href: "/dashboard/view-docs" },
                ]}
            >
                <div
                    className="mb-3 flex cursor-pointer select-none items-center gap-2 font-medium text-[#8b94ad] hover:text-[#f8fbff]"
                    onClick={() => setIsDebugCollapsed(!isDebugCollapsed)}
                >
                </div>
            </Sidebar>

            {/* ================= MIDDLE SIDEBAR (Menu) ================= */}
            <aside className="sticky top-0 h-screen w-[280px] shrink-0 bg-[#161616] flex flex-col pt-24 px-8 border-r border-zinc-800/50 hidden md:flex z-40 overflow-y-auto custom-scrollbar">
                <h2 className="text-sm font-bold text-gray-100 mb-6 tracking-wide uppercase text-zinc-400">
                    TradingAgent Multi Agent
                </h2>

                <div className="relative flex flex-col gap-4 pl-2">
                    {/* Main Hierarchy Line */}
                    <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-zinc-800"></div>

                    {SECTIONS.map((section) => (
                        <MenuItem
                            key={section.id}
                            label={section.title}
                            active={activeSection === section.id}
                            onClick={() => scrollToSection(section.id)}
                        />
                    ))}
                </div>
            </aside>

            {/* ================= MAIN CONTENT (Scrollable) ================= */}
            <main className="flex-1 flex flex-col bg-[#161616] relative min-h-screen min-w-0">

                {/* Sticky Header / Breadcrumb */}
                <div className="sticky top-0 bg-[#161616]/90 backdrop-blur-sm pt-8 pb-4 px-12 z-30 border-b border-zinc-800/30 flex items-center gap-4">
                    <Link href="/dashboard/view-docs" className="text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <p className="text-zinc-500 font-medium text-sm">
                        View Docs / <span className="text-white">Document</span>
                    </p>
                </div>

                <div className="px-12 max-w-4xl w-full pb-40 pt-8">
                    <h1 className="text-4xl font-bold text-white mb-16 tracking-tight">
                        TradingAgent Multi Agent
                    </h1>

                    {/* Loop Render Sections */}
                    <div className="flex flex-col gap-24">
                        {SECTIONS.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-32 animate-in fade-in duration-700">

                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="text-cyan-400">#</span> {section.title}
                                </h2>

                                {/* Content */}
                                <div className="text-zinc-400 leading-relaxed text-lg mb-8">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>

                </div>

            </main>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function NavIcon({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
    return (
        <div className={`cursor-pointer p-2.5 rounded-xl transition-all duration-200 relative ${active ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>
            {active && (<div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full"></div>)}
            {icon}
        </div>
    );
}

function MenuItem({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`relative pl-6 py-2 text-sm cursor-pointer transition-all duration-200 select-none group
      ${active ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}>

            {/* Active Indicator Line */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] bg-white rounded-full transition-all duration-300
        ${active ? 'h-5 opacity-100' : 'h-0 opacity-0'}`}></div>

            {label}
        </div>
    );
}

function SkeletonLine({ width }: { width: string }) {
    return (
        <div className="h-[6px] bg-zinc-600 rounded-full animate-pulse" style={{ width: width }}></div>
    );
}

