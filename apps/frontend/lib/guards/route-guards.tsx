"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type { UserRole } from "@/lib/api/types/user.types";

// Re-export UserRole for convenience
export type { UserRole } from "@/lib/api/types/user.types";

// Roles that have access to the frontend dashboard
export const FRONTEND_ACCESS_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "INTERNAL_TEACHER",
];

// External teachers have limited frontend access (transfers only)
export const EXTERNAL_TEACHER_ALLOWED_ROUTES: string[] = [
  "/teacher/transfers",
  "/teacher/profile",
  "/teacher/settings",
  "/teacher/change-password",
];

// Admin roles that should use /admin/sign-in
export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

// All teacher roles
export const TEACHER_ROLES: UserRole[] = [
  "INTERNAL_TEACHER",
  "EXTERNAL_TEACHER",
];

interface RouteConfig {
  path: string;
  allowedRoles?: UserRole[];
  requireAuth: boolean;
  redirectTo?: string;
}

const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/",
  "/admin/sign-in",
];

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/admin/sign-in",
];

function matchesRoute(pathname: string, route: string): boolean {
  if (route === pathname) return true;
  if (route.endsWith("/*")) {
    const baseRoute = route.slice(0, -2);
    return pathname.startsWith(baseRoute);
  }
  return false;
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matchesRoute(pathname, route));
}

/**
 * Check if EXTERNAL_TEACHER can access a specific route
 * External teachers have limited access to transfers and profile routes only
 */
export function canExternalTeacherAccess(pathname: string): boolean {
  return EXTERNAL_TEACHER_ALLOWED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

export function getDashboardPath(role?: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "INTERNAL_TEACHER":
      return "/teacher";
    // External teachers have limited access - redirect to transfers portal
    case "EXTERNAL_TEACHER":
      return "/teacher/transfers";
    // Students don't have frontend access
    case "INTERNAL_STUDENT":
    case "EXTERNAL_STUDENT":
      return "/";
    default:
      return "/";
  }
}

/**
 * Get the appropriate sign-in URL based on current path
 * Role-based validation is now handled server-side in middleware.ts
 */
function getSignInUrlForContext(pathname?: string): string {
  // If the current path is an admin route, redirect to admin sign-in
  if (pathname?.startsWith("/admin")) {
    return "/admin/sign-in";
  }
  return "/sign-in";
}

interface UseRouteGuardOptions {
  /**
   * @deprecated Role validation is now handled server-side in middleware.ts
   * This prop is kept for backward compatibility but has no effect.
   */
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
  /**
   * @deprecated Role validation is now handled server-side in middleware.ts
   */
  onUnauthorized?: () => void;
}

/**
 * useRouteGuard
 *
 * Handles authentication state for routes.
 * Role-based access control is now handled server-side in middleware.ts
 * API-level protection is handled by backend RolesGuard.
 */
export function useRouteGuard(options: UseRouteGuardOptions = {}) {
  const { requireAuth = true } = options;

  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = user !== null;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    setIsChecking(false);

    // Authentication check only - role validation done by middleware
    if (requireAuth && !isAuthenticated) {
      toast.error("Please log in to access this page");
      const signInUrl = getSignInUrlForContext(pathname);
      router.push(`${signInUrl}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect authenticated users away from auth routes
    if (isAuthenticated && isAuthRoute(pathname)) {
      const dashboardPath = getDashboardPath(user?.role);
      router.push(dashboardPath);
      return;
    }

    // Note: Role-based validation is now handled server-side in middleware.ts
  }, [isLoading, isAuthenticated, user, pathname, requireAuth, router]);

  return {
    isLoading: isLoading || isChecking,
    isAuthenticated,
    user,
  };
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * @deprecated Role validation is now handled server-side in middleware.ts
   */
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  /**
   * @deprecated Role validation is now handled server-side in middleware.ts
   */
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component from route-guards
 *
 * Note: Role-based access control is now handled server-side in middleware.ts
 * The allowedRoles prop is deprecated and has no effect.
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  fallback = <RouteGuardLoading />,
}: ProtectedRouteProps) {
  const { isLoading } = useRouteGuard({
    requireAuth,
  });

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function RouteGuardLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Hook to check if current user has one of the specified roles
 * Note: This is for UI visibility only. Access control is handled server-side.
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuthStore();
  const userRole = user?.role as UserRole;
  return allowedRoles.includes(userRole);
}

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RequireRole component for conditional UI rendering based on role
 *
 * Note: This is for UI visibility only (hiding/showing UI elements).
 * Actual access control is handled server-side in middleware.ts and backend RolesGuard.
 * Do NOT rely on this for security - it's purely for UX.
 */
export function RequireRole({
  allowedRoles,
  children,
  fallback = null,
}: RequireRoleProps) {
  const hasRole = useHasRole(allowedRoles);
  return hasRole ? <>{children}</> : <>{fallback}</>;
}
