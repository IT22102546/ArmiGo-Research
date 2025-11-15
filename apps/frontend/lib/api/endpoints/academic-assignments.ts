import { ApiClient } from "../api-client";

export const academicAssignmentsApi = {
  // GRADE-SUBJECT ASSIGNMENTS

  assignSubjectsToGrade: (gradeId: string, subjectIds: string[]) =>
    ApiClient.post(`/academic-assignments/grades/${gradeId}/subjects`, {
      subjectIds,
    }),

  getGradeSubjects: (gradeId: string, includeInactive = false) =>
    ApiClient.get(
      `/academic-assignments/grades/${gradeId}/subjects?includeInactive=${includeInactive}`
    ),

  removeSubjectFromGrade: (gradeId: string, subjectId: string) =>
    ApiClient.delete(
      `/academic-assignments/grades/${gradeId}/subjects/${subjectId}`
    ),

  getSubjectGrades: (subjectId: string, includeInactive = false) =>
    ApiClient.get(
      `/academic-assignments/subjects/${subjectId}/grades?includeInactive=${includeInactive}`
    ),

  // SUBJECT-MEDIUM ASSIGNMENTS

  assignMediumsToSubject: (subjectId: string, mediumIds: string[]) =>
    ApiClient.post(`/academic-assignments/subjects/${subjectId}/mediums`, {
      mediumIds,
    }),

  getSubjectMediums: (subjectId: string, includeInactive = false) =>
    ApiClient.get(
      `/academic-assignments/subjects/${subjectId}/mediums?includeInactive=${includeInactive}`
    ),

  removeMediumFromSubject: (subjectId: string, mediumId: string) =>
    ApiClient.delete(
      `/academic-assignments/subjects/${subjectId}/mediums/${mediumId}`
    ),

  getMediumSubjects: (mediumId: string, includeInactive = false) =>
    ApiClient.get(
      `/academic-assignments/mediums/${mediumId}/subjects?includeInactive=${includeInactive}`
    ),

  // STUDENT-SUBJECT ASSIGNMENTS

  assignSubjectsToStudent: (
    studentProfileId: string,
    subjectIds: string[],
    academicYear: string
  ) =>
    ApiClient.post(
      `/academic-assignments/students/${studentProfileId}/subjects`,
      {
        subjectIds,
        academicYear,
      }
    ),

  getStudentSubjects: (
    studentProfileId: string,
    academicYear?: string,
    includeInactive = false
  ) =>
    ApiClient.get(
      `/academic-assignments/students/${studentProfileId}/subjects?academicYear=${academicYear || ""}&includeInactive=${includeInactive}`
    ),

  removeSubjectFromStudent: (
    studentProfileId: string,
    subjectId: string,
    academicYear: string
  ) =>
    ApiClient.delete(
      `/academic-assignments/students/${studentProfileId}/subjects/${subjectId}?academicYear=${academicYear}`
    ),

  getSubjectStudents: (
    subjectId: string,
    academicYear?: string,
    includeInactive = false
  ) =>
    ApiClient.get(
      `/academic-assignments/subjects/${subjectId}/students?academicYear=${academicYear || ""}&includeInactive=${includeInactive}`
    ),

  // COMPREHENSIVE QUERIES

  getSubjectWithRelations: (subjectId: string) =>
    ApiClient.get(`/academic-assignments/subjects/${subjectId}/complete`),

  getGradeWithRelations: (gradeId: string) =>
    ApiClient.get(`/academic-assignments/grades/${gradeId}/complete`),

  getAvailableSubjectsForStudent: (studentProfileId: string) =>
    ApiClient.get(
      `/academic-assignments/students/${studentProfileId}/available-subjects`
    ),
};
