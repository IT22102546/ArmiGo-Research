import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsEmail,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsPositive,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

// ===== ADD PAYMENT ENUMS =====
export enum PaymentMethod {
  MONTHLY = "MONTHLY",
  PER_CLASS = "PER_CLASS",
  PER_SESSION = "PER_SESSION",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  CALCULATED = "CALCULATED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

// Enums
export enum TeachingMedium {
  SINHALA = "Sinhala",
  ENGLISH = "English",
  TAMIL = "Tamil",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ===== Student Management DTOs =====

export class UpdateStudentProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  currentGPA?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalCredits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(TeachingMedium)
  medium?: TeachingMedium;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSubjects?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthInfo?: string;

  // transportMode removed in schema for online-only platform
}

export class StudentProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  grade: string;

  @ApiProperty()
  batch: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty()
  medium: string;

  @ApiProperty()
  currentGPA: number;

  @ApiProperty()
  totalCredits: number;

  @ApiProperty({ type: [String] })
  preferredSubjects: string[];

  @ApiProperty()
  guardianName: string;

  @ApiProperty()
  guardianPhone: string;

  @ApiProperty()
  guardianEmail: string;

  @ApiProperty()
  enrolledSubjects: Array<{
    subject: string;
    grade: string;
    teacher: string;
    status: string;
  }>;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  examPerformance: {
    averageScore: number;
    totalExams: number;
    passRate: number;
  };
}

// ===== Teacher Management DTOs =====

export class AssignGradeDto {
  @ApiProperty()
  @IsString()
  teacherProfileId: string;

  @ApiProperty({ description: 'Grade level (e.g., "6", "7", "8")' })
  @IsString()
  grade: string;

  @ApiProperty({ description: "Subject to teach" })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: "Class section (A, B, C)" })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({ description: 'Academic year (e.g., "2025")' })
  @IsString()
  academicYear: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingGrades?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingSubjects?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingMedium?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudentsPerClass?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClassesPerWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canCreateExams?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canMonitorExams?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canManageClasses?: boolean;
}

// ===== UPDATED TEACHER PAYMENT DTOs =====

export class TeacherPaymentDto {
  @ApiPropertyOptional({ description: "Payment amount per class/session" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentPerClass?: number;

  @ApiPropertyOptional({ description: "Currency code (default: LKR)" })
  @IsOptional()
  @IsString()
  paymentCurrency?: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: "Payment calculation method",
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: "Auto-approve teacher's exams" })
  @IsOptional()
  @IsBoolean()
  autoApproveExams?: boolean;
}

export class UpdateTeacherPaymentDto {
  @ApiProperty({ description: "Payment amount per class/session" })
  @IsNumber()
  @Min(0)
  paymentPerClass: number;

  @ApiPropertyOptional({ description: "Currency code (default: LKR)" })
  @IsOptional()
  @IsString()
  paymentCurrency?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: "Payment calculation method",
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: "Auto-approve teacher's exams" })
  @IsBoolean()
  autoApproveExams: boolean;
}

export class MonthlyPaymentDto {
  @ApiProperty({ description: "Month in YYYY-MM format" })
  @IsString()
  month: string;

  @ApiProperty({ description: "Total classes conducted" })
  @IsNumber()
  @IsPositive()
  totalClasses: number;

  @ApiProperty({ description: "Total payment amount" })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: "Payment status" })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: "Payment notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TeacherPaymentSummaryDto {
  @ApiProperty()
  teacherProfileId: string;

  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  month: string;

  @ApiProperty()
  totalClasses: number;

  @ApiProperty()
  paymentPerClass: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  isPaid: boolean;

  @ApiPropertyOptional()
  paidAt?: Date;
}

// ===== NEW TEACHER MONTHLY PAYMENT DTO =====

export class TeacherMonthlyPaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherProfileId: string;

  @ApiProperty()
  month: string;

  @ApiProperty()
  totalClasses: number;

  @ApiProperty()
  totalSessions: number;

  @ApiProperty()
  paymentPerClass: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  isPaid: boolean;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  paidBy?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  calculatedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TeacherProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  specialization: string;

  @ApiProperty()
  experience: number;

  @ApiProperty({ type: [String] })
  teachingGrades: string[];

  @ApiProperty({ type: [String] })
  teachingSubjects: string[];

  @ApiProperty({ type: [String] })
  teachingMedium: string[];

  @ApiProperty()
  assignedGrade: string;

  @ApiProperty()
  assignedClass: string;

  @ApiProperty()
  performanceRating: number;

  @ApiProperty()
  activeClasses: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  weeklySchedule: Array<{
    day: string;
    classes: Array<{
      time: string;
      grade: string;
      subject: string;
      section: string;
    }>;
  }>;

  @ApiProperty()
  gradeAssignments: GradeAssignmentDto[];

  // ===== ADD PAYMENT FIELDS =====
  @ApiPropertyOptional()
  paymentPerClass?: number;

  @ApiPropertyOptional()
  paymentCurrency?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  autoApproveExams?: boolean;

  @ApiPropertyOptional()
  totalEarnings?: number;

  @ApiPropertyOptional()
  pendingPayment?: number;

  @ApiPropertyOptional()
  lastPaymentDate?: Date;
}

export class GradeAssignmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  grade: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  section: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty()
  studentsCount: number;

  @ApiProperty()
  maxStudents: number;

  @ApiProperty()
  status: AssignmentStatus;

  @ApiProperty()
  effectiveFrom: Date;

  @ApiProperty()
  effectiveTo: Date;
}

// ===== Search and Filter DTOs =====

export class UserSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}

export class BulkAssignGradesDto {
  @ApiProperty({ type: [AssignGradeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => AssignGradeDto)
  assignments: AssignGradeDto[];
}

export class TeacherWorkloadDto {
  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  totalClasses: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  weeklyHours: number;

  @ApiProperty()
  gradeAssignments: Array<{
    grade: string;
    subject: string;
    section: string;
    studentCount: number;
  }>;

  @ApiProperty()
  utilizationPercentage: number;

  @ApiProperty()
  status: "underutilized" | "optimal" | "overloaded";
}

export class GradeCapacityDto {
  @ApiProperty()
  grade: string;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  totalCapacity: number;

  @ApiProperty()
  utilizationRate: number;

  @ApiProperty()
  sections: Array<{
    section: string;
    students: number;
    capacity: number;
    teacher: string;
  }>;

  @ApiProperty()
  teachers: Array<{
    name: string;
    subject: string;
    sections: string[];
  }>;
}

// ===== PAYMENT CALCULATION RESPONSE DTOs =====

export class PaymentCalculationResultDto {
  @ApiProperty()
  success: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  results: Array<{
    teacherId: string;
    teacherName: string;
    payment: TeacherMonthlyPaymentDto;
  }>;

  @ApiProperty()
  errors: Array<{
    teacherId: string;
    teacherName: string;
    error: string;
  }>;
}

export class PendingPaymentsResponseDto {
  @ApiProperty({ type: [TeacherMonthlyPaymentDto] })
  payments: TeacherMonthlyPaymentDto[];

  @ApiProperty()
  summary: {
    totalTeachers: number;
    totalPendingAmount: number;
    totalPendingClasses: number;
  };
}

export class TeacherPaymentSummaryResponseDto {
  @ApiProperty()
  teacher: {
    id: string;
    name: string;
    paymentPerClass: number;
    paymentMethod: PaymentMethod;
    autoApproveExams: boolean;
  };

  @ApiProperty({ type: [TeacherMonthlyPaymentDto] })
  payments: TeacherMonthlyPaymentDto[];

  @ApiProperty()
  summary: {
    totalEarnings: number;
    pendingPayment: number;
    totalClasses: number;
  };
}
