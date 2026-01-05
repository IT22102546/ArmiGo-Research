import { ApiClient } from "../api-client";

export type ProctoringEventType =
  | "FACE_NOT_DETECTED"
  | "MULTIPLE_FACES"
  | "TAB_SWITCH"
  | "BROWSER_UNFOCUSED"
  | "SUSPICIOUS_MOVEMENT"
  | "SCREENSHOT_BLOCKED"
  | "COPY_PASTE_DETECTED"
  | "EXTERNAL_DISPLAY"
  | "SESSION_START"
  | "SESSION_END";

export type ProctoringEventSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProctoringEvent {
  id: string;
  attemptId: string;
  eventType: ProctoringEventType;
  severity: ProctoringEventSeverity;
  description?: string;
  snapshotUrl?: string;
  faceMatchScore?: number;
  tabSwitchCount?: number;
  suspiciousActions?: string[];
  metadata?: any;
  createdAt: string;
}

export interface ProctoringLog {
  id: string;
  studentId: string;
  examId: string;
  attemptId: string;
  events: ProctoringEvent[];
  flagged: boolean;
  flagReason?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ActiveAttempt {
  id: string;
  studentId: string;
  examId: string;
  startTime: string;
  lastActivityAt: string;
  tabSwitchCount: number;
  flagged: boolean;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  warningCount: number;
}

export interface CreateProctoringEventDto {
  attemptId: string;
  eventType: ProctoringEventType;
  severity: ProctoringEventSeverity;
  description?: string;
  snapshotUrl?: string;
  faceMatchScore?: number;
  tabSwitchCount?: number;
  suspiciousActions?: string[];
  metadata?: any;
}

export const proctoringApi = {
  /**
   * Get proctoring logs for an exam
   */
  getExamLogs: (examId: string) =>
    ApiClient.get<ProctoringLog[]>(`/proctoring/exam/${examId}/logs`),

  /**
   * Get active attempts for an exam (students currently taking the exam)
   */
  getActiveAttempts: (examId: string) =>
    ApiClient.get<ActiveAttempt[]>(
      `/proctoring/exam/${examId}/active-attempts`
    ),

  /**
   * Get proctoring logs for a specific attempt
   */
  getAttemptLogs: (attemptId: string) =>
    ApiClient.get<ProctoringEvent[]>(`/proctoring/attempt/${attemptId}/logs`),

  /**
   * Flag or unflag an attempt for review
   */
  flagAttempt: (
    attemptId: string,
    data: { reason: string; flagged: boolean }
  ) => ApiClient.patch(`/proctoring/attempt/${attemptId}/flag`, data),

  /**
   * Send a message to a student during exam
   */
  sendStudentMessage: (
    studentId: string,
    data: { message: string; examId: string }
  ) => ApiClient.post(`/proctoring/student/${studentId}/message`, data),

  /**
   * Create a proctoring event
   */
  createEvent: (data: CreateProctoringEventDto) =>
    ApiClient.post<ProctoringEvent>("/proctoring/event", data),
};
