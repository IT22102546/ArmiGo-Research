import { useEffect, useRef } from "react";
import { useAuthStore, getCurrentUserSignInUrl } from "@/stores/auth-store";
import { useCheckAuthMutation } from "@/lib/hooks/queries/useAuth";
import { createLogger } from "@/lib/utils/logger";

const sessionLogger = createLogger("SessionValidator");
const tokenLogger = createLogger("TokenMonitor");

const ACCESS_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS * 0.75;
const SESSION_VALIDATION_THRESHOLD = 30000;

export function useSession() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { mutateAsync: checkAuth } = useCheckAuthMutation();

  const lastVisibleTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);

  const isAuthenticated = user !== null;

  // Session Validation - when user returns to tab
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const timeSinceHidden = Date.now() - lastVisibleTime.current;

        sessionLogger.debug(
          `Tab visible again after ${Math.round(timeSinceHidden / 1000)}s`
        );

        // Only validate if tab was hidden for more than 30 seconds
        if (timeSinceHidden > SESSION_VALIDATION_THRESHOLD) {
          sessionLogger.log("Validating session after extended absence");

          try {
            await checkAuth();
          } catch (error) {
            sessionLogger.error("Session validation failed", error);
          }
        }

        lastVisibleTime.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, checkAuth]);

  // Token Refresh Monitor
  useEffect(() => {
    if (!isAuthenticated) {
      isInitialized.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Wait for initial validation to complete before starting monitor
    if (!isInitialized.current) {
      const initTimer = setTimeout(() => {
        isInitialized.current = true;
        tokenLogger.log(
          `Initialized - will refresh tokens every ${REFRESH_INTERVAL_MS / 60000} minutes`
        );
      }, 1000);

      return () => clearTimeout(initTimer);
    }

    // Function to silently refresh tokens
    const refreshTokens = async () => {
      try {
        tokenLogger.debug("Attempting silent token refresh...");

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
          tokenLogger.log("✅ Tokens refreshed successfully");
        } else if (response.status === 401) {
          tokenLogger.warn("Session expired - logging out");
          const redirectUrl = getCurrentUserSignInUrl();
          clearAuth("Your session has expired. Please login again.");

          if (typeof window !== "undefined") {
            window.location.href = redirectUrl;
          }
        } else {
          tokenLogger.warn(
            `Token refresh failed with status ${response.status}`
          );
        }
      } catch (error) {
        tokenLogger.error("[TokenMonitor] Token refresh error:", error);
      }
    };

    // Start periodic refresh
    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL_MS);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, clearAuth]);
}
