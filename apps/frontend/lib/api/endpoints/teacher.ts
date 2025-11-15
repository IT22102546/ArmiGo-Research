// apps/frontend/lib/api/endpoints/teachers.ts
import { ApiClient } from "../api-client";
import { Teacher } from "../types/subjects";

export const teachersApi = {
  // Get all teachers (both internal and external)
  findAll: (includeInactive?: boolean) => {
    return ApiClient.get<{ users: Teacher[] }>(
      `/users?role=INTERNAL_TEACHER,EXTERNAL_TEACHER${includeInactive ? "&isActive=true" : ""}`
    );
  },

  // Get teachers by subject and grade (for assignment)
  getBySubjectGrade: (subjectId: string, gradeId: string, medium: string) => {
    return ApiClient.get<Teacher[]>(
      `/subjects/${subjectId}/grade/${gradeId}/teachers?medium=${medium}`
    );
  },

  // Assign teacher to subject
  assignToSubject: (data: {
    teacherProfileId: string;
    subjectId: string;
    gradeId: string;
    medium: string;
    isPrimary?: boolean;
  }) => {
    return ApiClient.post<Teacher>("/subjects/assign-teacher", data);
  },
};
