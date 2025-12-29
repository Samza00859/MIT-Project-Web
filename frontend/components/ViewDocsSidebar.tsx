"use client";

import React, { useMemo } from "react";
import { ChevronRight, ChevronDown } from 'lucide-react';

// --- Navigation Data Structure ---
interface NavSubItem {
    id: string;
    title: string;
}

interface NavCategory {
    id: string;
    title: string;
    items: NavSubItem[];
}

export const NAV_STRUCTURE: NavCategory[] = [
    {
        id: 'document',
        title: 'Document',
        items: [
            { id: 'introduction', title: 'Introduction' },
            { id: 'related-work', title: 'Related Work' },
            { id: 'role-specialization', title: 'TradingAgents: Role Specialization' },
            { id: 'agent-workflow', title: 'TradingAgents: Agent Workflow' },
        ]
    },
    {
        id: 'tutorials',
        title: 'Tutorials',
        items: [
            { id: 'start-analysis', title: 'Starting an analysis' },
            { id: 'understanding-reports', title: 'Understanding Report' },
            { id: 'telegram-alerts', title: 'Connecting Telegram Alert' },
            { id: 'exporting-pdf', title: 'Exporting Report to PDF' },
        ]
    },
    {
        id: 'our-agent',
        title: 'Our Agent',
        items: [
            { id: 'analyst-team', title: 'Analyst Team' },
            { id: 'research-team', title: 'Research Team' },
            { id: 'trader-team', title: 'Trader Team' },
            { id: 'risk-team', title: 'Risk Team' },
            { id: 'manager-team', title: 'Manager Team' },
        ]
    }
];

// --- Navigation Item Component ---
const NavMenuItem = React.memo(function NavMenuItem({
    category,
    isExpanded,
    onToggle,
    activeSection,
    onSelectItem,
    isDarkMode
}: {
    category: NavCategory;
    isExpanded: boolean;
    onToggle: () => void;
    activeSection: string;
    onSelectItem: (id: string) => void;
    isDarkMode: boolean;
}) {
    const isItemActive = useMemo(() => {
        return category.items.some(item => item.id === activeSection);
    }, [category.items, activeSection]);

    return (
        <div className="mb-2">
            {/* Category Header */}
            <div
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer font-semibold text-sm transition-colors ${isDarkMode
                    ? 'text-white hover:text-cyan-400 hover:bg-cyan-500/10'
                    : 'text-[#0F172A] hover:text-[#2563EB] hover:bg-[#EFF6FF]'
                    }`}
                onClick={onToggle}
            >
                <div>
                    {isExpanded ? (
                        <ChevronDown size={14} className={isDarkMode ? "text-cyan-400" : "text-[#2563EB]"} />
                    ) : (
                        <ChevronRight size={14} className={isDarkMode ? "text-zinc-400" : "text-gray-600"} />
                    )}
                </div>
                <span>{category.title}</span>
            </div>

            {/* Sub Items */}
            {isExpanded && (
                <div className={`relative ml-2 pl-4 border-l ${isDarkMode ? 'border-cyan-500/30' : 'border-[#2563EB]/30'}`}>
                    {category.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`relative py-2 px-2 -ml-4 rounded-lg text-sm cursor-pointer select-none transition-colors ${isActive
                                    ? isDarkMode
                                        ? 'text-cyan-400 font-semibold bg-cyan-500/15 border border-cyan-400/40'
                                        : 'text-[#2563EB] font-semibold bg-[#EFF6FF] border border-[#2563EB]/40'
                                    : isDarkMode
                                        ? 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/5'
                                        : 'text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF]'
                                    }`}
                                onClick={() => onSelectItem(item.id)}
                            >
                                {item.title}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

interface ViewDocsSidebarProps {
    activeSection: string;
    expandedCategories: string[];
    onToggleCategory: (categoryId: string) => void;
    onSelectItem: (id: string) => void;
    isDarkMode?: boolean;
}

export default function ViewDocsSidebar({
    activeSection,
    expandedCategories,
    onToggleCategory,
    onSelectItem,
    isDarkMode = true,
}: ViewDocsSidebarProps) {
    // Memoize categories to prevent unnecessary re-renders
    const memoizedCategories = useMemo(() => NAV_STRUCTURE, []);

    return (
        <aside className={`sticky top-0 w-[280px] shrink-0 flex flex-col pt-20 px-6 border-r hidden md:flex z-40 max-h-screen overflow-y-auto backdrop-blur-xl custom-scrollbar ${isDarkMode ? 'bg-[#020617]/80 border-white/10' : 'bg-white/80 border-[#E2E8F0]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                    TradingAgent Multi Agent
                </h2>
            </div>

            {/* Navigation Tree */}
            <nav className="flex flex-col pb-20">
                {memoizedCategories.map((category) => (
                    <NavMenuItem
                        key={category.id}
                        category={category}
                        isExpanded={expandedCategories.includes(category.id)}
                        onToggle={() => onToggleCategory(category.id)}
                        activeSection={activeSection}
                        onSelectItem={onSelectItem}
                        isDarkMode={isDarkMode}
                    />
                ))}
            </nav>
        </aside>
    );
}