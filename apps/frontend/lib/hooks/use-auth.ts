import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = user !== null;

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}
