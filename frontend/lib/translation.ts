/**
 * Translation Service for Thai language support using Typhoon API
 */

import { getApiUrl } from "./api";

export interface TranslationResponse {
    original: string;
    translated: string;
    source_lang: string;
    target_lang: string;
}

export interface BatchTranslationResponse {
    translations: TranslationResponse[];
}

export interface TranslationStatus {
    status: "ready" | "not_configured" | "error";
    message: string;
    model?: string;
}

/**
 * Check if translation service is available
 */
export async function checkTranslationStatus(): Promise<TranslationStatus> {
    try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/translate/status`);
        if (!response.ok) {
            return { status: "error", message: "Translation service unavailable" };
        }
        return await response.json();
    } catch (error) {
        console.error("Error checking translation status:", error);
        return { status: "error", message: "Failed to connect to translation service" };
    }
}

/**
 * Translate a single text from English to Thai
 */
export async function translateText(
    text: string,
    context: string = "financial analysis"
): Promise<string> {
    if (!text || !text.trim()) return text;

    try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/translate/single`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                source_lang: "en",
                target_lang: "th",
                context,
            }),
        });

        if (!response.ok) {
            console.error("Translation failed:", response.status);
            return text; // Return original text on error
        }

        const data: TranslationResponse = await response.json();
        return data.translated;
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Return original text on error
    }
}

/**
 * Translate multiple texts in batch (more efficient for reports)
 */
export async function translateBatch(
    texts: string[],
    context: string = "financial analysis"
): Promise<string[]> {
    if (!texts || texts.length === 0) return texts;

    try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/translate/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                texts,
                source_lang: "en",
                target_lang: "th",
                context,
            }),
        });

        if (!response.ok) {
            console.error("Batch translation failed:", response.status);
            return texts; // Return original texts on error
        }

        const data: BatchTranslationResponse = await response.json();
        return data.translations.map((t) => t.translated);
    } catch (error) {
        console.error("Batch translation error:", error);
        return texts; // Return original texts on error
    }
}

/**
 * Translate report section content (handles JSON and text)
 */
export async function translateReportContent(content: string | object): Promise<string | object> {
    if (typeof content === "string") {
        return await translateText(content, "stock market financial analysis report");
    }

    if (typeof content === "object" && content !== null) {
        // Deep translate object values
        const translatedObj: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(content)) {
            if (typeof value === "string") {
                translatedObj[key] = await translateText(value, "financial analysis");
            } else if (typeof value === "object" && value !== null) {
                translatedObj[key] = await translateReportContent(value as object);
            } else {
                translatedObj[key] = value;
            }
        }

        return translatedObj;
    }

    return content;
}

// Thai labels for SECTION_MAP
export const SECTION_MAP_TH: Record<string, { key: string; label: string }> = {
    market_report: { key: "market", label: "วิเคราะห์ตลาด (ฉบับเต็ม)" },
    Summarize_market_report: {
        key: "sum_market",
        label: "วิเคราะห์ตลาด (สรุป)",
    },

    sentiment_report: { key: "sentiment", label: "วิเคราะห์ความรู้สึกโซเชียล (ฉบับเต็ม)" },
    Summarize_social_report: {
        key: "sum_social",
        label: "วิเคราะห์ความรู้สึกโซเชียล (สรุป)",
    },

    news_report: { key: "news", label: "วิเคราะห์ข่าว (ฉบับเต็ม)" },
    Summarize_news_report: { key: "sum_news", label: "วิเคราะห์ข่าว (สรุป)" },

    fundamentals_report: {
        key: "fundamentals",
        label: "ทบทวนปัจจัยพื้นฐาน (ฉบับเต็ม)",
    },
    Summarize_fundamentals_report: {
        key: "sum_funda",
        label: "ทบทวนปัจจัยพื้นฐาน (สรุป)",
    },

    bull_researcher_summarizer: { key: "sum_bull", label: "มุมมองขาขึ้น (สรุป)" },
    bear_researcher_summarizer: { key: "sum_bear", label: "มุมมองขาลง (สรุป)" },

    investment_plan: {
        key: "investment_plan",
        label: "การตัดสินใจทีมวิจัย (ฉบับเต็ม)",
    },
    Summarize_investment_plan_report: {
        key: "sum_invest",
        label: "การตัดสินใจทีมวิจัย (สรุป)",
    },

    trader_investment_plan: {
        key: "trader",
        label: "แผนการลงทุนเทรดเดอร์ (ฉบับเต็ม)",
    },
    trader_summarizer: { key: "sum_trader", label: "แผนเทรดเดอร์ (สรุป)" },

    Summarize_conservative_report: {
        key: "sum_cons",
        label: "ความเสี่ยง: ระมัดระวัง (สรุป)",
    },
    Summarize_aggressive_report: {
        key: "sum_aggr",
        label: "ความเสี่ยง: เชิงรุก (สรุป)",
    },
    Summarize_neutral_report: {
        key: "sum_neut",
        label: "ความเสี่ยง: กลาง (สรุป)",
    },

    final_trade_decision: {
        key: "final",
        label: "การตัดสินใจจัดการพอร์ต (ฉบับเต็ม)",
    },
    Summarize_final_trade_decision_report: {
        key: "sum_final",
        label: "การตัดสินใจจัดการพอร์ต (สรุป)",
    },
};

// History page Thai constants
export const HISTORY_REPORT_ORDER_TH = [
    "ทบทวนปัจจัยพื้นฐาน",
    "วิเคราะห์ตลาด",
    "วิเคราะห์ความรู้สึกโซเชียล",
    "วิเคราะห์ข่าว",
    "มุมมองขาขึ้น",
    "มุมมองขาลง",
    "ความเสี่ยง: ระมัดระวัง",
    "ความเสี่ยง: เชิงรุก",
    "ความเสี่ยง: กลาง",
    "แผนเทรดเดอร์",
    "การตัดสินใจทีมวิจัย",
    "การตัดสินใจจัดการพอร์ต",
];

export const TITLE_MAP_TH: Record<string, string> = {
    fundamental: "ทบทวนปัจจัยพื้นฐาน",
    market: "วิเคราะห์ตลาด",
    sentiment: "วิเคราะห์ความรู้สึกโซเชียล",
    news: "วิเคราะห์ข่าว",
    trader: "แผนเทรดเดอร์",
    risk: "การตัดสินใจจัดการพอร์ต",
    technical: "วิเคราะห์ตลาด",
};

// English to Thai title mapping for quick lookup
export const TITLE_EN_TO_TH: Record<string, string> = {
    "Fundamentals Review": "ทบทวนปัจจัยพื้นฐาน",
    "Market Analysis": "วิเคราะห์ตลาด",
    "Social Sentiment": "วิเคราะห์ความรู้สึกโซเชียล",
    "News Analysis": "วิเคราะห์ข่าว",
    "Bull Case": "มุมมองขาขึ้น",
    "Bear Case": "มุมมองขาลง",
    "Risk: Conservative": "ความเสี่ยง: ระมัดระวัง",
    "Risk: Aggressive": "ความเสี่ยง: เชิงรุก",
    "Risk: Neutral": "ความเสี่ยง: กลาง",
    "Trader Plan": "แผนเทรดเดอร์",
    "Research Team Decision": "การตัดสินใจทีมวิจัย",
    "Portfolio Management Decision": "การตัดสินใจจัดการพอร์ต",
    // Summary variants
    "Market Analysis (Summary)": "วิเคราะห์ตลาด (สรุป)",
    "Market Analysis (Full)": "วิเคราะห์ตลาด (ฉบับเต็ม)",
    "Social Sentiment (Summary)": "วิเคราะห์ความรู้สึกโซเชียล (สรุป)",
    "Social Sentiment (Full)": "วิเคราะห์ความรู้สึกโซเชียล (ฉบับเต็ม)",
    "News Analysis (Summary)": "วิเคราะห์ข่าว (สรุป)",
    "News Analysis (Full)": "วิเคราะห์ข่าว (ฉบับเต็ม)",
    "Fundamentals Review (Summary)": "ทบทวนปัจจัยพื้นฐาน (สรุป)",
    "Fundamentals Review (Full)": "ทบทวนปัจจัยพื้นฐาน (ฉบับเต็ม)",
    "Bull Case (Summary)": "มุมมองขาขึ้น (สรุป)",
    "Bear Case (Summary)": "มุมมองขาลง (สรุป)",
    "Research Team Decision (Summary)": "การตัดสินใจทีมวิจัย (สรุป)",
    "Research Team Decision (Full)": "การตัดสินใจทีมวิจัย (ฉบับเต็ม)",
    "Trader Investment Plan (Full)": "แผนการลงทุนเทรดเดอร์ (ฉบับเต็ม)",
    "Trader Plan (Summary)": "แผนเทรดเดอร์ (สรุป)",
    "Risk: Conservative (Summary)": "ความเสี่ยง: ระมัดระวัง (สรุป)",
    "Risk: Aggressive (Summary)": "ความเสี่ยง: เชิงรุก (สรุป)",
    "Risk: Neutral (Summary)": "ความเสี่ยง: กลาง (สรุป)",
    "Portfolio Management Decision (Full)": "การตัดสินใจจัดการพอร์ต (ฉบับเต็ม)",
    "Portfolio Decision (Summary)": "การตัดสินใจจัดการพอร์ต (สรุป)",
};

/**
 * Convert English label to Thai
 */
export function getThaiLabel(englishLabel: string): string {
    return TITLE_EN_TO_TH[englishLabel] || englishLabel;
}
