import { ApiClient } from "../api-client";

// lib/api/endpoints/classes.ts - CORRECTED VERSION
export const classesApi = {
  //  Create class (TEACHERS /ADMINS)
  create: (data: any) => ApiClient.post<any>("/classes", data),

  //  Get all classes with pagination
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
    grade?: string;
    teacherId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.subject) queryParams.append("subject", params.subject);
    if (params?.grade) queryParams.append("grade", params.grade);
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);

    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/classes${queryString ? `?${queryString}` : ""}`
    );
  },

  //  Get my classes (based on role)
  getMyClasses: () => ApiClient.get<any>("/classes/my-classes"),

  getTeacherClasses: () => ApiClient.get<any>("/classes/my-classes"), //get teacher class

  //  Get class by ID
  getById: (id: string) => ApiClient.get<any>(`/classes/${id}`),

  //  Update class (TEACHER OR ADMIN ONLY)
  update: (id: string, data: any) =>
    ApiClient.patch<any>(`/classes/${id}`, data),

  //  Delete class (TEACHER OR ADMIN ONLY)
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/classes/${id}`),

  //  Enroll student
  enrollStudent: (
    classId: string,
    data: { studentId: string; isPaid?: boolean }
  ) => ApiClient.post<any>(`/classes/${classId}/enroll`, data),

  //  Unenroll student
  unenrollStudent: (classId: string, studentId: string) =>
    ApiClient.delete<{ message: string }>(
      `/classes/${classId}/enroll/${studentId}`
    ),

  //  Get teachers list
  getTeachersList: () => ApiClient.get<any>("/classes/teachers/list"),

  //  Get students list
  getStudentsList: (grade?: string) => {
    const queryParams = grade ? `?grade=${grade}` : "";
    return ApiClient.get<any>(`/classes/students/list${queryParams}`);
  },

  //  Start class (TEACHER ONLY)
  startClass: (id: string) =>
    ApiClient.post<{ message: string; class: any }>(`/classes/${id}/start`, {}),

  //  Stop class (TEACHER ONLY)
  stopClass: (id: string) =>
    ApiClient.post<{ message: string; class: any }>(`/classes/${id}/stop`, {}),

  //  Get today's classes (based on role)
  getTodaysClasses: () =>
    ApiClient.get<{
      teacherClasses: any[];
      enrolledClasses: any[];
    }>("/classes/today"),

  //  Get enrolled students in a class
  getEnrolledStudents: (id: string) =>
    ApiClient.get<{
      students: any[];
      totalEnrolled: number;
      maxStudents: number;
      availableSlots: number;
    }>(`/classes/${id}/enrolled-students`),

  // Get class sessions (proxied to /video - use classSessionsApi.getAll() for filtered queries)
  getSessions: (classId: string) => {
    // Kept for backward compatibility with ClassSessionsPage.tsx
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append("classId", classId);
    const queryString = queryParams.toString();
    return ApiClient.get<any>(`/video${queryString ? `?${queryString}` : ""}`);
  },

  // Get session details (proxy to video)
  getSessionDetails: (_classId: string, sessionId: string) =>
    ApiClient.get<any>(`/video/${sessionId}`),

  // Force end session (proxy to video)
  endSession: (_classId: string, sessionId: string) =>
    ApiClient.post<any>(`/video/end/${sessionId}`, {}),

  // Update attendance manually - prefer using /attendance endpoints directly
  updateAttendance: (
    _classId: string,
    sessionId: string,
    data: { userId: string; status: string }
  ) => {
    // Map status to present boolean when possible (PRESENT => true, others => false)
    const present = data.status === "PRESENT";
    return ApiClient.post<any>(`/attendance/mark`, {
      userId: data.userId,
      sessionId,
      present,
    });
  },
};
