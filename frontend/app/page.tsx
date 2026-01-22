"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

import { jsPDF } from "jspdf";
import ReportSections from "../components/ReportSections";
import { buildApiUrl, buildWsUrl, mapFetchError } from "@/lib/api";
import { useGeneration } from "../context/GenerationContext";
import { getApiUrl } from "../lib/api";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import GenerateIcon from "@/image/report_6902377.png";
import { useLanguage } from "@/context/LanguageContext";

const TRANSLATIONS = {
  en: {
    title: "Generate Analysis",
    step1: "Step 1: Symbol Selection",
    step2: "Step 2: Analysis Date",
    marketData: "Live Market Data",
    sector: "SECTOR",
    generate: "Generate",
    stop: "Stop",
    teams: {
      analyst: { title: "Analyst team" },
      research: { title: "Research team" },
      trader: { title: "Trader team" },
      risk: { title: "Risk & Portfolio" },
      portfolio: { title: "Portfolio Management" }
    },
    roles: {
      "Market Analyst": "Market Analyst",
      "Social Media Analyst": "Social Media Analyst",
      "News Analyst": "News Analyst",
      "Fundamentals Analyst": "Fundamentals Analyst",
      "Bull Research": "Bull Research",
      "Bear Research": "Bear Research",
      "Research Manager": "Research Manager",
      "Trader": "Trader",
      "Risk Analyst": "Risk Analyst",
      "Neutral Analyst": "Neutral Analyst",
      "Safe Analyst": "Safe Analyst",
      "Portfolio Manager": "Portfolio Manager"
    },
    progressStatus: {
      ready: "Ready",
      pending: "Pending",
      in_progress: "Working",
      completed: "Completed",
      error: "Error"
    },
    signal: {
      asset: "Selected Asset",
      strength: "Technicals",
      recommendation: "Recommendation",
      awaitingRun: "Awaiting Run"
    },
    status: {
      loading: "Loading...",
      strongBear: "Strong Bearish",
      bear: "Bearish",
      neutral: "Neutral",
      bull: "Bullish",
      strongBull: "Strong Bullish"
    },
    search: {
      placeholder: "Search Symbol",
      popular: "Market Symbols",
      results: "Search Results"
    }
  },
  th: {
    title: "สร้างบทวิเคราะห์",
    step1: "ขั้นตอนที่ 1: เลือกเหรียญ/หุ้น",
    step2: "ขั้นตอนที่ 2: วันที่วิเคราะห์",
    marketData: "ข้อมูลตลาดเรียลไทม์",
    sector: "กลุ่มอุตสาหกรรม",
    generate: "เริ่มวิเคราะห์",
    stop: "หยุดการทำงาน",
    teams: {
      analyst: { title: "ทีมรวบรวมข้อมูล" },
      research: { title: "ทีมวิเคราะห์และวิจัย" },
      trader: { title: "ทีมเทรดเดอร์" },
      risk: { title: "ทีมบริหารความเสี่ยง" },
      portfolio: { title: "ผู้จัดการกองทุน" }
    },
    roles: {
      "Market Analyst": "นักวิเคราะห์ตลาด",
      "Social Media Analyst": "นักวิเคราะห์โซเชียล",
      "News Analyst": "นักวิเคราะห์ข่าว",
      "Fundamentals Analyst": "นักวิเคราะห์พื้นฐาน",
      "Bull Research": "วิจัยแนวโน้มขาขึ้น",
      "Bear Research": "วิจัยแนวโน้มขาลง",
      "Research Manager": "ผู้จัดการงานวิจัย",
      "Trader": "เทรดเดอร์",
      "Risk Analyst": "นักวิเคราะห์ความเสี่ยง",
      "Neutral Analyst": "วิเคราะห์แนวโน้มกลาง",
      "Safe Analyst": "นักวิเคราะห์ความปลอดภัย",
      "Portfolio Manager": "ผู้จัดการพอร์ต"
    },
    progressStatus: {
      ready: "พร้อม",
      pending: "รอ",
      in_progress: "กำลังทำ",
      completed: "เสร็จสิ้น",
      error: "ผิดพลาด"
    },
    signal: {
      asset: "สินทรัพย์ที่เลือก",
      strength: "ตัวชี้วัดทางเทคนิค",
      recommendation: "คำแนะนำ",
      awaitingRun: "รอเริ่มวิเคราะห์"
    },
    status: {
      loading: "กำลังโหลด...",
      strongBear: "ลงแรง (Strong Bearish)",
      bear: "ลง (Bearish)",
      neutral: "ทรงตัว (Neutral)",
      bull: "ขึ้น (Bullish)",
      strongBull: "ขึ้นแรง (Strong Bullish)"
    },
    search: {
      placeholder: "พิมพ์ชื่อหุ้น (เช่น PTT)",
      popular: "รายชื่อหุ้นทั้งหมด",
      results: "ผลการค้นหา"
    }
  }
};

// Logo component with robust fallback
const logoCache = new Map<string, string>();

// Thai stock ticker to company domain mapping for accurate logo fetching
const THAI_STOCK_DOMAINS: Record<string, string> = {
  // Energy & Petrochemical
  "PTT": "pttplc.com",
  "PTTEP": "pttep.com",
  "PTTGC": "pttgcgroup.com",
  "TOP": "thaioilgroup.com",
  "IRPC": "irpc.co.th",
  "GPSC": "gpscgroup.com",
  "OR": "pttor.com",
  "GULF": "gulf.co.th",
  "BGRIM": "b-grimm.com",
  "RATCH": "ratch.co.th",
  "EGCO": "egco.com",
  "BANPU": "banpu.com",
  "BCP": "bangchak.co.th",

  // Banking & Finance
  "KBANK": "kasikornbank.com",
  "SCB": "scb.co.th",
  "BBL": "bangkokbank.com",
  "KTB": "ktb.co.th",
  "TMB": "ttbbank.com",
  "TTB": "ttbbank.com",
  "BAY": "krungsri.com",
  "TISCO": "tisco.co.th",
  "KKP": "kkpfg.com",
  "TCAP": "thanachartcapital.co.th",

  // Telecommunication & Technology
  "ADVANC": "ais.th",
  "TRUE": "truecorp.co.th",
  "DTAC": "dtac.co.th",
  "INTUCH": "intouchcompany.com",
  "JAS": "jasmine.com",
  "THCOM": "thaicom.net",

  // Real Estate & Construction
  "CPN": "centralpattana.co.th",
  "LH": "lh.co.th",
  "AP": "apthai.com",
  "SPALI": "spali.co.th",
  "PSH": "pruksa.com",
  "ORI": "origin.co.th",
  "SC": "scasset.com",
  "SIRI": "sansiri.com",
  "QH": "qh.co.th",
  "WHA": "wha-group.com",
  "AMATA": "amata.com",
  "HEMRAJ": "hemaraj.com",
  "SCC": "scg.com",
  "TPIPL": "tpipolene.co.th",

  // Consumer & Retail
  "CPALL": "cpall.co.th",
  "CP": "cpthailand.com",
  "CPF": "cpfworldwide.com",
  "MINT": "minor.com",
  "CRC": "centralretail.com",
  "HMPRO": "homepro.co.th",
  "BJC": "bjc.co.th",
  "MAKRO": "siammakro.co.th",
  "GLOBAL": "globalhouse.co.th",
  "COM7": "com7.co.th",
  "OSP": "osotspa.com",
  "CBG": "carabao.co.th",

  // Healthcare
  "BDMS": "bdms.co.th",
  "BH": "bumrungrad.com",
  "BCH": "bangkokchainhospital.com",
  "CHG": "chularat.com",
  "THG": "thonburihealth.com",
  "RJH": "rajavithi.go.th",

  // Transportation & Logistics
  "AOT": "airportthai.co.th",
  "BEM": "bangkokmetro.co.th",
  "BTS": "btsgroup.co.th",
  "AAV": "airasiax.com",
  "BA": "bangkokair.com",
  "THAI": "thaiairways.com",

  // Industrial & Manufacturing
  "IVL": "indorama.com",
  "DELTA": "deltathailand.com",
  "PCSGH": "pcsgh.com",
  "HANA": "hanagroup.com",
  "STA": "sritranggroup.com",
  "NER": "ner.co.th",

  // Media & Entertainment
  "BEC": "becworld.com",
  "MONO": "mono29.com",
  "GRAMMY": "grammy.co.th",
  "VGI": "vgigroup.com",
  "MAJOR": "majorcineplex.com",
  "PLANB": "planbmedia.co.th",

  // Insurance
  "BLA": "bangkoklife.com",
  "TLI": "thailife.com",
  "MTL": "muangthai.co.th",

  // Others
  "SAWAD": "sawad.co.th",
  "MTC": "mtc.co.th",
  "TIDLOR": "tidlor.com",
  "JMT": "jmt.co.th",
  "SINGER": "singer.co.th",
  "AWC": "assetworldcorp.com",
  "ASSET": "assetwise.co.th",
  "CENTEL": "centarahotelsresorts.com",
  "ERW": "theerawan.com",
  "DOHOME": "dohomeonline.com",
  "BEAUTY": "beautycommunity.co.th",
  "JMART": "jaymart.co.th",
  "KLINIQ": "thekliniq.com",
  "MEGA": "megabangna.com",
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
      const cleanTicker = ticker.trim().toUpperCase();
      logoCache.set(cleanTicker, "ERROR");
      setIsError(true);
    }
  };

  const handleImageLoad = () => {
    const cleanTicker = ticker.trim().toUpperCase();
    logoCache.set(cleanTicker, currentSrc);
  };

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 relative overflow-hidden transition-colors ${!isError && currentSrc ? "bg-white" : (isDarkMode ? "bg-white/10" : "bg-gray-100")}`}>
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


// Import from shared modules for better code splitting
import {
  ANALYSTS_DATA,
  RESEARCH_DEPTH_OPTIONS,
  SHALLOW_AGENTS,
  DEEP_AGENTS,
  REPORT_ORDER,
  SECTION_MAP,
  TEAM_KEYS,
  TEAM_TEMPLATE,
  AGENT_TO_TEAM_MAP,
} from "../lib/constants";
import { MARKET_INFO } from "../components/MarketIcons";
import { deepClone, extractDecision, toISODate } from "@/lib/helpers";
import PdfDownloadModal, { PdfOptions } from "@/components/PdfDownloadModal";
// import { translateBatch, getThaiLabel } from "@/lib/translation";

// --- Components ---

interface TickerSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  [key: string]: string | number;
}

interface Star {
  id: number;
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  opacity: number;
}

// Parse Thai content to handle JSON strings wrapped in markdown code blocks
const parseThaiContent = (content: any): any => {
  if (!content) return content;

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
        // Try to handle escaped JSON strings
        if (textValue.includes('\\n') || textValue.includes('\\"')) {
          try {
            const unescaped = textValue
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            return JSON.parse(unescaped);
          } catch {
            return null;
          }
        }
        return null;
      }
    }
    return null;
  };

  const deepParse = (obj: any): any => {
    if (typeof obj === 'string') {
      const parsed = parseFromMarkdown(obj);
      if (parsed !== null) {
        return deepParse(parsed);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => deepParse(item));
    }

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


export default function Home() {
  // Get global generation context
  const {
    // Generation State
    isRunning,
    teamState,
    reportSections: contextReportSections,
    decision: contextDecision,
    finalReportData: contextFinalReportData,
    progress: contextProgress,
    // Setters
    setReportSections: setContextReportSections,
    setFinalReportData: setContextFinalReportData,
    startGeneration,
    stopGeneration: stopPipeline,
    // Form State (persisted from context)
    ticker,
    setTicker,
    selectedMarket,
    setSelectedMarket,
    analysisDate,
    setAnalysisDate,
    researchDepth,
    setResearchDepth,
    reportLength,
    setReportLength,
    // Market Data State (persisted from context)
    marketData,
    setMarketData,
    logoSrc,
    setLogoSrc,
    logoError,
    setLogoError,
    // WebSocket State
    wsStatus,
    debugLogs,
    addDebugLog,
    // Thai Report Sections (from WebSocket)
    thaiReportSections,
  } = useGeneration();

  // Authentication
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Local State (UI-specific only)

  const { isDarkMode, toggleTheme } = useTheme();
  // Debug State
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Track last fetched ticker to avoid refetching same data
  const lastFetchedTickerRef = useRef<string>("");

  // Ticker Search State
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [marketTickers, setMarketTickers] = useState<TickerSuggestion[]>([]); // Cache for backend list
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false); // New Dropdown State
  const [logoCandidates, setLogoCandidates] = useState<string[]>([]);
  const [logoCandidateIndex, setLogoCandidateIndex] = useState(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Scroll position preservation for Popular Recommendations
  const popularListScrollPos = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const marketSelectorRef = useRef<HTMLDivElement>(null);

  // Language and Translation State
  const { language, setLanguage } = useLanguage();
  const t = TRANSLATIONS[language];
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedSections, setTranslatedSections] = useState<{ key: string; label: string; text: string; report_type: string }[]>([]);

  // Track previous isRunning to detect when generation completes
  const prevIsRunningRef = useRef<boolean>(false);

  // Initialize translatedSections from thaiReportSections on component mount (for persistence when returning from history)
  useEffect(() => {
    if (thaiReportSections.length > 0 && translatedSections.length === 0 && !isRunning) {
      // Load Thai content if it exists but translatedSections is empty (e.g., after navigation)
      try {
        const thaiSections: { key: string; label: string; text: string; report_type: string }[] = [];

        thaiReportSections.forEach((report) => {
          // Parse Thai content to handle JSON-wrapped strings
          const parsedContent = parseThaiContent(report.content);

          let textContent = "";
          if (typeof parsedContent === "object") {
            textContent = "```json\n" + JSON.stringify(parsedContent, null, 2) + "\n```";
          } else {
            textContent = String(parsedContent);
          }

          thaiSections.push({
            key: report.section,
            label: report.label,
            text: textContent,
            report_type: report.report_type,
          });
        });

        if (thaiSections.length > 0) {
          setTranslatedSections(thaiSections);
          console.log(`Initialized ${thaiSections.length} Thai sections from context`);
        }
      } catch (error) {
        console.error("Failed to initialize Thai content:", error);
      }
    }
  }, [thaiReportSections, isRunning]);

  // Build translated sections from WebSocket thaiReportSections when generation completes
  useEffect(() => {
    if (prevIsRunningRef.current === true && isRunning === false && thaiReportSections.length > 0) {
      // Generation just completed - use Thai content from WebSocket
      setIsTranslating(true);
      try {
        // Build translated sections from WebSocket Thai reports
        const thaiSections: { key: string; label: string; text: string; report_type: string }[] = [];

        thaiReportSections.forEach((report) => {
          // Parse Thai content to handle JSON-wrapped strings
          const parsedContent = parseThaiContent(report.content);

          let textContent = "";
          if (typeof parsedContent === "object") {
            textContent = "```json\n" + JSON.stringify(parsedContent, null, 2) + "\n```";
          } else {
            textContent = String(parsedContent);
          }

          thaiSections.push({
            key: report.section,
            label: report.label,
            text: textContent,
            report_type: report.report_type,
          });
        });

        if (thaiSections.length > 0) {
          setTranslatedSections(thaiSections);
          console.log(`Loaded ${thaiSections.length} Thai sections from WebSocket`);
        }
      } catch (error) {
        console.error("Failed to process Thai content:", error);
      } finally {
        setIsTranslating(false);
      }
    }
    prevIsRunningRef.current = isRunning;
  }, [isRunning, thaiReportSections]);

  // Filter translated sections based on reportLength (like English sections)
  const filteredTranslatedSections = useMemo(() => {
    if (translatedSections.length === 0) return [];

    const filtered = translatedSections.filter((section) => {
      // Check if section key indicates summary or full
      const isSummary = section.key.startsWith("Summarize_") ||
        section.key.includes("_summarizer") ||
        section.report_type === "summary";

      if (reportLength === "summary report") {
        return isSummary;
      } else {
        return !isSummary;
      }
    });

    // Sort by REPORT_ORDER to ensure consistent ordering matching English view
    return filtered.sort((a, b) => {
      const indexA = REPORT_ORDER.indexOf(a.key);
      const indexB = REPORT_ORDER.indexOf(b.key);
      // Handle cases where key might not be in REPORT_ORDER (put them at the end)
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [translatedSections, reportLength]);

  // Generate stars once for the night sky effect (reduced count for better performance)
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Reduced from 150 to 80 stars for better performance
    const generatedStars = Array.from({ length: 80 }).map((_, i) => {
      const size = Math.random() * 2 + 0.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = Math.random() * 3 + 2;
      const opacity = Math.random() * 0.8 + 0.2;

      return {
        id: i,
        size,
        left,
        top,
        delay,
        duration,
        opacity,
      };
    });
    setStars(generatedStars);
  }, []);

  // Close market selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (marketSelectorRef.current && !marketSelectorRef.current.contains(event.target as Node)) {
        setShowMarketSelector(false);
      }
    };

    if (showMarketSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMarketSelector]);

  // Fetch Full Ticker List from Backend
  const fetchMarketTickers = useCallback(async (market: string) => {
    try {
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/tickers?market=${market}`);
      if (res.ok) {
        const data = await res.json();
        setMarketTickers(data);
        // Don't override suggestions here, let the effect handle it based on ticker state
        // Reset scroll position when market changes
        popularListScrollPos.current = 0;
      }
    } catch (error) {
      console.error("Error fetching market tickers:", error);
    }
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions(marketTickers);
      // Don't auto-show - let user interaction control visibility
      return;
    }

    try {
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/search?q=${query}&market=${selectedMarket}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        // Don't auto-show - only show when user is typing
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, [marketTickers, selectedMarket]);

  // Logic: When Market changes -> Fetch Tickers for that market
  useEffect(() => {
    fetchMarketTickers(selectedMarket);
  }, [selectedMarket, fetchMarketTickers]);

  // Handle ticker changes (typing or restoration) and sync suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (ticker) {
        // Filter locally immediately: Strict "Starts With" for Symbol + Alphabetical Sort
        const cleanTicker = ticker.toLowerCase().trim();
        const localMatches = marketTickers
          .filter((item) => item.symbol.toLowerCase().startsWith(cleanTicker))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));

        setSuggestions(localMatches);

        // If ticker is long enough, fetch from API for broader search
        if (ticker.length >= 2) {
          fetchSuggestions(ticker);
        }
      } else {
        // If ticker is empty, show all popular recommendations
        if (marketTickers.length > 0) {
          setSuggestions(marketTickers);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ticker, marketTickers, fetchSuggestions]);

  // Restore scroll position for Popular Recommendations
  useEffect(() => {
    if (showSuggestions && listRef.current) {
      if (suggestions === marketTickers) {
        listRef.current.scrollTop = popularListScrollPos.current;
      } else {
        listRef.current.scrollTop = 0;
      }
    }
  }, [showSuggestions, suggestions, marketTickers]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    // Auto-show suggestions on focus for better UX (Combobox feel)
    if (!showSuggestions) {
      setShowSuggestions(true);

      if (ticker) {
        // Filter suggestions based on current input: Strict "Starts With" + Sort
        const cleanTicker = ticker.toLowerCase().trim();
        const localMatches = marketTickers
          .filter((item) => item.symbol.toLowerCase().startsWith(cleanTicker))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));

        setSuggestions(localMatches);
      } else if (marketTickers.length > 0) {
        // No input, show all popular recommendations
        setSuggestions(marketTickers);
      }
    }
  };

  const selectSuggestion = (symbol: string) => {
    // Remove .BK suffix for Thai stocks before setting ticker
    setTicker(symbol.replace('.BK', ''));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Fetch Market Data Effect - only fetch when ticker changes
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    // Skip fetch if ticker hasn't changed and we already have data
    if (marketData && lastFetchedTickerRef.current === ticker) {
      return;
    }

    const fetchMarketData = async (retries = 2) => {
      if (!isMounted) return;
      try {
        const apiUrl = getApiUrl();

        // Only clear data on initial attempt when ticker changed
        if (retries === 2 && lastFetchedTickerRef.current !== ticker) {
          setMarketData(null); // Reset while loading
          setLogoError(false); // Reset logo error
          setLogoSrc(""); // Reset logo source
          setLogoCandidates([]);
          setLogoCandidateIndex(0);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Add .BK back for Thai stocks when calling API
        const apiTicker = (selectedMarket === 'TH' && !ticker.includes('.BK')) ? `${ticker}.BK` : ticker;

        const res = await fetch(`${apiUrl}/quote/${apiTicker}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMarketData(data);
            lastFetchedTickerRef.current = ticker;

            const cleanTicker = ticker.trim().toUpperCase();
            const symbol = cleanTicker.split(".")[0].split("-")[0]; // Handle PTT.BK -> PTT, BTC-USD -> BTC
            const isThaiStock = cleanTicker.endsWith(".BK") || selectedMarket === "TH";

            let urls: string[] = [];

            if (isThaiStock) {
              // Thai stocks: Use domain mapping for accurate logos
              const domain = THAI_STOCK_DOMAINS[symbol];
              if (domain) {
                urls = [
                  // Google Favicon (reliable, free, no API key needed)
                  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                  // Brandfetch CDN (high quality, free tier available)
                  `https://cdn.brandfetch.io/${domain}/w/400/h/400`,
                  // DuckDuckGo icons (another free fallback)
                  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
                ];
              } else {
                // Unknown Thai stock: set error immediately
                setLogoCandidates([]);
                setLogoCandidateIndex(0);
                setLogoSrc("");
                setLogoError(true);
                return;
              }
            } else {
              // Non-Thai stocks: Use standard sources
              urls = [
                `https://assets.parqet.com/logos/symbol/${symbol}?format=png`,
                `https://unavatar.io/${symbol}`,
                `https://www.google.com/s2/favicons?domain=${symbol.toLowerCase()}.com&sz=128`,
              ];
            }

            setLogoCandidates(urls);
            setLogoCandidateIndex(0);
            setLogoSrc(urls[0] || "");
          }
        } else {
          throw new Error(`Status: ${res.status}`);
        }
      } catch (e: unknown) {
        if (!isMounted) return;

        // Only log error on final retry to reduce console spam
        if (retries <= 0) {
          console.warn(`Market data fetch failed for ${ticker}. Backend may not be running.`);
        }

        // Retry only once more if we have retries left
        if (retries > 0) {
          retryTimeout = setTimeout(() => fetchMarketData(retries - 1), 3000);
        }
      }
    };

    if (ticker) {
      // Debounce slightly to avoid rapid calls if typing
      const timeout = setTimeout(() => fetchMarketData(), 500);
      return () => {
        isMounted = false;
        clearTimeout(timeout);
        clearTimeout(retryTimeout);
      };
    }
  }, [ticker, marketData, setMarketData, setLogoError, setLogoSrc]);

  // Helper to format large numbers
  const formatVolume = (num: number) => {
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B";
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M";
    if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K";
    return num.toString();
  };

  // Handle Logo Error with Fallback
  const handleLogoError = () => {
    const nextIndex = logoCandidateIndex + 1;
    if (nextIndex < logoCandidates.length) {
      setLogoCandidateIndex(nextIndex);
      setLogoSrc(logoCandidates[nextIndex]);
    } else {
      setLogoError(true);
    }
  };

  // Helper to create sparkline path
  const createSparklinePath = (data: number[]) => {
    if (!data || data.length === 0) return "";
    // Filter out invalid numbers
    const validData = data.filter(n => Number.isFinite(n));
    if (validData.length < 2) return "";

    const width = 100;
    const height = 50;
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    // Create points
    const points = validData.map((val, i) => {
      const x = (i / (validData.length - 1)) * width;
      const y = height - ((val - min) / range) * height * 0.8 - height * 0.1; // Add padding
      return `${x},${y}`;
    });

    // Create area path
    return `M 0,${height} L ${points[0]} L ${points.join(" L ")} L ${width},${height} Z`;
  };

  // Create line only path
  const createLinePath = (data: number[]) => {
    if (!data || data.length === 0) return "";
    const validData = data.filter(n => Number.isFinite(n));
    if (validData.length < 2) return "";

    const width = 100;
    const height = 50;
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    const points = validData.map((val, i) => {
      const x = (i / (validData.length - 1)) * width;
      const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
      return `${x} ${y}`;
    });
    return `M ${points.join(" L ")}`;
  };


  // Ticker search should use market-specific list when focused
  useEffect(() => {
    if (!ticker) {
      setSuggestions(marketTickers);
    }
  }, [marketTickers, ticker]);

  const runPipeline = useCallback(() => {
    if (isRunning) return;

    if (wsStatus !== "connected") {
      alert("WebSocket is not connected. Please wait and try again.");
      return;
    }

    // Add .BK back for Thai stocks when calling API
    const apiTicker = (selectedMarket === 'TH' && !ticker.includes('.BK')) ? `${ticker}.BK` : ticker;

    startGeneration({
      ticker: apiTicker,
      analysisDate,
      analysts: ANALYSTS_DATA.map((a) => a.value),
      researchDepth,
      // llmProvider: "google",
      // backendUrl: getApiUrl(),
      // shallowThinker: SHALLOW_AGENTS.google[0][1],
      // deepThinker: DEEP_AGENTS.google[0][1],
      llmProvider: "deepseek",
      backendUrl: "https://api.deepseek.com",
      shallowThinker: SHALLOW_AGENTS.deepseek[0][1],
      deepThinker: DEEP_AGENTS.deepseek[0][1],
      reportLength,
    });
  }, [isRunning, wsStatus, startGeneration, ticker, analysisDate, researchDepth, reportLength]);

  const [copyFeedback, setCopyFeedback] = useState("Copy report");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleCopyReport = async () => {
    const fullText = contextReportSections
      .map((s) => `${s.label}\n${s.text}`)
      .join("\n\n");
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback("Copy report"), 1800);
    } catch (err) {
      setCopyFeedback("Copy failed");
      setTimeout(() => setCopyFeedback("Copy report"), 1800);
    }
  };

  /* 
   * PDF Generation 
   * Logic: Supports robust font loading (Thai/English), multi-language reports, and filtering
   */
  const handleOpenPdfModal = () => {
    setIsPdfModalOpen(true);
  };

  const generatePdf = async (options: PdfOptions) => {
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
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 14;

    let yPosition = margin + 20;

    // --- Helpers ---

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
      } else if (hasChinese && hasThai) {
        currentFont = "Sarabun";
      }

      let currentStyle = isBold ? "bold" : "normal";
      if (currentFont === "Maishan") currentStyle = "normal";

      doc.setFont(currentFont, currentStyle);

      const lines = doc.splitTextToSize(text, maxLineWidth - indent);

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

    const processData = (data: any, indent = 0) => {
      const KEYS_TO_HIDE = ["selected_indicators", "memory_application", "count", "conversation_history", "full_content", "indicator", "validation_notes", "metadata"];
      const KEYS_TO_SKIP = ["id", "timestamp"];

      const cleanContent = (text: string) => {
        if (!text || typeof text !== 'string') return '';
        let cleaned = text.replace(/`/g, "").trim();
        cleaned = cleaned.replace(/^#{1,6}\s+.*$/gm, '');
        cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
        cleaned = cleaned.replace(/\*\*/g, "");
        return cleaned.trim();
      };

      const toSentenceCase = (str: string) => {
        const s = str.replace(/_/g, " ");
        return s.charAt(0).toUpperCase() + s.slice(1);
      };

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (index > 0 && typeof item === 'object') {
            yPosition += 8;
            checkPageBreak(10);
          }

          if (typeof item === 'string') {
            const cleanedText = cleanContent(item);
            if (cleanedText) addText(`•  ${cleanedText}`, 10, false, indent + 5);
          } else if (typeof item === 'object') {
            let parsedItem = item;
            if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
              try { parsedItem = JSON.parse(item); } catch (e) { }
            }
            if (typeof parsedItem === 'object') {
              processData(parsedItem, indent + 10);
            } else {
              const cleanedText = cleanContent(String(parsedItem));
              if (cleanedText) addText(`•  ${cleanedText}`, 10, false, indent + 10);
            }
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          if (KEYS_TO_HIDE.includes(key)) return;
          if (KEYS_TO_SKIP.includes(key.toLowerCase())) return;
          const label = toSentenceCase(key);
          let valToProcess = value;

          if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
            try { valToProcess = JSON.parse(value); } catch (e) { }
          }

          const isComplex = typeof valToProcess === 'object' && valToProcess !== null;
          let strVal = '';
          if (!isComplex) {
            strVal = cleanContent(String(valToProcess));
          }
          const isShortText = strVal.length < 80 && !strVal.includes('\n');

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
              // Recalculate max width for local usage
              const currentMaxWidth = pageWidth - margin * 2;

              if (margin + indent + keyWidth + doc.getTextWidth(strVal) < currentMaxWidth) {
                doc.text(label + ": ", margin + indent, yPosition);
                doc.setFont("Sarabun", "normal");
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
        const cleanedVal = cleanContent(String(data));
        if (cleanedVal.trim()) addText(cleanedVal, 10, false, indent, [0, 0, 0]);
      }
    };

    // --- MAIN EXECUTION ---
    // Generate separate PDF files for each selected combination

    const languagesToProcess: ("en" | "th")[] = [];
    if (options.includeEnglish) languagesToProcess.push("en");
    if (options.includeThai && translatedSections.length > 0) languagesToProcess.push("th");

    const reportTypes: ("summary" | "full")[] = [];
    if (options.includeSummary) reportTypes.push("summary");
    if (options.includeFull) reportTypes.push("full");

    // Function to generate a single PDF
    const generateSinglePdf = (langCode: "en" | "th", reportType: "summary" | "full") => {
      const singleDoc = new jsPDF({ unit: "pt", format: "a4" });
      const isThai = langCode === "th";
      const isSummaryReport = reportType === "summary";

      // Re-add fonts to this document
      const addFontsToDoc = async () => {
        try {
          const sarabunRegular = await loadFont("/fonts/Sarabun-Regular.ttf");
          const sarabunBold = await loadFont("/fonts/Sarabun-Bold.ttf");
          if (sarabunRegular) {
            singleDoc.addFileToVFS("Sarabun-Regular.ttf", sarabunRegular);
            singleDoc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
          }
          if (sarabunBold) {
            singleDoc.addFileToVFS("Sarabun-Bold.ttf", sarabunBold);
            singleDoc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
          }
        } catch (e) {
          console.warn("Font loading failed for separate PDF");
        }
      };

      // Helper functions scoped to this document
      let docYPosition = margin + 20;

      const docDrawPageFooter = (pageNumber: number) => {
        const str = `Page ${pageNumber}`;
        singleDoc.setFontSize(8);
        singleDoc.setFont("Sarabun", "normal");
        singleDoc.setTextColor(150, 150, 150);
        singleDoc.text(str, pageWidth / 2, pageHeight - 20, { align: 'center' });
        singleDoc.text("Generated by TradingAgents", pageWidth - margin, pageHeight - 20, { align: 'right' });
      };

      const docCheckPageBreak = (neededHeight: number) => {
        if (docYPosition + neededHeight > pageHeight - margin) {
          docDrawPageFooter(singleDoc.getNumberOfPages());
          singleDoc.addPage();
          docYPosition = margin + 20;
          singleDoc.setTextColor(0, 0, 0);
          return true;
        }
        return false;
      };

      const docAddText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
        singleDoc.setFontSize(fontSize);
        singleDoc.setTextColor(color[0], color[1], color[2]);

        const hasThai = /[\u0E00-\u0E7F]/.test(text);
        const hasChinese = /[\u4E00-\u9FFF]/.test(text);

        let currentFont = "Sarabun";
        if (hasChinese && !hasThai && hasMaishan) {
          currentFont = "Maishan";
        }

        let currentStyle = isBold ? "bold" : "normal";
        if (currentFont === "Maishan") currentStyle = "normal";

        singleDoc.setFont(currentFont, currentStyle);

        const lines = singleDoc.splitTextToSize(text, maxLineWidth - indent);

        for (let i = 0; i < lines.length; i++) {
          const pageBreakTriggered = docCheckPageBreak(lineHeight);
          if (pageBreakTriggered) {
            singleDoc.setFontSize(fontSize);
            singleDoc.setFont(currentFont, currentStyle);
            singleDoc.setTextColor(color[0], color[1], color[2]);
          }
          singleDoc.text(lines[i], margin + indent, docYPosition);
          docYPosition += lineHeight;
        }
      };

      const docProcessData = (data: any, indent = 0) => {
        const KEYS_TO_HIDE = ["selected_indicators", "memory_application", "count", "conversation_history", "full_content", "indicator", "validation_notes", "metadata"];
        const KEYS_TO_SKIP = ["id", "timestamp"];

        const cleanContent = (text: string) => {
          if (!text || typeof text !== 'string') return '';
          let cleaned = text.replace(/`/g, "").trim();
          cleaned = cleaned.replace(/^#{1,6}\s+.*$/gm, '');
          cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
          cleaned = cleaned.replace(/\*\*/g, "");
          return cleaned.trim();
        };

        const toSentenceCase = (str: string) => {
          const s = str.replace(/_/g, " ");
          return s.charAt(0).toUpperCase() + s.slice(1);
        };

        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            if (index > 0 && typeof item === 'object') {
              docYPosition += 8;
              docCheckPageBreak(10);
            }

            if (typeof item === 'string') {
              const cleanedText = cleanContent(item);
              if (cleanedText) docAddText(`•  ${cleanedText}`, 10, false, indent + 5);
            } else if (typeof item === 'object') {
              docProcessData(item, indent + 10);
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (KEYS_TO_HIDE.includes(key)) return;
            if (KEYS_TO_SKIP.includes(key.toLowerCase())) return;
            const label = toSentenceCase(key);
            let valToProcess = value;

            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
              try { valToProcess = JSON.parse(value); } catch (e) { }
            }

            const isComplex = typeof valToProcess === 'object' && valToProcess !== null;
            let strVal = '';
            if (!isComplex) {
              strVal = cleanContent(String(valToProcess));
            }

            if (!isComplex && !strVal.trim()) return;

            docCheckPageBreak(20);

            if (isComplex) {
              docAddText(label + ":", 10, true, indent, [0, 0, 0]);
              docProcessData(valToProcess, indent + 15);
              docYPosition += 4;
            } else {
              docAddText(label + ":", 10, true, indent, [50, 50, 50]);
              docAddText(strVal, 10, false, indent + 15, [0, 0, 0]);
              docYPosition += 4;
            }
          });
        } else {
          const cleanedVal = cleanContent(String(data));
          if (cleanedVal.trim()) docAddText(cleanedVal, 10, false, indent, [0, 0, 0]);
        }
      };

      // Filter Sections based on report type
      const sourceList = isThai ? translatedSections : contextReportSections;
      const filteredSections = sourceList.filter(section => {
        const lowerKey = section.key.toLowerCase();
        const isSummarySection = lowerKey.includes("summar") || lowerKey.includes("summarize_") || (section as any).report_type === "summary";

        // Match the selected report type
        if (isSummaryReport) {
          return isSummarySection;
        } else {
          return !isSummarySection;
        }
      });

      if (filteredSections.length === 0) return null;

      // Header
      singleDoc.setFontSize(18);
      singleDoc.setFont("Sarabun", "bold");
      singleDoc.setTextColor(0, 51, 102);
      const langLabel = isThai ? "(ภาษาไทย)" : "(English)";
      const typeLabel = isSummaryReport ? (isThai ? "สรุป" : "Summary") : (isThai ? "ฉบับเต็ม" : "Full Report");
      singleDoc.text(`TradingAgents Report: ${ticker}`, margin, docYPosition);
      docYPosition += 20;

      singleDoc.setFontSize(12);
      singleDoc.setFont("Sarabun", "normal");
      singleDoc.setTextColor(80, 80, 80);
      singleDoc.text(`${typeLabel} ${langLabel}`, margin, docYPosition);
      docYPosition += 20;

      singleDoc.setFontSize(10);
      singleDoc.setTextColor(100, 100, 100);
      singleDoc.text(`Analysis Date: ${analysisDate}`, margin, docYPosition);
      docYPosition += 25;

      // Divider
      singleDoc.setDrawColor(200, 200, 200);
      singleDoc.setLineWidth(1);
      singleDoc.line(margin, docYPosition, pageWidth - margin, docYPosition);
      docYPosition += 25;

      // Recommendation
      if (contextDecision) {
        singleDoc.setFont("Sarabun", "bold");
        singleDoc.setFontSize(14);
        singleDoc.setTextColor(0, 200, 0);
        const recLabel = isThai ? "คำแนะนำ" : "Recommendation";
        singleDoc.text(`${recLabel}: ${contextDecision}`, margin, docYPosition);
        docYPosition += 15;
      }

      // Render Sections
      filteredSections.forEach((section: any) => {
        docCheckPageBreak(60);

        // Section Header
        singleDoc.setFillColor(245, 245, 245);
        singleDoc.rect(margin, docYPosition - 12, maxLineWidth, 24, 'F');

        singleDoc.setFontSize(13);
        singleDoc.setFont("Sarabun", "bold");
        singleDoc.setTextColor(0, 0, 0);
        singleDoc.text(section.label, margin + 8, docYPosition + 5);
        docYPosition += 30;

        let contentData: any = section.text;
        try {
          if (typeof section.text === 'string') {
            const cleanJsonStr = section.text.replace(/```json/g, "").replace(/```/g, "").trim();
            if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
              contentData = JSON.parse(cleanJsonStr);
            }
          }
        } catch (e) { }

        docProcessData(contentData);
        docYPosition += 25;
      });

      docDrawPageFooter(singleDoc.getNumberOfPages());

      // Generate filename
      const langSuffix = isThai ? "TH" : "EN";
      const typeSuffix = isSummaryReport ? "Summary" : "Full";
      const filename = `TradingAgents_${ticker}_${analysisDate}_${typeSuffix}_${langSuffix}.pdf`;

      return { doc: singleDoc, filename };
    };

    // Generate PDFs for each selected combination
    const pdfPromises: Promise<void>[] = [];

    for (const langCode of languagesToProcess) {
      for (const reportType of reportTypes) {
        const result = generateSinglePdf(langCode, reportType);
        if (result) {
          // Small delay between downloads to prevent browser blocking
          pdfPromises.push(
            new Promise(resolve => {
              setTimeout(() => {
                result.doc.save(result.filename);
                resolve();
              }, pdfPromises.length * 500);
            })
          );
        }
      }
    }

    await Promise.all(pdfPromises);
  };

  // Handle language change (for viewing translated content in UI)
  // Thai content should already be pre-translated during report generation
  // For reports generated after the update, Thai content will be available
  // For old reports, we just switch to show Thai labels (content stays English)
  const handleLanguageChange = (lang: "en" | "th") => {
    setLanguage(lang);
    // No need to call translation API - Thai content is pre-loaded from database
    // or already translated during generation
  };

  // Render Helpers

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (AuthContext will handle redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full font-sans transition-colors duration-300 relative flex flex-col ${isDarkMode
        ? "bg-[#020617] text-[#f8fbff]"
        : "bg-[#F6F9FC] text-[#0F172A]"
        }`}
    >
      {/* Starry Night Sky Effect - Dark Mode */}
      {isDarkMode && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  opacity: star.opacity,
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                }}
              />
            ))}
          </div>
          <style jsx>{`
            @keyframes twinkle {
              0%, 100% {
                opacity: 0.2;
                transform: scale(1);
              }
              50% {
                opacity: 1;
                transform: scale(1.2);
              }
            }
          `}</style>
        </>
      )}

      {/* Light Mode Background - Subtle blue gradient */}
      {!isDarkMode && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-[#F6F9FC] via-[#F1F5F9] to-[#F6F9FC]" />
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.03),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.04),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.05),transparent_60%)] animate-[gradient_18s_ease_infinite] opacity-60"
          />
          <style jsx>{`
            @keyframes gradient {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </>
      )}





      <main className="flex-1 flex flex-col gap-4 px-4 py-4 md:px-8 md:py-6 relative z-10 overflow-y-auto">
        <header className="flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-6">
            <h1
              className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDarkMode ? "text-[#f8fbff]" : "text-[#0F172A]"
                }`}
            >
              {t.title}
            </h1>
          </div>

        </header>

        {connectionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {connectionError}
          </div>
        )}

        <div className="flex flex-col gap-4 shrink-0">
          {/* Step Grid */}
          <section className="grid grid-cols-12 gap-4 md:gap-6">
            {/* Step 1: Symbol Selection */}
            <article className={`col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between rounded-[20px] border p-4 md:p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
                {t.step1}
              </h2>

              <div className="flex items-center gap-3">
                {/* Custom Market Select Dropdown - Compact Flag Only */}
                <div
                  ref={marketSelectorRef}
                  className="relative z-30 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setShowMarketSelector(!showMarketSelector)}
                    className={`flex items-center justify-center gap-2 h-[46px] w-[70px] rounded-xl border transition-colors cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] hover:bg-white/5" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/30"}`}
                  >
                    <span className="text-xl">{MARKET_INFO[selectedMarket]?.icon || "?"}</span>
                    <svg className={`w-3 h-3 ${isDarkMode ? "text-gray-400" : "text-[#334155]"} transition-transform ${showMarketSelector ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Market Dropdown Menu */}
                  {showMarketSelector && (
                    <div className={`absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? "bg-[#1a2133] border-white/10" : "bg-white border-[#E2E8F0] shadow-lg"}`}>
                      {Object.entries(MARKET_INFO).map(([key, info]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedMarket(key);
                            setTicker(""); // Clear ticker when changing market
                            setSuggestions([]);
                            setShowMarketSelector(false);
                            fetchMarketTickers(key);
                          }}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${key === selectedMarket ? (isDarkMode ? "bg-white/10 text-white" : "bg-[#EFF6FF] text-[#2563EB]") : (isDarkMode ? "text-gray-300 hover:bg-white/5" : "text-[#334155] hover:bg-[#F8FAFC]")}`}
                        >
                          {info.icon}
                          <span className="font-medium">{info.label}</span>
                          {key === selectedMarket && <span className="ml-auto text-xs opacity-60">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ticker Input */}
                <div className="relative flex-1 z-30">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={t.search.placeholder}
                    value={ticker.replace(/\.BK$/, '')}
                    onChange={handleTickerChange}
                    onFocus={handleInputFocus}
                    onClick={() => {
                      if (!showSuggestions) {
                        setShowSuggestions(true);
                        // If we have text, keep current suggestions (which might be search results), 
                        // otherwise show market defaults
                        if ((!ticker || ticker.length < 2) && marketTickers.length > 0) {
                          setSuggestions(marketTickers);
                        }
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`w-full rounded-xl border pl-10 pr-10 py-2.5 h-[46px] cursor-pointer font-medium ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff] placeholder-gray-500" : "border-[#E2E8F0] bg-white text-[#0F172A]"}`}
                  />

                  {/* Dropdown Chevron Indicator */}
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                    <svg className={`w-4 h-4 transition-transform ${showSuggestions ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      ref={listRef}
                      onScroll={(e) => {
                        if (suggestions === marketTickers) {
                          popularListScrollPos.current = e.currentTarget.scrollTop;
                        }
                      }}
                      className={`absolute left-0 top-full z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border py-1 shadow-lg ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-[#E2E8F0] bg-white shadow-lg"}`}
                    >
                      <li className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? "bg-white/5 text-gray-400 opacity-50" : "bg-[#F8FAFC] text-[#64748B]"}`}>
                        {ticker.length < 2 ? t.search.popular : t.search.results}
                      </li>
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => selectSuggestion(item.symbol)}
                          className={`cursor-pointer px-4 py-2 text-sm flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-white/5 text-gray-200" : "hover:bg-[#F8FAFC] text-[#334155]"}`}
                        >
                          <div>
                            <span className={`font-bold ${isDarkMode ? "" : "text-[#0F172A]"}`}>{item.symbol.replace('.BK', '')}</span>
                            <span className={`ml-2 text-xs ${isDarkMode ? "opacity-70" : "text-[#334155]"}`}>{item.name}</span>
                          </div>
                          <span className={`text-[10px] border rounded px-1 ${isDarkMode ? "opacity-50" : "border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]"}`}>{item.exchange}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>

            {/* Step 2: Analysis Date */}
            <article className={`col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between rounded-[20px] border p-4 md:p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
                {t.step2}
              </h2>

              <div className="relative w-full">
                {/* Styled Date Input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={analysisDate}
                  onChange={(e) => setAnalysisDate(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 h-[46px] cursor-pointer font-medium transition-all ${isDarkMode
                    ? "border-white/10 bg-[#1a2133] text-[#f8fbff] hover:border-[#2df4c6]/50 scheme-dark"
                    : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB] scheme-light"
                    }`}
                />
              </div>
            </article>

            {/* Live Market Data Card */}
            <article className={`col-span-12 md:col-span-8 lg:col-span-4 relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
              {/* Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2df4c6] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2df4c6]"></span>
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
                    {t.marketData}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-[#8b94ad] opacity-70" : "text-[#334155]"}`}>
                  {marketData?.sector || t.sector}
                </span>
              </div>

              {/* Main Info Row */}
              <div className="relative z-10 flex items-center justify-between mt-1">
                {/* Price & Change */}
                <div className="flex flex-col">
                  {marketData ? (
                    <div className="flex items-baseline gap-3">
                      <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>${marketData.price?.toFixed(2)}</span>
                      <span className={`text-sm font-bold ${marketData.change >= 0 ? "text-[#2df4c6]" : "text-[#ff4d6d]"}`}>
                        {marketData.change > 0 ? "↑" : "↓"} {Math.abs(marketData.percentChange).toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className={`animate-pulse text-2xl font-bold opacity-50 ${isDarkMode ? "" : "text-[#334155]"}`}>{t.status.loading}</span>
                  )}

                  {marketData && (
                    <span className="text-xs text-[#8b94ad] mt-1 font-medium uppercase tracking-wide">
                      Vol: {formatVolume(marketData.volume)}
                    </span>
                  )}
                </div>

                {/* Sparkline (Right side) */}
                <div className="w-[200px] h-[60px] -mr-4">
                  <svg viewBox="0 0 100 50" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {marketData?.sparkline ? (
                      <>
                        <path d={createSparklinePath(marketData.sparkline)} fill="url(#chartGradient)" stroke="none" />
                        <path d={createLinePath(marketData.sparkline)} fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5 L 100 50 L 0 50 Z" fill="url(#chartGradient)" stroke="none" />
                        <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5" fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </article>

            {/* Generate / Stop Button */}
            <article className={`col-span-12 md:col-span-4 lg:col-span-2 flex items-center justify-center rounded-[20px] overflow-hidden relative shadow-lg shadow-[#00dc82]/20`}>
              {isRunning ? (
                <button
                  onClick={stopPipeline}
                  className="flex w-full h-full flex-col items-center justify-center gap-2 bg-[#ff4d6d] text-white transition-all hover:bg-[#ff3355] cursor-pointer"
                >
                  <div className="h-3 w-3 rounded-[1px] bg-white mb-1" />
                  <span className="text-sm font-bold uppercase tracking-widest">{t.stop}</span>
                </button>
              ) : (
                <button
                  onClick={runPipeline}
                  disabled={wsStatus !== "connected"}
                  className={`flex w-full h-full flex-col items-center justify-center gap-2 bg-[#00dc82] text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#00c976] transition-all cursor-pointer`}
                >
                  <div className="mb-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7-11-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{t.generate}</span>
                </button>
              )}
            </article>
          </section>

          {/* Symbol / Signal / Recommendation */}
        </div>

        {/* Teams Grid */}
        <section className="hidden grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 relative z-0 rounded-[16px]">
          {TEAM_KEYS.map((teamKey, index) => {
            const members = teamState[teamKey];
            const completedCount = members.filter(
              (m: { status: string; }) => m.status === "completed"
            ).length;
            const progress = Math.round(
              (completedCount / members.length) * 100
            );

            // Logic: Show "Completed" (Green) only if:
            // 1. The entire team is finished
            // 2. OR the next team has already started working
            const isTeamFinished = members.every((m) => m.status === "completed");
            const nextTeamKey = TEAM_KEYS[index + 1];
            const isNextTeamStarted = nextTeamKey
              ? teamState[nextTeamKey].some((m) => m.status !== "pending")
              : false;

            const showGreenCompletion = isTeamFinished || isNextTeamStarted;

            // Logic: Show "Error" (Red) only if:
            // 1. The generation is complete (not running and decision exists)
            // 2. AND all members of this team are still pending
            const isGenerationComplete = !isRunning && contextDecision && contextDecision !== "Awaiting run";
            const isAllPending = members.every((m) => m.status === "pending");
            const showError = isGenerationComplete && isAllPending;

            let headerTitle = "";
            if (teamKey === "analyst") {
              headerTitle = t.teams.analyst.title;
            } else if (teamKey === "research") {
              headerTitle = t.teams.research.title;
            } else if (teamKey === "trader") {
              headerTitle = t.teams.trader.title;
            } else if (teamKey === "risk") {
              headerTitle = t.teams.risk.title;
            } else if (teamKey === "portfolio") {
              headerTitle = t.teams.portfolio.title;
            }

            return (
              <article
                key={teamKey}
                className={`flex flex-col gap-2 md:gap-3 rounded-xl border p-2 md:p-3 ${showError
                  ? "border-red-500 bg-red-50/10"
                  : isDarkMode
                    ? "border-white/5 bg-[#111726]"
                    : "border-[#2563EB]/25 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(37,99,235,0.15)]"
                  }`}
              >
                <header className="flex items-center justify-between gap-2 md:gap-3">
                  <div>
                    <p className={`text-sm md:text-base font-bold ${isDarkMode ? "text-white" : "text-[#0F172A]"}`}>
                      {headerTitle}
                    </p>
                  </div>
                  <div
                    className="relative grid h-8 w-8 md:h-10 md:w-10 shrink-0 place-items-center rounded-full"
                    style={{
                      background: isDarkMode
                        ? `conic-gradient(#2df4c6 ${(progress / 100) * 360}deg, rgba(255,255,255,0.05) 0deg)`
                        : `conic-gradient(#2563EB ${(progress / 100) * 360}deg, rgba(226,232,240,0.5) 0deg)`,
                      transition: "background 1s ease-out",
                    }}
                  >
                    <div className={`absolute inset-[3px] md:inset-[4px] rounded-full ${isDarkMode ? "bg-[#111726]" : "bg-white/80"}`}></div>
                    <span className="relative text-[10px] md:text-xs font-bold">{progress}%</span>
                  </div>
                </header>
                {!isTeamFinished && (
                  <ul className="flex flex-col gap-1 md:gap-1.5">
                    {members.map((member, idx) => {
                      // Translation for role and status
                      // @ts-ignore
                      // @ts-ignore
                      const memberRole = t.roles[member.name] || member.name;

                      let effectiveStatus = member.status;
                      if (member.status === "pending" && !isRunning && contextProgress === 0) {
                        effectiveStatus = "ready";
                      }

                      // @ts-ignore
                      let statusLabel = t.progressStatus[effectiveStatus] || effectiveStatus;

                      let statusColorClass = "";

                      if (effectiveStatus === "completed") {
                        statusColorClass = isDarkMode
                          ? "bg-[#1D4ED8]/20 text-[#2563EB]"
                          : "bg-[#DBEAFE] text-[#1D4ED8]";
                      } else if (effectiveStatus === "pending") {
                        statusColorClass = isDarkMode ? "bg-[#f9a826]/10 text-[#f9a826]" : "bg-[#EFF6FF] text-[#2563EB]";
                      } else if (effectiveStatus === "ready") {
                        statusColorClass = isDarkMode ? "bg-[#64748B]/20 text-[#94A3B8]" : "bg-[#F1F5F9] text-[#64748B]";
                      } else if (effectiveStatus === "in_progress") {
                        statusColorClass = isDarkMode ? "bg-[#3db8ff]/10 text-[#3db8ff]" : "bg-[#DBEAFE] text-[#2563EB]";
                      } else {
                        statusColorClass = "bg-[#ff4d6d]/10 text-[#ff4d6d]";
                      }

                      return (
                        <li
                          key={idx}
                          className={`flex flex-wrap items-center justify-between gap-y-1 text-xs md:text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}
                        >
                          <span className={`truncate max-w-[100px] md:max-w-none ${isDarkMode ? "" : "text-[#334155]"}`}>{memberRole}</span>
                          <span
                            className={`inline-flex items-center gap-1 leading-none rounded-full px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs capitalize ${statusColorClass}`}
                          >
                            {(member.status === "in_progress" || (member.status === "pending" && isRunning)) && (
                              <svg className="h-2.5 w-2.5 md:h-3 md:w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                            {statusLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </section>

        {/* Symbol / Signal / Recommendation - Only show after generation */}
        {contextDecision && (
          <section
            className={`flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 rounded-[20px] px-4 sm:px-6 py-2 sm:py-3 ${isDarkMode ? "bg-[#0f172a] border border-white/5" : "bg-white border-[#E2E8F0] shadow-sm"
              }`}
          >
            {/* Selected Asset */}
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[150px] items-center sm:items-start">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-[#64748b]" : "text-[#334155]"
                  }`}
              >
                {t.signal.asset}
              </span>
              <div className="flex items-center gap-3">
                {ticker && <StockLogo ticker={ticker} isDarkMode={isDarkMode} />}
                <div
                  className={`text-lg sm:text-xl font-bold tracking-wide ${isDarkMode ? "text-white" : "text-[#0F172A]"
                    }`}
                >
                  {ticker ? ticker.replace('.BK', '') : "—"}
                  <span
                    className={`ml-1 text-xs sm:text-sm ${isDarkMode ? "text-[#64748b]" : "text-[#334155]"
                      }`}
                  >
                    {selectedMarket ? `:${selectedMarket.toUpperCase()}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Signal Strength */}
            <div className="flex flex-col items-center gap-2 flex-1 w-full sm:w-auto">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-[#64748b]" : "text-[#334155]"
                  }`}
              >
                {t.signal.strength}
              </span>
              <div className="flex flex-col items-center gap-1">
                {/* Visual Bars */}
                <div className="flex gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const pc = Number(marketData?.percentChange || 0);
                    let active = false;
                    let colorClass = "bg-[#334155]"; // Inactive color (slate-700)

                    if (pc > 0) { // Bullish
                      if (i === 1) active = true;
                      if (i === 2 && pc > 0.5) active = true;
                      if (i === 3 && pc > 1.5) active = true;
                      if (i === 4 && pc > 3.0) active = true;
                      if (i === 5 && pc > 5.0) active = true;
                      if (active) colorClass = "bg-[#2df4c6] shadow-[0_0_8px_rgba(45,244,198,0.4)]";
                    } else if (pc < 0) { // Bearish
                      if (i === 1) active = true;
                      if (i === 2 && pc < -0.5) active = true;
                      if (i === 3 && pc < -1.5) active = true;
                      if (i === 4 && pc < -3.0) active = true;
                      if (i === 5 && pc < -5.0) active = true;
                      if (active) colorClass = "bg-[#ff4500] shadow-[0_0_8px_rgba(255,69,0,0.4)]"; // Orange-Red style
                    }

                    return (
                      <div key={i} className={`h-1 w-8 sm:w-12 rounded-sm transition-all duration-500 ${colorClass}`} />
                    );
                  })}
                </div>

                {/* Status Text Below Bars */}
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 ${Number(marketData?.percentChange || 0) > 0
                    ? "text-[#2df4c6]"
                    : Number(marketData?.percentChange || 0) < 0
                      ? "text-[#ff4500]"
                      : isDarkMode
                        ? "text-gray-400"
                        : "text-[#334155]"
                    }`}
                >
                  {(() => {
                    const pc = Number(marketData?.percentChange);
                    if (!Number.isFinite(pc)) return "—";
                    if (pc <= -2) return t.status.strongBear;
                    if (pc < 0) return t.status.bear;
                    if (pc >= 2) return t.status.strongBull;
                    if (pc > 0) return t.status.bull;
                    return t.status.neutral;
                  })()}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto sm:min-w-[150px]">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-[#64748b]" : "text-[#334155]"
                  }`}
              >
                {t.signal.recommendation}
              </span>

              <button
                type="button"
                className={`h-[32px] sm:h-[36px] px-4 sm:px-6 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wide transition-transform active:scale-95 ${(contextDecision || "").toLowerCase().includes("sell")
                  ? "bg-[#ff4500] text-white shadow-lg shadow-[#ff4500]/25"
                  : (contextDecision || "").toLowerCase().includes("buy")
                    ? "bg-[#2df4c6] text-[#0f172a] shadow-lg shadow-[#2df4c6]/25"
                    : "bg-[#334155] text-white"
                  }`}
              >
                {contextDecision === "Awaiting run" ? t.signal.awaitingRun : (contextDecision || "—")}
              </button>
            </div>
          </section>
        )}

        {/* Report Panel */}
        <div className="flex-1 min-h-[200px] sm:min-h-0 mt-2 flex flex-col">
          <ReportSections
            reportSections={language === "th" && filteredTranslatedSections.length > 0 ? filteredTranslatedSections : contextReportSections}
            isDarkMode={isDarkMode}
            ticker={ticker}
            analysisDate={analysisDate}
            decision={contextDecision}
            copyFeedback={copyFeedback}
            setCopyFeedback={setCopyFeedback}
            handleCopyReport={handleCopyReport}
            handleDownloadPdf={handleOpenPdfModal}
            reportLength={reportLength}
            setReportLength={setReportLength}
            isRunning={isRunning}
            language={language}
            setLanguage={setLanguage}
            isTranslating={isTranslating}
            teamState={teamState}
            telegramData={(() => {
              // 1. Calculate Telegram Data (Always Summary)
              let telegramSections: any[] = [];
              const isThai = language === "th" && translatedSections.length > 0;
              const sourceSections = isThai ? translatedSections : contextReportSections;

              if (isThai) {
                telegramSections = sourceSections.filter((section) => {
                  const isSummary = section.key.startsWith("Summarize_") ||
                    section.key.includes("_summarizer");
                  return isSummary;
                }).sort((a, b) => {
                  const indexA = REPORT_ORDER.indexOf(a.key);
                  const indexB = REPORT_ORDER.indexOf(b.key);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });
              } else {
                // For English, we need to re-derive from finalReportData because contextReportSections is already filtered by view
                // If we have finalReportData, we can re-create the summary list
                if (contextFinalReportData) {
                  const sections: any[] = [];
                  REPORT_ORDER.forEach((key) => {
                    const content = contextFinalReportData[key];
                    if (content && SECTION_MAP[key]) {
                      const entry = SECTION_MAP[key];
                      // FORCE SUMMARY ONLY
                      if (entry.label.includes("(Summary)")) {
                        let textContent = "";
                        if (typeof content === "object") {
                          textContent = "```json\n" + JSON.stringify(content, null, 2) + "\n```";
                        } else {
                          textContent = String(content);
                        }
                        sections.push({
                          key: SECTION_MAP[key].key,
                          label: SECTION_MAP[key].label,
                          text: textContent,
                        });
                      }
                    }
                  });
                  telegramSections = sections;
                } else {
                  // Fallback if no final data (e.g. still running or partial)
                  // If current view is Summary, use it. If Full, we might miss data if context cleans it up.
                  // But GenerationContext usually keeps all data in finalReportData.
                  // If contextReportSections contains summaries (even if hidden? no, context filters them).
                  // So we MUST use contextFinalReportData as done above.
                  telegramSections = [];
                }
              }
              return telegramSections;
            })()}
          />
          <PdfDownloadModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            onDownload={generatePdf}
            isDarkMode={isDarkMode}
            hasThaiContent={translatedSections.length > 0}
            currentLanguage={language}
          />
        </div>


      </main>
    </div >
  );
}
