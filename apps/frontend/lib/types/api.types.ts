// Base Types & Utilities

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp?: string;
  };
}

export function isApiErrorResponse(
  response: unknown
): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as ApiErrorResponse).success === false &&
    "error" in response
  );
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// Error Types

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isValidationError?: boolean;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  return undefined;
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const apiError: ApiError = {
      message: error.message,
      isNetworkError:
        error.name === "NetworkError" ||
        error.message.includes("Failed to fetch"),
    };

    // Check for status property
    if ("status" in error && typeof error.status === "number") {
      apiError.status = error.status;
      apiError.isAuthError = error.status === 401;
    }

    // Check for code property
    if ("code" in error && typeof error.code === "string") {
      apiError.code = error.code;
    }

    return apiError;
  }

  return {
    message: typeof error === "string" ? error : "An unexpected error occurred",
  };
}

// User Types
// Import the canonical UserRole from user.types.ts to avoid duplication
export type { UserRole } from "@/lib/api/types/user.types";
import type { UserRole } from "@/lib/api/types/user.types";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
  // Extended profile fields (populated from backend in some responses)
  firstName?: string;
  lastName?: string;
  city?: string;
  postalCode?: string;
  phoneNumber?: string;
  district?: string | { id: string; name: string };
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId?: string;
  gradeId?: string;
  mediumId?: string;
  batchId?: string;
  batch?: string | Batch;
  academicYear?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  currentGPA?: number;
  totalCredits?: number;
  sourceInstitution?: string;
  preferredSubjects?: string[];
  createdAt: string;
  updatedAt: string;
  grade?: Grade;
  medium?: Medium;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  experience?: number;
  qualifications?: string;
  canCreateExams: boolean;
  canMonitorExams: boolean;
  canManageClasses: boolean;
  maxStudentsPerClass?: number;
  maxClassesPerWeek?: number;
  availability?: Record<string, unknown>;
  certifications?: string[];
  performanceRating?: number;
  lastEvaluationDate?: string;
  institutionId?: string;
  createdAt: string;
  updatedAt: string;
  subjectAssignments?: TeacherSubjectAssignment[];
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  studentProfile?: Partial<StudentProfile>;
  teacherProfile?: Partial<TeacherProfile>;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  studentProfile?: Partial<StudentProfile>;
  teacherProfile?: Partial<TeacherProfile>;
}

// Academic Types

export interface Medium {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: string;
  code?: string;
  level?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubjectAssignment {
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
  subject?: Subject;
  grade?: Grade;
  medium?: Medium;
}

// Class Types

export type ClassStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Class {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  teacherId: string;
  teacherAssignmentId?: string | null;
  status: ClassStatus;
  maxStudents: number;
  enrolledCount: number;
  monthlyFee: number;
  schedule?: ClassSchedule[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  grade?: Grade;
  medium?: Medium;
  teacher?: User;
}

export interface ClassSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface CreateClassDto {
  name: string;
  description?: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  maxStudents?: number;
  monthlyFee?: number;
  schedule?: ClassSchedule[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateClassDto {
  name?: string;
  description?: string;
  maxStudents?: number;
  monthlyFee?: number;
  schedule?: ClassSchedule[];
  status?: ClassStatus;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
  isPaid: boolean;
  status: "ACTIVE" | "DROPPED" | "COMPLETED";
  student?: User;
}

export interface EnrollStudentDto {
  studentId: string;
  isPaid?: boolean;
}

// Exam Types

export type ExamStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";
export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  classId?: string | null;
  createdById: string;
  status: ExamStatus;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  isProctored: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  subject?: Subject;
  grade?: Grade;
  medium?: Medium;
  createdBy?: User;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  content: string;
  marks: number;
  order: number;
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateExamDto {
  title: string;
  description?: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  classId?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  isProctored?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface UpdateExamDto {
  title?: string;
  description?: string;
  duration?: number;
  totalMarks?: number;
  passingMarks?: number;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  status?: ExamStatus;
}

// Video/Session Types

export type SessionStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

export interface VideoSession {
  id: string;
  classId: string;
  title?: string;
  status: SessionStatus;
  roomId?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  class?: Class;
}

export interface CreateSessionDto {
  classId: string;
  title?: string;
  scheduledAt?: string;
}

export interface JoinSessionResponse {
  sessionId: string;
  roomId: string;
  token: string;
  role: "host" | "participant";
}

// Attendance Types

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  joinedAt?: string;
  leftAt?: string;
  duration?: number;
  notes?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  session?: VideoSession;
}

export interface MarkAttendanceDto {
  userId: string;
  sessionId: string;
  present: boolean;
  notes?: string;
}

// Payment & Wallet Types

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type TransactionType =
  | "CREDIT"
  | "DEBIT"
  | "REFUND"
  | "FREEZE"
  | "UNFREEZE";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  frozenAmount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: string;
  referenceId?: string;
  referenceType?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditWalletDto {
  userId: string;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
}

// Notification Types

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

// Dashboard Types

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalExams: number;
  activeClasses: number;
  upcomingExams: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  user?: Pick<User, "id" | "name" | "avatar">;
}

export interface TeacherDashboard {
  myClasses: Class[];
  todayClasses: Class[];
  upcomingExams: Exam[];
  recentAttendance: AttendanceRecord[];
  stats: {
    totalStudents: number;
    totalClasses: number;
    classesToday: number;
  };
}

export interface StudentDashboard {
  enrolledClasses: Class[];
  todayClasses: Class[];
  upcomingExams: Exam[];
  recentGrades: ExamResult[];
  stats: {
    enrolledClasses: number;
    completedExams: number;
    averageScore: number;
  };
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  exam?: Exam;
}

// Auth Types

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Zone Types

export interface Zone {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Zone;
  children?: Zone[];
}

export interface CreateZoneDto {
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
}

export interface UpdateZoneDto {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

// Batch Types

export interface Batch {
  id: string;
  name: string;
  year: string;
  gradeId?: string;
  mediumId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grade?: Grade;
  medium?: Medium;
}

// Select Options Types

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export type GradeOption = SelectOption<string>;
export type SubjectOption = SelectOption<string>;
export type MediumOption = SelectOption<string>;
export type TeacherOption = SelectOption<string>;
export type ClassOption = SelectOption<string>;
export type AcademicYearOption = SelectOption<string>;
export type BatchOption = SelectOption<string>;

// Filter Types

export interface ClassFilters extends PaginationParams {
  status?: ClassStatus;
  subjectId?: string;
  gradeId?: string;
  mediumId?: string;
  teacherId?: string;
}

export interface ExamFilters extends PaginationParams {
  status?: ExamStatus;
  subjectId?: string;
  gradeId?: string;
  classId?: string;
}

export interface UserFilters extends PaginationParams {
  role?: UserRole;
  status?: UserStatus;
  gradeId?: string;
}

// Report Types

export interface AttendanceReport {
  sessionId: string;
  sessionTitle?: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  records: AttendanceRecord[];
}

export interface ExamReport {
  examId: string;
  examTitle: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  results: ExamResult[];
}
