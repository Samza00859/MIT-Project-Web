import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Make the API base URL available to the client bundle. Update this value
  // (or the NEXT_PUBLIC_API_URL env var) to point at other environments.
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  /* config options here */
  // Explicitly use webpack instead of Turbopack to avoid UTF-8 path issues
  // with non-ASCII characters (Thai characters in path: เดสก์ท็อป)
  // Turbopack has issues with multi-byte UTF-8 characters in file paths
  webpack: (config) => {
    // Ensure proper UTF-8 handling for file paths
    config.resolve = config.resolve || {};
    return config;
  },
  // Add empty turbopack config to silence warnings (we're using --webpack flag)
  turbopack: {},
};

export default nextConfig;
