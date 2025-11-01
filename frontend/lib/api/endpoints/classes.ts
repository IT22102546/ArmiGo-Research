import { ApiClient } from "../api-client";

// lib/api/endpoints/classes.ts - CORRECTED VERSION
export const classesApi = {
  //  Create class (TEACHERS ONLY)
  create: (data: any) => ApiClient.post<any>("/api/v1/classes", data),

  //  Get all classes with pagination
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
    grade?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.subject) queryParams.append("subject", params.subject);
    if (params?.grade) queryParams.append("grade", params.grade);

    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/api/v1/classes${queryString ? `?${queryString}` : ""}`
    );
  },

  //  Get my classes (based on role)
  getMyClasses: () => ApiClient.get<any>("/api/v1/classes/my-classes"),

  getTeacherClasses: () => ApiClient.get<any>("/api/v1/classes/my-classes"), //get teacher class

  //  Get class by ID
  getById: (id: string) => ApiClient.get<any>(`/api/v1/classes/${id}`),

  //  Update class (TEACHER OR ADMIN ONLY)
  update: (id: string, data: any) =>
    ApiClient.patch<any>(`/api/v1/classes/${id}`, data),

  //  Delete class (TEACHER OR ADMIN ONLY)
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/classes/${id}`),

  //  Enroll student
  enrollStudent: (
    classId: string,
    data: { studentId: string; isPaid?: boolean }
  ) => ApiClient.post<any>(`/api/v1/classes/${classId}/enroll`, data),

  //  Unenroll student
  unenrollStudent: (classId: string, studentId: string) =>
    ApiClient.delete<{ message: string }>(
      `/api/v1/classes/${classId}/enroll/${studentId}`
    ),

  //  Get teachers list
  getTeachersList: () => ApiClient.get<any>("/api/v1/classes/teachers/list"),

  //  Get students list
  getStudentsList: (grade?: string) => {
    const queryParams = grade ? `?grade=${grade}` : "";
    return ApiClient.get<any>(`/api/v1/classes/students/list${queryParams}`);
  },

  //  Start class (TEACHER ONLY)
  startClass: (id: string) =>
    ApiClient.post<{ message: string; class: any }>(
      `/api/v1/classes/${id}/start`,
      {}
    ),

  //  Stop class (TEACHER ONLY)
  stopClass: (id: string) =>
    ApiClient.post<{ message: string; class: any }>(
      `/api/v1/classes/${id}/stop`,
      {}
    ),

  //  Get today's classes (based on role)
  getTodaysClasses: () =>
    ApiClient.get<{
      teacherClasses: any[];
      enrolledClasses: any[];
    }>("/api/v1/classes/today"),

  //  Get enrolled students in a class
  getEnrolledStudents: (id: string) =>
    ApiClient.get<{
      students: any[];
      totalEnrolled: number;
      maxStudents: number;
      availableSlots: number;
    }>(`/api/v1/classes/${id}/enrolled-students`),
};
