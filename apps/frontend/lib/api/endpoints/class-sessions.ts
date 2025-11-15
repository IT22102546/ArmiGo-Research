import { ApiClient } from "../api-client";

export interface ClassSession {
  id: string;
  classId: string;
  class?: {
    id: string;
    name: string;
    grade?: { name: string };
    subject?: { name: string };
    teacher?: { firstName: string; lastName: string };
  };
  timetableId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  meetingLink?: string;
  videoSession?: {
    id: string;
    status: string;
    roomId: string;
    recordingUrl?: string;
    participants?: SessionParticipant[];
  };
  attendances?: Attendance[];
}

export interface Attendance {
  id: string;
  userId: string;
  classSessionId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  email: string;
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
}

const mapBackendToFrontendStatus = (status?: string) => {
  if (!status) return status;
  if (status === "ACTIVE") return "IN_PROGRESS";
  if (status === "ENDED") return "COMPLETED";
  return status;
};

const mapFrontendToBackendStatus = (status?: string) => {
  if (!status) return status;
  if (status === "IN_PROGRESS") return "ACTIVE";
  if (status === "COMPLETED") return "ENDED";
  return status;
};

const normalizeSessions = (sessions: ClassSession[] = []) =>
  sessions.map((s) => ({ ...s, status: mapBackendToFrontendStatus(s.status) }));

export const classSessionsApi = {
  // Get all class sessions
  getAll: async (params?: {
    classId?: string;
    gradeId?: string;
    subjectId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.gradeId) queryParams.append("gradeId", params.gradeId);
    if (params?.subjectId) queryParams.append("subjectId", params.subjectId);
    const mapStatusToBackend = (s?: string) => {
      if (!s) return undefined;
      if (s === "IN_PROGRESS") return "ACTIVE";
      if (s === "COMPLETED") return "ENDED";
      return s;
    };
    const backendStatus = mapStatusToBackend(params?.status);
    if (backendStatus) queryParams.append("status", backendStatus);
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
    const queryString = queryParams.toString();
    const mapBackendToFrontendStatus = (status?: string) => {
      if (!status) return status;
      if (status === "ACTIVE") return "IN_PROGRESS";
      if (status === "ENDED") return "COMPLETED";
      return status;
    };

    const normalizeSessions = (sessions: ClassSession[] = []) =>
      sessions.map((s) => ({
        ...s,
        status: mapBackendToFrontendStatus(s.status),
      }));

    const res = await ApiClient.get<{
      sessions: ClassSession[];
      pagination?: any;
    }>(`/video${queryString ? `?${queryString}` : ""}`);
    // Backend returns { sessions, pagination } - unwrap for client convenience
    return normalizeSessions(res?.sessions ?? []);
  },

  // Get session by ID with details
  getById: async (id: string) => {
    const res = await ApiClient.get<ClassSession>(`/video/${id}`);
    if (!res) return res;
    return { ...res, status: mapBackendToFrontendStatus(res.status) };
  },

  // Create a new session
  create: async (data: {
    classId: string;
    timetableId?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    meetingLink?: string;
  }) => {
    const res = await ApiClient.post<ClassSession>("/video/create-room", data);
    return { ...res, status: mapBackendToFrontendStatus(res.status) };
  },

  // Update session
  update: (
    id: string,
    data: {
      date?: string;
      startTime?: string;
      endTime?: string;
      status?: string;
      meetingLink?: string;
    }
  ) => {
    const mappedData: Record<string, string | undefined> = { ...data };
    if (mappedData.status)
      mappedData.status = mapFrontendToBackendStatus(mappedData.status);
    return ApiClient.put<ClassSession>(`/video/${id}`, mappedData).then(
      (r) => ({ ...r, status: mapBackendToFrontendStatus(r.status) })
    );
  },

  // End session
  endSession: (id: string) =>
    ApiClient.post<ClassSession>(`/video/end/${id}`, {}).then((r) => ({
      ...r,
      status: mapBackendToFrontendStatus(r.status),
    })),

  // Delete session
  delete: (id: string) => ApiClient.delete<{ message: string }>(`/video/${id}`),

  // Get sessions for a specific class
  getByClass: async (
    classId: string,
    params?: { dateFrom?: string; dateTo?: string }
  ) => {
    const queryParams = new URLSearchParams();
    queryParams.append("classId", classId);
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
    const res = await ApiClient.get<{
      sessions: ClassSession[];
      pagination?: any;
    }>(`/video?${queryParams.toString()}`);
    return normalizeSessions(res.sessions ?? []);
  },

  // Get today's sessions
  getToday: async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await ApiClient.get<{
      sessions: ClassSession[];
      pagination?: any;
    }>(`/video?dateFrom=${today}&dateTo=${today}`);
    return normalizeSessions(res.sessions ?? []);
  },

  // Get upcoming sessions
  getUpcoming: async (limit?: number) => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    const today = new Date().toISOString().split("T")[0];
    queryParams.append("dateFrom", today);
    const queryString = queryParams.toString();
    const res = await ApiClient.get<{
      sessions: ClassSession[];
      pagination?: any;
    }>(`/video${queryString ? `?${queryString}` : ""}`);
    return normalizeSessions(res.sessions ?? []);
  },
};

export const attendanceApi = {
  // Get attendance by ID
  getById: (id: string) => ApiClient.get<Attendance>(`/attendance/${id}`),

  // Update attendance status
  update: (
    id: string,
    data: {
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      notes?: string;
    }
  ) => ApiClient.put<Attendance>(`/attendance/${id}`, data),

  // Get attendance for a session
  getBySession: (sessionId: string) =>
    ApiClient.get<Attendance[]>(`/attendance?sessionId=${sessionId}`),

  // Get attendance for a user
  getByUser: (
    userId: string,
    params?: { dateFrom?: string; dateTo?: string }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
    const queryString = queryParams.toString();
    return ApiClient.get<Attendance[]>(
      `/attendance/user/${userId}${queryString ? `?${queryString}` : ""}`
    );
  },

  // Bulk update attendance
  bulkUpdate: (data: {
    sessionId: string;
    attendances: Array<{
      userId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    }>;
  }) => ApiClient.post<{ updated: number }>("/attendance/bulk-update", data),
};
