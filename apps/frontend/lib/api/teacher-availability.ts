import { ApiClient } from "./api-client";

// Enums
export enum LeaveType {
  SICK_LEAVE = "SICK_LEAVE",
  CASUAL_LEAVE = "CASUAL_LEAVE",
  EMERGENCY = "EMERGENCY",
  PROFESSIONAL_DEVELOPMENT = "PROFESSIONAL_DEVELOPMENT",
  PERSONAL = "PERSONAL",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  VACATION = "VACATION",
  OTHER = "OTHER",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// Interfaces
export interface TeacherAvailability {
  id: string;
  teacherId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  replacementTeacherId?: string;
  replacementApproved: boolean;
  affectedClassIds: string[];
  autoRescheduled: boolean;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  replacementTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejector?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateLeaveDto {
  teacherId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  replacementTeacherId?: string;
}

export interface UpdateLeaveDto {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
  replacementTeacherId?: string;
}

export interface AvailabilityFilterDto {
  teacherId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApproveLeaveDto {
  replacementTeacherId?: string;
}

export interface RejectLeaveDto {
  rejectionReason: string;
}

export interface ReplacementSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  commonSubjects: number;
  subjects?: string[];
}

export interface LeaveStatistics {
  total: number;
  byStatus: {
    [key in LeaveStatus]: number;
  };
  byType: {
    [key in LeaveType]: number;
  };
}

export interface AvailabilityListResponse {
  data: TeacherAvailability[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CalendarEntry {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string;
}

// API Client Methods
export const teacherAvailabilityApi = {
  /**
   * Create a new leave request
   */
  createLeaveRequest: async (
    data: CreateLeaveDto
  ): Promise<TeacherAvailability> => {
    const response = await ApiClient.post<TeacherAvailability>(
      "/teacher-availability",
      data
    );
    return response;
  },

  /**
   * Get list of teacher availability/leaves with filters
   */
  getAvailabilityList: async (
    filters?: AvailabilityFilterDto
  ): Promise<AvailabilityListResponse> => {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.leaveType) params.append("leaveType", filters.leaveType);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = queryString
      ? `/teacher-availability?${queryString}`
      : "/teacher-availability";

    const response = await ApiClient.get<AvailabilityListResponse>(url);
    return response;
  },

  /**
   * Get leave statistics
   */
  getStatistics: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveStatistics> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/teacher-availability/statistics?${queryString}`
      : "/teacher-availability/statistics";

    const response = await ApiClient.get<LeaveStatistics>(url);
    return response;
  },

  /**
   * Get teacher leave calendar
   */
  getTeacherCalendar: async (
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEntry[]> => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await ApiClient.get<CalendarEntry[]>(
      `/teacher-availability/calendar/${teacherId}?${params.toString()}`
    );
    return response;
  },

  /**
   * Get replacement teacher suggestions
   */
  getReplacementSuggestions: async (
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<ReplacementSuggestion[]> => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await ApiClient.get<ReplacementSuggestion[]>(
      `/teacher-availability/suggestions/${teacherId}?${params.toString()}`
    );
    return response;
  },

  /**
   * Get leave request by ID
   */
  getAvailabilityById: async (id: string): Promise<TeacherAvailability> => {
    const response = await ApiClient.get<TeacherAvailability>(
      `/teacher-availability/${id}`
    );
    return response;
  },

  /**
   * Update leave request (only for pending leaves)
   */
  updateLeaveRequest: async (
    id: string,
    data: UpdateLeaveDto
  ): Promise<TeacherAvailability> => {
    const response = await ApiClient.patch<TeacherAvailability>(
      `/teacher-availability/${id}`,
      data
    );
    return response;
  },

  /**
   * Approve leave request
   */
  approveLeave: async (
    id: string,
    data?: ApproveLeaveDto
  ): Promise<TeacherAvailability> => {
    const response = await ApiClient.patch<TeacherAvailability>(
      `/teacher-availability/${id}/approve`,
      data || {}
    );
    return response;
  },

  /**
   * Reject leave request
   */
  rejectLeave: async (
    id: string,
    data: RejectLeaveDto
  ): Promise<TeacherAvailability> => {
    const response = await ApiClient.patch<TeacherAvailability>(
      `/teacher-availability/${id}/reject`,
      data
    );
    return response;
  },

  /**
   * Cancel leave request
   */
  cancelLeave: async (id: string): Promise<TeacherAvailability> => {
    const response = await ApiClient.patch<TeacherAvailability>(
      `/teacher-availability/${id}/cancel`,
      {}
    );
    return response;
  },
};
