// --- Helper Functions ---

export function toISODate(): string {
    return new Date().toISOString().split("T")[0];
}

export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function escapeHtml(text: string): string {
    if (typeof text !== "string") return String(text);
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function formatInlineMarkdown(text: string): string {
    // Remove all asterisks for display
    return escapeHtml(text).replace(/\*+/g, "");
}

export function extractDecision(markdownText: string): string {
    const match = markdownText.match(
        /(BUY|SELL|HOLD|REDUCE|MONITOR|RE-EVALUATE)/i
    );
    return match ? match[0].toUpperCase() : "REVIEW";
}

export function extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    const bulletMatches = text.match(/[-*•·]\s*([^\n]+)/g);
    if (bulletMatches) {
        bulletMatches.slice(0, 3).forEach((match) => {
            const point = match.replace(/^[-*•·]\s*/, "• ").trim();
            if (point.length > 10 && point.length < 200) {
                keyPoints.push(point);
            }
        });
    }
    if (keyPoints.length === 0) {
        const sentences = text.split(/[.!?]+/).filter((s) => {
            const trimmed = s.trim();
            return trimmed.length > 30 && trimmed.length < 250;
        });
        const importantTerms = [
            "buy",
            "sell",
            "hold",
            "recommend",
            "price",
            "target",
            "risk",
            "opportunity",
            "trend",
            "analysis",
        ];
        const scoredSentences = sentences
            .map((s) => {
                const lower = s.toLowerCase();
                const score = importantTerms.reduce(
                    (acc, term) => acc + (lower.includes(term) ? 1 : 0),
                    0
                );
                return { text: s.trim(), score };
            })
            .sort((a, b) => b.score - a.score);
        scoredSentences.slice(0, 2).forEach((item) => {
            if (item.text) {
                keyPoints.push(item.text + ".");
            }
        });
    }
    return keyPoints;
}

export function summarizeReport(
    reportText: string | unknown,
    decision: string
): string {
    if (!reportText) return "";
    // Ensure reportText is a string
    const text =
        typeof reportText === "string" ? reportText : String(reportText);
    const lines = text.split("\n");
    const summary: string[] = [];
    let currentSection: string | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const isHeader =
            (line.match(/^[A-Z][A-Za-z\s]+$/) &&
                line.length < 80 &&
                !line.includes(".") &&
                !line.includes(",")) ||
            line.match(/^#{1,6}\s/) ||
            (line.endsWith(":") && line.length < 60);

        if (
            isHeader &&
            !line.startsWith("•") &&
            !line.startsWith("-") &&
            !line.startsWith("*")
        ) {
            if (currentSection) {
                summary.push(currentSection);
                const keyPoints = extractKeyPoints(currentContent.join(" "));
                if (keyPoints.length > 0) {
                    summary.push(...keyPoints);
                }
                summary.push("");
            }
            currentSection = line.replace(/^#+\s*/, "").replace(":", "");
            currentContent = [];
        } else if (currentSection) {
            currentContent.push(line);
        } else {
            currentContent.push(line);
        }
    }
    if (currentSection) {
        summary.push(currentSection);
        const keyPoints = extractKeyPoints(currentContent.join(" "));
        if (keyPoints.length > 0) {
            summary.push(...keyPoints);
        }
    } else if (currentContent.length > 0) {
        const keyPoints = extractKeyPoints(currentContent.join(" "));
        summary.push(...keyPoints);
    }

    if (decision && decision !== "Awaiting run" && decision !== "—") {
        summary.push("");
        summary.push(`RECOMMENDATION: ${decision}`);
    }
    return summary.join("\n");
}

export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
    } catch {
        return dateString;
    }
}

export function formatVolume(num: number): string {
    if (num >= 1.0e9) return (num / 1.0e9).toFixed(1) + "B";
    if (num >= 1.0e6) return (num / 1.0e6).toFixed(1) + "M";
    if (num >= 1.0e3) return (num / 1.0e3).toFixed(1) + "K";
    return num.toString();
}

// Helper function to clean content that has JSON mixed with markdown
export function extractAndCleanContent(text: string): string {
    if (!text) return "";

    // Remove markdown headers like "### Portfolio Manager Decision"
    let cleaned = text.replace(/^###?\s+.+$/gm, "");

    // Try to find and format JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const jsonData = JSON.parse(jsonMatch[0]);
            // Convert JSON to readable format
            const lines: string[] = [];
            for (const [key, value] of Object.entries(jsonData)) {
                const label = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                if (typeof value === "string" && value.length > 0) {
                    lines.push(`${label}: ${value}`);
                }
            }
            if (lines.length > 0) {
                return lines.join("\n\n");
            }
        } catch {
            // Not valid JSON, return cleaned text
        }
    }

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    return cleaned || text;
}

// Re-export API utilities from centralized location
export { getApiUrl, getWsUrl } from "./api";
