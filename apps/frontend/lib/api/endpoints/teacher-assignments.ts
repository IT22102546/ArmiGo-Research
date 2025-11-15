import { ApiClient } from "../api-client";

export interface TeacherAssignment {
  id: string;
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  academicYear: string;
  isActive: boolean;
  canCreateExams?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  grade?: {
    id: string;
    name: string;
    code?: string;
  };
  medium?: {
    id: string;
    name: string;
    code?: string;
  };
}

export interface CreateTeacherAssignmentDto {
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  academicYear: string;
  canCreateExams?: boolean;
}

export const teacherAssignmentsApi = {
  // Get all assignments for a teacher
  getByTeacher: (
    teacherProfileId: string,
    params?: { academicYear?: string; includeInactive?: boolean }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.academicYear)
      queryParams.append("academicYear", params.academicYear);
    if (params?.includeInactive !== undefined)
      queryParams.append("includeInactive", params.includeInactive.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{ assignments: TeacherAssignment[] }>(
      `/teacher-assignments/teacher/${teacherProfileId}${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get all assignments for a subject-grade-medium combination
  getBySubjectGradeMedium: (params: {
    subjectId?: string;
    gradeId?: string;
    mediumId?: string;
    academicYear?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.subjectId) queryParams.append("subjectId", params.subjectId);
    if (params.gradeId) queryParams.append("gradeId", params.gradeId);
    if (params.mediumId) queryParams.append("mediumId", params.mediumId);
    if (params.academicYear)
      queryParams.append("academicYear", params.academicYear);
    return ApiClient.get<{ assignments: TeacherAssignment[] }>(
      `/teacher-assignments?${queryParams.toString()}`
    );
  },

  // Get assignment by ID
  getById: (id: string) =>
    ApiClient.get<{ assignment: TeacherAssignment }>(
      `/teacher-assignments/${id}`
    ),

  // Create new assignment
  create: (data: CreateTeacherAssignmentDto) =>
    ApiClient.post<{ assignment: TeacherAssignment }>(
      "/teacher-assignments",
      data
    ),

  // Update assignment
  update: (id: string, data: Partial<CreateTeacherAssignmentDto>) =>
    ApiClient.patch<{ assignment: TeacherAssignment }>(
      `/teacher-assignments/${id}`,
      data
    ),

  // Delete assignment
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/teacher-assignments/${id}`),

  // Activate/Deactivate assignment
  toggleActive: (id: string, isActive: boolean) =>
    ApiClient.patch<{ assignment: TeacherAssignment }>(
      `/teacher-assignments/${id}/toggle-active`,
      { isActive }
    ),
};
