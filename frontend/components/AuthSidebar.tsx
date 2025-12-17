import React from 'react';
import Image from 'next/image';

const AuthSidebar = () => {
    return (
        <div className="hidden md:flex flex-col justify-between w-1/3 bg-[#111111] text-white p-12 min-h-screen">
            {/* Top Section */}
            <div className="mt-10">
                <h2 className="text-4xl font-light mb-2 text-center">Welcome to</h2>
            </div>

            {/* Center Section - Logo */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-20">
                <div className="flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full border-2 border-cyan-400 flex items-center justify-center mb-6 relative shadow-[0_0_20px_rgba(34,211,238,0.6)] overflow-hidden">
                        <Image 
                            src="/Logo.png" 
                            alt="Trading Agents Logo" 
                            width={160} 
                            height={160}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-4xl font-bold tracking-wide">Trading Agents</h1>
                    <p className="text-base text-gray-400 mt-3">Multi-Agents LLM Financial Trading</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="text-base text-gray-500 leading-relaxed text-justify">
                <p>
                    Experience the future of investing with our Trading Agent, powered by the collective intelligence of Multi-Agents LLM. This cutting-edge technology enables each agent to learn and adapt its strategies in real-time, responding to dynamic market conditions. They operate autonomously yet collaboratively, working as a cohesive system to identify opportunities and manage risk, making your automated trading smarter and more effective than ever before.
                </p>
            </div>
        </div>
    );
};

export default AuthSidebar;