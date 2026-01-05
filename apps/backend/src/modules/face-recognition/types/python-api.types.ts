/**
 * Type definitions for Python FastAPI service responses
 */

export interface FaceRegistrationResponse {
  success: boolean;
  message: string;
  student_id?: number;
  face_encoding?: string;
}

export interface FaceRegistrationVideoResponse {
  success: boolean;
  message: string;
  student_id?: number;
  best_frame_index?: number;
  face_encoding?: string;
}

export interface AddEmbeddingResponse {
  success: boolean;
  message: string;
  embeddings_count?: number;
}

export interface FaceVerificationResponse {
  success: boolean;
  verified: boolean;
  student_id?: number;
  name?: string;
  similarity?: number;
  message?: string;
}

export interface ExamSessionStartResponse {
  aiSessionId: number;
  similarity: number;
  threshold: number;
}

export interface ExamMonitoringResult {
  success: boolean;
  issues: string[];
  incidentsCount: number;
  sessionLocked: boolean;
  warnings?: string[];
}

export interface ExamSessionEndResponse {
  success: boolean;
  message: string;
}

export interface ExamSessionUnlockResponse {
  success: boolean;
  message: string;
}

export interface PythonApiError {
  detail?: string;
  message?: string;
}
