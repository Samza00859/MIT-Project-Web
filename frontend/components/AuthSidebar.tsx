import React from 'react';
import { TrendingUp } from 'lucide-react'; // คุณอาจต้องลง npm install lucide-react หรือใช้ icon อื่นแทน

const AuthSidebar = () => {
    return (
        <div className="hidden md:flex flex-col justify-between w-1/3 bg-[#111111] text-white p-12 min-h-screen">
            {/* Top Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-light mb-2 text-center">Welcome to</h2>

                {/* Logo Placeholder */}
                <div className="flex flex-col items-center my-10">
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-400 flex items-center justify-center mb-4 relative shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                        <TrendingUp className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-wide">Trading Agents</h1>
                    <p className="text-sm text-gray-400 mt-2">Multi-Agents LLM Financial Trading</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="text-xs text-gray-500 leading-relaxed text-justify">
                <p>
                    Experience the future of investing with our Trading Agent, powered by the collective intelligence of Multi-Agents LLM. This cutting-edge technology enables each agent to learn and adapt its strategies in real-time, responding to dynamic market conditions. They operate autonomously yet collaboratively, working as a cohesive system to identify opportunities and manage risk, making your automated trading smarter and more effective than ever before.
                </p>
            </div>
        </div>
    );
};

export default AuthSidebar;