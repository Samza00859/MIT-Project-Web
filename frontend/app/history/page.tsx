"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
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

// Logo component for history items
function StockLogo({ ticker, isDarkMode }: { ticker: string; isDarkMode: boolean }) {
    const [logoSrc, setLogoSrc] = useState<string>("");
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        const fetchLogo = async () => {
            if (!ticker) return;
            const cleanTicker = ticker.trim().toUpperCase();

            try {
                const apiUrl = getApiUrl();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

                const res = await fetch(`${apiUrl}/quote/${cleanTicker}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.logo_url && !data.logo_url.includes("clearbit.com")) {
                        // Clearbit is often unreliable, prefer backend choice if it's not clearbit
                        setLogoSrc(data.logo_url);
                    } else if (data.website) {
                        try {
                            // URL constructor needs protocol
                            const website = data.website.startsWith('http') ? data.website : `https://${data.website}`;
                            const domain = new URL(website).hostname;
                            setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
                        } catch (e) {
                            // Fallback to Parqet for cleaner stock logos if domain fails
                            setLogoSrc(`https://assets.parqet.com/logos/symbol/${cleanTicker.split('.')[0]}?format=png`);
                        }
                    } else {
                        // Secondary fallback: known public logo API
                        setLogoSrc(`https://assets.parqet.com/logos/symbol/${cleanTicker.split('.')[0]}?format=png`);
                    }
                } else {
                    setLogoSrc(`https://assets.parqet.com/logos/symbol/${cleanTicker.split('.')[0]}?format=png`);
                }
            } catch (e) {
                // Network error or timeout, try direct fallback
                setLogoSrc(`https://assets.parqet.com/logos/symbol/${cleanTicker.split('.')[0]}?format=png`);
            }
        };
        fetchLogo();
    }, [ticker]);

    const handleLogoError = () => {
        // Final fallback to text if all image attempts fail
        setLogoError(true);
    };

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 relative overflow-hidden ${logoSrc && !logoError ? "bg-white" : (isDarkMode ? "bg-white/10" : "bg-gray-100")}`}>
            {logoSrc && !logoError ? (
                <img
                    src={logoSrc}
                    alt={ticker}
                    className="h-full w-full object-contain p-1.5"
                    onError={handleLogoError}
                />
            ) : (
                <span className={`text-xs font-bold ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                    {ticker.substring(0, 2).toUpperCase()}
                </span>
            )}
        </div>
    );
}

import { useTheme } from "../../context/ThemeContext";

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { isDarkMode, toggleTheme } = useTheme();
    const [viewMode, setViewMode] = useState<"summary" | "detailed">("detailed");

    // Search and Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

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

    // Filter logic
    const filteredHistory = history.filter(item => {
        // Search filter
        const matchesSearch = item.ticker.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

        // Time filter
        let matchesTime = true;
        if (timeFilter !== "all") {
            const now = new Date();
            const itemDate = new Date(item.timestamp);
            const diffMs = now.getTime() - itemDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (timeFilter === "last24h") matchesTime = diffHours <= 24;
            else if (timeFilter === "last7d") matchesTime = diffHours <= 24 * 7;
            else if (timeFilter === "last30d") matchesTime = diffHours <= 24 * 30;
        }

        return matchesSearch && matchesStatus && matchesTime;
    });



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

        // Clean content: remove unwanted formatting while preserving actual content
        const cleanContent = (text: string): string => {
            if (!text || typeof text !== 'string') return '';

            let cleaned = text;

            // Convert literal escape sequences to actual characters
            cleaned = cleaned.replace(/\\n/g, '\n');  // \n to newline
            cleaned = cleaned.replace(/\\t/g, '  ');  // \t to spaces
            cleaned = cleaned.replace(/\\r/g, '');    // remove \r

            // Remove backslashes used as emphasis markers (e.g., \word\)
            cleaned = cleaned.replace(/\\([^\\]+)\\/g, '$1');  // \text\ -> text

            // Remove all remaining standalone backslashes
            cleaned = cleaned.replace(/\\/g, '');

            // Remove code block markers
            cleaned = cleaned.replace(/```json\s*/g, '');
            cleaned = cleaned.replace(/```\s*/g, '');

            // Convert markdown headers to bold-like text (preserve the content)
            cleaned = cleaned.replace(/^#{1,6}\s+(.*)$/gm, '$1');

            // Remove "Text:" labels at the start of lines
            cleaned = cleaned.replace(/^Text:\s*/gim, '');

            // Remove standalone curly braces lines but keep JSON content
            cleaned = cleaned.replace(/^\s*{\s*$/gm, '');
            cleaned = cleaned.replace(/^\s*}\s*$/gm, '');

            // Convert JSON key-value format "key": "value" to Key: value
            cleaned = cleaned.replace(/"([^"]+)":\s*"([^"]*)"/g, (_, key, value) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                return `${formattedKey}: ${value}`;
            });

            // Remove quotes around remaining values
            cleaned = cleaned.replace(/"([^"]+)"/g, '$1');

            // Clean up markdown bold markers
            cleaned = cleaned.replace(/\*\*/g, '');

            // Remove excessive whitespace and empty lines
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            cleaned = cleaned.trim();

            return cleaned;
        };

        // Keys to skip (not display in PDF) - technical fields only
        // Note: 'text' is NOT skipped because full_report content is in 'text' key
        const KEYS_TO_SKIP = ['raw', 'raw_content', 'markdown', 'metadata'];

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

                    // Special styling for analyst-type keys (sub-headers)
                    const isAnalystKey = key.toLowerCase().includes('analyst') ||
                        key.toLowerCase().includes('history') ||
                        key.toLowerCase().includes('reasoning') ||
                        key.toLowerCase().includes('recommendation') ||
                        key.toLowerCase().includes('decision') ||
                        key.toLowerCase().includes('summary');

                    if (isComplex) {
                        if (isAnalystKey) {
                            // Analyst sub-header - prominent styling
                            yPosition += 8;
                            doc.setFontSize(11);
                            doc.setFont("Sarabun", "bold");
                            doc.setTextColor(0, 100, 150); // Blue color for sub-headers
                            doc.text(label + ":", margin + indent, yPosition);
                            yPosition += lineHeight + 4;
                        } else {
                            addText(label + ":", 10, true, indent, [40, 40, 40]);
                        }
                        processData(valToProcess, indent + 15);
                        yPosition += 6;
                    } else {
                        if (isShortText) {
                            doc.setFontSize(10);
                            doc.setFont("Sarabun", "bold");

                            // Color key labels based on type
                            if (isAnalystKey) {
                                doc.setTextColor(0, 100, 150);
                            } else {
                                doc.setTextColor(80, 80, 80);
                            }

                            const keyWidth = doc.getTextWidth(label + ": ");

                            const hasThai = /[\u0E00-\u0E7F]/.test(strVal);
                            const hasChinese = /[\u4E00-\u9FFF]/.test(strVal);
                            let valFont = "Sarabun";
                            if (hasChinese && !hasThai && hasMaishan) valFont = "Maishan";

                            doc.setFont(valFont, "normal");
                            const valWidth = doc.getTextWidth(strVal);

                            if (margin + indent + keyWidth + valWidth < maxWidth) {
                                doc.setFont("Sarabun", "bold");
                                if (isAnalystKey) {
                                    doc.setTextColor(0, 100, 150);
                                } else {
                                    doc.setTextColor(80, 80, 80);
                                }
                                doc.text(label + ": ", margin + indent, yPosition);

                                doc.setFont(valFont, "normal");
                                doc.setTextColor(30, 30, 30);
                                doc.text(strVal, margin + indent + keyWidth, yPosition);
                                yPosition += lineHeight;
                            } else {
                                if (isAnalystKey) {
                                    addText(label + ":", 10, true, indent, [0, 100, 150]);
                                } else {
                                    addText(label + ":", 10, true, indent, [80, 80, 80]);
                                }
                                addText(strVal, 10, false, indent + 15, [30, 30, 30]);
                            }
                        } else {
                            if (isAnalystKey) {
                                addText(label + ":", 10, true, indent, [0, 100, 150]);
                            } else {
                                addText(label + ":", 10, true, indent, [80, 80, 80]);
                            }
                            addText(strVal, 10, false, indent + 15, [30, 30, 30]);
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
        const currentViewMode = viewMode;

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

            // Handle object with 'text' or 'content' key
            if (typeof content === 'object' && content !== null) {
                if (content.text) contentData = content.text;
                else if (content.content) contentData = content.content;
            }

            // Try to parse JSON if it's a string
            if (typeof contentData === 'string') {
                try {
                    const cleanJsonStr = contentData.replace(/```json/g, "").replace(/```/g, "").trim();
                    if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
                        contentData = JSON.parse(cleanJsonStr);
                    }
                } catch (e) { }
            }

            // Render Content
            if (typeof contentData === 'string') {
                const cleanedContent = cleanContent(contentData);
                if (cleanedContent) {
                    // Split by newlines and render paragraph by paragraph
                    const paragraphs = cleanedContent.split('\n').filter(p => p.trim());
                    paragraphs.forEach(para => {
                        addText(para, 10, false, 0);
                        yPosition += 4;
                    });
                }
            } else if (typeof contentData === 'object' && contentData !== null) {
                // Check if object has 'text', 'content', 'summary', 'reasoning' etc
                if (contentData.text || contentData.content || contentData.summary) {
                    const textContent = contentData.text || contentData.content || contentData.summary;
                    if (typeof textContent === 'string') {
                        const cleanedContent = cleanContent(textContent);
                        if (cleanedContent) {
                            addText(cleanedContent, 10, false, 0);
                        }
                    }
                }
                // Process remaining keys
                processData(contentData);
            }

            yPosition += 30;
        });

        // 4. Footer Last Page
        drawPageFooter(doc.getNumberOfPages());

        // Save
        const viewModeLabel = currentViewMode === "summary" ? "Summary" : "Full";
        doc.save(`TradingAgents_${item.ticker}_${item.analysis_date}_${viewModeLabel}.pdf`);
    };

    return (
        <div className={`w-full h-full flex flex-col xl:flex-row overflow-hidden ${isDarkMode ? "bg-[#0c111f] text-white" : "bg-gray-50 text-gray-900"}`}>

            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
                {/* List Sidebar - Full width on mobile, fixed width on desktop */}
                <div className={`${selectedItem ? 'hidden xl:flex' : 'flex'} w-full xl:w-88 border-r flex-col ${isDarkMode ? "border-white/10 bg-[#0c111f]" : "border-gray-200 bg-white"}`}>
                    <div className={`p-4 pt-24 md:p-6 md:pt-24 xl:p-6 xl:pt-6 border-b ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
                        <h2 className="text-xl md:text-2xl font-bold mb-1">Execution history</h2>
                        <p className={`text-sm mb-4 md:mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Showing {filteredHistory.length} record
                        </p>

                        {/* Search and Filters */}
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search Symbol"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${isDarkMode
                                        ? "bg-white/5 border-white/10 focus:border-[#2df4c6]/50 focus:bg-white/10"
                                        : "bg-gray-50 border-gray-200 focus:border-[#2df4c6] focus:bg-white"
                                        }`}
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`flex-1 px-3 py-2 rounded-xl border text-sm appearance-none outline-none ${isDarkMode
                                        ? "bg-white/5 border-white/10 text-white"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                >
                                    <option value="all">All Status</option>
                                    <option value="success">Success</option>
                                    <option value="error">Error</option>
                                    <option value="executing">Executing</option>
                                </select>

                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className={`flex-1 px-3 py-2 rounded-xl border text-sm appearance-none outline-none ${isDarkMode
                                        ? "bg-white/5 border-white/10 text-white"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                >
                                    <option value="all">All Time</option>
                                    <option value="last24h">Last 24h</option>
                                    <option value="last7d">Last 7 days</option>
                                    <option value="last30d">Last 30 days</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="p-6 text-center animate-pulse">Loading...</div>
                        ) : (
                            <>
                                {isRunning && currentTicker && (
                                    <>
                                        <div
                                            className={`w-full text-left p-4 rounded-2xl border transition-all ${isDarkMode
                                                ? "bg-[#2df4c6]/5 border-[#2df4c6]/20"
                                                : "bg-[#2df4c6]/5 border-[#2df4c6]/20"
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <StockLogo ticker={currentTicker} isDarkMode={isDarkMode} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-xs uppercase tracking-tight opacity-90">ANALYSIS</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-yellow-500 text-black animate-pulse">
                                                            PROGRESS
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-sm truncate">{currentTicker} - {new Date().toISOString().split('T')[0]}</div>
                                                    <div className="text-[11px] opacity-40 mt-1">Processing analysis...</div>
                                                </div>
                                            </div>
                                        </div>

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
                                                            ? (isDarkMode ? "bg-yellow-500/20 text-yellow-400 animate-pulse" : "bg-yellow-100 text-yellow-700 animate-pulse")
                                                            : completed === total && completed > 0
                                                                ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#2df4c6]/15 text-[#065f46]")
                                                                : (isDarkMode ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")
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
                                    </>
                                )}
                            </>
                        )}

                        {/* History Items */}
                        {filteredHistory.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all group ${selectedItem?.id === item.id
                                    ? (isDarkMode ? "bg-white/10 border-[#2df4c6] shadow-[0_0_15px_rgba(45,244,198,0.1)]" : "bg-gray-50 border-[#2df4c6]")
                                    : (isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-white border-gray-100 hover:bg-gray-50")
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <StockLogo ticker={item.ticker} isDarkMode={isDarkMode} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start font-sans">
                                            <span className="font-bold text-xs uppercase tracking-tight opacity-90">ANALYSIS</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${item.status === "success"
                                                ? "bg-[#2df4c6] text-black"
                                                : (item.status === "executing" && item.reports.length === 0)
                                                    ? "bg-red-500 text-white"
                                                    : item.status === "executing"
                                                        ? "bg-yellow-500 text-black"
                                                        : "bg-red-500 text-white"
                                                }`}>
                                                {item.status === "executing" && item.reports.length === 0
                                                    ? "FAILED"
                                                    : item.status}
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm truncate">{item.ticker} - {item.analysis_date}</div>
                                        <div className="text-[11px] opacity-40 mt-1">
                                            {new Date(item.timestamp).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {filteredHistory.length === 0 && !loading && (
                            <div className="p-8 text-center opacity-40">
                                <p className="text-sm">No records found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View - Hidden on mobile when no item selected */}
                <div className={`${selectedItem ? 'flex' : 'hidden xl:flex'} flex-1 flex-col overflow-y-auto p-4 pt-24 md:p-8 md:pt-24 xl:p-8 xl:pt-8`}>
                    {selectedItem ? (
                        <div className="max-w-5xl mx-auto">
                            {/* Back button for mobile */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                className={`xl:hidden flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to list
                            </button>
                            <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
                                <div>
                                    <div className="flex flex-wrap items-center gap-4 mb-2">
                                        <h1 className="text-4xl font-bold">{selectedItem.ticker}</h1>
                                        {(() => {
                                            const finalReport = selectedItem.reports.find(r => r.report_type === 'conclusion');
                                            let decision = null;
                                            if (finalReport) {
                                                try {
                                                    const content = typeof finalReport.content === 'string'
                                                        ? JSON.parse(finalReport.content)
                                                        : finalReport.content;
                                                    if (content && content.decision) {
                                                        decision = content.decision;
                                                    }
                                                } catch (e) { /* ignore */ }
                                            }
                                            if (decision) {
                                                return (
                                                    <span className="px-3 py-1 rounded-lg text-lg font-bold bg-[#2df4c6] text-[#03161b] shadow-[0_0_15px_rgba(45,244,198,0.3)]">
                                                        {decision.toUpperCase()}
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${selectedItem.status === "success"
                                            ? (isDarkMode ? "bg-[#2df4c6]/20 text-[#2df4c6]" : "bg-[#2df4c6]/20 text-[#065f46]")
                                            : (selectedItem.status === "executing" && selectedItem.reports.length === 0)
                                                ? "bg-red-500/10 text-red-500"
                                                : selectedItem.status === "executing"
                                                    ? (isDarkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-500/10 text-yellow-700")
                                                    : "bg-red-500/10 text-red-500"
                                            }`}>
                                            {selectedItem.status === "executing" && selectedItem.reports.length === 0
                                                ? "INCOMPLETE"
                                                : selectedItem.status.toUpperCase()}
                                        </span>
                                        <p className="opacity-50 text-sm whitespace-nowrap">Analysis for {selectedItem.analysis_date}</p>
                                    </div>
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
                                                <div key={idx} className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5 shadow-[0_4px_20_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-sm"}`}>
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
            </div>
        </div>
    );
}
