import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/lib/api/types";

function clearAuthCookies(): void {
  if (typeof document !== "undefined") {
    // Clear access_token cookie
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
      window.location.hostname +
      ";";

    // Clear refresh_token cookie
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
      window.location.hostname +
      ";";
  }
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  sessionError: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: (reason?: string) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      sessionError: null,

      // Actions
      setUser: (user: User | null) => {
        set({
          user,
          sessionError: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: (reason?: string) => {
        set({
          user: null,
          isLoading: false,
          sessionError: reason || null,
        });

        // Clear browser cookies (access_token and refresh_token)
        clearAuthCookies();

        // Clear localStorage and all cached data
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");

          // Clear React Query cache to prevent stale data after logout
          try {
            const queryClient = (window as any).__REACT_QUERY_CLIENT__;
            if (queryClient) {
              queryClient.clear();
            }
          } catch (error) {
            console.warn("Could not clear query cache:", error);
          }
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading or error states
      partialize: (state) => ({
        user: state.user,
      }),
      version: 1, // Incremented version to clear old state
    }
  )
);

export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.user !== null);
};

/**
 * Get the appropriate sign-in redirect URL based on user role
 * Regular admins (SUPER_ADMIN, ADMIN) go to /admin
 * Hospital admins go to /admin/sign-in
 * Other roles go to /sign-in
 */
export const getSignInRedirectUrl = (userRole?: string | null): string => {
  if (!userRole) return "/sign-in";

  // Regular admins go to main admin dashboard
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return "/admin";
  }
  
  // Hospital admins go to hospital admin login
  if (userRole === "HOSPITAL_ADMIN") {
    return "/admin/sign-in";
  }
  
  // Default fallback for other roles
  return "/sign-in";
};

/**
 * Get the sign-in redirect URL for the current user from store state
 */
export const getCurrentUserSignInUrl = (): string => {
  const user = useAuthStore.getState().user;
  return getSignInRedirectUrl(user?.role);
};