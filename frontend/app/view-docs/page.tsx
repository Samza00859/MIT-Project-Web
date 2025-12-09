"use client";

import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function ViewDocsPage() {
    const [isDarkMode, setIsDarkMode] = useState(true);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#070a13] text-[#f8fbff]" : "bg-[#f0f2f5] text-[#1a202c]"}`}>
            <Sidebar activeId="docs" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            <main className="flex-1 flex flex-col gap-8 px-9 py-8 pb-12 overflow-y-auto h-screen">
                <header>
                    <p className="text-[0.85rem] font-medium text-[#8b94ad] mb-6">
                        View Docs / Document
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">
                        TradingAgent Multi Agent
                    </h1>
                </header>

                <div className="flex flex-col gap-12 max-w-4xl">
                    <section className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold">Introduction</h2>
                        <div className={`text-[0.95rem] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>
                            <p className="mt-4">
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold">Related Work</h2>
                        <div className={`text-[0.95rem] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <p>
                                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.
                            </p>
                            <p className="mt-4">
                                Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold">TradingAgents: Role Specialization</h2>
                        <div className={`text-[0.95rem] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <p>
                                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.
                            </p>
                            <p className="mt-4">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold">TradingAgents: Agent Workflow</h2>
                        <div className={`text-[0.95rem] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <p>
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>
                            <p className="mt-4">
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
