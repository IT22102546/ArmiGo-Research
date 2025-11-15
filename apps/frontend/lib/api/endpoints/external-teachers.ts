// apps/frontend/lib/api/endpoints/external-teachers.ts
import { ApiClient } from "../api-client";

export enum ExternalTeacherStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface ExternalTeacher {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ExternalTeacherStatus;
  zone?: string;
  /** District can be a string ID or an object with id/name depending on API response */
  district?: string | { id: string; name: string };
  subject?: string;
  medium?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDetail {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nic?: string;
  status: ExternalTeacherStatus;

  // Professional Information
  zone?: string;
  /** District can be a string ID or an object with id/name depending on API response */
  district?: string | { id: string; name: string };
  school?: string;
  subject?: string;
  medium?: string;
  yearsOfExperience?: number;

  // Qualifications
  qualifications?: string[];
  certifications?: string[];
  educationLevel?: string;

  // Additional Info
  address?: string;
  dateOfBirth?: string;
  gender?: string;

  // Internal notes (Admin only)
  internalNotes?: Array<{
    id: string;
    note: string;
    createdBy: string;
    createdAt: string;
  }>;

  // Status changes
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ExternalTeachersFilters extends PaginationParams {
  status?: ExternalTeacherStatus | "ALL";
  searchTerm?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const externalTeachersApi = {
  /**
   * Get all external teachers with optional filters (Admin only)
   */
  getAll: (filters?: ExternalTeachersFilters) => {
    const params: Record<string, any> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.status && filters.status !== "ALL")
      params.status = filters.status;
    if (filters?.searchTerm) params.search = filters.searchTerm;

    return ApiClient.get<PaginatedResponse<ExternalTeacher>>(
      "/external-teachers/admin/all",
      { params }
    );
  },

  /**
   * Get detailed information about an external teacher application (Admin only)
   */
  getDetail: (id: string) =>
    ApiClient.get<ApplicationDetail>(`/external-teachers/admin/${id}/detail`),

  /**
   * Approve an external teacher application (Admin only)
   */
  approve: (id: string, data?: { notes?: string }) =>
    ApiClient.patch<{ message: string; teacher: ApplicationDetail }>(
      `/external-teachers/admin/${id}/approve`,
      data || {}
    ),

  /**
   * Reject an external teacher application (Admin only)
   */
  reject: (id: string, data: { reason: string }) =>
    ApiClient.patch<{ message: string; teacher: ApplicationDetail }>(
      `/external-teachers/admin/${id}/reject`,
      data
    ),

  /**
   * Add an internal note to an external teacher application (Admin only)
   */
  addNote: (id: string, data: { note: string }) =>
    ApiClient.post<{ message: string; note: any }>(
      `/external-teachers/admin/${id}/note`,
      data
    ),

  /**
   * Get statistics about external teacher applications (Admin only)
   */
  getStats: () =>
    ApiClient.get<{
      total: number;
      pending: number;
      active: number;
      suspended: number;
      byZone: Record<string, number>;
      bySubject: Record<string, number>;
      byMedium: Record<string, number>;
    }>("/external-teachers/admin/stats"),
};
