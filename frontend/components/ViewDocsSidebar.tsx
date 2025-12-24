"use client";

import React, { useMemo } from "react";
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';

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
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer font-semibold text-sm transition-colors duration-150 ${
                    isDarkMode
                        ? "text-white hover:text-cyan-400 hover:bg-cyan-500/10"
                        : "text-gray-800 hover:text-cyan-600 hover:bg-cyan-50"
                }`}
                onClick={onToggle}
            >
                <div className="transition-transform duration-200">
                    {isExpanded ? (
                        <ChevronDown size={14} className={isDarkMode ? "text-cyan-400" : "text-cyan-600"} />
                    ) : (
                        <ChevronRight size={14} className={isDarkMode ? "text-zinc-400" : "text-gray-500"} />
                    )}
                </div>
                <span>{category.title}</span>
            </div>

            {/* Sub Items */}
            {isExpanded && (
                <div className={`relative ml-2 pl-4 border-l transition-opacity duration-200 ${isDarkMode ? "border-cyan-500/30" : "border-cyan-400/40"}`}>
                    {category.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`relative py-2 px-2 -ml-4 rounded-lg text-sm cursor-pointer transition-colors duration-150 select-none
                                    ${isActive
                                        ? isDarkMode
                                            ? 'text-cyan-400 font-semibold bg-cyan-500/15 border border-cyan-400/40'
                                            : 'text-cyan-600 font-semibold bg-cyan-100 border border-cyan-400'
                                        : isDarkMode
                                            ? 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/5'
                                            : 'text-gray-800 hover:text-cyan-600 hover:bg-cyan-50'
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
    isDarkMode: boolean;
    activeSection: string;
    expandedCategories: string[];
    readingMode: boolean;
    onToggleCategory: (categoryId: string) => void;
    onSelectItem: (id: string) => void;
    onToggleReadingMode: () => void;
}

export default function ViewDocsSidebar({
    isDarkMode,
    activeSection,
    expandedCategories,
    readingMode,
    onToggleCategory,
    onSelectItem,
    onToggleReadingMode,
}: ViewDocsSidebarProps) {
    // Memoize categories to prevent unnecessary re-renders
    const memoizedCategories = useMemo(() => NAV_STRUCTURE, []);

    return (
        <aside className={`sticky top-0 h-screen w-[280px] shrink-0 flex flex-col pt-8 px-6 border-r hidden md:flex z-40 overflow-y-auto backdrop-blur-xl custom-scrollbar ${
            isDarkMode
                ? "bg-gradient-to-b from-[#1e2330] via-[#232837] to-[#1e2330] border-zinc-600/50"
                : "bg-white border-gray-300"
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    TradingAgent Multi Agent
                </h2>
                {/* Reading Mode Toggle */}
                <button
                    onClick={onToggleReadingMode}
                    className={`p-2 rounded-lg transition-colors duration-150 ${
                        readingMode
                            ? isDarkMode ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600"
                            : isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title="Reading Mode"
                >
                    <Eye size={18} />
                </button>
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

