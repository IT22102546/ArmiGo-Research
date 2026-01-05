// apps/frontend/lib/api/endpoints/class-rescheduling.ts
import { ApiClient } from "../api-client";

export type RescheduleStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface ClassRescheduling {
  id: string;
  originalClassId: string;
  teacherId: string;
  reason: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  status: RescheduleStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  originalClass?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ReschedulingQuery {
  originalClassId?: string;
  teacherId?: string;
  status?: RescheduleStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ReschedulingStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byMonth?: {
    month: string;
    count: number;
  }[];
}

export interface CreateReschedulingData {
  originalClassId: string;
  reason: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

export interface UpdateReschedulingData {
  reason?: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
}

export const classReschedulingApi = {
  // Get list of rescheduling requests
  getAll: (query?: ReschedulingQuery) =>
    ApiClient.get<{ data: ClassRescheduling[]; total: number }>(
      "/class-rescheduling",
      { params: query }
    ),

  // Get rescheduling statistics
  getStatistics: (filters?: { startDate?: string; endDate?: string }) =>
    ApiClient.get<ReschedulingStatistics>("/class-rescheduling/statistics", {
      params: filters,
    }),

  // Get rescheduling history for a class
  getClassHistory: (classId: string) =>
    ApiClient.get<ClassRescheduling[]>(
      `/class-rescheduling/history/${classId}`
    ),

  // Get rescheduling by ID
  getById: (id: string) =>
    ApiClient.get<ClassRescheduling>(`/class-rescheduling/${id}`),

  // Create new rescheduling request
  create: (data: CreateReschedulingData) =>
    ApiClient.post<ClassRescheduling>("/class-rescheduling", data),

  // Update rescheduling request
  update: (id: string, data: UpdateReschedulingData) =>
    ApiClient.patch<ClassRescheduling>(`/class-rescheduling/${id}`, data),

  // Approve rescheduling
  approve: (id: string, notes?: string) =>
    ApiClient.patch<ClassRescheduling>(`/class-rescheduling/${id}/approve`, {
      notes,
    }),

  // Reject rescheduling
  reject: (id: string, reason: string) =>
    ApiClient.patch<ClassRescheduling>(`/class-rescheduling/${id}/reject`, {
      reason,
    }),

  // Cancel rescheduling request
  cancel: (id: string) =>
    ApiClient.patch<ClassRescheduling>(`/class-rescheduling/${id}/cancel`),

  // Delete rescheduling request
  delete: (id: string) => ApiClient.delete<void>(`/class-rescheduling/${id}`),
};
