// Attendance API
import { MobileApiClient } from "../api-client";

export interface AttendanceRecord {
  id: string;
  userId: string;
  classId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  markedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export const attendanceApi = {
  /**
   * Mark attendance for a student
   */
  mark: (data: {
    userId: string;
    classId: string;
    status: string;
    date?: string;
    notes?: string;
  }) => MobileApiClient.post<AttendanceRecord>("/api/v1/attendance/mark", data),

  /**
   * Bulk mark attendance for multiple students
   */
  bulkMark: (data: {
    classId: string;
    date: string;
    attendances: Array<{ userId: string; status: string; notes?: string }>;
  }) =>
    MobileApiClient.post<{ count: number; message: string }>(
      "/api/v1/attendance/bulk-mark",
      data
    ),

  /**
   * Get attendance records
   */
  getRecords: (params?: {
    userId?: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    MobileApiClient.get<AttendanceRecord[]>(
      `/api/v1/attendance?${new URLSearchParams(params as any).toString()}`
    ),

  /**
   * Get attendance by ID
   */
  getById: (id: string) =>
    MobileApiClient.get<AttendanceRecord>(`/api/v1/attendance/${id}`),

  /**
   * Get student attendance records
   */
  getStudentAttendance: (userId: string, params?: { classId?: string }) =>
    MobileApiClient.get<AttendanceRecord[]>(
      `/api/v1/attendance/student/${userId}?${new URLSearchParams(
        params as any
      ).toString()}`
    ),

  /**
   * Get attendance summary for a student
   */
  getSummary: (
    userId: string,
    params?: { classId?: string; startDate?: string; endDate?: string }
  ) =>
    MobileApiClient.get<AttendanceSummary>(
      `/api/v1/attendance/summary/${userId}?${new URLSearchParams(
        params as any
      ).toString()}`
    ),

  /**
   * Get class attendance for a specific date
   */
  getClassAttendance: (classId: string, date: string) =>
    MobileApiClient.get<AttendanceRecord[]>(
      `/api/v1/attendance/class/${classId}?date=${date}`
    ),

  /**
   * Update attendance record
   */
  update: (id: string, data: Partial<AttendanceRecord>) =>
    MobileApiClient.patch<AttendanceRecord>(`/api/v1/attendance/${id}`, data),

  /**
   * Delete attendance record
   */
  delete: (id: string) =>
    MobileApiClient.delete<{ message: string }>(`/api/v1/attendance/${id}`),
};
