// apps/frontend/lib/api/endpoints/subjects.ts
import { ApiClient } from "../api-client";

interface TeacherProfile {
  id: string;
  department?: string;
  subject?: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teacherProfile?: TeacherProfile;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  medium?: string;
  credits?: number;
  duration?: number;
  teacherId?: string;
  teacher?: Teacher;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDto {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  medium?: string;
  credits?: number;
  duration?: number;
  teacherId?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateSubjectDto {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  medium?: string;
  credits?: number;
  duration?: number;
  teacherId?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const subjectsApi = {
  // Upload subject image
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return ApiClient.post<{
      url: string;
      key: string;
      bucket: string;
      filename: string;
      size: number;
      mimetype: string;
    }>("/api/v1/subjects/upload-image", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Create a new subject (Admin only)
  create: (data: CreateSubjectDto) =>
    ApiClient.post<Subject>("/api/v1/subjects", data),

  // Get all subjects
  findAll: (includeInactive?: boolean) =>
    ApiClient.get<Subject[]>(
      `/api/v1/subjects${includeInactive ? "?includeInactive=true" : ""}`
    ),

  // Search subjects
  search: (query: string) =>
    ApiClient.get<Subject[]>(`/api/v1/subjects/search?q=${query}`),

  // Get all categories
  getCategories: () =>
    ApiClient.get<string[]>("/api/v1/subjects/categories"),

  // Get subjects by category
  getByCategory: (category: string) =>
    ApiClient.get<Subject[]>(`/api/v1/subjects/category/${category}`),

  // Get a single subject by ID
  findOne: (id: string) =>
    ApiClient.get<Subject>(`/api/v1/subjects/${id}`),

  // Update a subject (Admin only)
  update: (id: string, data: UpdateSubjectDto) =>
    ApiClient.put<Subject>(`/api/v1/subjects/${id}`, data),

  // Delete a subject (hard delete by default, soft delete with ?soft=true)
  remove: (id: string, soft?: boolean) =>
    ApiClient.delete<{ message: string }>(`/api/v1/subjects/${id}${soft ? '?soft=true' : ''}`),

  // Restore a soft-deleted subject (Admin only)
  restore: (id: string) =>
    ApiClient.post<Subject>(`/api/v1/subjects/${id}/restore`, {}),
};
