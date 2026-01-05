/** Analytics query hooks (TanStack Query). */

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/endpoints/analytics";
import { queryKeys } from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  classId?: string;
  gradeId?: string;
}

/**
 * Get dashboard analytics
 */
export function useDashboardAnalytics(filters?: DashboardFilters) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.analytics.dashboard(user?.role),
    queryFn: async () => {
      return await analyticsApi.getDashboard(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });
}

/**
 * Get attendance analytics
 */
export function useAttendanceAnalytics(filters?: {
  classId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.analytics.attendance(filters),
    queryFn: async () => {
      return await analyticsApi.getAttendanceAnalytics(filters);
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get student performance analytics
 */
export function useStudentPerformance(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, "student-performance", userId],
    queryFn: async () => {
      return await analyticsApi.getStudentPerformance(userId);
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get class analytics
 */
export function useClassAnalytics(
  filters?: { startDate?: string; endDate?: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, "class", filters],
    queryFn: async () => {
      return await analyticsApi.getClassAnalytics(filters);
    },
    enabled: enabled,
    staleTime: 3 * 60 * 1000,
  });
}
