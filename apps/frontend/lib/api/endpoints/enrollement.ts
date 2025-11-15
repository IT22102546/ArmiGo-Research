import { ApiClient } from "../api-client";

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  isPaid: boolean;
  paymentId?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  class: {
    id: string;
    name: string;
    description?: string;
    status: string;
    grade?: {
      id: string;
      name: string;
    };
    subject?: {
      id: string;
      name: string;
    };
    medium?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateEnrollmentData {
  studentId: string;
  classId: string;
  status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  paymentId?: string;
}

export interface UpdateEnrollmentData {
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface EnrollmentQueryParams {
  classId?: string;
  status?: string;
  studentId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface EnrollmentsResponse {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildQueryString = (params?: EnrollmentQueryParams): string => {
  if (!params) return "";
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const query = queryParams.toString();
  return query ? `?${query}` : "";
};

export const enrollmentsApi = {
  /**
   * Get all enrollments with optional filtering
   */
  getAll: (params?: EnrollmentQueryParams) =>
    ApiClient.get<Enrollment[]>(`/enrollments${buildQueryString(params)}`),

  /**
   * Get a specific enrollment by ID
   */
  getOne: (id: string) => ApiClient.get<Enrollment>(`/enrollments/${id}`),

  /**
   * Create a new enrollment
   */
  create: (data: CreateEnrollmentData) =>
    ApiClient.post<Enrollment>("/enrollments", data),

  /**
   * Update enrollment status
   */
  update: (id: string, data: UpdateEnrollmentData) =>
    ApiClient.patch<Enrollment>(`/enrollments/${id}`, data),

  /**
   * Delete an enrollment (soft delete)
   */
  delete: (id: string) => ApiClient.delete<Enrollment>(`/enrollments/${id}`),

  /**
   * Get enrollment statistics
   */
  getStats: () =>
    ApiClient.get<{
      total: number;
      active: number;
      completed: number;
      pending: number;
    }>("/enrollments/stats"),

  /**
   * Bulk update enrollments
   */
  bulkUpdate: (ids: string[], data: UpdateEnrollmentData) =>
    ApiClient.patch<Enrollment[]>("/enrollments/bulk", { ids, ...data }),
};
