import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, checkAuth, ...actions } = useAuthStore();

  // Auto check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    ...actions,
  };
}


// export { useUIStore } from '@/stores/ui-store';