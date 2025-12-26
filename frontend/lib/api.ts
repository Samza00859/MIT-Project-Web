/**
 * API URL utilities for connecting frontend to backend.
 * Uses environment variables for production deployment.
 */

/**
 * Get the base API URL for HTTP requests.
 * Priority: NEXT_PUBLIC_API_URL env var > dynamic detection > localhost fallback
 */
export function getApiUrl(): string {
    // 1. Check for environment variable (set in production)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Dynamic detection based on current window location
    if (typeof window !== "undefined") {
        const { protocol, hostname } = window.location;

        // Skip for file:// protocol or empty hostname
        if (protocol !== "file:" && hostname !== "") {
            // Use same hostname but port 8000 for backend
            return `${protocol}//${hostname}:8000`;
        }
    }

    // 3. Fallback to localhost for development
    return "http://localhost:8000";
}

/**
 * Get the WebSocket URL for real-time connections.
 * Priority: NEXT_PUBLIC_WS_URL env var > dynamic detection > localhost fallback
 */
export function getWsUrl(): string {
    // 1. Check for explicit WebSocket URL
    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL;
    }

    // 2. Derive from API URL if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // Convert http(s) to ws(s)
        return apiUrl.replace(/^http/, "ws") + "/ws";
    }

    // 3. Dynamic detection based on current window location
    if (typeof window !== "undefined") {
        const { protocol, hostname } = window.location;

        // Skip for file:// protocol or empty hostname
        if (protocol !== "file:" && hostname !== "") {
            const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
            return `${wsProtocol}//${hostname}:8000/ws`;
        }
    }

    // 4. Fallback to localhost for development
    return "ws://localhost:8000/ws";
}

/**
 * Default backend URL for configuration purposes
 */
export const DEFAULT_BACKEND_URL = "http://localhost:8000";
