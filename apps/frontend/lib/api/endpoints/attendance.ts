import { ApiClient } from "../api-client";

// lib/api/endpoints/attendance.ts - CORRECTED VERSION
export const attendanceApi = {
  //  Get attendance with filters (teachers can see all, students see only their own)
  getAll: (params?: {
    userId?: string;
    classId?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    present?: boolean;
    type?: string;
    month?: number;
    year?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.present !== undefined)
      queryParams.append("present", params.present.toString());
    if (params?.type) queryParams.append("type", params.type);
    if (params?.month) queryParams.append("month", params.month.toString());
    if (params?.year) queryParams.append("year", params.year.toString());

    const queryString = queryParams.toString();
    return ApiClient.get<any[]>(
      `/attendance${queryString ? `?${queryString}` : ""}`
    );
  },

  //  Get attendance for a specific session
  getBySession: (sessionId: string) =>
    ApiClient.get<any[]>(`/attendance?sessionId=${sessionId}`),

  //  Mark single attendance (TEACHERS ONLY)
  mark: (data: {
    userId: string;
    date: string;
    classId?: string;
    sessionId?: string;
    present: boolean;
    joinTime?: string;
    leaveTime?: string;
    duration?: number;
    notes?: string;
    type?: string;
  }) => ApiClient.post<any>("/attendance/mark", data),

  //  Bulk mark attendance (TEACHERS ONLY)
  bulkMark: (data: {
    attendances: Array<{
      userId: string;
      date: string;
      classId?: string;
      present: boolean;
      notes?: string;
    }>;
  }) => ApiClient.post<any[]>("/attendance/bulk-mark", data),

  //  Get student attendance (students can only see their own)
  getStudentAttendance: (
    userId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      month?: number;
      year?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.month) queryParams.append("month", params.month.toString());
    if (params?.year) queryParams.append("year", params.year.toString());

    const queryString = queryParams.toString();
    return ApiClient.get<any[]>(
      `/attendance/student/${userId}${queryString ? `?${queryString}` : ""}`
    );
  },

  //  Get attendance by ID
  getById: (id: string) => ApiClient.get<any>(`/attendance/${id}`),

  //  Get calendar view
  getCalendar: (userId: string, month: number, year: number) =>
    ApiClient.get<any>(
      `/attendance/calendar/${userId}?month=${month}&year=${year}`
    ),

  //  Get monthly summary
  getSummary: (userId: string, month: number, year: number) =>
    ApiClient.get<any>(
      `/attendance/summary/${userId}?month=${month}&year=${year}`
    ),

  //  Get attendance statistics (admin only)
  getStats: () =>
    ApiClient.get<{
      totalRecords: number;
      presentCount: number;
      absentCount: number;
      averageAttendanceRate: number;
      byClass: Array<{
        classId: string;
        className: string;
        attendanceRate: number;
      }>;
    }>("/attendance/stats"),

  //  Get attendance report
  getReport: (userId: string, startDate: string, endDate: string) =>
    ApiClient.get<any>(
      `/attendance/report/${userId}?startDate=${startDate}&endDate=${endDate}`
    ),

  //  Update attendance (TEACHERS ONLY)
  update: (
    id: string,
    data: {
      present?: boolean;
      joinTime?: string;
      leaveTime?: string;
      duration?: number;
      notes?: string;
    }
  ) => ApiClient.patch<any>(`/attendance/${id}`, data),

  //  Delete attendance (ADMIN ONLY)
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/attendance/${id}`),
};
