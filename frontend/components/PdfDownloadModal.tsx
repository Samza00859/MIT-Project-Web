import React, { useState, useEffect } from "react";
import { X, FileText, Check } from "lucide-react";

interface PdfDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (options: PdfOptions) => void;
    isDarkMode: boolean;
    hasThaiContent: boolean;
    currentLanguage: "en" | "th";
}

export interface PdfOptions {
    includeSummary: boolean;
    includeFull: boolean;
    includeEnglish: boolean;
    includeThai: boolean;
}

export default function PdfDownloadModal({
    isOpen,
    onClose,
    onDownload,
    isDarkMode,
    hasThaiContent,
    currentLanguage
}: PdfDownloadModalProps) {
    const [options, setOptions] = useState<PdfOptions>({
        includeSummary: true,
        includeFull: true,
        includeEnglish: currentLanguage === 'en',
        includeThai: currentLanguage === 'th' || hasThaiContent,
    });

    // Reset options when modal opens or content availability changes
    useEffect(() => {
        if (isOpen) {
            setOptions({
                includeSummary: true,
                includeFull: true,
                includeEnglish: true,
                includeThai: hasThaiContent,
            });
        }
    }, [isOpen, hasThaiContent]);

    if (!isOpen) return null;

    const handleDownload = () => {
        onDownload(options);
        onClose();
    };

    const toggleOption = (key: keyof PdfOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div
                className={`relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl transition-all ${isDarkMode
                        ? "bg-[#0f172a] border-white/10 shadow-[0_0_50px_rgba(45,244,198,0.1)]"
                        : "bg-white border-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.1)]"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${isDarkMode ? "from-[#2df4c6] to-teal-500" : "from-blue-500 to-indigo-600"
                            } shadow-lg`}>
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                Download Report
                            </h3>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Select content and format
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`rounded-full p-2 transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Selection */}
                <div className="space-y-6">
                    {/* Report Type Section */}
                    <div className="space-y-3">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Report Sections
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleOption("includeSummary")}
                                className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3 transition-all ${options.includeSummary
                                        ? isDarkMode
                                            ? "bg-[#2df4c6]/10 border-[#2df4c6] shadow-[0_0_20px_rgba(45,244,198,0.1)]"
                                            : "bg-blue-50 border-blue-500 shadow-md"
                                        : isDarkMode
                                            ? "bg-white/5 border-white/5 hover:bg-white/10"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${options.includeSummary
                                        ? isDarkMode ? "bg-[#2df4c6] border-[#2df4c6]" : "bg-blue-500 border-blue-500"
                                        : "border-gray-400 bg-transparent"
                                    }`}>
                                    {options.includeSummary && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"
                                    }`}>Summary</span>
                            </button>

                            <button
                                onClick={() => toggleOption("includeFull")}
                                className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3 transition-all ${options.includeFull
                                        ? isDarkMode
                                            ? "bg-[#2df4c6]/10 border-[#2df4c6] shadow-[0_0_20px_rgba(45,244,198,0.1)]"
                                            : "bg-blue-50 border-blue-500 shadow-md"
                                        : isDarkMode
                                            ? "bg-white/5 border-white/5 hover:bg-white/10"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${options.includeFull
                                        ? isDarkMode ? "bg-[#2df4c6] border-[#2df4c6]" : "bg-blue-500 border-blue-500"
                                        : "border-gray-400 bg-transparent"
                                    }`}>
                                    {options.includeFull && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"
                                    }`}>Full Report</span>
                            </button>
                        </div>
                    </div>

                    {/* Language Section */}
                    <div className="space-y-3">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Language Version
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleOption("includeEnglish")}
                                className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all ${options.includeEnglish
                                        ? isDarkMode
                                            ? "bg-[#2df4c6]/10 border-[#2df4c6] shadow-[0_0_20px_rgba(45,244,198,0.1)]"
                                            : "bg-blue-50 border-blue-500 shadow-md"
                                        : isDarkMode
                                            ? "bg-white/5 border-white/5 hover:bg-white/10"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${options.includeEnglish
                                        ? isDarkMode ? "bg-[#2df4c6] border-[#2df4c6]" : "bg-blue-500 border-blue-500"
                                        : "border-gray-400 bg-transparent"
                                    }`}>
                                    {options.includeEnglish && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"
                                    }`}>English</span>
                            </button>

                            <button
                                onClick={() => hasThaiContent && toggleOption("includeThai")}
                                disabled={!hasThaiContent}
                                className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all ${options.includeThai
                                        ? isDarkMode
                                            ? "bg-[#2df4c6]/10 border-[#2df4c6] shadow-[0_0_20px_rgba(45,244,198,0.1)]"
                                            : "bg-blue-50 border-blue-500 shadow-md"
                                        : isDarkMode
                                            ? "bg-white/5 border-white/5 hover:bg-white/10"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    } ${!hasThaiContent ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${options.includeThai
                                        ? isDarkMode ? "bg-[#2df4c6] border-[#2df4c6]" : "bg-blue-500 border-blue-500"
                                        : "border-gray-400 bg-transparent"
                                    }`}>
                                    {options.includeThai && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"
                                    }`}>Thai (TH)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${isDarkMode
                                ? "bg-white/5 hover:bg-white/10 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={(!options.includeSummary && !options.includeFull) || (!options.includeEnglish && !options.includeThai)}
                        className={`flex-1 rounded-xl py-3 text-sm font-bold shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                                ? "bg-gradient-to-r from-[#2df4c6] to-teal-500 text-[#0f172a] hover:brightness-110"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110"
                            }`}
                    >
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
