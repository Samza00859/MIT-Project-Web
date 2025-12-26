"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import Sidebar from "../../components/Sidebar";
import { useGeneration } from "../../context/GenerationContext";
import { getApiUrl } from "../../lib/api";

// Import from shared modules for better code splitting
import { HISTORY_REPORT_ORDER as REPORT_ORDER, TITLE_MAP } from "../../lib/constants";
import { formatDate } from "../../lib/helpers";
import { RenderMarkdown, RenderJsonData } from "../../components/RenderContent";

interface ReportResult {
    id: number;
    report_type: string;
    title: string;
    content: any;
    created_at: string;
}

interface HistoryItem {
    id: number;
    timestamp: string;
    ticker: string;
    analysis_date: string;
    status: string;
    error_message: string | null;
    reports: ReportResult[];
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<"summary" | "detailed">("detailed");

    // Get generation state from context
    const { isRunning, currentTicker, teamState, progress } = useGeneration();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/history/`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const getGroupedSections = (item: HistoryItem) => {
        const sectionsMap: Record<string, { sum?: any, full?: any }> = {};
        const titlesFound = new Set<string>();

        item.reports.forEach(report => {
            let title = report.title || "Report";
            // Map known short titles to full titles
            if (TITLE_MAP[title.toLowerCase()]) {
                title = TITLE_MAP[title.toLowerCase()];
            }

            if (!sectionsMap[title]) sectionsMap[title] = {};

            let content = report.content;
            if (typeof content === 'object' && content !== null) {
                content = content.summary || content.text || content.reasoning || content;
            }

            if (report.report_type === "sum_report") {
                sectionsMap[title].sum = content;
            } else if (report.report_type === "full_report") {
                sectionsMap[title].full = report.content;
            }
            titlesFound.add(title);
        });

        // Combine titles in order + any extra titles found
        const orderedTitles = REPORT_ORDER.filter(title => sectionsMap[title]);
        const otherTitles = Array.from(titlesFound).filter(t => !REPORT_ORDER.includes(t));

        return [...orderedTitles, ...otherTitles].map(title => ({
            label: title,
            sum: sectionsMap[title].sum,
            full: sectionsMap[title].full
        }));
    };

    const getSummary = (item: HistoryItem) => {
        const portSummary = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "sum_report"
        );
        const portFull = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "full_report"
        );

        if (!portSummary) return null;

        let content = portSummary.content;
        if (typeof content === 'object' && content !== null) {
            content = content.summary || content.text || content.reasoning || content;
        }

        let decision = "N/A";
        if (portFull && typeof portFull.content === 'object' && portFull.content !== null) {
            // 1. Try direct keys
            decision = portFull.content.judge_decision ||
                portFull.content.decision ||
                portFull.content.recommendation ||
                (portFull.content.score ? `SCORE: ${portFull.content.score}` : "N/A");

            // 2. If still N/A, try to parse JSON from 'text' (e.g. if it had markdown headers)
            if (decision === "N/A" && typeof portFull.content.text === 'string') {
                try {
                    const text = portFull.content.text;
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        const jsonStr = text.substring(firstBrace, lastBrace + 1);
                        const parsed = JSON.parse(jsonStr);
                        decision = parsed.judge_decision ||
                            parsed.decision ||
                            parsed.recommendation ||
                            (parsed.score ? `SCORE: ${parsed.score}` : "N/A");
                    }
                } catch (e) {
                    // ignore parse error
                }
            }
        }

        return {
            summary: content,
            decision: decision
        };
    };

    // PDF Download Handler
    const handleDownloadPdf = async (item: HistoryItem) => {
        if (!item || item.reports.length === 0) {
            alert("No reports available to download");
            return;
        }

        // 1. Setup Document
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        // Load Fonts Implementation with validation
        const loadFont = async (url: string): Promise<string | null> => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Font not found: ${url}`);
                    return null;
                }
                const blob = await response.blob();

                // Validate font file size (should be more than 1KB for valid TTF)
                if (blob.size < 1000) {
                    console.warn(`Invalid font file (too small): ${url}`);
                    return null;
                }

                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = (reader.result as string).split(",")[1];
                        resolve(base64data);
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.warn(`Failed to load font: ${url}`, error);
                return null;
            }
        };

        // Track which fonts are available
        let hasMaishan = false;

        // Load Sarabun fonts (required for Thai)
        try {
            const sarabunRegular = await loadFont("/fonts/Sarabun-Regular.ttf");
            const sarabunBold = await loadFont("/fonts/Sarabun-Bold.ttf");

            if (sarabunRegular) {
                doc.addFileToVFS("Sarabun-Regular.ttf", sarabunRegular);
                doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
            }

            if (sarabunBold) {
                doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBold);
                doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
            }
        } catch (error) {
            console.error("Error loading Sarabun fonts:", error);
        }

        // Load Maishan font (optional, for Chinese characters)
        try {
            const maishan = await loadFont("/fonts/Maishan.ttf");
            if (maishan) {
                doc.addFileToVFS("Maishan.ttf", maishan);
                doc.addFont("Maishan.ttf", "Maishan", "normal");
                hasMaishan = true;
            }
        } catch (error) {
            console.warn("Maishan font not available, Chinese characters may not render correctly");
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const maxWidth = pageWidth - margin * 2;
        const lineHeight = 14;

        let yPosition = margin + 20;

        const KEYS_TO_HIDE = [
            "selected_indicators", "memory_application", "count",
            "indicator", "validation_notes", "metadata"
        ];

        const drawPageFooter = (pageNumber: number) => {
            const str = `Page ${pageNumber}`;
            doc.setFontSize(8);
            doc.setFont("Sarabun", "normal");
            doc.setTextColor(150, 150, 150);
            doc.text(str, pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text("Generated by TradingAgents", pageWidth - margin, pageHeight - 20, { align: 'right' });
        };

        const checkPageBreak = (neededHeight: number) => {
            if (yPosition + neededHeight > pageHeight - margin) {
                drawPageFooter(doc.getNumberOfPages());
                doc.addPage();
                yPosition = margin + 20;
                doc.setTextColor(0, 0, 0);
                return true;
            }
            return false;
        };

        const addText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
            doc.setFontSize(fontSize);
            doc.setTextColor(color[0], color[1], color[2]);

            const hasThai = /[\u0E00-\u0E7F]/.test(text);
            const hasChinese = /[\u4E00-\u9FFF]/.test(text);

            let currentFont = "Sarabun";
            if (hasChinese && !hasThai && hasMaishan) {
                currentFont = "Maishan";
            }

            let currentStyle = isBold ? "bold" : "normal";
            if (currentFont === "Maishan") {
                currentStyle = "normal";
            }

            doc.setFont(currentFont, currentStyle);

            const lines = doc.splitTextToSize(text, maxWidth - indent);

            for (let i = 0; i < lines.length; i++) {
                const pageBreakTriggered = checkPageBreak(lineHeight);
                if (pageBreakTriggered) {
                    doc.setFontSize(fontSize);
                    doc.setFont(currentFont, currentStyle);
                    doc.setTextColor(color[0], color[1], color[2]);
                }

                doc.text(lines[i], margin + indent, yPosition);
                yPosition += lineHeight;
            }
        };

        const toSentenceCase = (str: string) => {
            const s = str.replace(/_/g, " ");
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        };

        // Clean content: remove markdown headers, raw JSON formatting, unwanted labels
        const cleanContent = (text: string): string => {
            if (!text || typeof text !== 'string') return '';

            let cleaned = text;

            // Remove markdown headers like "### Portfolio Manager Decision"
            cleaned = cleaned.replace(/^#{1,6}\s+.*$/gm, '');

            // Remove code block markers
            cleaned = cleaned.replace(/```json/g, '');
            cleaned = cleaned.replace(/```/g, '');

            // Remove "Text:" labels at the start
            cleaned = cleaned.replace(/^Text:\s*/gim, '');

            // Remove standalone curly braces lines
            cleaned = cleaned.replace(/^\s*[{}]\s*$/gm, '');

            // Remove JSON key-value format like "key": "value" - convert to readable format
            cleaned = cleaned.replace(/"([^"]+)":\s*"([^"]*)"/g, (_, key, value) => {
                // Convert snake_case to Title Case
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                return `${formattedKey}: ${value}`;
            });

            // Remove remaining quotes around values
            cleaned = cleaned.replace(/"([^"]+)"/g, '$1');

            // Remove excessive whitespace and empty lines
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            cleaned = cleaned.trim();

            return cleaned;
        };

        // Keys to skip (not display in PDF)
        const KEYS_TO_SKIP = ['text', 'raw', 'raw_content', 'markdown'];

        const processData = (data: any, indent = 0) => {
            if (!data) return;

            if (Array.isArray(data)) {
                data.forEach((dataItem, index) => {
                    if (typeof dataItem === 'object' && dataItem !== null) {
                        if (index > 0) {
                            yPosition += 8;
                            checkPageBreak(10);
                            doc.setDrawColor(220, 220, 220);
                            doc.setLineWidth(0.5);
                            doc.line(margin + indent, yPosition, pageWidth - margin, yPosition);
                            yPosition += 12;
                        }
                        processData(dataItem, indent);
                        yPosition += 4;
                    } else {
                        let parsedItem = dataItem;
                        if (typeof dataItem === 'string' && (dataItem.trim().startsWith('{') || dataItem.trim().startsWith('['))) {
                            try { parsedItem = JSON.parse(dataItem); } catch (e) { }
                        }

                        if (typeof parsedItem === 'object') {
                            processData(parsedItem, indent + 10);
                        } else {
                            // Clean the content before adding
                            const cleanedText = cleanContent(String(parsedItem));
                            if (cleanedText) {
                                addText(`•  ${cleanedText.replace(/\*\*/g, "")}`, 10, false, indent + 10);
                            }
                        }
                    }
                });
            } else if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    // Skip hidden keys and unwanted display keys
                    if (KEYS_TO_HIDE.includes(key)) return;
                    if (KEYS_TO_SKIP.includes(key.toLowerCase())) return;

                    const label = toSentenceCase(key);
                    let valToProcess = value;

                    if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                        try { valToProcess = JSON.parse(value); } catch (e) { }
                    }

                    const isComplex = typeof valToProcess === 'object' && valToProcess !== null;

                    // Clean string values before display
                    let strVal = '';
                    if (!isComplex) {
                        strVal = cleanContent(String(valToProcess)).replace(/\*\*/g, "");
                    }
                    const isShortText = strVal.length < 80 && !strVal.includes('\n');

                    // Skip empty values
                    if (!isComplex && !strVal.trim()) return;

                    checkPageBreak(20);

                    if (isComplex) {
                        addText(label + ":", 10, true, indent, [0, 0, 0]);
                        processData(valToProcess, indent + 15);
                        yPosition += 4;
                    } else {
                        if (isShortText) {
                            doc.setFontSize(10);
                            doc.setFont("Sarabun", "bold");
                            doc.setTextColor(50, 50, 50);
                            const keyWidth = doc.getTextWidth(label + ": ");

                            const hasThai = /[\u0E00-\u0E7F]/.test(strVal);
                            const hasChinese = /[\u4E00-\u9FFF]/.test(strVal);
                            let valFont = "Sarabun";
                            if (hasChinese && !hasThai && hasMaishan) valFont = "Maishan";

                            doc.setFont(valFont, "normal");
                            const valWidth = doc.getTextWidth(strVal);

                            if (margin + indent + keyWidth + valWidth < maxWidth) {
                                doc.setFont("Sarabun", "bold");
                                doc.setTextColor(50, 50, 50);
                                doc.text(label + ": ", margin + indent, yPosition);

                                doc.setFont(valFont, "normal");
                                doc.setTextColor(0, 0, 0);
                                doc.text(strVal, margin + indent + keyWidth, yPosition);
                                yPosition += lineHeight;
                            } else {
                                addText(label + ":", 10, true, indent, [50, 50, 50]);
                                addText(strVal, 10, false, indent + 15, [0, 0, 0]);
                            }
                        } else {
                            addText(label + ":", 10, true, indent, [50, 50, 50]);
                            addText(strVal, 10, false, indent + 15, [0, 0, 0]);
                            yPosition += 4;
                        }
                    }
                });
            } else {
                // Base case (Primitive)
                const cleanedVal = cleanContent(String(data)).replace(/\*\*/g, "");
                if (cleanedVal.trim()) {
                    addText(cleanedVal, 10, false, indent, [0, 0, 0]);
                }
            }
        };

        // --- Start Drawing PDF ---

        // 1. Main Header
        doc.setFontSize(18);
        doc.setFont("Sarabun", "bold");
        doc.setTextColor(0, 51, 102);
        doc.text(`TradingAgents Report: ${item.ticker}`, margin, yPosition);
        yPosition += 20;

        // Sub-header
        doc.setFontSize(10);
        doc.setFont("Sarabun", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Analysis Date: ${item.analysis_date}`, margin, yPosition);
        yPosition += 15;
        doc.text(`Generated: ${formatDate(item.timestamp)}`, margin, yPosition);
        yPosition += 25;

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 25;

        // 2. Recommendation Section
        const summary = getSummary(item);
        if (summary && summary.decision) {
            yPosition += lineHeight * 1.5;
            doc.setFont("Sarabun", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 200, 0);
            doc.text(`Recommendation: ${summary.decision}`, margin, yPosition);
            yPosition += lineHeight * 2;
        }

        // 3. Render Report Sections
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(11);

        const sections = getGroupedSections(item);
        const currentViewMode = viewMode; // Use current view mode

        sections.forEach((section, idx) => {
            const content = currentViewMode === "summary" ? section.sum : section.full;
            if (!content) return;

            checkPageBreak(60);

            // Section Header Background
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 12, maxWidth, 24, 'F');

            // Section Title
            doc.setFontSize(13);
            doc.setFont("Sarabun", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`${idx + 1}. ${section.label}`, margin + 8, yPosition + 5);
            yPosition += 30;

            // Prepare Content
            let contentData: any = content;
            try {
                if (typeof content === 'string') {
                    const cleanJsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
                    if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
                        contentData = JSON.parse(cleanJsonStr);
                    }
                }
            } catch (e) { }

            // Render Content
            processData(contentData);

            yPosition += 25;
        });

        // 4. Footer Last Page
        drawPageFooter(doc.getNumberOfPages());

        // Save
        const viewModeLabel = currentViewMode === "summary" ? "Summary" : "Full";
        doc.save(`TradingAgents_${item.ticker}_${item.analysis_date}_${viewModeLabel}.pdf`);
    };

    return (
        <div className={`flex h-screen overflow-hidden ${isDarkMode ? "bg-[#0c111f] text-white" : "bg-gray-50 text-gray-900"}`}>
            <Sidebar activeId="history" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <main className="flex-1 flex overflow-hidden">
                {/* List Sidebar */}
                <div className={`w-80 border-r flex flex-col ${isDarkMode ? "border-white/10 bg-[#161b2c]" : "border-gray-200 bg-white"}`}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">Execution History</h2>
                        <div className="flex justify-between items-center mt-1">
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {history.length} records found
                            </p>
                            <button onClick={fetchHistory} className="text-xs text-[#2df4c6] hover:underline">Refresh</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center animate-pulse">Loading...</div>
                        ) : (
                            <>
                                {/* Currently Running Generation Card */}
                                {isRunning && currentTicker && (
                                    <div
                                        className={`w-full text-left p-4 border-b border-l-4 border-l-[#2df4c6] ${isDarkMode ? "bg-[#2df4c6]/5 border-white/10" : "bg-[#2df4c6]/5 border-gray-100"}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-xs tracking-widest opacity-70 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2df4c6] opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2df4c6]"></span>
                                                </span>
                                                GENERATING...
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-yellow-500/20 text-yellow-400 animate-pulse">
                                                IN PROGRESS
                                            </span>
                                        </div>
                                        <div className="font-bold text-lg text-[#2df4c6]">{currentTicker}</div>
                                        <div className="text-sm opacity-60">Analysis in progress...</div>

                                        {/* Progress indicator */}
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {Object.entries(teamState).map(([teamName, members]) => {
                                                const completed = members.filter((m: { name: string; status: string }) => m.status === "completed").length;
                                                const total = members.length;
                                                const isActive = members.some((m: { name: string; status: string }) => m.status === "working");
                                                return (
                                                    <span
                                                        key={teamName}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded ${isActive
                                                            ? "bg-yellow-500/20 text-yellow-400 animate-pulse"
                                                            : completed === total && completed > 0
                                                                ? "bg-[#2df4c6]/20 text-[#2df4c6]"
                                                                : "bg-white/10 text-gray-400"
                                                            }`}
                                                    >
                                                        {teamName.charAt(0).toUpperCase() + teamName.slice(1)}: {completed}/{total}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        <div className="text-[10px] opacity-40 mt-2 flex items-center gap-1">
                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </div>
                                    </div>
                                )}

                                {/* History Items */}
                                {history.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full text-left p-4 border-b transition-all ${selectedItem?.id === item.id
                                            ? (isDarkMode ? "bg-[#2df4c6]/10 border-l-4 border-l-[#2df4c6]" : "bg-[#2df4c6]/10 border-l-4 border-l-[#2df4c6]")
                                            : (isDarkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50")
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-xs tracking-widest opacity-70">ID #{item.id}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.status === "success"
                                                ? "bg-[#2df4c6]/20 text-[#2df4c6]"
                                                : (item.status === "executing" && item.reports.length === 0)
                                                    ? "bg-red-500/20 text-red-400"
                                                    : item.status === "executing"
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : "bg-red-500/20 text-red-400"
                                                }`}>
                                                {item.status === "executing" && item.reports.length === 0
                                                    ? "INCOMPLETE"
                                                    : item.status}
                                            </span>
                                        </div>
                                        <div className="font-bold text-lg">{item.ticker}</div>
                                        <div className="text-sm opacity-60">{item.analysis_date}</div>
                                        <div className="text-[10px] opacity-40 mt-2">
                                            {formatDate(item.timestamp)}
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Detail View */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {selectedItem ? (
                        <div className="max-w-5xl mx-auto">
                            <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl font-bold">{selectedItem.ticker}</h1>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedItem.status === "success"
                                            ? "bg-[#2df4c6]/20 text-[#2df4c6]"
                                            : (selectedItem.status === "executing" && selectedItem.reports.length === 0)
                                                ? "bg-red-500/10 text-red-500"
                                                : selectedItem.status === "executing"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/10 text-red-500"
                                            }`}>
                                            {selectedItem.status === "executing" && selectedItem.reports.length === 0
                                                ? "INCOMPLETE"
                                                : selectedItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="opacity-50 text-lg">Analysis for {selectedItem.analysis_date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Download PDF Button */}
                                    {selectedItem.reports.length > 0 && selectedItem.status === "success" && (
                                        <button
                                            onClick={() => handleDownloadPdf(selectedItem)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isDarkMode
                                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                                                : "bg-blue-500 text-white hover:bg-blue-600"}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download PDF
                                        </button>
                                    )}

                                    {/* View Mode Toggle */}
                                    {selectedItem.status === "success" && (
                                        <div className={`flex rounded-full border p-1 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100"}`}>
                                            <button
                                                onClick={() => setViewMode("summary")}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "summary" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                            >
                                                Summary report
                                            </button>
                                            <button
                                                onClick={() => setViewMode("detailed")}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "detailed" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                            >
                                                Full report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </header>

                            {/* Show error for: error, cancelled, OR executing with no reports (incomplete) */}
                            {selectedItem.status === "error" || selectedItem.status === "cancelled" ||
                                (selectedItem.status === "executing" && selectedItem.reports.length === 0) ? (
                                <div className="p-8 rounded-[20px] bg-red-500/5 border border-red-500/20 text-red-400">
                                    <h3 className="text-xl font-bold mb-4">
                                        {selectedItem.status === "cancelled"
                                            ? "Analysis Cancelled"
                                            : selectedItem.status === "executing"
                                                ? "Analysis Incomplete"
                                                : "Analysis Failed"}
                                    </h3>
                                    <p className="bg-black/20 p-4 rounded-xl font-mono text-sm">
                                        {selectedItem.error_message ||
                                            (selectedItem.status === "cancelled"
                                                ? "This analysis was cancelled before completion."
                                                : selectedItem.status === "executing"
                                                    ? "This analysis was interrupted and did not complete. No reports were saved."
                                                    : "Unknown error")}
                                    </p>
                                </div>
                            ) : selectedItem.reports.length === 0 ? (
                                <div className="p-8 rounded-[20px] bg-gray-500/5 border border-gray-500/20 text-gray-400">
                                    <h3 className="text-xl font-bold mb-4">No Reports Available</h3>
                                    <p className="opacity-70">
                                        This analysis completed but no reports were saved. This may indicate an issue during the summarization process.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Final Summary Card */}
                                    {(() => {
                                        const summary = getSummary(selectedItem);
                                        if (!summary) return null;
                                        return (
                                            <section className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#8b94ad] mb-2">Final Recommendation Summary</h3>
                                                        <div className="text-lg opacity-90 italic leading-relaxed">
                                                            {typeof summary.summary === 'string' ? (
                                                                <RenderMarkdown text={summary.summary} />
                                                            ) : (
                                                                <RenderJsonData data={summary.summary} isDarkMode={isDarkMode} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-auto p-6 rounded-2xl bg-[#2df4c6]/10 border border-[#2df4c6]/30 text-center">
                                                        <span className="text-xs uppercase font-bold text-[#2df4c6] block mb-1">Recommendation</span>
                                                        <strong className="text-3xl text-[#2df4c6] uppercase">{summary.decision}</strong>
                                                    </div>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {/* Selected View Content */}
                                    <div className="space-y-8">
                                        {getGroupedSections(selectedItem).map((section, idx) => {
                                            const hasContent = (viewMode === "summary" && section.sum) || (viewMode === "detailed" && section.full);
                                            if (!hasContent) return null;

                                            return (
                                                <div key={idx} className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-sm"}`}>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2df4c6]/20 text-sm text-[#2df4c6]">
                                                            {idx + 1}
                                                        </span>
                                                        {section.label}
                                                    </h3>

                                                    <div className="space-y-8">
                                                        {viewMode === "summary" && section.sum && (
                                                            <div className={`p-5 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-[#2df4c6]">Executive Summary</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.sum === 'string' ? (
                                                                        <RenderMarkdown text={section.sum} />
                                                                    ) : (
                                                                        <RenderJsonData data={section.sum} isDarkMode={isDarkMode} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {viewMode === "detailed" && section.full && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Detailed Data / Research</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.full === 'string' ? (
                                                                        <RenderMarkdown text={section.full} />
                                                                    ) : (
                                                                        <div className="mt-4">
                                                                            <RenderJsonData data={section.full} isDarkMode={isDarkMode} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <div className="w-24 h-24 mb-6 relative">
                                <div className="absolute inset-0 border-4 border-[#2df4c6] rounded-full animate-ping opacity-20"></div>
                                <div className="absolute inset-2 border-2 border-[#2df4c6] rounded-full opacity-40"></div>
                                <svg className="absolute inset-0 m-auto text-[#2df4c6]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold">Select a record</h2>
                            <p>Select an analysis result from the sidebar to view details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
