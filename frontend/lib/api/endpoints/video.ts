// apps/frontend/lib/api/endpoints/video.ts
import { ApiClient } from "../api-client";

export interface VideoSession {
  id: string;
  classId: string;
  hostId: string;
  title: string;
  description?: string;
  status: "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  meetingUrl?: string;
  recordingUrl?: string;
  participants: number;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    subject: string;
  };
}

export interface CreateRoomDto {
  classId: string;
  title: string;
  description?: string;
  scheduledAt?: string;
}

export interface JoinSessionDto {
  displayName: string;
}

export const videoApi = {
  // Create a new video session
  createSession: (data: CreateRoomDto) =>
    ApiClient.post<VideoSession>("/api/v1/video/create-room", data),

  // Get all video sessions with filters
  getSessions: (params?: { classId?: string; status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{ sessions: VideoSession[]; total: number }>(
      `/api/v1/video${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get session by ID
  getSession: (id: string) =>
    ApiClient.get<VideoSession>(`/api/v1/video/${id}`),

  // Start a session
  startSession: (sessionId: string) =>
    ApiClient.post<VideoSession>(`/api/v1/video/start/${sessionId}`, {}),

  // End a session
  endSession: (sessionId: string) =>
    ApiClient.post<VideoSession>(`/api/v1/video/end/${sessionId}`, {}),

  // Join a video session
  joinSession: (sessionId: string, data: JoinSessionDto) =>
    ApiClient.post<{ token: string; roomName: string; meetingUrl: string }>(
      `/api/v1/video/join/${sessionId}`,
      data
    ),

  // Update session
  updateSession: (sessionId: string, data: Partial<CreateRoomDto>) =>
    ApiClient.put<VideoSession>(`/api/v1/video/${sessionId}`, data),

  // Delete a session
  deleteSession: (sessionId: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/video/${sessionId}`),

  // Get recording for a session
  getRecording: (sessionId: string) =>
    ApiClient.get<{ recordingUrl: string }>(
      `/api/v1/video/${sessionId}/recording`
    ),

  // Get session metrics
  getMetrics: (sessionId: string) =>
    ApiClient.get<any>(`/api/v1/video/${sessionId}/metrics`),
};
