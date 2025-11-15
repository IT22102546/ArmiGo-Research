/** Face recognition API client: lightweight fetch wrapper for the microservice. */

const FACE_API_URL =
  process.env.NEXT_PUBLIC_FACE_RECOGNITION_URL || "http://localhost:8000";

export interface FaceRecognitionRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Custom fetch function for the face recognition API
 * Used by Orval-generated hooks
 */
export const faceRecognitionFetch = async <T>(
  url: string,
  options?: FaceRecognitionRequestOptions
): Promise<T> => {
  const { params, ...fetchOptions } = options || {};

  // Build URL with query params
  let fullUrl = `${FACE_API_URL}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  // Get auth token from main auth if needed
  const authToken =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("access_token="))
          ?.split("=")[1]
      : undefined;

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers: {
      ...fetchOptions?.headers,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new FaceRecognitionError(
      errorData.detail || `Face recognition API error: ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.blob() as unknown as T;
};

/**
 * Custom error class for face recognition API errors
 */
export class FaceRecognitionError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FaceRecognitionError";
  }
}

/**
 * Helper to create FormData for face recognition endpoints
 */
export const createFaceFormData = (
  data: Record<string, string | Blob | undefined>
): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
};

/**
 * Type-safe face recognition API methods
 * These can be used directly or replaced by Orval-generated hooks
 */
export const faceRecognitionApi = {
  /**
   * Register a new student with face data
   */
  registerStudent: async (data: {
    name: string;
    email?: string;
    rollNumber?: string;
    image?: File;
    video?: File;
  }) => {
    const formData = createFaceFormData({
      name: data.name,
      email: data.email,
      roll_number: data.rollNumber,
      image: data.image,
      video: data.video,
    });

    return faceRecognitionFetch<{
      status: string;
      student_id: string;
      bbox: number[];
    }>("/students/register", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Add face embedding to existing student
   */
  addEmbedding: async (
    studentId: string,
    data: { image?: File; video?: File }
  ) => {
    const formData = createFaceFormData({
      image: data.image,
      video: data.video,
    });

    return faceRecognitionFetch<{
      status: string;
      student_id: string;
      bbox: number[];
    }>(`/students/${studentId}/add-embedding`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Mark attendance with face recognition
   */
  markAttendance: async (data: {
    className?: string;
    sessionId?: string;
    image: File;
  }) => {
    const formData = createFaceFormData({
      class_name: data.className,
      session_id: data.sessionId,
      image: data.image,
    });

    return faceRecognitionFetch<{
      status: "allowed" | "rejected";
      student_id?: string;
      name?: string;
      similarity: number;
      threshold: number;
      bbox: number[];
      reason?: string;
    }>("/attendance/mark", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Start exam session with face verification
   */
  startExam: async (data: {
    studentId: string;
    examCode: string;
    image: File;
  }) => {
    const formData = createFaceFormData({
      student_id: data.studentId,
      exam_code: data.examCode,
      image: data.image,
    });

    return faceRecognitionFetch<{
      status: string;
      session_id: string;
      similarity: number;
      threshold: number;
    }>("/exam/start", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Monitor exam session
   */
  monitorExam: async (data: { sessionId: string; image: File }) => {
    const formData = createFaceFormData({
      session_id: data.sessionId,
      image: data.image,
    });

    return faceRecognitionFetch<{
      status: "active" | "locked" | "completed" | "aborted";
      reason?: string;
    }>("/exam/monitor", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Get exam session status
   */
  getSessionStatus: async (sessionId: string) => {
    return faceRecognitionFetch<{
      session_id: string;
      status: string;
      reason_locked: string | null;
      student_id: string;
      exam_id: string;
    }>(`/exam/session/${sessionId}`);
  },
};

export default faceRecognitionApi;
