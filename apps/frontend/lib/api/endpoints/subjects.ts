// apps/frontend/lib/api/endpoints/subjects.ts - UPDATED
import { ApiClient } from "../api-client";
import {
  CreateSubjectDto,
  Subject,
  UpdateSubjectDto,
  AssignTeacherDto,
  SubjectGradeAssignment,
  TeacherSubject,
  Grade,
} from "../types/subjects";

// Re-export types for backwards compatibility
export type {
  CreateSubjectDto,
  Subject,
  UpdateSubjectDto,
  AssignTeacherDto,
  SubjectGradeAssignment,
  TeacherSubject,
  Grade,
};

export const subjectsApi = {
  // Upload subject image
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return ApiClient.post<{
      url: string;
      key: string;
      bucket: string;
      filename: string;
      size: number;
      mimetype: string;
    }>("/subjects/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Create a new subject (Admin only)
  create: (data: CreateSubjectDto) =>
    ApiClient.post<Subject>("/subjects", data),

  // Get all subjects
  findAll: (includeInactive?: boolean) =>
    ApiClient.get<Subject[]>(
      `/subjects${includeInactive ? "?includeInactive=true" : ""}`
    ),

  // Search subjects
  search: (query: string) =>
    ApiClient.get<Subject[]>(`/subjects/search?q=${query}`),

  // Get all categories
  getCategories: () => ApiClient.get<string[]>("/subjects/categories"),

  // Get subjects by category
  getByCategory: (category: string) =>
    ApiClient.get<Subject[]>(`/subjects/category/${category}`),

  // Get subjects by grade
  getByGrade: (gradeId: string, medium?: string) =>
    ApiClient.get<Subject[]>(
      `/subjects/grade/${gradeId}${medium ? `?medium=${medium}` : ""}`
    ),

  // Get a single subject by ID
  findOne: (id: string) => ApiClient.get<Subject>(`/subjects/${id}`),

  // Update a subject (Admin only)
  update: (id: string, data: UpdateSubjectDto) =>
    ApiClient.put<Subject>(`/subjects/${id}`, data),

  // Delete a subject (hard delete by default, soft delete with ?soft=true)
  remove: (id: string, soft?: boolean) =>
    ApiClient.delete<{ message: string }>(
      `/subjects/${id}${soft ? "?soft=true" : ""}`
    ),

  // Restore a soft-deleted subject (Admin only)
  restore: (id: string) =>
    ApiClient.post<Subject>(`/subjects/${id}/restore`, {}),

  // Assign teacher to subject-grade
  assignTeacher: (data: AssignTeacherDto) =>
    ApiClient.post<Subject>("/subjects/assign-teacher", data),

  // Get teachers by subject and grade
  getTeachersBySubjectGrade: (
    subjectId: string,
    gradeId: string,
    medium: string
  ) =>
    ApiClient.get<any[]>(
      `/subjects/${subjectId}/grade/${gradeId}/teachers?medium=${medium}`
    ),

  // Get available mediums for a subject
  getAvailableMediums: (subjectId: string) =>
    ApiClient.get<string[]>(`/subjects/${subjectId}/mediums`),
};
