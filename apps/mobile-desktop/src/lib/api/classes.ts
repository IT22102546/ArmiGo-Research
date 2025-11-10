// Classes API
import { MobileApiClient } from "../api-client";

export interface Class {
  id: string;
  name: string;
  description?: string;
  subject: string;
  grade: string;
  status: string;
  startDate: string;
  endDate?: string;
  maxStudents: number;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentEnrollment?: number;
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

export const classesApi = {
  /**
   * Get all classes
   */
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    MobileApiClient.get<PaginatedResponse<Class>>(
      `/api/v1/classes?${new URLSearchParams(params as any).toString()}`
    ),

  /**
   * Get class by ID
   */
  getById: (id: string) => MobileApiClient.get<Class>(`/api/v1/classes/${id}`),

  /**
   * Get my enrolled classes (student)
   */
  getMyClasses: () =>
    MobileApiClient.get<PaginatedResponse<Class>>("/api/v1/classes/my-classes"),

  /**
   * Get classes I'm teaching (teacher)
   */
  getMyTeachingClasses: () =>
    MobileApiClient.get<PaginatedResponse<Class>>(
      "/api/v1/classes/teaching-classes"
    ),

  /**
   * Create new class (admin/teacher)
   */
  create: (data: Partial<Class>) =>
    MobileApiClient.post<Class>("/api/v1/classes", data),

  /**
   * Update class
   */
  update: (id: string, data: Partial<Class>) =>
    MobileApiClient.patch<Class>(`/api/v1/classes/${id}`, data),

  /**
   * Delete class
   */
  delete: (id: string) =>
    MobileApiClient.delete<{ message: string }>(`/api/v1/classes/${id}`),

  /**
   * Enroll in class
   */
  enroll: (classId: string) =>
    MobileApiClient.post<{ message: string }>(
      `/api/v1/classes/${classId}/enroll`
    ),

  /**
   * Unenroll from class
   */
  unenroll: (classId: string) =>
    MobileApiClient.post<{ message: string }>(
      `/api/v1/classes/${classId}/unenroll`
    ),
};
