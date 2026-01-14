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
import { translateBatch, getThaiLabel } from "@/lib/translation";

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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Language and Translation State
  const [language, setLanguage] = useState<"en" | "th">("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedSections, setTranslatedSections] = useState<{ key: string; label: string; text: string; report_type: string }[]>([]);

  // Track previous isRunning to detect when generation completes
  const prevIsRunningRef = useRef<boolean>(false);

  // Build translated sections from WebSocket thaiReportSections when generation completes
  useEffect(() => {
    if (prevIsRunningRef.current === true && isRunning === false && thaiReportSections.length > 0) {
      // Generation just completed - use Thai content from WebSocket
      setIsTranslating(true);
      try {
        // Build translated sections from WebSocket Thai reports
        const thaiSections: { key: string; label: string; text: string; report_type: string }[] = [];

        thaiReportSections.forEach((report) => {
          let textContent = "";
          if (typeof report.content === "object") {
            textContent = "```json\n" + JSON.stringify(report.content, null, 2) + "\n```";
          } else {
            textContent = String(report.content);
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

    return translatedSections.filter((section) => {
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

  // Fetch Full Ticker List from Backend
  const fetchMarketTickers = useCallback(async (market: string) => {
    try {
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/tickers?market=${market}`);
      if (res.ok) {
        const data = await res.json();
        setMarketTickers(data);
        if (ticker.length < 2) {
          setSuggestions(data);
        }
      }
    } catch (error) {
      console.error("Error fetching market tickers:", error);
    }
  }, [ticker]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions(marketTickers);
      return;
    }

    try {
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/search?q=${query}&market=${selectedMarket}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, [marketTickers, selectedMarket]);

  // Logic: When Market changes -> Fetch Tickers for that market
  useEffect(() => {
    fetchMarketTickers(selectedMarket);
    // Note: we don't clear suggestions immediately here because fetch will update them
  }, [selectedMarket, fetchMarketTickers]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length < 2) {
      // Revert to backend list if input cleared
      setSuggestions(marketTickers);
      setShowSuggestions(true);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    setShowSuggestions(true);
    // Always show the full list on focus so user can switch easily
    setSuggestions(marketTickers);

    // Optional: Select text (if it's a focus event) for quick replacement, 
    // unless it's a click where user might want to place cursor
    if (e.type === 'focus') {
      (e.target as HTMLInputElement).select();
    }
  };

  const selectSuggestion = (symbol: string) => {
    setTicker(symbol);
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
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const res = await fetch(`${apiUrl}/quote/${ticker}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMarketData(data);
            lastFetchedTickerRef.current = ticker;

            // Smarter Logo Logic:
            // 1. Try provided logo_url
            // 2. If website exists, try Google Favicon (reliable for global sites)
            // 3. Fallback to clearbit in JSX onError
            if (data.logo_url) {
              setLogoSrc(data.logo_url);
            } else if (data.website) {
              // Clean website url to get domain
              try {
                const domain = new URL(data.website).hostname;
                setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
              } catch (e) {
                setLogoSrc("");
              }
            } else {
              setLogoSrc("");
            }
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
    // If current logo failed, try fallback strategy
    if (marketData?.website && !logoSrc.includes("google.com")) {
      try {
        const domain = new URL(marketData.website).hostname;
        setLogoSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        return;
      } catch (e) {
        // Failed to parse URL, proceed to error
      }
    }
    setLogoError(true);
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

    startGeneration({
      ticker,
      analysisDate,
      analysts: ANALYSTS_DATA.map((a) => a.value),
      researchDepth,
      llmProvider: "google",
      backendUrl: getApiUrl(),
      shallowThinker: SHALLOW_AGENTS.google[0][1],
      deepThinker: DEEP_AGENTS.google[0][1],
      // llmProvider: "deepseek",
      // backendUrl: "https://api.deepseek.com",
      // shallowThinker: SHALLOW_AGENTS.deepseek[0][1],
      // deepThinker: DEEP_AGENTS.deepseek[0][1],
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

  const handleDownloadPdf = async () => {
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

    // รายการ Key ที่ต้องการซ่อน
    const KEYS_TO_HIDE = [
      "selected_indicators", "memory_application", "count",
      "indicator", "validation_notes", "metadata"
    ];

    // --- Helpers ---

    const drawPageFooter = (pageNumber: number) => {
      const str = `Page ${pageNumber}`;
      doc.setFontSize(8);
      // Determine font for footer (numbers are safe in Sarabun)
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
        // Reset style after new page
        doc.setTextColor(0, 0, 0);
        return true;
      }
      return false;
    };

    // ฟังก์ชันพิมพ์ข้อความแบบรองรับการตัดบรรทัดอัตโนมัติ และเปลี่ยน Font ตามภาษา
    const addText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      // Simple language detection
      // Check for Thai characters
      const hasThai = /[\u0E00-\u0E7F]/.test(text);
      // Check for Chinese characters
      const hasChinese = /[\u4E00-\u9FFF]/.test(text);

      let currentFont = "Sarabun"; // Default to Sarabun (covers Eng + Thai)
      if (hasChinese && !hasThai && hasMaishan) {
        currentFont = "Maishan";
      } else if (hasChinese && hasThai) {
        // Mixed content: Prioritize Thai (Sarabun) as it is likely the primary context
        currentFont = "Sarabun";
      }

      // Check if we requested bold but the font doesn't support it (Maishan might only have normal)
      let currentStyle = isBold ? "bold" : "normal";
      if (currentFont === "Maishan") {
        currentStyle = "normal"; // Assuming Maishan only has normal
      }

      doc.setFont(currentFont, currentStyle);

      const lines = doc.splitTextToSize(text, maxWidth - indent);

      for (let i = 0; i < lines.length; i++) {
        const pageBreakTriggered = checkPageBreak(lineHeight);
        if (pageBreakTriggered) {
          // Re-apply style if page break happened
          doc.setFontSize(fontSize);
          doc.setFont(currentFont, currentStyle);
          doc.setTextColor(color[0], color[1], color[2]);
        }

        doc.text(lines[i], margin + indent, yPosition);
        yPosition += lineHeight;
      }
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

    const toSentenceCase = (str: string) => {
      const s = str.replace(/_/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    // Keys to skip (not display in PDF)
    const KEYS_TO_SKIP = ['text', 'raw', 'raw_content', 'markdown'];

    // --- Recursive Data Processor (Logic หลักที่คุณต้องการ) ---
    const processData = (data: any, indent = 0) => {
      if (!data) return;

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            // เส้นคั่นระหว่าง Item ใน Array
            if (index > 0) {
              yPosition += 8;
              checkPageBreak(10);
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.5);
              doc.line(margin + indent, yPosition, pageWidth - margin, yPosition);
              yPosition += 12;
            }
            processData(item, indent);
            yPosition += 4;
          } else {
            // Text ใน Array
            let parsedItem = item;
            if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
              try { parsedItem = JSON.parse(item); } catch (e) { }
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

          // Parse JSON String inside Value
          if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
            try { valToProcess = JSON.parse(value); } catch (e) { }
          }

          // DECISION LOGIC: Inline vs Block
          const isComplex = typeof valToProcess === 'object' && valToProcess !== null;

          // Clean string values before display
          let strVal = '';
          if (!isComplex) {
            strVal = cleanContent(String(valToProcess)).replace(/\*\*/g, ""); // ลบ Markdown bold
          }
          const isShortText = strVal.length < 80 && !strVal.includes('\n');

          // Skip empty values
          if (!isComplex && !strVal.trim()) return;

          checkPageBreak(20); // เช็คก่อนเริ่ม Key ใหม่

          if (isComplex) {
            // Case 1: Complex Object -> Block Style (หัวข้ออยู่บรรทัดบน)
            addText(label + ":", 10, true, indent, [0, 0, 0]); // สีดำ
            processData(valToProcess, indent + 15);
            yPosition += 4;
          } else {
            if (isShortText) {
              // Case 2: Short Text -> Inline Style (หัวข้อและเนื้อหาอยู่บรรทัดเดียวกัน)
              doc.setFontSize(10);
              doc.setFont("Sarabun", "bold");
              doc.setTextColor(50, 50, 50); // Key สีเทาเข้ม
              const keyWidth = doc.getTextWidth(label + ": ");

              // Detect value language for inline text
              const hasThai = /[\u0E00-\u0E7F]/.test(strVal);
              const hasChinese = /[\u4E00-\u9FFF]/.test(strVal);
              let valFont = "Sarabun";
              if (hasChinese && !hasThai && hasMaishan) valFont = "Maishan";

              // Check width with correct font
              doc.setFont(valFont, "normal");
              const valWidth = doc.getTextWidth(strVal);

              // เช็คว่าพื้นที่พอมั้ย
              if (margin + indent + keyWidth + valWidth < maxWidth) {
                // Draw Label
                doc.setFont("Sarabun", "bold");
                doc.setTextColor(50, 50, 50);
                doc.text(label + ": ", margin + indent, yPosition);

                // Draw Value
                doc.setFont(valFont, "normal");
                doc.setTextColor(0, 0, 0); // Value สีดำ
                doc.text(strVal, margin + indent + keyWidth, yPosition);
                yPosition += lineHeight;
              } else {
                // ถ้าไม่พอ ให้ปัดลง
                addText(label + ":", 10, true, indent, [50, 50, 50]);
                addText(strVal, 10, false, indent + 15, [0, 0, 0]);
              }
            } else {
              // Case 3: Long Text -> Block Indented
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

    // --- เริ่มวาด PDF ---

    // 1. Main Header
    doc.setFontSize(18);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(0, 51, 102); // Navy Blue
    doc.text(`TradingAgents Report: ${ticker}`, margin, yPosition);
    yPosition += 20;

    // Sub-header
    doc.setFontSize(10);
    doc.setFont("Sarabun", "normal");
    doc.setTextColor(100, 100, 100); // Gray
    doc.text(`Analysis Date: ${analysisDate}`, margin, yPosition);
    yPosition += 25;

    // เส้นคั่น
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 25;

    // 2. Recommendation Section
    // (สมมติว่า decision อยู่ใน props หรือ state ของ component นี้)
    if (contextDecision) {
      yPosition += lineHeight * 1.5;
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 200, 0);
      doc.text(`Recommendation: ${contextDecision}`, margin, yPosition);
      yPosition += lineHeight * 2;
    }

    // 4. Render Report Sections
    doc.setFont("Sarabun", "normal");
    doc.setFontSize(11);
    contextReportSections.forEach((section: any) => {
      checkPageBreak(60);

      // Section Header Background
      doc.setFillColor(245, 245, 245); // Light Gray Background
      doc.rect(margin, yPosition - 12, maxWidth, 24, 'F');

      // Section Title
      doc.setFontSize(13);
      doc.setFont("Sarabun", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.label, margin + 8, yPosition + 5);
      yPosition += 30;


      // Prepare Content
      let contentData: any = section.text;
      try {
        if (typeof section.text === 'string') {
          // Clean markdown json blocks if any
          const cleanJsonStr = section.text.replace(/```json/g, "").replace(/```/g, "").trim();
          if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
            contentData = JSON.parse(cleanJsonStr);
          }
        }
      } catch (e) { }

      // Render Content
      processData(contentData);

      yPosition += 25; // Spacing between sections
    });

    // 4. Footer Last Page
    drawPageFooter(doc.getNumberOfPages());

    // Save
    doc.save(`TradingAgents_${ticker}_${analysisDate}.pdf`);
  };

  // Handle Thai PDF Download - Translates content first using Typhoon API
  const handleDownloadPdfThai = async () => {
    setIsTranslating(true);

    try {
      // Extract all text content from report sections
      const textsToTranslate: string[] = [];
      const jsonContents: (object | null)[] = [];

      contextReportSections.forEach((section) => {
        if (typeof section.text === 'string') {
          // Try to parse JSON first
          const trimmed = section.text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed.replace(/```json/g, '').replace(/```/g, ''));
              // Flatten object values for translation
              const textValues: string[] = [];
              const extractTexts = (obj: object): void => {
                Object.values(obj).forEach((val) => {
                  if (typeof val === 'string' && val.trim()) {
                    textValues.push(val);
                  } else if (typeof val === 'object' && val !== null) {
                    extractTexts(val);
                  }
                });
              };
              extractTexts(parsed);
              textsToTranslate.push(textValues.join('\n\n---SEPARATOR---\n\n'));
              jsonContents.push(parsed);
            } catch {
              textsToTranslate.push(section.text);
              jsonContents.push(null);
            }
          } else {
            textsToTranslate.push(section.text);
            jsonContents.push(null);
          }
        } else {
          textsToTranslate.push(String(section.text));
          jsonContents.push(null);
        }
      });

      // Translate all texts in batch
      const translatedTexts = await translateBatch(textsToTranslate, "stock market financial analysis report");

      // Create translated sections with Thai labels
      const thaiSections = contextReportSections.map((section, idx) => ({
        key: section.key,
        label: getThaiLabel(section.label),
        text: translatedTexts[idx] || section.text,
        report_type: section.key.includes("sum_") ? "summary" : "full",
      }));

      setTranslatedSections(thaiSections);

      // Generate Thai PDF using jsPDF
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Load Thai fonts
      const loadFont = async (url: string): Promise<string | null> => {
        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const blob = await response.blob();
          if (blob.size < 1000) return null;
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = (reader.result as string).split(",")[1];
              resolve(base64data);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

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

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 14;
      let yPosition = margin + 20;

      const checkPageBreak = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          doc.setFontSize(8);
          doc.setFont("Sarabun", "normal");
          doc.setTextColor(150);
          doc.text(`หน้า ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
          doc.addPage();
          yPosition = margin + 20;
          return true;
        }
        return false;
      };

      const addThaiText = (text: string, fontSize = 10, isBold = false, indent = 0, color: [number, number, number] = [50, 50, 50]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("Sarabun", isBold ? "bold" : "normal");

        const cleanText = text.replace(/\*\*/g, "").replace(/---SEPARATOR---/g, "\n");
        const lines = doc.splitTextToSize(cleanText, maxWidth - indent);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, margin + indent, yPosition);
          yPosition += lineHeight;
        }
      };

      // Header
      doc.setFontSize(18);
      doc.setFont("Sarabun", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text(`รายงาน TradingAgents: ${ticker}`, margin, yPosition);
      yPosition += 20;

      doc.setFontSize(10);
      doc.setFont("Sarabun", "normal");
      doc.setTextColor(100);
      doc.text(`วันที่วิเคราะห์: ${analysisDate}`, margin, yPosition);
      yPosition += 25;

      doc.setDrawColor(200);
      doc.setLineWidth(1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 25;

      // Recommendation
      if (contextDecision) {
        yPosition += lineHeight * 1.5;
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 200, 0);
        doc.text(`คำแนะนำ: ${contextDecision}`, margin, yPosition);
        yPosition += lineHeight * 2;
      }

      // Render sections
      thaiSections.forEach((section) => {
        checkPageBreak(60);

        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPosition - 12, maxWidth, 24, 'F');

        doc.setFontSize(13);
        doc.setFont("Sarabun", "bold");
        doc.setTextColor(0);
        doc.text(section.label, margin + 8, yPosition + 5);
        yPosition += 30;

        addThaiText(section.text, 10, false, 0, [50, 50, 50]);
        yPosition += 25;
      });

      // Footer
      doc.setFontSize(8);
      doc.setFont("Sarabun", "normal");
      doc.setTextColor(150);
      doc.text(`หน้า ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text("สร้างโดย TradingAgents", pageWidth - margin, pageHeight - 20, { align: 'right' });

      doc.save(`TradingAgents_${ticker}_${analysisDate}_TH.pdf`);

    } catch (error) {
      console.error("Thai PDF generation failed:", error);
      alert("การสร้าง PDF ภาษาไทยล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsTranslating(false);
    }
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
  const getRecommendationVariant = (decision: string) => {
    const d = decision.toLowerCase();
    if (d.includes("buy")) return "buy";
    if (d.includes("sell")) return "sell";
    if (d.includes("reduce")) return "reduce";
    return "text-gray-500";
  };

  const recVariant = getRecommendationVariant(contextDecision);

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
      className={`min-h-full w-full font-sans transition-colors duration-300 relative ${isDarkMode
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





      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-8 px-4 py-6 md:px-9 md:py-8 md:pb-12 pt-20 md:pt-24 xl:pt-8 relative z-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`text-[0.85rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
              Trading workflow
            </p>
            <h1 className={`text-2xl font-semibold ${isDarkMode ? "" : "text-[#0F172A]"}`}>Generate</h1>
          </div>
        </header>

        {connectionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {connectionError}
          </div>
        )}

        {/* Step Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
            <header>
              <p className={`text-[0.7rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                Step 1
              </p>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "" : "text-[#0F172A]"}`}>Ticker Symbol</h2>
            </header>
            <div className={`flex flex-col gap-1.5 text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
              <span>Select Market & Ticker</span>
              <div className="flex gap-2">
                {/* Custom Market Select Dropdown */}
                <div
                  className="relative z-30"
                  onBlur={(e) => {
                    // Close dropdown if focus leaves the container
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setShowMarketSelector(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowMarketSelector(!showMarketSelector)}
                    className={`flex items-center gap-2 h-full rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] hover:bg-white/5" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/30"}`}
                  >
                    {MARKET_INFO[selectedMarket]?.icon || <span>?</span>}
                    <svg className={`w-3 h-3 ${isDarkMode ? "text-gray-400" : "text-[#64748B]"} transition-transform ${showMarketSelector ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            setShowMarketSelector(false);
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
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Select or Type Symbol"
                    value={ticker}
                    onChange={handleTickerChange}
                    onFocus={handleInputFocus}
                    onClick={() => {
                      if (!showSuggestions) {
                        setShowSuggestions(true);
                        setSuggestions(marketTickers);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`w-full min-w-[120px] rounded-xl border pl-3 pr-8 py-2.5 cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff]" : "border-[#E2E8F0] bg-white text-[#0F172A]"}`}
                  />
                  {/* Chevron Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={`absolute left-0 top-full z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border py-1 shadow-lg ${isDarkMode ? "border-white/10 bg-[#1a2133]" : "border-[#E2E8F0] bg-white shadow-lg"}`}>
                      {/* Optional Header for List */}
                      <li className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? "bg-white/5 text-gray-400 opacity-50" : "bg-[#F8FAFC] text-[#64748B]"}`}>
                        {ticker.length < 2 ? "Popular Recommendations" : "Search Results"}
                      </li>
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => selectSuggestion(item.symbol)}
                          className={`cursor-pointer px-4 py-2 text-sm flex justify-between items-center transition-colors ${isDarkMode ? "hover:bg-white/5 text-gray-200" : "hover:bg-[#F8FAFC] text-[#334155]"}`}
                        >
                          <div>
                            <span className={`font-bold ${isDarkMode ? "" : "text-[#0F172A]"}`}>{item.symbol}</span>
                            <span className={`ml-2 text-xs ${isDarkMode ? "opacity-70" : "text-[#64748B]"}`}>{item.name}</span>
                          </div>
                          <span className={`text-[10px] border rounded px-1 ${isDarkMode ? "opacity-50" : "border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]"}`}>{item.exchange}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className={`flex flex-col gap-3.5 rounded-[20px] border p-5 h-[210px] ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
            <header>
              <p className={`text-[0.7rem] uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                Step 2
              </p>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "" : "text-[#0F172A]"}`}>Analysis Date</h2>
            </header>
            <div className="flex items-end gap-3">
              <label className={`flex flex-1 flex-col gap-1.5 text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
                <span>Select Date (DD-MM-YYYY)</span>
                <div className="relative w-full">
                  {/* Visual Input (DD/MM/YYYY) */}
                  <input
                    type="text"
                    readOnly
                    value={analysisDate.split('-').reverse().join('/')}
                    onClick={() => dateInputRef.current?.showPicker()}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 shadow-inner outline-none transition-all ${isDarkMode
                      ? "border-white/10 bg-[#1a2133] text-[#f8fbff] placeholder-gray-600 focus:border-[#2df4c6]/50"
                      : "border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#2563EB]"
                      }`}
                  />
                  {/* Hidden Actual Date Input */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={analysisDate}
                    onChange={(e) => setAnalysisDate(e.target.value)}
                    className="absolute inset-0 -z-10 opacity-0"
                  />
                </div>
              </label>
              <button
                onClick={() => dateInputRef.current?.showPicker()}
                className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${isDarkMode
                  ? "border-[#2df4c6]/30 bg-[#2df4c6]/10 text-[#2df4c6] hover:bg-[#2df4c6]/20 hover:shadow-[0_0_15px_rgba(45,244,198,0.3)]"
                  : "border-[#2563EB]/50 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] hover:shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </button>
            </div>
          </article>



          {/* Live Market Data Card */}
          <article className={`relative flex flex-col overflow-hidden rounded-[20px] border p-5 h-auto min-h-[210px] transition-all duration-300 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2df4c6] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2df4c6]"></span>
                </span>
                <span className={`text-[0.7rem] font-bold uppercase tracking-widest ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`}>
                  Live Market Data
                </span>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[0.65rem] font-semibold uppercase ${isDarkMode ? "border-white/10 text-[#8b94ad]" : "border-[#E2E8F0] bg-white text-[#334155]"}`}>
                {marketData?.sector || "Loading..."}
              </span>
            </div>

            {/* Main Info */}
            <div className="relative z-10 mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full overflow-hidden shrink-0 ${isDarkMode ? "bg-white text-black" : "bg-white text-gray-700 shadow-md border border-gray-200"}`}>
                  {logoSrc && !logoError ? (
                    <img
                      src={logoSrc}
                      alt="logo"
                      className="h-full w-full object-cover"
                      onError={handleLogoError}
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                      <path d="M12 2a10 10 0 0 1 10 10H12V2z" fill="currentColor"></path>
                      <path d="M21.18 10.98a10.05 10.05 0 0 0-9.16-8.96"></path>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold truncate">
                  {/* Prioritize full name from our curated list, then market data name */}
                  {marketTickers.find(t => t.symbol === ticker)?.name || marketData?.name || marketData?.shortName || ticker}
                </h3>
              </div>
              <div className="mt-2 min-h-[40px]">
                {marketData ? (
                  <span className={`text-4xl font-bold tracking-tight ${isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"}`}>${marketData.price?.toFixed(2)}</span>
                ) : (
                  <span className={`animate-pulse text-2xl font-bold opacity-50 ${isDarkMode ? "" : "text-[#334155]"}`}>Loading...</span>
                )}
              </div>
            </div>

            {/* Footer / Stats */}
            <div className="relative z-10 mt-4 flex items-center justify-between">
              {marketData && (
                <div className="flex items-center gap-3">
                  <span className={`flex items-center rounded-md px-2 py-1 text-xs font-bold ${marketData.change >= 0
                    ? isDarkMode ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#EFF6FF] text-[#2563EB]"
                    : "bg-[#ff4d6d]/10 text-[#ff4d6d]"
                    }`}>
                    {marketData.change >= 0 ? "↑" : "↓"} {marketData.change > 0 ? "+" : ""}{marketData.percentChange}%
                  </span>
                  <span className="text-xs text-[#8b94ad]">
                    Vol: {formatVolume(marketData.volume)}
                  </span>
                </div>
              )}
            </div>

            {/* Mini Chart SVG (Absolute Background) */}
            <div className="absolute bottom-0 right-0 h-24 w-40 translate-x-4 translate-y-2 pointer-events-none">
              <svg viewBox="0 0 100 50" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {marketData?.sparkline && (
                  <>
                    {/* Area */}
                    <path d={createSparklinePath(marketData.sparkline)} fill="url(#chartGradient)" />
                    {/* Line */}
                    <path d={createLinePath(marketData.sparkline)} fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                  </>
                )}
                {!marketData?.sparkline && (
                  <>
                    <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5 L 100 50 L 0 50 Z" fill="url(#chartGradient)" />
                    <path d="M0 40 Q 20 35, 40 38 T 70 20 T 100 5" fill="none" stroke={marketData?.change < 0 ? "#ff4d6d" : "#2df4c6"} strokeWidth="2" />
                  </>
                )}
              </svg>
            </div>
          </article>

          {/* Generate / Stop Button */}
          {isRunning ? (
            <button
              onClick={stopPipeline}
              className="flex w-full flex-row items-center justify-center gap-2 rounded-[16px] border-2 border-white/20 bg-[#ff4d6d] py-2.5 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#ff3355] hover:shadow-[0_10px_25px_rgba(255,77,109,0.35)]"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-transparent">
                <div className="h-2 w-2 rounded-[1px] bg-white" />
              </div>
              <span>Stop Generating</span>
            </button>
          ) : (
            <button
              onClick={runPipeline}
              disabled={wsStatus !== "connected"}
              className={`flex w-full flex-row items-center justify-center gap-2.5 rounded-[12px] border-2 py-2 text-2xl font-bold text-white shadow-lg transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale ${isDarkMode
                ? "border-white/20 bg-[#00c05e] hover:bg-[#00b056] hover:shadow-[0_10px_25px_rgba(0,192,94,0.35)]"
                : "border-[#2563EB] bg-linear-to-r from-[#2563EB] to-[#38BDF8] text-white hover:shadow-[0_10px_25px_rgba(37,99,235,0.3)]"
                }`}
            >
              <Image
                src={GenerateIcon}
                alt="Generate"
                width={40}
                height={40}
                className="shrink-0"
              />
              <span>Generate</span>
            </button>
          )}
        </section>

        {/* Teams Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 relative z-0">
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

            let headerTitle = "";
            let headerSub = "";
            if (teamKey === "analyst") {
              headerTitle = "Analyst team";
              headerSub = "Market • News • Social • Fundamentals";
            } else if (teamKey === "research") {
              headerTitle = "Research team";
              headerSub = "Bull • Bear • Manager";
            } else if (teamKey === "trader") {
              headerTitle = "Trader team";
              headerSub = "Execution";
            } else if (teamKey === "risk") {
              headerTitle = "Risk & Portfolio";
              headerSub = "Risky • Neutral • Safe • Manager";
            } else if (teamKey === "portfolio") {
              headerTitle = "Portfolio Management";
              headerSub = "Portfolio";
            }

            return (
              <article
                key={teamKey}
                className={`flex flex-col gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#f59e0b]/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(245,158,11,0.1)]"}`}
              >
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>
                      {headerTitle}
                    </p>
                    <span className={`text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                      {headerSub}
                    </span>
                  </div>
                  <div
                    className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
                    style={{
                      background: isDarkMode
                        ? `conic-gradient(#2df4c6 ${(progress / 100) * 360}deg, rgba(255,255,255,0.05) 0deg)`
                        : `conic-gradient(#2563EB ${(progress / 100) * 360}deg, rgba(226,232,240,0.5) 0deg)`,
                      transition: "background 1s ease-out",
                    }}
                  >
                    <div className={`absolute inset-[10px] rounded-full ${isDarkMode ? "bg-[#111726]" : "bg-white/80"}`}></div>
                    <span className="relative font-semibold">{progress}%</span>
                  </div>
                </header>
                <ul className="flex flex-col gap-2.5">
                  {members.map((member, idx) => {
                    let statusLabel = member.status.replace("_", " ");
                    let statusColorClass = "";

                    if (member.status === "completed") {
                      if (showGreenCompletion) {
                        statusColorClass = isDarkMode ? "bg-[#2df4c6]/10 text-[#2df4c6]" : "bg-[#f59e0b]/15 text-[#d97706]";
                      } else {
                        statusLabel = "Completed";
                        statusColorClass = isDarkMode
                          ? "bg-green-600/10 text-green-600"
                          : "bg-green-600/15 text-green-700";
                      }
                    } else if (member.status === "pending") {
                      statusColorClass = isDarkMode ? "bg-[#f9a826]/10 text-[#f9a826]" : "bg-[#EFF6FF] text-[#2563EB]";
                    } else if (member.status === "in_progress") {
                      statusColorClass = isDarkMode ? "bg-[#3db8ff]/10 text-[#3db8ff]" : "bg-[#DBEAFE] text-[#2563EB]";
                    } else {
                      statusColorClass = "bg-[#ff4d6d]/10 text-[#ff4d6d]";
                    }

                    return (
                      <li
                        key={idx}
                        className={`flex flex-wrap items-center justify-between gap-y-1 text-sm ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}
                      >
                        <span className={isDarkMode ? "" : "text-[#334155]"}>{member.name}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs capitalize ${statusColorClass}`}
                        >
                          {(member.status === "in_progress" || (member.status === "pending" && isRunning)) && (
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
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
              </article>
            );
          })}
        </section>

        {/* Report Panel */}
        <ReportSections
          reportSections={language === "th" && filteredTranslatedSections.length > 0 ? filteredTranslatedSections : contextReportSections}
          isDarkMode={isDarkMode}
          ticker={ticker}
          analysisDate={analysisDate}
          decision={contextDecision}
          copyFeedback={copyFeedback}
          setCopyFeedback={setCopyFeedback}
          handleCopyReport={handleCopyReport}
          handleDownloadPdf={handleDownloadPdf}
          handleDownloadPdfThai={handleDownloadPdfThai}
          reportLength={reportLength}
          setReportLength={setReportLength}
          isRunning={isRunning}
          language={language}
          setLanguage={handleLanguageChange}
          isTranslating={isTranslating}
        />

        {/* Summary Panel */}
        <section className={`flex flex-col lg:flex-row items-center justify-between gap-4 rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
          <div className="w-full lg:w-auto">
            <p className="mb-2">Summary</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Symbol
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-[#0F172A]"}`}>{ticker}</strong>
              </div>
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Date
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-[#0F172A]"}`}>{analysisDate}</strong>
              </div>
              <div>
                <span className={`block text-[0.85rem] ${isDarkMode ? "text-[#8b94ad]" : "text-gray-600"}`}>
                  Research depth
                </span>
                <strong className={`text-xl ${isDarkMode ? "" : "text-[#0F172A]"}`}>
                  {
                    RESEARCH_DEPTH_OPTIONS.find(
                      (o) => o.value === researchDepth
                    )?.label
                  }
                </strong>
              </div>
            </div>
          </div>
          <div
            className={`rounded-2xl border px-8 py-4 text-center ${recVariant === "buy"
              ? isDarkMode ? "border-[#2df4c6]/40 bg-[#2df4c6]/10" : "border-[#2563EB]/40 bg-[#EFF6FF]"
              : recVariant === "sell" || recVariant === "reduce"
                ? "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
                : "border-[#ff4d6d]/40 bg-[#ff4d6d]/10"
              }`}
          >
            <span className={`block ${isDarkMode ? "text-[#8b94ad]" : "text-[#334155]"}`}>Recommendation</span>
            <strong
              className={`text-2xl ${recVariant === "buy"
                ? isDarkMode ? "text-[#2df4c6]" : "text-[#2563EB]"
                : "text-[#ff4d6d]"
                }`}
            >
              {contextDecision}
            </strong>
          </div>
        </section>
      </main>
    </div>
  );
}
