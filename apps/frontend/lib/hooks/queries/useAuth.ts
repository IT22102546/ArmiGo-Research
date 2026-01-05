/**
 * Auth Query Hooks
 *
 * React Query mutations for authentication operations.
 * These handle server-state mutations and update Zustand store on success.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/stores/auth-store";
import { LoginData, RegisterData, TeacherRegisterData } from "@/lib/api/types";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("AuthHooks");

/**
 * Login mutation
 * Updates Zustand store on successful login
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: async (data: LoginData) => {
      setLoading(true);
      try {
        const response = await authApi.login(data);
        return response;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (response) => {
      // Update Zustand store with user data
      setUser(response.user);

      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });

      logger.log("✅ Login successful:", response.user);
    },
    onError: (error: unknown) => {
      logger.error("❌ Login failed:", error);
      setLoading(false);
    },
  });
}

/**
 * Register mutation
 * Updates Zustand store on successful registration
 */
export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: async (data: RegisterData | TeacherRegisterData) => {
      setLoading(true);
      try {
        const response = await authApi.register(data);
        return response;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (response) => {
      // Update Zustand store with user data
      setUser(response.user);

      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });

      logger.log("✅ Registration successful:", response.user);
    },
    onError: (error: unknown) => {
      logger.error("❌ Registration failed:", error);
      setLoading(false);
    },
  });
}

/**
 * Logout mutation
 * Clears Zustand store on successful logout
 * Redirects to role-specific sign-in page
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Determine the redirect URL based on user role
  const getRedirectUrl = () => {
    if (!user) return "/sign-in";

    // Admin roles should redirect to admin sign-in
    const adminRoles = ["ADMIN", "SUPER_ADMIN"];
    if (adminRoles.includes(user.role)) {
      return "/admin/sign-in";
    }

    // Teachers and students redirect to regular sign-in
    return "/sign-in";
  };

  return useMutation({
    mutationFn: async () => {
      // Capture redirect URL before clearing auth
      const redirectUrl = getRedirectUrl();
      await authApi.logout();
      return redirectUrl;
    },
    onSuccess: (redirectUrl: string) => {
      // Clear Zustand store
      clearAuth();

      // Clear all queries
      queryClient.clear();

      logger.log("✅ Logout successful");

      // Redirect to role-specific sign-in
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl;
      }
    },
    onError: (error: unknown) => {
      logger.error("❌ Logout failed:", error);
      // Capture redirect URL before clearing auth
      const redirectUrl = getRedirectUrl();
      // Still clear auth on error
      clearAuth();

      if (typeof window !== "undefined") {
        window.location.href = redirectUrl;
      }
    },
  });
}

/**
 * Check auth mutation
 * Validates session and updates Zustand store
 */
export function useCheckAuthMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const response = await authApi.getProfile();
        return response;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (response) => {
      setUser(response.user);
      logger.log("✅ Auth check successful");
    },
    onError: (error: unknown) => {
      const apiError = error as { message?: string; isSessionError?: boolean };
      logger.error("❌ Auth check failed:", error);

      // Only clear auth on authentication errors (401, 403)
      if (
        apiError.message?.includes("401") ||
        apiError.message?.includes("403") ||
        apiError.message?.includes("Authentication required")
      ) {
        const errorReason = apiError.isSessionError
          ? apiError.message
          : "Session expired - please login again";
        clearAuth(errorReason);
      }

      setLoading(false);
    },
  });
}
