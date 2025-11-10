import { ApiClient } from "../api-client";

// Types
export interface Session {
  sessionId: string;
  title: string;
  teacherId: string;
  roomName: string;
  startedAt: string;
}

export interface JoinSessionResponse {
  success: boolean;
  jitsiDomain: string;
  jitsiRoomName: string;
  jitsiToken: string | null; // null for self-hosted without JWT
  role: "teacher" | "student";
  isModerator: boolean;
  displayName: string;
  title?: string;
  description?: string;
  muteAll?: boolean;
  videoDisabled?: boolean;
}

export interface StartSessionRequest {
  title: string;
  teacherId: string;
}

// Video API
export const videoApi = {
  getActiveSessions: async (): Promise<Session[]> => {
    return ApiClient.get<Session[]>("/video/sessions");
  },

  joinSession: async (sessionId: string): Promise<JoinSessionResponse> => {
    return ApiClient.post<JoinSessionResponse>(`/video/join/${sessionId}`, {});
  },

  startSession: async (data: StartSessionRequest): Promise<Session> => {
    return ApiClient.post<Session>("/video/start", data);
  },

  endSession: async (sessionId: string): Promise<{ success: boolean }> => {
    return ApiClient.post<{ success: boolean }>("/video/end", { sessionId });
  },

  muteAll: async (sessionId: string): Promise<{ success: boolean }> => {
    return ApiClient.post<{ success: boolean }>("/video/mute-all", {
      sessionId,
    });
  },
};
