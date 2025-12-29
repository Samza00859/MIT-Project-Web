import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Standalone output for Docker
  output: 'standalone',

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features for faster compilation
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
