"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createLogger } from "@/lib/utils/logger";
import { useTranslations } from "next-intl";

const logger = createLogger("ProtectedRoute");

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * @deprecated Role validation is now handled server-side in middleware.
   * This prop is kept for backward compatibility but has no effect.
   */
  allowedRoles?: string[];
}

/**
 * ProtectedRoute
 *
 * Handles authentication state display only.
 * Role-based access control is handled server-side in middleware.ts
 * API-level protection is handled by backend RolesGuard.
 *
 * This component:
 * 1. Shows loading state while auth is being checked
 * 2. Redirects to sign-in if not authenticated
 * 3. Renders children if authenticated (role validation done by middleware)
 */
export default function ProtectedRoute({
  children,
  allowedRoles, // Deprecated - kept for backward compatibility
}: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const t = useTranslations("common");

  useEffect(() => {
    // Trust the existing state - no API call needed
    // AuthInitializer already validated on app mount
    logger.debug("Using cached auth state");
    setIsChecking(false);
  }, []);

  useEffect(() => {
    // Only handle redirects after initial check is complete
    if (isLoading || isChecking) {
      return;
    }

    if (!user) {
      // User is not authenticated - middleware should have already redirected
      // This is a fallback for edge cases (e.g., token expired mid-session)
      logger.debug("No user found, redirecting to sign-in");
      router.push("/sign-in");
      return;
    }

    // Note: Role-based redirects are now handled by middleware.ts (server-side)
    // No client-side role validation needed here
  }, [user, isLoading, isChecking, router]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!user) return null;

  // User is authenticated - role validation handled by middleware
  return <>{children}</>;
}
