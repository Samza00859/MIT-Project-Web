import type { Metadata } from "next";
import { Geist, Geist_Mono, Prompt } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
});

export const metadata: Metadata = {
  title: "TradingAgents AI",
  description: "AI-powered trading analysis platform",
};

import Sidebar from "../components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${prompt.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden bg-transparent">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-transparent relative w-full h-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

