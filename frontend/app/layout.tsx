import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden bg-transparent">
            <Sidebar />
            <main id="main-content" className="flex-1 overflow-hidden bg-transparent relative w-full h-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

