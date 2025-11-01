// hooks/use-auth-redirect.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook to automatically redirect users to their appropriate dashboard
 * based on their role if they have a valid token
 */
export function useAuthRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only redirect if authenticated and user data is loaded
    if (isAuthenticated && user) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on a dashboard/protected page
      if (
        currentPath.includes("/dashboard") ||
        currentPath.includes("/admin") ||
        currentPath.includes("/teacher")
      ) {
        return;
      }

      // Redirect based on role
      switch (user.role) {
        case "SUPER_ADMIN":
        case "ADMIN":
          router.push("/dashboard");
          break;
        case "INTERNAL_TEACHER":
        case "EXTERNAL_TEACHER":
          router.push("/dashboard"); // Teacher dashboard
          break;
        case "INTERNAL_STUDENT":
        case "EXTERNAL_STUDENT":
          router.push("/dashboard"); // Student dashboard
          break;
        default:
          // If role is unknown, don't redirect
          break;
      }
    }
  }, [isAuthenticated, user, router]);
}

/**
 * Get the appropriate dashboard path for a user role
 */
export function getDashboardPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/dashboard";
    case "INTERNAL_TEACHER":
    case "EXTERNAL_TEACHER":
      return "/dashboard";
    case "INTERNAL_STUDENT":
    case "EXTERNAL_STUDENT":
      return "/dashboard";
    default:
      return "/";
  }
}
