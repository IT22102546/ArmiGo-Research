// @deprecated Use useSession() instead

import { useEffect, useRef } from "react";
import { useAuthStore, getCurrentUserSignInUrl } from "@/stores/auth-store";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("TokenMonitor");

const ACCESS_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS * 0.75;

export function useTokenMonitor() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = user !== null;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      isInitialized.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!isInitialized.current) {
      const initTimer = setTimeout(() => {
        isInitialized.current = true;
        logger.log(
          `Initialized - will refresh tokens every ${REFRESH_INTERVAL_MS / 60000} minutes`
        );
      }, 1000);

      return () => clearTimeout(initTimer);
    }

    const refreshTokens = async () => {
      try {
        logger.debug("Attempting silent token refresh...");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          logger.log("✅ Tokens refreshed successfully");
        } else if (response.status === 401) {
          logger.warn("Session expired - logging out");
          const redirectUrl = getCurrentUserSignInUrl();
          clearAuth("Your session has expired. Please login again.");

          if (typeof window !== "undefined") {
            window.location.href = redirectUrl;
          }
        } else {
          logger.warn(`Refresh failed with status ${response.status}`);
        }
      } catch (error) {
        logger.error("Token refresh error", error);
      }
    };

    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, clearAuth]);
}
