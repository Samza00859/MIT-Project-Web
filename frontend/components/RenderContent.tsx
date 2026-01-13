"use client";

import React from "react";
import { formatInlineMarkdown, extractAndCleanContent } from "../lib/helpers";

// Render Markdown Component
export function RenderMarkdown({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="space-y-2">
            {text.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={idx} />;
                if (/^[-*•]/.test(trimmed)) {
                    return (
                        <div
                            key={idx}
                            className="ml-4 flex items-start gap-2 text-sm md:text-base"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 min-w-[6px] rounded-full bg-current opacity-60" />
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: formatInlineMarkdown(
                                        trimmed.replace(/^[-*•]\s*/, "")
                                    ),
                                }}
                            />
                        </div>
                    );
                }
                return (
                    <p
                        key={idx}
                        className="text-sm md:text-base"
                        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
                    />
                );
            })}
        </div>
    );
}

// Render JSON Data Component
export function RenderJsonData({
    data,
    isDarkMode,
}: {
    data: any;
    isDarkMode: boolean;
}) {
    // Helper: Try to parse a string as JSON (handles escaped strings too)
    const tryParseJson = (str: string): any => {
        if (typeof str !== 'string') return null;
        let trimmed = str.trim();

        // Strip markdown code blocks
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.replace(/^```json\s*\n?/, "").replace(/\n?```$/, "").trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.replace(/^```\s*\n?/, "").replace(/\n?```$/, "").trim();
        }

        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

        try {
            return JSON.parse(trimmed);
        } catch {
            // Try to handle escaped JSON strings (with literal \n and \")
            if (trimmed.includes('\\n') || trimmed.includes('\\"')) {
                try {
                    // Unescape by parsing as a JSON string first
                    const unescaped = trimmed
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
    };

    // Helper: Recursively deep-parse JSON strings within objects
    const deepParseJson = (obj: any): any => {
        if (typeof obj === 'string') {
            const parsed = tryParseJson(obj);
            if (parsed !== null) {
                return deepParseJson(parsed); // Recursively parse
            }
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => deepParseJson(item));
        }
        if (typeof obj === 'object' && obj !== null) {
            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = deepParseJson(value);
            }
            return result;
        }
        return obj;
    };

    // If data is a string, try to parse it as JSON first
    let parsedData = data;
    if (typeof data === "string") {
        let trimmed = data.trim();

        // Handle markdown code blocks (```json ... ```)
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "")
                .trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "")
                .trim();
        }

        if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
            try {
                parsedData = JSON.parse(trimmed);
            } catch {
                return <RenderMarkdown text={data} />;
            }
        } else {
            return <RenderMarkdown text={data} />;
        }
    }

    // Deep-parse any nested JSON strings in the parsed data
    parsedData = deepParseJson(parsedData);

    if (Array.isArray(parsedData)) {
        // Optimization: If array contains only primitives, render as a tag cloud
        const isPrimitives = parsedData.every((item) =>
            ["string", "number", "boolean"].includes(typeof item)
        );

        if (isPrimitives) {
            return (
                <div
                    className={`flex w-fit max-w-full flex-wrap gap-2 rounded-xl border p-4 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}
                >
                    {parsedData.length > 0 ? (
                        parsedData.map((item, idx) => (
                            <span
                                key={idx}
                                className={`rounded px-2.5 py-1 text-sm font-medium ${isDarkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"}`}
                            >
                                {String(item)}
                            </span>
                        ))
                    ) : (
                        <span className="text-base opacity-50">None</span>
                    )}
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parsedData.map((item, idx) => {
                    // Smart Card Logic: Try to find a "Title" key
                    let title = "";
                    let content = item;

                    if (typeof item === "object" && item !== null) {
                        const outputItem = { ...item };
                        const titleKey = Object.keys(item).find((k) =>
                            [
                                "headline",
                                "topic",
                                "indicator_full_name",
                                "title",
                                "name",
                                "section_name",
                            ].includes(k)
                        );
                        if (titleKey) {
                            title = item[titleKey];
                            delete outputItem[titleKey];
                            content = outputItem;
                            if (titleKey === "indicator_full_name")
                                delete outputItem["indicator"];
                        }
                    }

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}
                        >
                            {title && (
                                <h4
                                    className={`text-base font-bold leading-tight ${isDarkMode ? "text-[#f8fbff]" : "text-gray-900"}`}
                                >
                                    {title}
                                </h4>
                            )}

                            {typeof content === "object" && content !== null ? (
                                Object.entries(content).map(([k, v]) => {
                                    // Hide specific sections
                                    if (
                                        [
                                            "selected_indicators",
                                            "memory_application",
                                            "count",
                                            "raw",
                                            "_dedup_key",
                                        ].includes(k)
                                    )
                                        return null;

                                    const displayKey = k.replace(/_/g, " ");

                                    return (
                                        <div key={k}>
                                            <p className="mb-0.5 text-xs font-bold uppercase tracking-wider opacity-50">
                                                {displayKey}
                                            </p>
                                            <div className="text-base opacity-90">
                                                {typeof v === "string" ? (
                                                    <RenderMarkdown text={v} />
                                                ) : (
                                                    <RenderJsonData data={v} isDarkMode={isDarkMode} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-base">{String(content)}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (typeof parsedData === "object" && parsedData !== null) {
        // Keys to hide completely
        const skipKeys = [
            "selected_indicators",
            "memory_application",
            "count",
            "raw",
            "_dedup_key",
        ];

        // If the object only has a "text" key, render its content directly
        const keys = Object.keys(parsedData).filter((k) => !skipKeys.includes(k));
        if (keys.length === 1 && keys[0] === "text") {
            const textContent = parsedData["text"];

            if (typeof textContent === "string") {
                let content = textContent.trim();

                // Strip markdown code blocks if present (more flexible regex)
                const codeBlockMatch = content.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
                if (codeBlockMatch) {
                    content = codeBlockMatch[1].trim();
                }

                // Check if it looks like JSON (starts with { or [)
                if (content.startsWith("{") || content.startsWith("[")) {
                    try {
                        const jsonData = JSON.parse(content);
                        // Recursively render the parsed JSON
                        return <RenderJsonData data={jsonData} isDarkMode={isDarkMode} />;
                    } catch (e) {
                        // Try to extract just the JSON part
                        const jsonMatch = content.match(/^(\{[\s\S]*\}|\[[\s\S]*\])/);
                        if (jsonMatch) {
                            try {
                                const jsonData = JSON.parse(jsonMatch[1]);
                                return <RenderJsonData data={jsonData} isDarkMode={isDarkMode} />;
                            } catch {
                                // Still not valid JSON
                            }
                        }
                        // Not valid JSON, render as markdown
                        const cleanedText = extractAndCleanContent(textContent);
                        return <RenderMarkdown text={cleanedText} />;
                    }
                }

                // Not JSON, render as markdown
                const cleanedText = extractAndCleanContent(textContent);
                return <RenderMarkdown text={cleanedText} />;
            }

            return <RenderJsonData data={textContent} isDarkMode={isDarkMode} />;
        }

        return (
            <div className="flex flex-col gap-4">
                {Object.entries(parsedData).map(([key, value]) => {
                    if (skipKeys.includes(key)) return null;

                    // Skip "text" key if we're rendering full object
                    if (key === "text" && keys.length > 1) return null;

                    // Handle nested JSON strings (including escaped ones)
                    let parsedValue = value;
                    if (typeof value === "string") {
                        let trimmed = value.trim();

                        // Handle escaped JSON strings (e.g., "{\n \"key\": \"value\"}")
                        // These have literal \n and \" characters that need to be unescaped
                        if (trimmed.includes('\\n') || trimmed.includes('\\"')) {
                            try {
                                // First try to parse as a JSON string (to unescape)
                                const unescaped = JSON.parse(`"${trimmed.replace(/"/g, '\\"')}"`);
                                if (unescaped.startsWith('{') || unescaped.startsWith('[')) {
                                    parsedValue = JSON.parse(unescaped);
                                }
                            } catch {
                                // Try direct parse if the above fails
                                try {
                                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                                        parsedValue = JSON.parse(trimmed);
                                    }
                                } catch { /* ignore */ }
                            }
                        } else if (
                            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                            (trimmed.startsWith("[") && trimmed.endsWith("]"))
                        ) {
                            try {
                                parsedValue = JSON.parse(trimmed);
                            } catch {
                                /* ignore */
                            }
                        }
                    }

                    // All keys use the same simple rendering
                    return (
                        <div
                            key={key}
                            className={`border-l-2 pl-4 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}
                        >
                            <h4 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-60">
                                {key.replace(/_/g, " ")}
                            </h4>
                            <div className="text-base leading-relaxed opacity-90">
                                {typeof parsedValue === "string" ? (
                                    <RenderMarkdown text={parsedValue} />
                                ) : typeof parsedValue === "object" ? (
                                    <RenderJsonData data={parsedValue} isDarkMode={isDarkMode} />
                                ) : (
                                    String(parsedValue)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <p className="text-sm md:text-base">{String(parsedData)}</p>;
}
