"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useCheckAuthMutation } from "@/lib/hooks/queries/useAuth";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("AuthInitializer");

const PUBLIC_PAGES = new Set([
  "/",
  "/sign-in",
  "/sign-up/external-teacher",
  "/admin/sign-in",
  "/forgot-password",
  "/reset-password",
  "/404",
  "/500",
]);

export function AuthInitializer() {
  // Use stable selector - only care if user exists, not the full object
  const hasUser = useAuthStore((state) => state.user !== null);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  const hasInitialized = useRef(false);
  const isValidating = useRef(false);
  const { mutateAsync: checkAuth } = useCheckAuthMutation();

  // Authentication validation
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const pathname = window.location.pathname;

    if (PUBLIC_PAGES.has(pathname) || pathname.startsWith("/sign-up")) {
      logger.debug("Public page - skipping validation");
      return;
    }

    // IMPORTANT: Even if hasUser is true, we still validate on mount
    // because localStorage user doesn't guarantee valid tokens
    // The server will auto-refresh if needed via ApiClient retry logic
    if (hasUser) {
      logger.debug(
        "Cached user found - skipping validation to prevent race conditions"
      );
      // CHANGED: If user exists in localStorage, trust it and skip validation
      // to prevent page reload loops. ApiClient will handle token refresh on 401.
      return;
    }

    // Only validate if no user is cached
    const validateAuth = async () => {
      // Prevent concurrent validation attempts
      if (isValidating.current) {
        logger.debug("Validation already in progress - skipping");
        return;
      }

      isValidating.current = true;
      logger.debug("No cached user - validating with server");

      try {
        await checkAuth();
        logger.debug("✅ Auth validated");
      } catch (error) {
        logger.error("Auth validation failed:", error);

        // Redirect to appropriate sign-in page immediately
        const isAdminPath = pathname.startsWith("/admin");
        const signInPath = isAdminPath ? "/admin/sign-in" : "/sign-in";
        logger.debug(`Redirecting to ${signInPath}`);

        // Use window.location for immediate redirect
        if (typeof window !== "undefined") {
          window.location.href = signInPath;
        }
      } finally {
        isValidating.current = false;
      }
    };

    validateAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
