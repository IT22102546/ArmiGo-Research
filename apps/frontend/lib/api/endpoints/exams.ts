import { ApiClient } from "../api-client";

// lib/api/endpoints/exams.ts - CORRECTED VERSION
export const examsApi = {
  // Create exam (TEACHERS ONLY)
  create: (data: any) => ApiClient.post<any>("/exams", data),

  addQuestion: (examId: string, data: any) =>
    ApiClient.post<any>(`/exams/${examId}/questions`, data),

  // Get all exams
  getAll: (params?: Record<string, any>) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, String(v)));
        } else {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return ApiClient.get<any>(`/exams${queryString ? `?${queryString}` : ""}`);
  },

  // Get student exams
  getStudentExams: () => ApiClient.get<any>("/exams/student/my-exams"),

  // Get exam by ID
  getById: (id: string) => ApiClient.get<any>(`/exams/${id}`),

  // Update exam
  update: (id: string, data: any) => ApiClient.patch<any>(`/exams/${id}`, data),

  // Delete exam
  delete: (id: string) => ApiClient.delete<{ message: string }>(`/exams/${id}`),

  // Start exam attempt
  startExam: (examId: string, data?: any) =>
    ApiClient.post<any>(`/exams/${examId}/start`, data),

  // Submit exam
  submitExam: (attemptId: string, data: any) =>
    ApiClient.post<any>(`/exams/attempts/${attemptId}/submit`, data),

  // Get exam results (TEACHERS ONLY)
  getResults: (examId: string) =>
    ApiClient.get<any>(`/exams/${examId}/results`),

  // Teacher-specific endpoints
  getTeacherExams: () => ApiClient.get<any>("/exams/teacher/my-exams"),

  publishExam: (examId: string) =>
    ApiClient.patch<any>(`/exams/${examId}/publish`, {}),

  // Student-centric marking endpoints
  getExamAttempts: (
    examId: string,
    params?: {
      grade?: string;
      status?: "marked" | "unmarked" | "partial";
      studentType?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.grade) queryParams.append("grade", params.grade);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.studentType)
      queryParams.append("studentType", params.studentType);
    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/exams/${examId}/attempts${queryString ? `?${queryString}` : ""}`
    );
  },

  getAttemptById: (attemptId: string) =>
    ApiClient.get<any>(`/exams/attempts/${attemptId}`),

  getAttemptAnswers: (attemptId: string) =>
    ApiClient.get<any>(`/exams/attempts/${attemptId}/answers`),

  // Marking endpoints
  getGradesWithExamsForMarking: () =>
    ApiClient.get<any>("/exams/marking/grades-with-exams"),

  getExamsByGradeForMarking: (gradeId: string) =>
    ApiClient.get<any>(`/exams/marking/by-grade/${gradeId}`),

  getStudentsForExamMarking: (examId: string) =>
    ApiClient.get<any>(`/exams/marking/${examId}/students`),

  // Get questions for marking
  getExamQuestions: (examId: string) =>
    ApiClient.get<any>(`/exams/${examId}/questions/by-part`),

  // Get all exam questions with correct answers (for teachers)
  getExamQuestionsWithAnswers: (examId: string) =>
    ApiClient.get<any>(`/exams/${examId}/questions`),

  // Update question
  updateQuestion: (questionId: string, data: any) =>
    ApiClient.patch<any>(`/exams/questions/${questionId}`, data),

  // Delete question
  deleteQuestion: (questionId: string) =>
    ApiClient.delete<{ message: string }>(`/exams/questions/${questionId}`),

  // Get exam rankings
  getRankings: (
    examId: string,
    params?: {
      level?: "ISLAND" | "DISTRICT" | "ZONE";
      studentType?: "INTERNAL" | "EXTERNAL";
      district?: string;
      zone?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append("level", params.level);
    if (params?.studentType)
      queryParams.append("studentType", params.studentType);
    if (params?.district) queryParams.append("district", params.district);
    if (params?.zone) queryParams.append("zone", params.zone);
    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/exams/${examId}/rankings${queryString ? `?${queryString}` : ""}`
    );
  },

  // Marking-specific endpoints (question-centric - legacy)
  getQuestionAnswers: (examId: string, questionId: string) =>
    ApiClient.get<any>(`/exams/${examId}/questions/${questionId}/answers`),

  // Student-centric marking - get specific question answer for a student attempt
  getAttemptQuestionAnswer: (attemptId: string, questionId: string) =>
    ApiClient.get<any>(
      `/exams/attempts/${attemptId}/questions/${questionId}/answers`
    ),

  gradeAnswer: (
    answerId: string,
    data: { pointsAwarded: number; comments?: string }
  ) => ApiClient.patch<any>(`/exams/answers/${answerId}/grade`, data),

  autoAssignMarks: (
    examId: string,
    questionId: string,
    data: { points: number; applyToUnanswered: boolean }
  ) =>
    ApiClient.post<any>(
      `/exams/${examId}/questions/${questionId}/auto-assign`,
      data
    ),

  getMarkingProgress: (examId: string) =>
    ApiClient.get<any>(`/exams/${examId}/marking-progress`),

  publishExamResults: (examId: string) =>
    ApiClient.post<any>(`/exams/${examId}/publish-results`, {}),

  // Admin-specific endpoints
  approveExam: (examId: string, data?: { note?: string }) =>
    ApiClient.patch<any>(`/exams/${examId}/approve`, data || {}),

  rejectExam: (examId: string, data: { reason: string }) =>
    ApiClient.patch<any>(`/exams/${examId}/reject`, data),

  duplicateExam: (examId: string) =>
    ApiClient.post<any>(`/exams/${examId}/duplicate`, {}),

  updateVisibility: (examId: string, data: { visibility: string }) =>
    ApiClient.patch<any>(`/exams/${examId}/visibility`, data),

  forceCloseExam: (examId: string, data?: { reason?: string }) =>
    ApiClient.patch<any>(`/exams/${examId}/force-close`, data || {}),

  // Proctoring endpoints
  getProctoringEvents: (examId: string) =>
    ApiClient.get<any>(`/proctoring/exam/${examId}/logs`),

  getAttemptProctoringLogs: (attemptId: string) =>
    ApiClient.get<any>(`/proctoring/attempt/${attemptId}/logs`),

  flagAttempt: (
    attemptId: string,
    data: { reason: string; flagged: boolean }
  ) => ApiClient.patch<any>(`/proctoring/attempt/${attemptId}/flag`, data),

  sendStudentMessage: (
    studentId: string,
    data: { message: string; examId: string }
  ) => ApiClient.post<any>(`/proctoring/student/${studentId}/message`, data),

  getActiveAttempts: (examId: string) =>
    ApiClient.get<any>(`/proctoring/exam/${examId}/active-attempts`),

  // Ranking visibility and export
  getRankingVisibility: (examId: string) =>
    ApiClient.get<any>(`/exams/${examId}/rankings/visibility`),

  updateRankingVisibility: (examId: string, visible: boolean) =>
    ApiClient.patch<any>(`/exams/${examId}/rankings/visibility`, { visible }),

  recalculateRankings: (examId: string) =>
    ApiClient.post<any>(`/exams/${examId}/rankings/recalculate`),

  exportRankings: (
    examId: string,
    params: { format?: string; scope?: string; studentType?: string }
  ) => {
    const query = new URLSearchParams();
    if (params.format) query.append("format", params.format);
    if (params.scope) query.append("level", params.scope);
    if (params.studentType) query.append("studentType", params.studentType);
    return ApiClient.downloadFile(
      `/exams/${examId}/rankings/export?${query.toString()}`
    );
  },
};
