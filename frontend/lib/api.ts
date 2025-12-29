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
const DEFAULT_API_URL = "http://localhost:8000";

// Resolve once at module load so all callers share a single, consistent base URL.
// Note: Next.js inlines NEXT_PUBLIC_* at build time. If you change the value,
// you must restart `npm run dev` so the client bundle picks up the new URL.
const RESOLVED_API_BASE = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  // Force http for local dev to avoid mixed-content/HTTPS-on-localhost issues.
  const normalized = (fromEnv || DEFAULT_API_URL).replace(/^https:\/\//, "http://");
  // Dev-only visibility to confirm what the frontend will actually use.
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log("[api] Using API base URL:", normalized);
  }
  return normalized || DEFAULT_API_URL;
})();

/**
 * Resolve the API base URL used by all frontend calls.
 * - Uses NEXT_PUBLIC_API_URL from the environment (configured in next.config.ts).
 * - Falls back to localhost:8000 for local development.
 * - Forces http to avoid accidental https mismatches during local testing.
 *
 * To point to another environment, set NEXT_PUBLIC_API_URL in your shell or
 * update next.config.ts. This keeps a single source of truth for API routing.
 */
export function getApiBaseUrl(): string {
  return RESOLVED_API_BASE;
}

export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${cleanPath}`;
}

export function buildWsUrl(path = "/ws"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Swap protocol for websocket usage while keeping the same host/port.
  const wsBase = getApiBaseUrl().replace(/^http/, "ws");
  return `${wsBase}${cleanPath}`;
}

/**
 * Provide a clear, user-facing error for connectivity issues.
 */
export function mapFetchError(error: unknown, endpoint: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";

  const lower = message.toLowerCase();
  // Network-level failures (browser reports TypeError: Failed to fetch / Network request failed).
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("networkerror")
  ) {
    return `Backend unreachable at ${getApiBaseUrl()} — verify the server is running on http://localhost:8000 and that CORS allows this origin.`;
  }

  // CORS-specific hints (the browser often just reports a network error, but some stacks mention CORS).
  if (lower.includes("cors")) {
    return "Request was blocked by CORS. Ensure the backend allows http://localhost:3000 and restart the server.";
  }

  // Anything else is likely an HTTP response handled by the caller.
  if (message.includes("AbortError")) {
    return `Request to ${endpoint} timed out or was aborted.`;
  }

  return `Unable to reach ${endpoint}: ${message}`;
}

