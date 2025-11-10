/** TanStack Query client configuration. */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyError } from "@/lib/error-handling";
import { shouldShowNotification } from "@/lib/utils/error-suppression";

// Default query options - OPTIMIZED FOR PERFORMANCE
const queryConfig: DefaultOptions = {
  queries: {
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 401, 403, 404
      if (error?.status && [401, 403, 404].includes(error.status)) {
        return false;
      }
      // Retry only once for other errors (reduced from 2)
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

    // Cache configuration - BALANCED for correctness and performance
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced to prevent stale auth state
    gcTime: 15 * 60 * 1000, // 15 minutes - reduced to clear old data faster

    // Refetch configuration - BALANCED for data freshness
    refetchOnWindowFocus: false, // Disabled to prevent excessive API calls
    refetchOnReconnect: true, // Re-fetch when connection is restored
    refetchOnMount: true, // ENABLED - always check for fresh data on mount to prevent stale state

    // Network mode
    networkMode: "online",

    // Structural sharing for performance
    structuralSharing: true,
  },
  mutations: {
    // Retry configuration for mutations
    retry: false, // Don't retry mutations by default

    // Network mode
    networkMode: "online",

    // Global mutation error handler
    onError: (error: any) => {
      // Handle session errors specially
      if (error?.isSessionError) {
        notifyError(error);
        return;
      }

      // For network/server-level issues, avoid spamming users with repeated toasts.
      // Show a single user-friendly message for server unreachable conditions.
      const isNetworkError =
        (error?.name === "TypeError" &&
          error?.message?.includes("Failed to fetch")) ||
        error?.message?.toLowerCase()?.includes("network") ||
        error?.response?.status >= 500;

      if (isNetworkError) {
        if (shouldShowNotification("backend_unreachable", 30_000)) {
          toast.error(
            "Service temporarily unavailable. Please try again later."
          );
        }
        return; // Do not show additional general errors for network/server issues
      }

      // Handle other errors (validation / client-side errors)
      notifyError(error);
    },
  },
};

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    profile: () => [...queryKeys.auth.all, "profile"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
    registrationOptions: () =>
      [...queryKeys.auth.all, "registration-options"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    stats: () => [...queryKeys.users.all, "stats"] as const,
  },

  // Classes/Batches
  classes: {
    all: ["classes"] as const,
    lists: () => [...queryKeys.classes.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.classes.lists(), filters] as const,
    details: () => [...queryKeys.classes.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.classes.details(), id] as const,
    students: (classId: string) =>
      [...queryKeys.classes.detail(classId), "students"] as const,
  },

  // Batches
  batches: {
    all: ["batches"] as const,
    lists: () => [...queryKeys.batches.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.batches.lists(), filters] as const,
    details: () => [...queryKeys.batches.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.batches.details(), id] as const,
    byGrade: (gradeId: string) =>
      [...queryKeys.batches.all, "by-grade", gradeId] as const,
  },

  // Subjects
  subjects: {
    all: ["subjects"] as const,
    lists: () => [...queryKeys.subjects.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.subjects.lists(), filters] as const,
    details: () => [...queryKeys.subjects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.subjects.details(), id] as const,
    teachers: (subjectId: string) =>
      [...queryKeys.subjects.detail(subjectId), "teachers"] as const,
  },

  // Attendance
  attendance: {
    all: ["attendance"] as const,
    lists: () => [...queryKeys.attendance.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.attendance.lists(), filters] as const,
    details: () => [...queryKeys.attendance.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.attendance.details(), id] as const,
    byClass: (classId: string, date?: string) =>
      [...queryKeys.attendance.all, "by-class", classId, date] as const,
    stats: (filters?: Record<string, any>) =>
      [...queryKeys.attendance.all, "stats", filters] as const,
  },

  // Exams
  exams: {
    all: ["exams"] as const,
    lists: () => [...queryKeys.exams.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.exams.lists(), filters] as const,
    details: () => [...queryKeys.exams.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.exams.details(), id] as const,
    results: (examId: string) =>
      [...queryKeys.exams.detail(examId), "results"] as const,
  },

  // Timetable
  timetable: {
    all: ["timetable"] as const,
    byClass: (classId: string) =>
      [...queryKeys.timetable.all, "by-class", classId] as const,
    byTeacher: (teacherId: string) =>
      [...queryKeys.timetable.all, "by-teacher", teacherId] as const,
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    dashboard: (role?: string) =>
      [...queryKeys.analytics.all, "dashboard", role] as const,
    attendance: (filters?: Record<string, any>) =>
      [...queryKeys.analytics.all, "attendance", filters] as const,
    performance: (filters?: Record<string, any>) =>
      [...queryKeys.analytics.all, "performance", filters] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, "unread-count"] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    lists: () => [...queryKeys.payments.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },

  // Wallet
  wallet: {
    all: ["wallet"] as const,
    balance: () => [...queryKeys.wallet.all, "balance"] as const,
    transactions: (filters?: Record<string, any>) =>
      [...queryKeys.wallet.all, "transactions", filters] as const,
  },

  // Health
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
    backend: () => [...queryKeys.health.all, "backend"] as const,
  },
};

// Invalidation helpers
export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  classes: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
  batches: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.batches.all }),
  subjects: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all }),
  attendance: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
  exams: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  timetable: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.timetable.all }),
  analytics: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  notifications: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  payments: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
  wallet: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
  all: () => queryClient.invalidateQueries(),
};
