// apps/frontend/lib/api/endpoints/timetable.ts - UPDATED TO MATCH BACKEND
import { ApiClient } from "../api-client";

export interface TimetableEntry {
  id: string;
  gradeId: string;
  grade: { name: string; level: number };
  subjectId: string;
  subject: { name: string };
  mediumId: string;
  medium: { name: string };
  teacherId: string;
  teacher: { firstName: string; lastName: string };
  teacherAssignmentId: string;
  classLink: string;
  classId?: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  validFrom: string; // ISO date string
  validUntil: string; // ISO date string
  recurring: boolean;
  active: boolean;
  academicYear: number;
  term: number;
  batch?: string;
  color?: string;
  notes?: string;
  recurrencePattern?: string;
  excludeDates?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTimetableData {
  gradeId: string;
  subjectId: string;
  mediumId: string;
  teacherId: string;
  classLink: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  recurring?: boolean;
  active?: boolean;
  academicYear: number;
  term: number;
  batch?: string;
  color?: string;
  notes?: string;
  recurrencePattern?: string;
  excludeDates?: string;
}

export interface UpdateTimetableData extends Partial<CreateTimetableData> {}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: TimetableEntry[];
}

export const timetableApi = {
  // Get today's timetable
  getToday: () => ApiClient.get<TimetableEntry[]>("/timetable/today"),

  // Get this week's timetable
  getWeek: () => ApiClient.get<TimetableEntry[]>("/timetable/week"),

  // Get all timetable entries
  getAll: (params?: {
    gradeId?: string;
    subjectId?: string;
    mediumId?: string;
    dayOfWeek?: number;
    academicYear?: number;
    term?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.gradeId) queryParams.append("gradeId", params.gradeId);
    if (params?.subjectId) queryParams.append("subjectId", params.subjectId);
    if (params?.mediumId) queryParams.append("mediumId", params.mediumId);
    if (params?.dayOfWeek !== undefined)
      queryParams.append("dayOfWeek", params.dayOfWeek.toString());
    if (params?.academicYear)
      queryParams.append("academicYear", params.academicYear.toString());
    if (params?.term) queryParams.append("term", params.term.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<TimetableEntry[]>(
      `/timetable${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get timetable by ID
  getById: (id: string) => ApiClient.get<TimetableEntry>(`/timetable/${id}`),

  // Create timetable entry
  create: (data: CreateTimetableData) =>
    ApiClient.post<TimetableEntry>("/timetable", data),

  // Update timetable entry
  update: (id: string, data: UpdateTimetableData) =>
    ApiClient.put<TimetableEntry>(`/timetable/${id}`, data),

  // Delete timetable entry
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/timetable/${id}`),

  // Check for scheduling conflicts
  checkConflicts: (data: {
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append("teacherId", data.teacherId);
    queryParams.append("dayOfWeek", data.dayOfWeek.toString());
    queryParams.append("startTime", data.startTime);
    queryParams.append("endTime", data.endTime);
    if (data.excludeId) queryParams.append("excludeId", data.excludeId);
    return ApiClient.get<any[]>(
      `/timetable/conflicts?${queryParams.toString()}`
    );
  },

  // Get timetable for a specific grade
  getByGrade: (grade: string) =>
    ApiClient.get<TimetableEntry[]>(`/timetable?grade=${grade}`),

  // Get timetable for a specific teacher
  getByTeacher: (teacherId: string, params?: { grade?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.grade) queryParams.append("grade", params.grade);
    const queryString = queryParams.toString();
    return ApiClient.get<TimetableEntry[]>(
      `/timetable?teacherId=${teacherId}${queryString ? `&${queryString}` : ""}`
    );
  },
};
