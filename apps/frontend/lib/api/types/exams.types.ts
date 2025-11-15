// lib/api/types/exams.types.ts
import { User } from "./auth.types";
import { Class } from "./classes.types";

export interface ExamQuestion {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "CODE";
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  order: number;
}

export interface ExamSettings {
  duration: number; // in minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  requireWebcam: boolean;
  fullScreen: boolean;
  disableCopyPaste: boolean;
  confidenceCheck: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  classId?: string;
  class?: Class;
  mediumId?: string;
  medium?: { id: string; name: string } | null;
  questions: ExamQuestion[];
  settings: ExamSettings;
  totalPoints: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  isProctored: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamData {
  title: string;
  description: string;
  classId?: string;
  mediumId?: string;
  questions: Omit<ExamQuestion, "id">[];
  settings: ExamSettings;
  totalPoints: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  isProctored: boolean;
}

export interface UpdateExamData extends Partial<CreateExamData> {
  status?: Exam["status"];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  student?: User;
  answers: Record<string, string | string[]>;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "CANCELLED";
  suspiciousActivities?: string[];
  confidenceScore?: number;
}

export interface SubmitExamData {
  answers: Record<string, string | string[]>;
  completedAt: string;
}

export interface ExamResult {
  attempt: ExamAttempt;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  questionResults: {
    questionId: string;
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    pointsEarned: number;
  }[];
}

export interface ExamFilters {
  page?: number;
  limit?: number;
  classId?: string;
  status?: Exam["status"];
  isProctored?: boolean;
}

export interface ExamsResponse {
  exams: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
