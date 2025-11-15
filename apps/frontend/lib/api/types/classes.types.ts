// lib/api/types/classes.types.ts
// Run `pnpm generate:api` to regenerate types from backend OpenAPI spec
import { User } from "./auth.types";

export interface ClassSchedule {
  days: string[];
  time: string;
  duration: number;
  timezone: string;
}

export interface ClassMetadata {
  requirements: string[];
  materials: string[];
  location: string;
  syllabus?: string[];
  prerequisites?: string[];
}

export interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  subjectId?: string;
  gradeId?: string;
  grade: string;
  mediumId?: string;
  medium?: { id: string; name: string } | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  currentEnrollment: number;
  maxStudents: number;
  fees: number;
  isPaid: boolean;
  metadata: ClassMetadata;
  teacher: Pick<User, "id" | "firstName" | "lastName" | "email">;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassData {
  name: string;
  description: string;
  subject: string;
  grade: string;
  maxStudents: number;
  fees: number;
  isPaid: boolean;
  metadata: ClassMetadata;
}

export interface UpdateClassData extends Partial<CreateClassData> {
  status?: Class["status"];
}

export interface EnrollmentData {
  studentId: string;
  isPaid: boolean;
}

export interface ClassEnrollment {
  id: string;
  student: User;
  class: Class;
  enrolledAt: string;
  status: "ACTIVE" | "DROPPED" | "COMPLETED";
  isPaid: boolean;
}

export interface ClassFilters {
  page?: number;
  limit?: number;
  subject?: string;
  grade?: string;
  status?: Class["status"];
  teacherId?: string;
}

export interface ClassesResponse {
  classes: Class[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
