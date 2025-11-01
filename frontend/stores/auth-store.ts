import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api/endpoints/auth";
import { LoginData, RegisterData, User } from "@/lib/api/types";

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (data: LoginData) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Role-based redirect after successful login
          if (typeof window !== "undefined") {
            const userRole = response.user.role;
            if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
              window.location.href = "/dashboard";
            } else if (userRole === "INTERNAL_TEACHER" || userRole === "EXTERNAL_TEACHER") {
              window.location.href = "/dashboard";
            } else {
              // Students or other roles - could add student dashboard later
              window.location.href = "/dashboard";
            }
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const currentUser = get().user;
        try {
          await authApi.logout();
        } catch (error) {
          // Silently handle logout errors
        } finally {
          get().clearAuth();
          if (typeof window !== "undefined") {
            // Redirect based on previous role
            if (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN") {
              window.location.href = "/admin/sign-in";
            } else {
              window.location.href = "/sign-in";
            }
          }
        }
      },

      checkAuth: async () => {
        const state = get();

        // Skip if already loading or recently checked
        if (state.isLoading || state.isAuthenticated) {
          return;
        }

        // Skip auth check on public pages
        if (typeof window !== "undefined") {
          const publicPages = ["/", "/sign-in", "/sign-up", "/teacher-sign-up", "/admin/sign-in", "/teacher-sign-in"];
          const isPublicPage = publicPages.includes(window.location.pathname);
          if (isPublicPage) return;
        }

        set({ isLoading: true });

        try {
          // Increased delay to prevent throttling
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const response = await authApi.getProfile();
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          if (
            error.message?.includes("ThrottlerException") ||
            error.message?.includes("429")
          ) {
            // Don't clear auth on throttling errors
          } else {
            // Clear auth only on actual auth errors
            state.clearAuth();
          }
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true, //prevents hydration issues!
    }
  )
);
