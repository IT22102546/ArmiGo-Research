// apps/frontend/lib/api/endpoints/marking.ts
import { ApiClient } from "../api-client";

export interface MarkData {
  pointsAwarded: number;
  feedback?: string;
}

export interface MarkedAnswer {
  id: string;
  answerId: string;
  pointsAwarded: number;
  feedback?: string;
  markedBy: string;
  markedAt: string;
}

export interface QuestionForMarking {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  totalAnswers: number;
  markedAnswers: number;
  pendingAnswers: number;
}

export interface AnswerForMarking {
  id: string;
  studentId: string;
  studentName: string;
  answerText?: string;
  answerData?: unknown;
  submittedAt: string;
  isMarked: boolean;
  pointsAwarded?: number;
  feedback?: string;
}

export interface MarkingProgress {
  examId: string;
  examTitle: string;
  totalQuestions: number;
  totalAnswers: number;
  markedAnswers: number;
  pendingAnswers: number;
  progressPercentage: number;
  questionProgress: {
    questionId: string;
    questionText: string;
    total: number;
    marked: number;
    pending: number;
  }[];
}

export interface AutoAssignResult {
  questionId: string;
  strategy: "ZERO" | "FULL";
  affectedAnswers: number;
}

export interface CalculateMarksResult {
  examId: string;
  studentsProcessed: number;
  resultsCalculated: number;
}

export interface PublishResultsResult {
  examId: string;
  resultsPublished: boolean;
  publishedAt: string;
  notificationsSent: number;
}

export const markingApi = {
  // Mark a specific answer
  markAnswer: (answerId: string, markData: MarkData) =>
    ApiClient.post<MarkedAnswer>(`/marking/${answerId}/mark`, markData),

  // Get questions for marking an exam
  getQuestionsForMarking: (examId: string) =>
    ApiClient.get<QuestionForMarking[]>(`/marking/exam/${examId}/questions`),

  // Get answers for a specific question in an exam
  getQuestionAnswers: (examId: string, questionId: string) =>
    ApiClient.get<AnswerForMarking[]>(
      `/marking/exam/${examId}/question/${questionId}/answers`
    ),

  // Get marking progress for an exam
  getMarkingProgress: (examId: string) =>
    ApiClient.get<MarkingProgress>(`/marking/exam/${examId}/progress`),

  // Auto-assign marks for a question
  autoAssignMarks: (
    examId: string,
    questionId: string,
    strategy: "ZERO" | "FULL"
  ) =>
    ApiClient.post<AutoAssignResult>(`/marking/exam/${examId}/auto-assign`, {
      questionId,
      strategy,
    }),

  // Calculate final marks for all students in an exam
  calculateFinalMarks: (examId: string) =>
    ApiClient.post<CalculateMarksResult>(
      `/marking/exam/${examId}/calculate-marks`
    ),

  // Publish exam results
  publishResults: (examId: string) =>
    ApiClient.post<PublishResultsResult>(`/marking/exam/${examId}/publish`),
};
