// apps/frontend/lib/api/endpoints/analytics.ts
import { ApiClient } from "../api-client";

export interface DashboardStats {
  totalUsers: number;
  totalClasses: number;
  totalExams: number;
  totalRevenue: number;
  activeUsers: number;
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisMonth: number;
  activeUsers: number;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
}

export interface ClassAnalytics {
  totalClasses: number;
  averageClassSize: number;
  classesBySubject: Record<string, number>;
  topClasses: Array<{
    id: string;
    name: string;
    enrollmentCount: number;
  }>;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  topPayingUsers: Array<{
    id: string;
    name: string;
    totalPaid: number;
  }>;
}

export interface AttendanceAnalytics {
  averageAttendanceRate: number;
  attendanceByClass: Array<{
    classId: string;
    className: string;
    attendanceRate: number;
  }>;
  attendanceTrend: Array<{
    date: string;
    rate: number;
  }>;
}

export interface ExamAnalytics {
  totalExams: number;
  averageScore: number;
  examsBySubject: Record<string, number>;
  recentExams: Array<{
    id: string;
    title: string;
    averageScore: number;
    completionRate: number;
  }>;
}

export interface SystemAnalytics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

export const analyticsApi = {
  // Get dashboard overview statistics
  getDashboard: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: DashboardStats }>(
      `/analytics/dashboard${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get user analytics
  getUserAnalytics: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: UserAnalytics }>(
      `/analytics/users${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get class analytics
  getClassAnalytics: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: ClassAnalytics }>(
      `/analytics/classes${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get financial analytics
  getFinancialAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: FinancialAnalytics }>(
      `/analytics/financial${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get attendance analytics
  getAttendanceAnalytics: (params?: {
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: AttendanceAnalytics }>(
      `/analytics/attendance${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get exam analytics
  getExamAnalytics: (params?: {
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: ExamAnalytics }>(
      `/analytics/exams${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get student performance analytics
  getStudentPerformance: (userId: string) =>
    ApiClient.get<{ data: any }>(`/analytics/exams/students/${userId}`),

  // Get system analytics (admin only)
  getSystemAnalytics: () =>
    ApiClient.get<{ data: SystemAnalytics }>("/analytics/system"),

  // Get custom report
  getCustomReport: (params: {
    reportType: string;
    startDate?: string;
    endDate?: string;
    filters?: Record<string, any>;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append("reportType", params.reportType);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        queryParams.append(`filter_${key}`, String(value));
      });
    }
    const queryString = queryParams.toString();
    return ApiClient.get<{ data: any }>(
      `/analytics/custom${queryString ? `?${queryString}` : ""}`
    );
  },

  // Export analytics data
  exportData: (params: {
    reportType: string;
    format: "csv" | "excel" | "pdf";
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append("reportType", params.reportType);
    queryParams.append("format", params.format);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ downloadUrl: string }>(
      `/analytics/export${queryString ? `?${queryString}` : ""}`
    );
  },
};
