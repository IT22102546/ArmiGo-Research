// apps/frontend/lib/api/endpoints/timetable.ts - UPDATED TO MATCH BACKEND
import { ApiClient } from "../api-client";

export interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  dayOfWeekName?: string; // Computed by backend
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  classLink?: string;
  validFrom: string; // ISO date string
  validUntil?: string; // ISO date string
  recurring: boolean;
  active: boolean;
  changes?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimetableData {
  grade: string;
  subject: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classLink?: string;
  validFrom: string;
  validUntil?: string;
  recurring?: boolean;
  active?: boolean;
}

export interface UpdateTimetableData extends Partial<CreateTimetableData> {}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: TimetableEntry[];
}

export const timetableApi = {
  // Get today's timetable
  getToday: () => ApiClient.get<TimetableEntry[]>("/api/v1/timetable/today"),

  // Get this week's timetable
  getWeek: () => ApiClient.get<TimetableEntry[]>("/api/v1/timetable/week"),

  // Get all timetable entries
  getAll: (params?: { grade?: string; dayOfWeek?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.grade) queryParams.append("grade", params.grade);
    if (params?.dayOfWeek !== undefined)
      queryParams.append("dayOfWeek", params.dayOfWeek.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<TimetableEntry[]>(
      `/api/v1/timetable${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get timetable by ID
  getById: (id: string) =>
    ApiClient.get<TimetableEntry>(`/api/v1/timetable/${id}`),

  // Create timetable entry
  create: (data: CreateTimetableData) =>
    ApiClient.post<TimetableEntry>("/api/v1/timetable", data),

  // Update timetable entry
  update: (id: string, data: UpdateTimetableData) =>
    ApiClient.put<TimetableEntry>(`/api/v1/timetable/${id}`, data),

  // Delete timetable entry
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/timetable/${id}`),

  // Check for scheduling conflicts
  checkConflicts: (data: {
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => ApiClient.post<ConflictCheck>("/api/v1/timetable/conflicts", data),

  // Get timetable for a specific grade
  getByGrade: (grade: string) =>
    ApiClient.get<TimetableEntry[]>(`/api/v1/timetable?grade=${grade}`),

  // Get timetable for a specific teacher
  getByTeacher: (teacherId: string, params?: { grade?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.grade) queryParams.append("grade", params.grade);
    const queryString = queryParams.toString();
    return ApiClient.get<TimetableEntry[]>(
      `/api/v1/timetable?teacherId=${teacherId}${
        queryString ? `&${queryString}` : ""
      }`
    );
  },
};
