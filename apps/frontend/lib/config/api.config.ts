/** API configuration. */

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 30000,
  withCredentials: true,
} as const;

export const WS_CONFIG = {
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000",
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
} as const;

export const AUTH_CONFIG = {
  tokenRefreshInterval: 4 * 60 * 1000, // 4 minutes
  sessionCheckInterval: 60 * 1000, // 1 minute
} as const;
