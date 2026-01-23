"use client";



import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
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
    title_th?: string;  // Thai title
    content: any;
    content_th?: any;   // Thai content
    created_at: string;
}

const TRANSLATIONS = {
    en: {
        sidebar: {
            title: "Execution history",
            showing: "Showing",
            record: "record",
            searchPlaceholder: "Search Symbol",
            analysisLabel: "ANALYSIS",
            filters: {
                allStatus: "All Status",
                success: "Success",
                error: "Error",
                executing: "Executing",
                allTime: "All Time",
                last24h: "Last 24h",
                last7d: "Last 7 days",
                last30d: "Last 30 days"
            },
            status: {
                success: "Success",
                failed: "FAILED",
                incomplete: "INCOMPLETE",
                executing: "EXECUTING"
            },
            loading: "Loading...",
            noRecords: "No records found"
        },
        detail: {
            back: "Back to list",
            analysisFor: "Analysis for",
            downloadPdf: "PDF",
            viewMode: {
                summary: "Summary",
                full: "Full"
            },
            headers: {
                cancelled: "Analysis Cancelled",
                incomplete: "Analysis Incomplete",
                failed: "Analysis Failed",
                noReports: "No Reports Available",
                finalRec: "Final Recommendation Summary",
                execSum: "Executive Summary",
                detailed: "Detailed Data / Research"
            },
            messages: {
                cancelled: "This analysis was cancelled before completion.",
                incomplete: "This analysis was interrupted and did not complete. No reports were saved.",
                unknown: "Unknown error",
                noReports: "This analysis completed but no reports were saved. This may indicate an issue during the summarization process."
            },
            empty: {
                title: "Select a record",
                desc: "Select an analysis result from the sidebar to view details"
            }
        }
    },
    th: {
        sidebar: {
            title: "ประวัติการทำงาน",
            showing: "แสดง",
            record: "รายการ",
            searchPlaceholder: "ค้นหาชื่อหุ้น",
            analysisLabel: "การวิเคราะห์",
            filters: {
                allStatus: "สถานะทั้งหมด",
                success: "สำเร็จ",
                error: "ล้มเหลว",
                executing: "กำลังทำงาน",
                allTime: "ทุกช่วงเวลา",
                last24h: "24 ชม. ล่าสุด",
                last7d: "7 วันล่าสุด",
                last30d: "30 วันล่าสุด"
            },
            status: {
                success: "สำเร็จ",
                failed: "ล้มเหลว",
                incomplete: "ไม่สมบูรณ์",
                executing: "กำลังทำ"
            },
            loading: "กำลังโหลด...",
            noRecords: "ไม่พบข้อมูล"
        },
        detail: {
            back: "กลับไปหน้ารายการ",
            analysisFor: "วิเคราะห์เมื่อ",
            downloadPdf: "ดาวน์โหลด PDF",
            viewMode: {
                summary: "สรุป",
                full: "ฉบับเต็ม"
            },
            headers: {
                cancelled: "ยกเลิกการวิเคราะห์",
                incomplete: "วิเคราะห์ไม่สำเร็จ",
                failed: "วิเคราะห์ล้มเหลว",
                noReports: "ไม่มีรายงาน",
                finalRec: "สรุปคำแนะนำการลงทุน",
                execSum: "บทสรุปผู้บริหาร",
                detailed: "ข้อมูลเชิงลึก / การวิจัย"
            },
            messages: {
                cancelled: "การวิเคราะห์ถูกยกเลิกก่อนกำหนด",
                incomplete: "การวิเคราะห์หยุดชะงักและไม่เสร็จสมบูรณ์ ไม่มีการบันทึกรายงาน",
                unknown: "ข้อผิดพลาดที่ไม่ทราบสาเหตุ",
                noReports: "การวิเคราะห์เสร็จสิ้นแต่ไม่มีการบันทึกรายงาน อาจเกิดปัญหาในกระบวนการสรุปผล"
            },
            empty: {
                title: "เลือกรายการ",
                desc: "เลือกรายการจากแถบด้านซ้ายเพื่อดูรายละเอียด"
            }
        }
    }
};

// Map English section labels to Thai
const THAI_LABEL_MAP: Record<string, string> = {
    "Market Analysis (Summary)": "การวิเคราะห์ตลาด (สรุป)",
    "Market Analysis Data": "ข้อมูลการวิเคราะห์ตลาด",
    "Fundamentals Analyst (Summary)": "การวิเคราะห์ปัจจัยพื้นฐาน (สรุป)",
    "Fundamentals Analyst Data": "ข้อมูลปัจจัยพื้นฐาน",
    "Social Media Analyst (Summary)": "การวิเคราะห์โซเชียลมีเดีย (สรุป)",
    "Social Media Research": "การวิจัยโซเชียลมีเดีย",
    "News Analyst (Summary)": "การวิเคราะห์ข่าว (สรุป)",
    "News Research": "การวิจัยข่าว",
    "Bull Research (Summary)": "การวิจัยแนวโน้มขาขึ้น (สรุป)",
    "Bull Research Analysis": "การวิเคราะห์แนวโนน้มขาขึ้น",
    "Bear Research (Summary)": "การวิจัยแนวโน้มขาลง (สรุป)",
    "Bear Research Analysis": "การวิเคราะห์แนวโน้มขาลง",
    "Research Manager (Summary)": "สรุปจากผู้จัดการงานวิจัย",
    "Research Manager Decision": "คำตัดสินผู้จัดการงานวิจัย",
    "Trader (Summary)": "การวิเคราะห์เทรดเดอร์ (สรุป)",
    "Trader Analysis": "การวิเคราะห์เทรดเดอร์",
    "Risk Analyst (Summary)": "การวิเคราะห์ความเสี่ยง (สรุป)",
    "Risk Analysis Data": "ข้อมูลการวิเคราะห์ความเสี่ยง",
    "Neutral Analyst (Summary)": "การวิเคราะห์แนวโน้มกลาง (สรุป)",
    "Neutral Analysis": "การวิเคราะห์แนวโน้มกลาง",
    "Safe Analyst (Summary)": "การวิเคราะห์ความปลอดภัย (สรุป)",
    "Safe Analysis": "การวิเคราะห์ความปลอดภัย",
    "Portfolio Manager (Summary)": "สรุปจากผู้จัดการพอร์ต",
    "Portfolio Manager Decision": "คำตัดสินผู้จัดการพอร์ต",
    "Final Trade Decision": "คำตัดสินการเทรดขั้นสุดท้าย"
};

interface HistoryItem {
    id: number;
    timestamp: string;
    ticker: string;
    analysis_date: string;
    status: string;
    error_message: string | null;
    reports: ReportResult[];
}

// Logo component for history items with robust fallback
// In-memory cache for logo URLs to avoid repeated fetches
const logoCache = new Map<string, string>();

// Thai stock ticker to company domain mapping for accurate logo fetching
const THAI_STOCK_DOMAINS: Record<string, string> = {
  // Energy & Petrochemical
  "PTT": "https://www.pttplc.com",
  // "PTTEP": "https://www.pttep.com" ,
  "PTTGC": "https://www.pttgcgroup.com",
  "TOP": "https://www.thaioilgroup.com",
  "IRPC": "https://www.irpc.co.th",
  "GPSC": "https://www.gpscgroup.com",
  "OR": "https://www.pttor.com",
  "GULF": "https://www.gulf.co.th",
  // "BGRIM": "https://www.bgrim.com",
  "RATCH": "https://www.ratch.co.th",
  "EGCO": "https://www.egco.com",
  "BANPU": "https://www.banpu.com",
  "BCP": "https://www.bangchak.co.th",

  // Banking & Finance
  "KBANK": "https://www.kasikornbank.com",
  "SCB": "https://www.scb.co.th",
  "BBL": "https://www.bangkokbank.com",
  "KTB": "https://www.ktb.co.th",
  "TMB": "https://www.ttbbank.com",
  "TTB": "https://www.ttbbank.com",
  "BAY": "https://www.krungsri.com",
  "TISCO": "https://www.tisco.co.th",
  "KKP": "https://www.kkpfg.com",
  // "TCAP": "https://www.thanachartcapital.co.th",

  // Telecommunication & Technology
  "ADVANC": "https://www.ais.th",
  "TRUE": "https://www.truecorp.co.th",
  "DTAC": "https://www.dtac.co.th",
  "INTUCH": "https://www.intouchcompany.com",
  "JAS": "https://www.jasmine.com",
  "THCOM": "https://www.thaicom.net",

  // Real Estate & Construction
  "CPN": "https://www.centralpattana.co.th",
  "LH": "https://www.lh.co.th",
  "AP": "https://www.apthai.com",
  "SPALI": "https://www.spali.com",
  "PSH": "https://www.pruksa.com",
  "ORI": "https://www.origin.com",
  "SC": "https://www.scasset.com",
  "SIRI": "https://www.sansiri.com",
  "QH": "https://www.qh.co.th",
  "WHA": "https://www.wha-group.com",
  "AMATA": "https://www.amata.com",
  "HEMRAJ": "https://www.hemaraj.com",
  "SCC": "https://www.scg.com",
  "TPIPL": "https://www.tpipolene.co.th",

  // Consumer & Retail
  "CPALL": "https://www.cpall.co.th",
  // "CP": "https://www.cpthailand.com",
  "CPF": "https://www.cpfworldwide.com",
  "MINT": "https://www.minor.com",
  "CRC": "https://www.centralretail.com",
  "HMPRO": "https://www.homepro.co.th",
  "BJC": "https://www.bjc.com",
  "MAKRO": "https://www.siammakro.co.th",
  "GLOBAL": "https://www.globalhouse.co.th",
  "COM7": "https://www.com7.com",
  "OSP": "https://www.osotspa.com",
  "CBG": "https://www.carabao.co.th",

  // Healthcare
  "BDMS": "https://www.bdms.co.th",
  "BH": "https://www.bumrungrad.com",
  "BCH": "https://www.bangkokchainhospital.com",
  // "CHG": "https://www.chularat.com",
  // "THG": "https://www.thonburihealth.com",
  // "RJH": "https://www.rajavithi.go.th",

  // Transportation & Logistics
  "AOT": "https://www.airportthai.co.th",
  "BEM": "https://www.bangkokmetro.com",
  // "BTS": "https://www.btsgroup.co.th",
  "AAV": "https://www.airasiax.com",
  "BA": "https://www.bangkokair.com",
  "THAI": "https://www.thaiairways.com",

  // Industrial & Manufacturing
  "IVL": "https://www.indorama.com",
  "DELTA": "https://www.deltathailand.com",
  "PCSGH": "https://www.pcsgh.com",
  "HANA": "https://www.hanagroup.com",
  "STA": "https://www.sritranggroup.com",
  "NER": "https://www.ner.com",

  // Media & Entertainment
  // "BEC": "https://www.becworld.com",
  "MONO": "https://www.mono29.com",
  "GRAMMY": "https://www.grammy.co.th",
  // "VGI": "https://www.vgigroup.com",
  "MAJOR": "https://www.majorcineplex.com",
  "PLANB": "https://www.planbmedia.co.th",

  // Insurance
  "BLA": "https://www.bangkoklife.com",
  "TLI": "https://www.thailife.com",
  "MTL": "https://www.muangthai.co.th",

  // Others
  "SAWAD": "https://www.sawad.co.th",
  "MTC": "https://www.mtc.com",
  "TIDLOR": "https://www.tidlor.com",
  // "JMT": "https://www.jmt.co.th",
  "SINGER": "https://www.singer.com",
  "AWC": "https://www.assetworldcorp.com",
  "ASSET": "https://www.assetwise.co.th",
  "CENTEL": "https://www.centarahotelsresorts.com",
  "ERW": "https://www.theerawan.com",
  // "DOHOME": "https://www.dohomeonline.com",
  "BEAUTY": "https://www.beautycommunity.co.th",
  "JMART": "https://www.jaymart.co.th",
  // "KLINIQ": "https://www.thekliniq.com",
  // "MEGA": "https://www.megabangna.com",
};

function StockLogo({ ticker, isDarkMode }: { ticker: string; isDarkMode: boolean }) {
    const [currentSrc, setCurrentSrc] = useState<string>("");
    const [isError, setIsError] = useState(false);
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [candidates, setCandidates] = useState<string[]>([]);

    useEffect(() => {
        if (!ticker) {
            setIsError(true);
            return;
        }

        const cleanTicker = ticker.trim().toUpperCase();
        const symbol = cleanTicker.split('.')[0].split('-')[0]; // Handle PTT.BK -> PTT
        const isThaiStock = cleanTicker.endsWith(".BK");

        // Check cache first
        if (logoCache.has(cleanTicker)) {
            const cachedUrl = logoCache.get(cleanTicker)!;
            if (cachedUrl === "ERROR") {
                setIsError(true);
            } else {
                setCurrentSrc(cachedUrl);
                setCandidates([cachedUrl]);
            }
            return;
        }

        let staticUrls: string[] = [];

        if (isThaiStock) {
            // Thai stocks: Use domain mapping for accurate logos
            const domain = THAI_STOCK_DOMAINS[symbol];
            if (domain) {
                staticUrls = [
                    // Google Favicon (reliable, free, no API key needed)
                    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                    // Brandfetch CDN (high quality, free tier available)
                    `https://cdn.brandfetch.io/${domain}/w/400/h/400`,
                    // DuckDuckGo icons (another free fallback)
                    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
                ];
            } else {
                // Unknown Thai stock: use text fallback immediately
                logoCache.set(cleanTicker, "ERROR");
                setIsError(true);
                return;
            }
        } else {
            // Non-Thai stocks: Use standard sources
            staticUrls = [
                `https://assets.parqet.com/logos/symbol/${symbol}?format=png`,
                `https://unavatar.io/${symbol}`,
                `https://www.google.com/s2/favicons?domain=${symbol.toLowerCase()}.com&sz=128`,
            ];
        }

        setCandidates(staticUrls);
        setCandidateIndex(0);
        setCurrentSrc(staticUrls[0]);
        setIsError(false);
    }, [ticker]);

    const handleImageError = () => {
        const nextIndex = candidateIndex + 1;
        if (nextIndex < candidates.length) {
            setCandidateIndex(nextIndex);
            setCurrentSrc(candidates[nextIndex]);
        } else {
            // All static sources failed, cache the error
            const cleanTicker = ticker.trim().toUpperCase();
            logoCache.set(cleanTicker, "ERROR");
            setIsError(true);
        }
    };

    const handleImageLoad = () => {
        // Cache successful URL
        const cleanTicker = ticker.trim().toUpperCase();
        logoCache.set(cleanTicker, currentSrc);
    };

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 relative overflow-hidden transition-colors ${!isError && currentSrc ? "bg-white" : (isDarkMode ? "bg-white/10" : "bg-gray-100")
            }`}>
            {!isError && currentSrc ? (
                <img
                    src={currentSrc}
                    alt={ticker}
                    className="h-full w-full object-contain p-0.5 rounded-full"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading="lazy"
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

    // Language toggle for EN/TH (Thai content is pre-loaded from database)
    const { language, setLanguage } = useLanguage();

    // Language search toggle for EN/TH
    const t = TRANSLATIONS[language];
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



    // Helper function to properly parse Thai content which may be wrapped in {text: "```json...```"}
    const parseThaiContent = (content: any): any => {
        if (!content) return content;

        // Helper to parse JSON from markdown code block string
        const parseFromMarkdown = (str: string): any => {
            let textValue = str.trim();

            // Strip markdown code blocks (```json...``` or ```...```)
            const codeBlockMatch = textValue.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
            if (codeBlockMatch) {
                textValue = codeBlockMatch[1].trim();
            }

            // Try to parse as JSON
            if (textValue.startsWith('{') || textValue.startsWith('[')) {
                try {
                    return JSON.parse(textValue);
                } catch (e) {
                    // Try to handle escaped JSON strings (with literal \n and \")
                    if (textValue.includes('\\n') || textValue.includes('\\"')) {
                        try {
                            const unescaped = textValue
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\');
                            return JSON.parse(unescaped);
                        } catch {
                            console.log('[parseThaiContent] JSON parse failed after unescape');
                            return null;
                        }
                    }
                    console.log('[parseThaiContent] JSON parse failed:', e);
                    return null;
                }
            }
            return null;
        };

        // Recursive deep parser
        const deepParse = (obj: any): any => {
            // If it's a string, try to parse it
            if (typeof obj === 'string') {
                const parsed = parseFromMarkdown(obj);
                if (parsed !== null) {
                    return deepParse(parsed); // Recursively parse the result
                }
                return obj;
            }

            // If it's an array, recursively parse each element
            if (Array.isArray(obj)) {
                return obj.map(item => deepParse(item));
            }

            // If it's an object, recursively parse each value
            if (typeof obj === 'object' && obj !== null) {
                const result: Record<string, any> = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = deepParse(value);
                }
                return result;
            }

            return obj;
        };

        return deepParse(content);
    };

    const getGroupedSections = (item: HistoryItem, lang: "en" | "th" = "en") => {
        const sectionsMap: Record<string, { sum?: any, full?: any, sum_th?: any, full_th?: any, label_th?: string }> = {};
        const titlesFound = new Set<string>();

        item.reports.forEach(report => {
            let title = report.title || "Report";
            let title_th = report.title_th || title;

            // Map known short titles to full titles
            if (TITLE_MAP[title.toLowerCase()]) {
                title = TITLE_MAP[title.toLowerCase()];
            }

            if (!sectionsMap[title]) sectionsMap[title] = {};

            // Store Thai title
            if (title_th) {
                sectionsMap[title].label_th = title_th;
            }

            // Process English content
            let content = report.content;
            if (typeof content === 'object' && content !== null) {
                content = content.summary || content.text || content.reasoning || content;
            }

            // Process Thai content (if available) - apply parseThaiContent to handle ```json wrappers
            let content_th = report.content_th;
            if (content_th) {
                // First parse the content to extract JSON from markdown blocks
                content_th = parseThaiContent(content_th);
                // Then extract summary/text/reasoning if it's an object
                if (typeof content_th === 'object' && content_th !== null) {
                    content_th = content_th.summary || content_th.text || content_th.reasoning || content_th;
                }
            }

            if (report.report_type === "sum_report") {
                sectionsMap[title].sum = content;
                if (content_th) sectionsMap[title].sum_th = content_th;
            } else if (report.report_type === "full_report") {
                sectionsMap[title].full = report.content;
                if (report.content_th) {
                    // Parse Thai content to extract JSON from markdown blocks
                    sectionsMap[title].full_th = parseThaiContent(report.content_th);
                }
            }
            titlesFound.add(title);
        });

        // Combine titles in order + any extra titles found
        const orderedTitles = REPORT_ORDER.filter(title => sectionsMap[title]);
        const otherTitles = Array.from(titlesFound).filter(t => !REPORT_ORDER.includes(t));

        return [...orderedTitles, ...otherTitles].map(title => {
            const section = sectionsMap[title];
            // Return content based on selected language
            if (lang === "th") {
                return {
                    label: section.label_th || THAI_LABEL_MAP[title] || title,
                    sum: section.sum_th || section.sum,
                    full: section.full_th || section.full
                };
            }
            return {
                label: title,
                sum: section.sum,
                full: section.full
            };
        });
    };

    const getSummary = (item: HistoryItem, lang: "en" | "th" = "en") => {
        const portSummary = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "sum_report"
        );
        const portFull = item.reports.find(r =>
            (r.title === "Portfolio Management Decision" || r.title?.toLowerCase() === "risk") &&
            r.report_type === "full_report"
        );

        if (!portSummary) return null;

        // Determine content based on language
        let content;
        if (lang === "th" && portSummary.content_th) {
            content = portSummary.content_th;
        } else {
            content = portSummary.content;
        }

        if (typeof content === 'object' && content !== null) {
            content = content.summary || content.text || content.reasoning || content;
        }

        let decision = "N/A";
        // Decision usually stays in original report structure unless translated separately?
        // Assuming decision keyword (Buy/Sell) might need translation or mapped
        // Ideally, decision logic logic relies on structured data in full_report.content

        let decisionSource = portFull ? portFull.content : null;

        if (decisionSource && typeof decisionSource === 'object' && decisionSource !== null) {
            // 1. Try direct keys
            decision = decisionSource.judge_decision ||
                decisionSource.decision ||
                decisionSource.recommendation ||
                (decisionSource.score ? `SCORE: ${decisionSource.score}` : "N/A");

            // 2. If still N/A, try to parse JSON from 'text' (e.g. if it had markdown headers)
            if (decision === "N/A" && typeof decisionSource.text === 'string') {
                try {
                    const text = decisionSource.text;
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

        // Thai Translation Map for Keys
        const THAI_KEY_MAP: Record<string, string> = {
            "executive_summary": "บทสรุปผู้บริหาร",
            "valuation_status": "สถานะมูลค่า",
            "comprehensive_metrics": "ตัวชี้วัดที่ครอบคลุม",
            "revenue_growth_year_over_year": "การเติบโตของรายได้ (YOY)",
            "net_profit_margin": "อัตรากำไรสุทธิ",
            "price_to_earnings_ratio": "อัตราส่วน P/E",
            "debt_to_equity_ratio": "อัตราส่วนหนี้สินต่อทุน",
            "return_on_equity": "ผลตอบแทนต่อส่วนผู้ถือหุ้น",
            "free_cash_flow_status": "สถานะกระแสเงินสดอิสระ",
            "key_strengths_analysis": "วิเคราะห์จุดแข็งหลัก",
            "key_risks_analysis": "วิเคราะห์ความเสี่ยงหลัก",
            "technical_outlook": "มุมมองทางเทคนิค",
            "trend_analysis": "การวิเคราะห์แนวโน้ม",
            "support_resistance_analysis": "การวิเคราะห์แนวรับแนวต้าน",
            "key_levels": "ระดับสำคัญ",
            "chart_patterns": "รูปแบบกราฟ",
            "indicators_summary": "สรุปอินดิเคเตอร์",
            "market_breadth": "ความกว้างของตลาด",
            "sector_performance": "ผลการดำเนินงานรายกลุ่ม",
            "sentiment_score": "คะแนนความรู้สึก",
            "sentiment_analysis": "การวิเคราะห์ความรู้สึก",
            "social_volume": "ปริมาณโซเชียล",
            "key_topics": "หัวข้อสำคัญ",
            "news_summary": "สรุปข่าว",
            "impact_assessment": "การประเมินผลกระทบ",
            "bull_case": "กรณีขาขึ้น",
            "bear_case": "กรณีขาลง",
            "risk_factors": "ปัจจัยเสี่ยง",
            "mitigation_strategies": "กลยุทธ์การลดความเสี่ยง",
            "investment_horizon": "ระยะเวลาการลงทุน",
            "verdict": "คำตัดสิน",
            "confidence_level": "ระดับความมั่นใจ",
            "recommendation": "คำแนะนำ",
            "decision": "การตัดสินใจ",
            "market_overview": "ภาพรวมตลาด",
            "trend_direction": "ทิศทางแนวโน้ม",
            "momentum_state": "สถานะโมเมนตัม",
            "volatility_level": "ระดับความผันผวน",
            "volume_condition": "สภาวะปริมาณการซื้อขาย",
            "indicator_analysis": "การวิเคราะห์อินดิเคเตอร์",
            "indicator_full_name": "ชื่ออินดิเคเตอร์",
            "signal": "สัญญาณ",
            "implication": "นัยสำคัญ",
            "ticker": "ชื่อหุ้น",
            "date": "วันที่",
            "key_support_levels": "ระดับแนวรับสำคัญ",
            "key_resistance_levels": "ระดับแนวต้านสำคัญ",
            "primary_trend": "แนวโน้มหลัก",
            "price_action_summary": "สรุปพฤติกรรมราคา",
            "recent_high_low": "จุดสูงสุด/ต่ำสุด ล่าสุด",
            "support_levels": "ระดับแนวรับ",
            "resistance_levels": "ระดับแนวต้าน",
            "short_term_behavior": "พฤติกรรมระยะสั้น",
            "market_sentiment": "ความรู้สึกตลาด",
            "sentiment_label": "สถานะความรู้สึก",
            "key_risks": "ความเสี่ยงหลัก",
            "short_term_outlook": "แนวโน้มระยะสั้น",
            "sentiment_verdict": "คำตัดสินความรู้สึก",
            "dominant_narrative": "กระแสหลัก",
            "top_topics": "หัวข้อเด่น",
            "topic": "หัวข้อ",
            "sentiment": "ความรู้สึก",
            "analysis_snippet": "รายละเอียดการวิเคราะห์"
        };

        const getLabel = (key: string) => {
            if (language === "th") {
                return THAI_KEY_MAP[key.toLowerCase()] || toSentenceCase(key);
            }
            return toSentenceCase(key);
        };

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

                    const label = getLabel(key);
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

        const reportTitle = language === "th"
            ? `รายงาน TradingAgents: ${item.ticker}`
            : `TradingAgents Report: ${item.ticker}`;

        doc.text(reportTitle, margin, yPosition);
        yPosition += 20;

        // Sub-header
        doc.setFontSize(10);
        doc.setFont("Sarabun", "normal");
        doc.setTextColor(100, 100, 100);

        const dateLabel = language === "th" ? "วันที่วิเคราะห์" : "Analysis Date";
        const generatedLabel = language === "th" ? "สร้างเมื่อ" : "Generated";

        doc.text(`${dateLabel}: ${item.analysis_date}`, margin, yPosition);
        yPosition += 15;
        doc.text(`${generatedLabel}: ${formatDate(item.timestamp)}`, margin, yPosition);
        yPosition += 25;

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 25;

        // 2. Recommendation Section
        const summary = getSummary(item, language);
        if (summary && summary.decision) {
            yPosition += lineHeight * 1.5;
            doc.setFont("Sarabun", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 200, 0);

            const recLabel = language === "th" ? "คำแนะนำ" : "Recommendation";

            doc.text(`${recLabel}: ${summary.decision}`, margin, yPosition);
            yPosition += lineHeight * 2;
        }

        // 3. Render Report Sections
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(11);

        const sections = getGroupedSections(item, language);
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
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl md:text-2xl font-bold">{t.sidebar.title}</h2>
                        </div>
                        <p className={`text-sm mb-4 md:mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {t.sidebar.showing} {filteredHistory.length} {t.sidebar.record}
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
                                    placeholder={t.sidebar.searchPlaceholder}
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
                                        ? "bg-white/5 border-white/10 text-white [&>option]:bg-[#0b0e14]"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                >
                                    <option value="all">{t.sidebar.filters.allStatus}</option>
                                    <option value="success">{t.sidebar.filters.success}</option>
                                    <option value="error">{t.sidebar.filters.error}</option>
                                    <option value="executing">{t.sidebar.filters.executing}</option>
                                </select>

                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className={`flex-1 px-3 py-2 rounded-xl border text-sm appearance-none outline-none ${isDarkMode
                                        ? "bg-white/5 border-white/10 text-white [&>option]:bg-[#0b0e14]"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                        }`}
                                >
                                    <option value="all">{t.sidebar.filters.allTime}</option>
                                    <option value="last24h">{t.sidebar.filters.last24h}</option>
                                    <option value="last7d">{t.sidebar.filters.last7d}</option>
                                    <option value="last30d">{t.sidebar.filters.last30d}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="p-6 text-center animate-pulse">{t.sidebar.loading}</div>
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
                                                        <span className="font-bold text-xs uppercase tracking-tight opacity-90">{t.sidebar.analysisLabel}</span>
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
                                            <span className="font-bold text-xs uppercase tracking-tight opacity-90">{t.sidebar.analysisLabel}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${item.status === "success"
                                                ? "bg-[#2df4c6] text-black"
                                                : (item.status === "executing" && item.reports.length === 0)
                                                    ? "bg-red-500 text-white"
                                                    : item.status === "executing"
                                                        ? "bg-yellow-600 text-black"
                                                        : "bg-red-500 text-white"
                                                }`}>
                                                {item.status === "executing" && item.reports.length === 0
                                                    ? t.sidebar.status.failed
                                                    : item.status === "success"
                                                        ? t.sidebar.status.success
                                                        : item.status === "executing"
                                                            ? t.sidebar.status.executing
                                                            : item.status === "error"
                                                                ? t.sidebar.status.failed
                                                                : item.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm truncate">{item.ticker.replace('.BK', '')} - {language === 'th' ? new Date(item.analysis_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : item.analysis_date}</div>
                                        <div className="text-[11px] opacity-40 mt-1">
                                            {new Date(item.timestamp).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
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
                                <p className="text-sm">{t.sidebar.noRecords}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View - Hidden on mobile when no item selected */}
                <div className={`${selectedItem ? 'flex' : 'hidden xl:flex'} flex-1 flex-col overflow-y-auto p-4 pt-24 md:p-8 md:pt-24 xl:p-8 xl:pt-0`}>
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
                                {t.detail.back}
                            </button>
                            <header className={`sticky top-0 z-20 flex flex-wrap justify-between items-end gap-4 pb-4 mb-4 -mx-8 px-8 pt-4 border-b ${isDarkMode ? "bg-[#03161b] border-white/5" : "bg-[#f5f8fa] border-gray-200"}`}>
                                <div>
                                    <div className="flex flex-wrap items-center gap-4 mb-2">
                                        <h1 className="text-4xl font-bold">{selectedItem.ticker.replace('.BK', '')}</h1>
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
                                                ? t.sidebar.status.incomplete
                                                : selectedItem.status === "success"
                                                    ? t.sidebar.status.success.toUpperCase()
                                                    : selectedItem.status === "error"
                                                        ? t.sidebar.status.failed
                                                        : selectedItem.status === "executing"
                                                            ? t.sidebar.status.executing
                                                            : selectedItem.status.toUpperCase()}
                                        </span>
                                        <p className="opacity-50 text-sm whitespace-nowrap">{t.detail.analysisFor} {language === 'th' ? new Date(selectedItem.analysis_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : selectedItem.analysis_date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Language Toggle */}
                                    {/* Removed redundant toggle from here as it is now in sidebar */}

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
                                            {t.detail.downloadPdf} ({language === "th" ? "TH" : "EN"})
                                        </button>
                                    )}

                                    {/* View Mode Toggle */}
                                    {selectedItem.status === "success" && (
                                        <div className={`flex rounded-full border p-1 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100"}`}>
                                            <button
                                                onClick={() => setViewMode("summary")}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "summary" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                            >
                                                {t.detail.viewMode.summary}
                                            </button>
                                            <button
                                                onClick={() => setViewMode("detailed")}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "detailed" ? "bg-[#2df4c6] text-black" : "opacity-50"}`}
                                            >
                                                {t.detail.viewMode.full}
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
                                            ? t.detail.headers.cancelled
                                            : selectedItem.status === "executing"
                                                ? t.detail.headers.incomplete
                                                : t.detail.headers.failed}
                                    </h3>
                                    <p className="bg-black/20 p-4 rounded-xl font-mono text-sm">
                                        {selectedItem.error_message ||
                                            (selectedItem.status === "cancelled"
                                                ? t.detail.messages.cancelled
                                                : selectedItem.status === "executing"
                                                    ? t.detail.messages.incomplete
                                                    : t.detail.messages.unknown)}
                                    </p>
                                </div>
                            ) : selectedItem.reports.length === 0 ? (
                                <div className="p-8 rounded-[20px] bg-gray-500/5 border border-gray-500/20 text-gray-400">
                                    <h3 className="text-xl font-bold mb-4">{t.detail.headers.noReports}</h3>
                                    <p className="opacity-70">
                                        {t.detail.messages.noReports}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Final Summary Card */}
                                    {(() => {
                                        const summary = getSummary(selectedItem, language);
                                        if (!summary) return null;
                                        return (
                                            <section className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#8b94ad] mb-2">{t.detail.headers.finalRec}</h3>
                                                        <div className="text-lg opacity-90 italic leading-relaxed">
                                                            {typeof summary.summary === 'string' ? (
                                                                <RenderMarkdown text={summary.summary} />
                                                            ) : (
                                                                <RenderJsonData data={summary.summary} isDarkMode={isDarkMode} language={language} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {/* Selected View Content */}
                                    <div className="space-y-8">
                                        {getGroupedSections(selectedItem, language).map((section, idx) => {
                                            const hasContent = (viewMode === "summary" && section.sum) || (viewMode === "detailed" && section.full);
                                            if (!hasContent) return null;

                                            return (
                                                <div key={idx} className={`p-6 rounded-[20px] border ${isDarkMode ? "bg-[#111726] border-white/5 shadow-[0_4px_20_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-sm"}`}>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${isDarkMode ? 'bg-[#2df4c6]/20 text-[#2df4c6]' : 'bg-teal-100 text-teal-700'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        {section.label}
                                                    </h3>

                                                    <div className="space-y-8">
                                                        {viewMode === "summary" && section.sum && (
                                                            <div className={`p-5 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                                                <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'opacity-50 text-[#2df4c6]' : 'text-teal-700'}`}>{t.detail.headers.execSum}</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.sum === 'string' ? (
                                                                        <RenderMarkdown text={section.sum} />
                                                                    ) : (
                                                                        <RenderJsonData data={section.sum} isDarkMode={isDarkMode} language={language} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {viewMode === "detailed" && section.full && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">{t.detail.headers.detailed}</h4>
                                                                <div className="opacity-90">
                                                                    {typeof section.full === 'string' ? (
                                                                        <RenderMarkdown text={section.full} />
                                                                    ) : (
                                                                        <div className="mt-4">
                                                                            <RenderJsonData data={section.full} isDarkMode={isDarkMode} language={language} />
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
                            <h2 className="text-2xl font-bold">{t.detail.empty.title}</h2>
                            <p>{t.detail.empty.desc}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
