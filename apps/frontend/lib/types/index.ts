// Re-export all API types for centralized access
export * from "./api.types";

// Additional model types specific to frontend usage
// These extend or complement the API types

export interface ClassModel {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  teacherId: string;
  teacherAssignmentId?: string | null;
}

export interface ExamModel {
  id: string;
  title: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  classId?: string | null;
  createdById?: string;
}
