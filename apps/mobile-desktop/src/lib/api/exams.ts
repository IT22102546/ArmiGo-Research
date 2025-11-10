// Exams API
import { MobileApiClient } from "../api-client";

export interface Exam {
  id: string;
  title: string;
  description?: string;
  classId: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MIXED";
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "GRADED";
  duration: number;
  totalMarks: number;
  passingMarks: number;
  attemptsAllowed: number;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  aiMonitoringEnabled: boolean;
  faceVerificationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: string;
  score?: number;
  answers: any[];
}

export const examsApi = {
  /**
   * Get all exams
   */
  getAll: (params?: { classId?: string; status?: string }) =>
    MobileApiClient.get<{ data: Exam[] }>(
      `/api/v1/exams?${new URLSearchParams(params as any).toString()}`
    ),

  /**
   * Get exam by ID
   */
  getById: (id: string) => MobileApiClient.get<Exam>(`/api/v1/exams/${id}`),

  /**
   * Get my exams (student)
   */
  getMyExams: () =>
    MobileApiClient.get<{ data: Exam[] }>("/api/v1/exams/my-exams"),

  /**
   * Create exam (teacher/admin)
   */
  create: (data: Partial<Exam>) =>
    MobileApiClient.post<Exam>("/api/v1/exams", data),

  /**
   * Update exam
   */
  update: (id: string, data: Partial<Exam>) =>
    MobileApiClient.patch<Exam>(`/api/v1/exams/${id}`, data),

  /**
   * Delete exam
   */
  delete: (id: string) =>
    MobileApiClient.delete<{ message: string }>(`/api/v1/exams/${id}`),

  /**
   * Publish exam
   */
  publish: (id: string) =>
    MobileApiClient.post<Exam>(`/api/v1/exams/${id}/publish`),

  /**
   * Get exam questions
   */
  getQuestions: (examId: string) =>
    MobileApiClient.get<ExamQuestion[]>(`/api/v1/exams/${examId}/questions`),

  /**
   * Start exam attempt
   */
  startAttempt: (examId: string) =>
    MobileApiClient.post<ExamAttempt>(`/api/v1/exams/${examId}/start`),

  /**
   * Submit exam attempt
   */
  submitAttempt: (examId: string, attemptId: string, answers: any[]) =>
    MobileApiClient.post<{ score: number; message: string }>(
      `/api/v1/exams/${examId}/submit`,
      { attemptId, answers }
    ),

  /**
   * Get exam results
   */
  getResults: (examId: string, attemptId: string) =>
    MobileApiClient.get<ExamAttempt>(
      `/api/v1/exams/${examId}/results/${attemptId}`
    ),

  /**
   * Get my attempts for an exam
   */
  getMyAttempts: (examId: string) =>
    MobileApiClient.get<ExamAttempt[]>(`/api/v1/exams/${examId}/my-attempts`),
};
