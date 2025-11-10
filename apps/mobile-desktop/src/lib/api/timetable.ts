// Timetable API
import { MobileApiClient } from "../api-client";

export interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dayOfWeek: number;
  dayOfWeekName?: string;
  startTime: string;
  endTime: string;
  classLink?: string;
  validFrom: string;
  validUntil?: string;
  recurring: boolean;
  active: boolean;
}

export const timetableApi = {
  /**
   * Get today's timetable
   */
  getToday: () =>
    MobileApiClient.get<TimetableEntry[]>("/api/v1/timetable/today"),

  /**
   * Get this week's timetable
   */
  getWeek: () =>
    MobileApiClient.get<TimetableEntry[]>("/api/v1/timetable/week"),

  /**
   * Get all timetable entries
   */
  getAll: (params?: { grade?: string; dayOfWeek?: number }) =>
    MobileApiClient.get<TimetableEntry[]>(
      `/api/v1/timetable?${new URLSearchParams(params as any).toString()}`
    ),

  /**
   * Get timetable entry by ID
   */
  getById: (id: string) =>
    MobileApiClient.get<TimetableEntry>(`/api/v1/timetable/${id}`),

  /**
   * Create timetable entry
   */
  create: (data: Partial<TimetableEntry>) =>
    MobileApiClient.post<TimetableEntry>("/api/v1/timetable", data),

  /**
   * Update timetable entry
   */
  update: (id: string, data: Partial<TimetableEntry>) =>
    MobileApiClient.put<TimetableEntry>(`/api/v1/timetable/${id}`, data),

  /**
   * Delete timetable entry
   */
  delete: (id: string) =>
    MobileApiClient.delete<{ message: string }>(`/api/v1/timetable/${id}`),

  /**
   * Get conflicts for a time slot
   */
  checkConflicts: (data: {
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) =>
    MobileApiClient.post<{
      hasConflicts: boolean;
      conflicts: TimetableEntry[];
    }>("/api/v1/timetable/conflicts", data),
};
