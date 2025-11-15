import { ApiClient } from "./api-client";

// Enums
export enum RescheduleStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum RescheduleReason {
  TEACHER_LEAVE = "TEACHER_LEAVE",
  HOLIDAY = "HOLIDAY",
  EMERGENCY = "EMERGENCY",
  MAKEUP = "MAKEUP",
  FACILITY_ISSUE = "FACILITY_ISSUE",
  OTHER = "OTHER",
}

// Interfaces
export interface ClassRescheduling {
  id: string;
  originalClassId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  teacherId: string;
  reason: RescheduleReason;
  reasonDetails?: string;
  status: RescheduleStatus;
  studentsNotified: boolean;
  notificationSentAt?: string;
  conflictResolution?: string;
  hasConflicts: boolean;
  affectedStudentIds: string[];
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  originalClass?: {
    id: string;
    name: string;
    description?: string;
    subject?: {
      id: string;
      name: string;
    };
    grade?: {
      id: string;
      name: string;
    };
  };
  teacher?: {
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

export interface CreateReschedulingDto {
  originalClassId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: RescheduleReason;
  reasonDetails?: string;
}

export interface UpdateReschedulingDto {
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: RescheduleReason;
  reasonDetails?: string;
}

export interface ReschedulingFilterDto {
  originalClassId?: string;
  teacherId?: string;
  status?: RescheduleStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApproveReschedulingDto {
  notifyStudents?: boolean;
}

export interface RejectReschedulingDto {
  rejectionReason: string;
}

export interface ReschedulingStatistics {
  total: number;
  byStatus: {
    [key in RescheduleStatus]: number;
  };
  byReason: {
    [key in RescheduleReason]: number;
  };
}

export interface ReschedulingListResponse {
  data: ClassRescheduling[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Client Methods
export const classReschedulingApi = {
  /**
   * Create a new class rescheduling request
   */
  createRescheduling: async (
    data: CreateReschedulingDto
  ): Promise<ClassRescheduling> => {
    const response = await ApiClient.post<ClassRescheduling>(
      "/class-rescheduling",
      data
    );
    return response;
  },

  /**
   * Get list of rescheduling requests with filters
   */
  getReschedulingList: async (
    filters?: ReschedulingFilterDto
  ): Promise<ReschedulingListResponse> => {
    const params = new URLSearchParams();
    if (filters?.originalClassId)
      params.append("originalClassId", filters.originalClassId);
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = queryString
      ? `/class-rescheduling?${queryString}`
      : "/class-rescheduling";

    const response = await ApiClient.get<ReschedulingListResponse>(url);
    return response;
  },

  /**
   * Get rescheduling statistics
   */
  getStatistics: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ReschedulingStatistics> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/class-rescheduling/statistics?${queryString}`
      : "/class-rescheduling/statistics";

    const response = await ApiClient.get<ReschedulingStatistics>(url);
    return response;
  },

  /**
   * Get rescheduling history for a class
   */
  getClassHistory: async (classId: string): Promise<ClassRescheduling[]> => {
    const response = await ApiClient.get<ClassRescheduling[]>(
      `/class-rescheduling/history/${classId}`
    );
    return response;
  },

  /**
   * Get rescheduling by ID
   */
  getReschedulingById: async (id: string): Promise<ClassRescheduling> => {
    const response = await ApiClient.get<ClassRescheduling>(
      `/class-rescheduling/${id}`
    );
    return response;
  },

  /**
   * Update rescheduling request (only for pending requests)
   */
  updateRescheduling: async (
    id: string,
    data: UpdateReschedulingDto
  ): Promise<ClassRescheduling> => {
    const response = await ApiClient.patch<ClassRescheduling>(
      `/class-rescheduling/${id}`,
      data
    );
    return response;
  },

  /**
   * Approve rescheduling request
   */
  approveRescheduling: async (
    id: string,
    data?: ApproveReschedulingDto
  ): Promise<ClassRescheduling> => {
    const response = await ApiClient.patch<ClassRescheduling>(
      `/class-rescheduling/${id}/approve`,
      data || {}
    );
    return response;
  },

  /**
   * Reject rescheduling request
   */
  rejectRescheduling: async (
    id: string,
    data: RejectReschedulingDto
  ): Promise<ClassRescheduling> => {
    const response = await ApiClient.patch<ClassRescheduling>(
      `/class-rescheduling/${id}/reject`,
      data
    );
    return response;
  },

  /**
   * Cancel rescheduling request
   */
  cancelRescheduling: async (id: string): Promise<ClassRescheduling> => {
    const response = await ApiClient.patch<ClassRescheduling>(
      `/class-rescheduling/${id}/cancel`,
      {}
    );
    return response;
  },

  /**
   * Mark rescheduling as completed
   */
  completeRescheduling: async (id: string): Promise<ClassRescheduling> => {
    const response = await ApiClient.patch<ClassRescheduling>(
      `/class-rescheduling/${id}/complete`,
      {}
    );
    return response;
  },
};
