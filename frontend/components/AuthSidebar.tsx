import React from 'react';
import Image from 'next/image';
import Logo from '@/image/Logo.png';

const AuthSidebar = () => {
    return (
        <div className="hidden md:flex flex-col justify-between w-1/3 text-white p-12 min-h-screen bg-linear-to-b from-[#0f1216] to-[#141922] relative overflow-hidden">
            {/* Animated background accents */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-[#2df4c6]/12 blur-3xl animate-orb" />
                <div className="absolute right-0 top-1/3 h-48 w-48 rounded-full bg-[#26dcb2]/10 blur-3xl animate-orb-delayed" />
                <div className="absolute -bottom-8 left-8 h-44 w-44 rounded-full bg-[#4b67ff]/10 blur-3xl animate-orb-slow" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_20%,rgba(255,255,255,0.08),transparent)]" />
            </div>
            {/* Top Section */}
            <div className="mt-10">
                <h2 className="text-4xl font-light mb-2 text-center">Welcome to</h2>
            </div>

            {/* Center Section - Logo */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-12">
                <div className="flex flex-col items-center">
                    {/* Logo card with glow (no circle) */}
                    <div className="relative mb-6 flex items-center justify-center">
                        {/* Glow background */}
                        <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 rounded-[32px] bg-linear-to-r from-[#2df4c6]/25 via-transparent to-[#26dcb2]/25 blur-3xl" />
                        {/* Logo frame */}
                        <div className="relative rounded-[28px] bg-[#040b10]/90 px-8 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
                            <Image
                                src={Logo}
                                alt="Trading Agents Logo"
                                width={220}
                                height={90}
                                className="h-auto w-full max-w-[220px] object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-wide">Trading Agents</h1>
                    <p className="mt-2 text-sm md:text-base text-gray-400">Multi-Agents LLM Financial Trading</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="text-base text-gray-400 leading-relaxed text-justify relative z-10">
                <p>
                    Experience the future of investing with our Trading Agent, powered by the collective intelligence of Multi-Agents LLM. This cutting-edge technology enables each agent to learn and adapt its strategies in real-time, responding to dynamic market conditions. They operate autonomously yet collaboratively, working as a cohesive system to identify opportunities and manage risk, making your automated trading smarter and more effective than ever before.
                </p>
            </div>
            <style jsx>{`
                @keyframes orbFloat {
                    0% { transform: translateY(0px) scale(1); opacity: 0.9; }
                    50% { transform: translateY(-12px) scale(1.05); opacity: 1; }
                    100% { transform: translateY(0px) scale(1); opacity: 0.9; }
                }
                .animate-orb {
                    animation: orbFloat 9s ease-in-out infinite;
                }
                .animate-orb-delayed {
                    animation: orbFloat 11s ease-in-out infinite 1.2s;
                }
                .animate-orb-slow {
                    animation: orbFloat 13s ease-in-out infinite 0.6s;
                }
            `}</style>
        </div>
    );
};

export default AuthSidebar;