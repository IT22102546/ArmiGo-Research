import { ApiClient } from "../api-client";

// Enrollment status types
export type EnrollmentStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "WITHDRAWN"
  | "PENDING"
  | "CANCELLED"
  | "SUSPENDED";
export type SeminarStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type ExamAttemptStatus =
  | "STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "CANCELLED";

// Basic enrollment interface
export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progress?: number;
  isPaid?: boolean;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
  };
  class?: {
    id: string;
    name: string;
    description?: string;
    status: string;
    grade?: any;
    subject?: any;
  };
}

// Class enrollment detail
export interface ClassEnrollmentDetail {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  gradeName: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  isPaid: boolean;
}

// Seminar registration detail
export interface SeminarRegistrationDetail {
  id: string;
  seminarId: string;
  seminarTitle: string;
  scheduledAt: string;
  attended: boolean;
  joinedAt?: string;
  leftAt?: string;
  status: SeminarStatus;
}

// Exam attempt detail
export interface ExamAttemptDetail {
  id: string;
  examId: string;
  examTitle: string;
  status: ExamAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  passed?: boolean;
  islandRank?: number;
  districtRank?: number;
  zoneRank?: number;
}

// Student info
export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

// Student enrollment stats
export interface StudentEnrollmentStats {
  totalClassEnrollments: number;
  activeClassEnrollments: number;
  completedClassEnrollments: number;
  totalSeminarRegistrations: number;
  attendedSeminars: number;
  totalExamAttempts: number;
  passedExams: number;
}

// Student enrollment summary (grouped view)
export interface StudentEnrollmentSummary {
  student: StudentInfo;
  classEnrollments: ClassEnrollmentDetail[];
  seminarRegistrations: SeminarRegistrationDetail[];
  examAttempts: ExamAttemptDetail[];
  stats: StudentEnrollmentStats;
}

// Overall stats
export interface OverallEnrollmentStats {
  totalStudents: number;
  totalClassEnrollments: number;
  totalSeminarRegistrations: number;
  totalExamAttempts: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Grouped enrollments response
export interface GroupedEnrollmentsResponse {
  data: StudentEnrollmentSummary[];
  stats: OverallEnrollmentStats;
  pagination: PaginationInfo;
}

// Filter interfaces
export interface EnrollmentFilters {
  classId?: string;
  status?: EnrollmentStatus;
  studentId?: string;
}

export interface GroupedEnrollmentFilters {
  type?: "class" | "seminar" | "exam";
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Available class for enrollment
export interface AvailableClass {
  id: string;
  name: string;
  subject: { id: string; name: string } | null;
  grade: { id: string; name: string; level?: number } | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  maxStudents: number | null;
  enrolledCount: number;
  availableSlots: number | null;
}

// Available student for enrollment (with grade info)
export interface AvailableStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  gradeId: string | null;
  grade: { id: string; name: string; level?: number } | null;
}

// Response for available classes for a specific student
export interface AvailableClassesForStudentResponse {
  studentGrade: { id: string; name: string; level?: number } | null;
  classes: AvailableClass[];
  message?: string;
}

// Create enrollment request
export interface CreateEnrollmentRequest {
  studentId: string;
  classId: string;
  status?: EnrollmentStatus;
  isPaid?: boolean;
}

// Update enrollment request
export interface UpdateEnrollmentRequest {
  status?: EnrollmentStatus;
  isPaid?: boolean;
  progress?: number;
}

export const enrollmentsApi = {
  /**
   * Get all enrollments with optional filtering
   */
  getAll: (filters?: EnrollmentFilters) =>
    ApiClient.get<Enrollment[]>("/enrollments", { params: filters }),

  /**
   * Get enrollments by class
   */
  getByClass: (classId: string) =>
    ApiClient.get<Enrollment[]>("/enrollments", { params: { classId } }),

  /**
   * Get enrollments by student
   */
  getByStudent: (studentId: string) =>
    ApiClient.get<Enrollment[]>("/enrollments", { params: { studentId } }),

  /**
   * Get enrollments grouped by student with all enrollment types
   */
  getGroupedByStudent: (filters?: GroupedEnrollmentFilters) =>
    ApiClient.get<GroupedEnrollmentsResponse>("/enrollments/grouped", {
      params: filters,
    }),

  /**
   * Get all enrollment details for a specific student
   */
  getStudentEnrollments: (studentId: string) =>
    ApiClient.get<StudentEnrollmentSummary>(
      `/enrollments/student/${studentId}`
    ),

  /**
   * Get available classes for enrollment
   */
  getAvailableClasses: () =>
    ApiClient.get<AvailableClass[]>("/enrollments/available-classes"),

  /**
   * Get available classes for a specific student (filtered by grade, excludes already enrolled)
   */
  getAvailableClassesForStudent: (studentId: string) =>
    ApiClient.get<AvailableClassesForStudentResponse>(
      `/enrollments/available-classes/${studentId}`
    ),

  /**
   * Get available students for enrollment
   */
  getAvailableStudents: (search?: string) =>
    ApiClient.get<AvailableStudent[]>("/enrollments/available-students", {
      params: search ? { search } : undefined,
    }),

  /**
   * Create a new enrollment
   */
  create: (data: CreateEnrollmentRequest) =>
    ApiClient.post<Enrollment>("/enrollments", data),

  /**
   * Update an enrollment
   */
  update: (id: string, data: UpdateEnrollmentRequest) =>
    ApiClient.patch<Enrollment>(`/enrollments/${id}`, data),

  /**
   * Delete an enrollment
   */
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/enrollments/${id}`),
};
