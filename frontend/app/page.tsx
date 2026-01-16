"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // Scroll position preservation for Popular Recommendations
  const popularListScrollPos = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);

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
      // Ensure suggestions are shown when reverting to default list
      if (marketTickers.length > 0) setShowSuggestions(true);
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
  }, [selectedMarket, fetchMarketTickers]);

  // Handle ticker changes (typing or restoration) and sync suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (ticker && ticker.length >= 2) {
         fetchSuggestions(ticker);
      } else {
         // If ticker is empty/short, show market tickers if available
         if (marketTickers.length > 0) {
             setSuggestions(marketTickers);
             setShowSuggestions(true);
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

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    // Only select text on focus, don't auto-show suggestions (wait for click or type)
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
          setLogoCandidates([]);
          setLogoCandidateIndex(0);
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

            const cleanTicker = ticker.trim().toUpperCase();
            const symbol = cleanTicker.split(".")[0].split("-")[0];
            const urls: string[] = [];
            if (data.logo_url) urls.push(data.logo_url);
            if (data.website) {
              try {
                const websiteUrl = data.website.startsWith("http") ? data.website : `https://${data.website}`;
                const hostname = new URL(websiteUrl).hostname;
                urls.push(`https://logo.clearbit.com/${hostname}`);
                urls.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`);
              } catch {}
            }
            urls.push(`https://assets.parqet.com/logos/symbol/${symbol}?format=png`);
            urls.push(`https://unavatar.io/${symbol}`);
            const uniqueUrls = Array.from(new Set(urls));
            setLogoCandidates(uniqueUrls);
            setLogoCandidateIndex(0);
            setLogoSrc(uniqueUrls[0] || "");
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

    startGeneration({
      ticker,
      analysisDate,
      analysts: ANALYSTS_DATA.map((a) => a.value),
      researchDepth,
      llmProvider: "google",
      backendUrl: getApiUrl(),
      shallowThinker: SHALLOW_AGENTS.google[0][1],
      deepThinker: DEEP_AGENTS.google[0][1],
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





      <main className="flex-1 flex flex-col gap-4 px-4 py-4 md:px-8 md:py-6 relative z-10 overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div>
            <h1
              className={`text-2xl md:text-3xl font-semibold tracking-tight ${
                isDarkMode ? "text-[#f8fbff]" : "text-[#0F172A]"
              }`}
            >
              Generate Analysis
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
        <section className="grid grid-cols-12 gap-4 h-[140px]">
          {/* Step 1: Symbol Selection */}
          <article className={`col-span-12 md:col-span-6 lg:col-span-3 flex flex-col justify-between rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
            <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
              Step 1: Symbol Selection
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Custom Market Select Dropdown - Compact Flag Only */}
              <div
                className="relative z-30 shrink-0"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setShowMarketSelector(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowMarketSelector(!showMarketSelector)}
                  className={`flex items-center justify-center gap-2 h-[46px] w-[70px] rounded-xl border transition-colors cursor-pointer ${isDarkMode ? "border-white/10 bg-[#1a2133] hover:bg-white/5" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/30"}`}
                >
                  <span className="text-xl">{MARKET_INFO[selectedMarket]?.icon || "?"}</span>
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
                          setTicker("");
                          setSuggestions([]);
                          setShowSuggestions(true);
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
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="AAPL"
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
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 h-[46px] cursor-pointer font-medium ${isDarkMode ? "border-white/10 bg-[#1a2133] text-[#f8fbff] placeholder-gray-500" : "border-[#E2E8F0] bg-white text-[#0F172A]"}`}
                />

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
          </article>

          {/* Step 2: Analysis Date */}
          <article className={`col-span-12 md:col-span-6 lg:col-span-3 flex flex-col justify-between rounded-[20px] border p-5 ${isDarkMode ? "border-white/5 bg-[#111726]" : "border-[#E2E8F0] bg-white shadow-sm"}`}>
            <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
              Step 2: Analysis Date
            </h2>
            
            <div className="relative w-full">
              {/* Visual Input (DD/MM/YYYY) */}
              <div className={`flex items-center w-full rounded-xl border px-3 py-2.5 h-[46px] cursor-pointer transition-all ${isDarkMode
                  ? "border-white/10 bg-[#1a2133] text-[#f8fbff] hover:border-[#2df4c6]/50"
                  : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB]"
                  }`}
                  onClick={() => dateInputRef.current?.showPicker()}
              >
                <div className={`mr-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <span className="flex-1 font-medium">
                  {analysisDate ? analysisDate.split('-').reverse().join('/') : "Select Date"}
                </span>
                <div className="opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
                </div>
              </div>
              
              {/* Hidden Actual Date Input */}
              <input
                ref={dateInputRef}
                type="date"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className="absolute inset-0 -z-10 opacity-0"
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
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-[#8b94ad]" : "text-[#64748B]"}`}>
                  Live Market Data
                </span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-[#8b94ad] opacity-70" : "text-[#64748B]"}`}>
                {marketData?.sector || "SECTOR"}
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
                  <span className={`animate-pulse text-2xl font-bold opacity-50 ${isDarkMode ? "" : "text-[#334155]"}`}>Loading...</span>
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
                className="flex w-full h-full flex-col items-center justify-center gap-2 bg-[#ff4d6d] text-white transition-all hover:bg-[#ff3355]"
              >
                 <div className="h-3 w-3 rounded-[1px] bg-white mb-1" />
                <span className="text-sm font-bold uppercase tracking-widest">Stop</span>
              </button>
            ) : (
              <button
                onClick={runPipeline}
                disabled={wsStatus !== "connected"}
                className={`flex w-full h-full flex-col items-center justify-center gap-2 bg-[#00dc82] text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#00c976] transition-all`}
              >
                <div className="mb-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7-11-7z" />
                  </svg>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Generate</span>
              </button>
            )}
          </article>
        </section>

        {/* Symbol / Signal / Recommendation */}
        </div>

        {/* Teams Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-0 rounded-[16px]">
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
                className={`flex flex-col gap-4 rounded-[20px] border p-5 ${
                  showError
                    ? "border-red-500 bg-red-50/10"
                    : isDarkMode
                    ? "border-white/5 bg-[#111726]"
                    : "border-[#2563EB]/25 bg-white/80 backdrop-blur-sm shadow-[0_8px_24px_rgba(37,99,235,0.15)]"
                }`}
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
                      statusLabel = "Completed";
                      statusColorClass = isDarkMode
                        ? "bg-[#1D4ED8]/20 text-[#BFDBFE]"
                        : "bg-[#DBEAFE] text-[#1D4ED8]";
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

        {/* Symbol / Signal / Recommendation - Only show after generation */}
        {contextDecision && (
          <section
            className={`flex flex-col md:flex-row items-center justify-between gap-6 rounded-[20px] px-8 py-5 ${
              isDarkMode ? "bg-[#0f172a] border border-white/5" : "bg-white border-[#E2E8F0] shadow-sm"
            }`}
          >
            {/* Selected Asset */}
            <div className="flex flex-col gap-1 min-w-[150px]">
               <span
                 className={`text-[10px] font-bold uppercase tracking-widest ${
                   isDarkMode ? "text-[#64748b]" : "text-[#64748B]"
                 }`}
               >
                 Selected Asset
               </span>
               <div
                 className={`text-xl font-bold tracking-wide ${
                   isDarkMode ? "text-white" : "text-[#0F172A]"
                 }`}
               >
                 {ticker || "—"}
                 <span
                   className={`ml-1 text-sm ${
                     isDarkMode ? "text-[#64748b]" : "text-[#64748B]"
                   }`}
                 >
                   {selectedMarket ? `:${selectedMarket.toUpperCase()}` : ""}
                 </span>
               </div>
            </div>

            {/* Signal Strength */}
            <div className="flex flex-col items-center gap-2 flex-1">
               <span
                 className={`text-[10px] font-bold uppercase tracking-widest ${
                   isDarkMode ? "text-[#64748b]" : "text-[#64748B]"
                 }`}
               >
                 Signal Strength
               </span>
               <div className="flex flex-col items-center gap-1">
                  {/* Visual Bars */}
                  <div className="flex gap-1.5">
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
                         <div key={i} className={`h-1 w-12 rounded-sm transition-all duration-500 ${colorClass}`} />
                       );
                    })}
                  </div>
                  
                  {/* Status Text Below Bars */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      Number(marketData?.percentChange || 0) > 0
                        ? "text-[#2df4c6]"
                        : Number(marketData?.percentChange || 0) < 0
                        ? "text-[#ff4500]"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-[#64748B]"
                    }`}
                  >
                    {(() => {
                      const pc = Number(marketData?.percentChange);
                      if (!Number.isFinite(pc)) return "—";
                      if (pc <= -2) return "Strong Bearish";
                      if (pc < 0) return "Bearish";
                      if (pc >= 2) return "Strong Bullish";
                      if (pc > 0) return "Bullish";
                      return "Neutral";
                    })()}
                  </span>
               </div>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col items-end gap-2 min-w-[150px]">
               <span
                 className={`text-[10px] font-bold uppercase tracking-widest ${
                   isDarkMode ? "text-[#64748b]" : "text-[#64748B]"
                 }`}
               >
                 Recommendation
               </span>
              
              <button
                type="button"
                className={`h-[36px] px-6 rounded-lg text-sm font-bold uppercase tracking-wide transition-transform active:scale-95 ${
                  (contextDecision || "").toLowerCase().includes("sell")
                    ? "bg-[#ff4500] text-white shadow-lg shadow-[#ff4500]/25"
                    : (contextDecision || "").toLowerCase().includes("buy")
                    ? "bg-[#2df4c6] text-[#0f172a] shadow-lg shadow-[#2df4c6]/25"
                    : "bg-[#334155] text-white"
                }`}
              >
                {contextDecision || "—"}
              </button>
            </div>
          </section>
        )}

        {/* Report Panel */}
        <div className="flex-1 min-h-0 mt-2">
          <ReportSections
            reportSections={contextReportSections}
            isDarkMode={isDarkMode}
            ticker={ticker}
            analysisDate={analysisDate}
            decision={contextDecision}
            copyFeedback={copyFeedback}
            setCopyFeedback={setCopyFeedback}
            handleCopyReport={handleCopyReport}
            handleDownloadPdf={handleDownloadPdf}
            reportLength={reportLength}
            setReportLength={setReportLength}
          />
        </div>

        
      </main>
    </div>
  );
}
