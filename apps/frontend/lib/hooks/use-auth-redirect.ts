"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthRedirect() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = user !== null;

  useEffect(() => {
    // Only redirect if authenticated and user data is loaded
    if (isAuthenticated && user) {
      const currentPath = window.location.pathname;

      // Don't redirect if already on a dashboard/protected page
      if (currentPath.includes("/admin") || currentPath.includes("/teacher")) {
        return;
      }

      // Redirect based on role
      switch (user.role) {
        case "SUPER_ADMIN":
        case "ADMIN":
          router.push("/admin");
          break;
        case "INTERNAL_TEACHER":
        case "EXTERNAL_TEACHER":
          router.push("/teacher");
          break;
        case "INTERNAL_STUDENT":
        case "EXTERNAL_STUDENT":
          // Students should use mobile app
          router.push("/");
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
      return "/admin";
    case "INTERNAL_TEACHER":
    case "EXTERNAL_TEACHER":
      return "/teacher";
    case "INTERNAL_STUDENT":
    case "EXTERNAL_STUDENT":
      return "/"; // Students use mobile app
    default:
      return "/";
  }
}
