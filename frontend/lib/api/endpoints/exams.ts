import { ApiClient } from "../api-client";

// lib/api/endpoints/exams.ts - CORRECTED VERSION
export const examsApi = {
  // Create exam (TEACHERS ONLY)
  create: (data: any) => ApiClient.post<any>("/api/v1/exams", data),

  addQuestion: (examId: string, data: any) =>
    ApiClient.post<any>(`/api/v1/exams/${examId}/questions`, data),

  // Get all exams
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    classId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.classId) queryParams.append("classId", params.classId);

    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/api/v1/exams${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get student exams
  getStudentExams: () => ApiClient.get<any>("/api/v1/exams/student/my-exams"),

  // Get exam by ID
  getById: (id: string) => ApiClient.get<any>(`/api/v1/exams/${id}`),

  // Update exam
  update: (id: string, data: any) =>
    ApiClient.patch<any>(`/api/v1/exams/${id}`, data),

  // Delete exam
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/exams/${id}`),

  // Start exam attempt
  startExam: (examId: string, data?: any) =>
    ApiClient.post<any>(`/api/v1/exams/${examId}/start`, data),

  // Submit exam
  submitExam: (attemptId: string, data: any) =>
    ApiClient.post<any>(`/api/v1/exams/attempts/${attemptId}/submit`, data),

  // Get exam results (TEACHERS ONLY)
  getResults: (examId: string) =>
    ApiClient.get<any>(`/api/v1/exams/${examId}/results`),

  // Teacher-specific endpoints
  getTeacherExams: () => ApiClient.get<any>("/api/v1/exams/teacher/my-exams"),

  publishExam: (examId: string) =>
    ApiClient.patch<any>(`/api/v1/exams/${examId}/publish`, {}),

  getExamAttempts: (examId: string) =>
    ApiClient.get<any>(`/api/v1/exams/${examId}/attempts`),

  // Update question
  updateQuestion: (questionId: string, data: any) =>
    ApiClient.patch<any>(`/api/v1/exams/questions/${questionId}`, data),

  // Delete question
  deleteQuestion: (questionId: string) =>
    ApiClient.delete<{ message: string }>(
      `/api/v1/exams/questions/${questionId}`
    ),
};
