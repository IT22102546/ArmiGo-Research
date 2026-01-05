/** Attendance query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/endpoints/attendance";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useAttendanceQueries");

interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get attendance records
 */
export function useAttendance(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: queryKeys.attendance.list(filters),
    queryFn: async () => {
      return await attendanceApi.getAll(filters);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get attendance by class ID
 */
export function useAttendanceByClass(classId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.attendance.all, "by-class", classId],
    queryFn: async () => {
      return await attendanceApi.getAll({ classId });
    },
    enabled: enabled && !!classId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get attendance statistics (admin only)
 */
export function useAttendanceStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.attendance.all, "stats"],
    queryFn: async () => {
      return await attendanceApi.getStats();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mark attendance mutation (bulk)
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      classId: string;
      date: string;
      attendance: Array<{
        studentId: string;
        status: string;
        remarks?: string;
      }>;
    }) => {
      // Transform to bulkMark format
      const bulkData = {
        attendances: data.attendance.map((a) => ({
          userId: a.studentId,
          date: data.date,
          classId: data.classId,
          present: a.status === "PRESENT",
          notes: a.remarks,
        })),
      };
      return await attendanceApi.bulkMark(bulkData);
    },
    onSuccess: (_, { classId, date }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });

      handleApiSuccess("Attendance marked successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to mark attendance:", error);
      handleApiError(
        error,
        "useAttendance.markAttendance",
        "Failed to mark attendance"
      );
    },
  });
}

/**
 * Update attendance mutation
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await attendanceApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      handleApiSuccess("Attendance updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update attendance:", error);
      handleApiError(
        error,
        "useAttendance.updateAttendance",
        "Failed to update attendance"
      );
    },
  });
}

/**
 * Bulk mark attendance mutation (with optimistic updates)
 */
export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      classId: string;
      date: string;
      records: Array<{ studentId: string; status: string }>;
    }) => {
      // Transform to bulkMark format
      const bulkData = {
        attendances: data.records.map((r) => ({
          userId: r.studentId,
          date: data.date,
          classId: data.classId,
          present: r.status === "PRESENT",
        })),
      };
      return await attendanceApi.bulkMark(bulkData);
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance.all });

      // Snapshot previous value
      const previousAttendance = queryClient.getQueryData(
        queryKeys.attendance.all
      );

      return { previousAttendance };
    },
    onSuccess: (_, { classId, date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.lists() });

      handleApiSuccess("Attendance marked for all students");
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousAttendance) {
        queryClient.setQueryData(
          queryKeys.attendance.all,
          context.previousAttendance
        );
      }

      logger.error("Failed to bulk mark attendance:", error);
      handleApiError(
        error,
        "useAttendance.bulkMarkAttendance",
        "Failed to mark attendance"
      );
    },
  });
}

/**
 * Get attendance report for a user
 */
export function useAttendanceReport(
  userId: string,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      ...queryKeys.attendance.all,
      "report",
      userId,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      return await attendanceApi.getReport(userId, startDate, endDate);
    },
    enabled: enabled && !!userId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}
