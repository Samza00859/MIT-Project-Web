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
    onSelectItem
}: {
    category: NavCategory;
    isExpanded: boolean;
    onToggle: () => void;
    activeSection: string;
    onSelectItem: (id: string) => void;
}) {
    const isItemActive = useMemo(() => {
        return category.items.some(item => item.id === activeSection);
    }, [category.items, activeSection]);

    return (
        <div className="mb-2">
            {/* Category Header */}
            <div
                className="flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer font-semibold text-sm text-white hover:text-cyan-400 hover:bg-cyan-500/10"
                onClick={onToggle}
            >
                <div>
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-cyan-400" />
                    ) : (
                        <ChevronRight size={14} className="text-zinc-400" />
                    )}
                </div>
                <span>{category.title}</span>
            </div>

            {/* Sub Items */}
            {isExpanded && (
                <div className="relative ml-2 pl-4 border-l border-cyan-500/30">
                    {category.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`relative py-2 px-2 -ml-4 rounded-lg text-sm cursor-pointer select-none ${
                                    isActive
                                        ? 'text-cyan-400 font-semibold bg-cyan-500/15 border border-cyan-400/40'
                                        : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/5'
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
}

export default function ViewDocsSidebar({
    activeSection,
    expandedCategories,
    onToggleCategory,
    onSelectItem,
}: ViewDocsSidebarProps) {
    // Memoize categories to prevent unnecessary re-renders
    const memoizedCategories = useMemo(() => NAV_STRUCTURE, []);

    return (
        <aside className="sticky top-0 w-[280px] shrink-0 flex flex-col pt-20 px-6 border-r hidden md:flex z-40 h-[calc(100vh-0px)] overflow-y-auto backdrop-blur-xl custom-scrollbar bg-[#020617]/80 border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-white">
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
                    />
                ))}
            </nav>
        </aside>
    );
}

