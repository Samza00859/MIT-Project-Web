"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

export default function ContactPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const contacts = [
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
        {
            name: "NAME: ____________________",
            company: "COMPANY: ____________________",
            position: "POSITION: ____________________",
            email: "Email",
            phone: "Phone",
            other: "Other contact",
        },
    ];

    return (
        <div className={`flex min-h-screen w-full ${isDarkMode ? "bg-[#0a0c10]" : "bg-gray-50"}`}>
            <Sidebar activeId="contact" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            <main className="flex-1 p-8 md:p-12 lg:p-16">
                <header className="mb-8">
                    <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Contact Us</h1>
                </header>
                <section className="flex flex-col gap-6">
                    {contacts.map((contact, index) => (
                        <article
                            key={index}
                            className={`group flex flex-col gap-6 rounded-[20px] p-8 shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-[#1e2330]" : "bg-white border border-gray-200"
                                }`}
                        >
                            {/* Top Section: Profile & Info */}
                            <div className="flex flex-col gap-6 md:flex-row md:items-center">
                                <div className={`h-24 w-24 flex-shrink-0 rounded-full ${isDarkMode ? "bg-white" : "bg-gray-200"}`}></div>
                                <div className={`flex flex-col gap-2 text-sm tracking-wide ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    <p>{contact.name}</p>
                                    <p>{contact.company}</p>
                                    <p>{contact.position}</p>
                                </div>
                            </div>

                            {/* Bottom Section: Contact Details (Dropdown) */}
                            <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-in-out group-hover:max-h-[500px] group-hover:opacity-100">
                                <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
                                    {[
                                        { label: contact.email, value: "____________________" },
                                        { label: contact.phone, value: "____________________" },
                                        { label: contact.other, value: "____________________" },
                                    ].map((detail, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col gap-2 rounded-xl p-4 ${isDarkMode
                                                ? "bg-[#151a25] border border-white/5"
                                                : "bg-gray-50 border border-gray-200"
                                                }`}
                                        >
                                            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {detail.label}
                                            </span>
                                            <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                                {detail.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
}
