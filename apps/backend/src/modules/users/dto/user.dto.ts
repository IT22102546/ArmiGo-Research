import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
  MaxLength,
  IsStrongPassword,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  ValidateNested,
} from "class-validator";
import { UserRole, UserStatus } from "@prisma/client";

/**
 * Strong password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format

export class AdminResetPasswordDto {
  @ApiProperty({
    description:
      "New password (min 8 chars, must include uppercase, lowercase, number, and special character)",
    example: "NewSecurePassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, {
    message:
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)",
  })
  newPassword!: string;
}
import { Type } from "class-transformer";

export class TeacherProfileDto {
  @ApiProperty({
    description: "Teacher department",
    example: "Mathematics",
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: "Teacher specialization",
    example: "Calculus",
    required: false,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({
    description: "Payment per class in LKR",
    example: 1500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  paymentPerClass?: number;

  @ApiProperty({
    description: "Payment currency",
    example: "LKR",
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentCurrency?: string;

  @ApiProperty({
    description: "Payment method",
    enum: ["MONTHLY", "PER_CLASS", "PER_SESSION"],
    example: "PER_CLASS",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "PER_CLASS", "PER_SESSION"])
  paymentMethod?: string;

  @ApiProperty({
    description: "Auto-approve exams without admin approval",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoApproveExams?: boolean;

  @ApiProperty({
    description: "Is external teacher",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isExternal?: boolean;

  @ApiProperty({
    description: "Employee ID",
    example: "EMP-001",
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: "Years of experience",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @ApiProperty({
    description: "Qualifications",
    example: "B.Sc. Mathematics",
    required: false,
  })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiProperty({
    description: "Can create exams",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canCreateExams?: boolean;

  @ApiProperty({
    description: "Can monitor exams",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canMonitorExams?: boolean;

  @ApiProperty({
    description: "Can manage classes",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canManageClasses?: boolean;

  @ApiProperty({
    description: "Max students per class",
    example: 40,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxStudentsPerClass?: number;

  @ApiProperty({
    description: "Source institution",
    example: "External School",
    required: false,
  })
  @IsOptional()
  @IsString()
  sourceInstitution?: string;

  @ApiProperty({
    description: "Max classes per week",
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxClassesPerWeek?: number;

  @ApiProperty({ description: "Availability schedule", required: false })
  @IsOptional()
  availability?: any; // Json type

  @ApiProperty({
    description: "Certifications",
    example: ["TKT", "CELTA"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  certifications?: string[];

  @ApiProperty({
    description: "Performance rating",
    example: 4.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  performanceRating?: number;

  @ApiProperty({ description: "Last evaluation date", required: false })
  @IsOptional()
  lastEvaluationDate?: string;

  @ApiProperty({ description: "Institution ID", required: false })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({
    description: "Total earnings",
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  totalEarnings?: number;

  @ApiProperty({
    description: "Pending payment",
    example: 15000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pendingPayment?: number;

  @ApiProperty({ description: "Last payment date", required: false })
  @IsOptional()
  lastPaymentDate?: string;

  @ApiProperty({ description: "Teacher subject assignments", required: false })
  @IsOptional()
  subjectAssignments?: Array<{
    subjectId: string;
    gradeId: string;
    mediumId: string;
    academicYear: string;
    canCreateExams?: boolean;
    maxStudents?: number;
  }>;
}

export class CreateUserDto {
  @ApiProperty({
    description: "User phone number in E.164 format (primary identifier)",
    example: "+94712345678",
  })
  @IsString()
  @Matches(PHONE_REGEX, {
    message:
      "Phone number must be in valid international format (e.g., +94712345678)",
  })
  phone!: string;

  @ApiProperty({
    description: "User email address (optional)",
    example: "john.doe@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "Please provide a valid email address" })
  email?: string;

  @ApiProperty({
    description:
      "User password (min 8 chars, must include uppercase, lowercase, number, and special character)",
    example: "SecurePassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, {
    message:
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)",
  })
  password!: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: "User role",
    enum: UserRole,
    example: "INTERNAL_STUDENT",
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    description: "User date of birth",
    example: "1990-01-01",
    required: false,
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    description: "User bio/description",
    example: "Experienced educator with 10 years of teaching mathematics.",
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: "Student profile data (for student roles)",
    required: false,
  })
  @IsOptional()
  studentProfile?: {
    grade?: string;
    batch?: string;
    medium?: string;
  };

  @ApiProperty({
    description: "Teacher profile data (for teacher roles)",
    required: false,
  })
  @ApiProperty({
    description: "Teacher profile data (required for teacher roles)",
    type: TeacherProfileDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TeacherProfileDto)
  teacherProfile?: TeacherProfileDto;
}

export class UpdateUserDto {
  @ApiProperty({
    description: "User first name",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  // Note: Phone and Email are read-only for regular users but can be updated by admins
  // The controller/service layer should check permissions

  @ApiProperty({
    description: "User phone number (Admin only)",
    example: "+94712345678",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone number must be in valid international format",
  })
  phone?: string;

  @ApiProperty({
    description: "User email address (Admin only)",
    example: "john.doe@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "Please provide a valid email address" })
  email?: string;

  @ApiProperty({
    description: "User role (Admin only)",
    enum: UserRole,
    example: "INTERNAL_STUDENT",
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: "User status",
    enum: UserStatus,
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: "User date of birth",
    example: "1990-01-01",
    required: false,
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    description: "User bio/description",
    example: "Experienced educator with 10 years of teaching mathematics.",
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: "User street address",
    example: "123 Main Street",
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "User city",
    example: "Colombo",
    required: false,
  })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiProperty({
    description: "User district",
    example: "Colombo",
    required: false,
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    description: "User district id",
    example: "uuid-string",
    required: false,
  })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiProperty({
    description: "User postal code",
    example: "10100",
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: "Phone verification status (Admin only)",
    example: true,
    required: false,
  })
  @IsOptional()
  phoneVerified?: boolean;

  @ApiProperty({
    description: "Email verification status (Admin only)",
    example: true,
    required: false,
  })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({
    description: "Two-factor authentication enabled (Admin only)",
    example: false,
    required: false,
  })
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiProperty({
    description: "Student profile data (for student roles)",
    required: false,
  })
  @IsOptional()
  studentProfile?: {
    grade?: string;
    batch?: string;
  };

  @ApiProperty({
    description: "Teacher profile data (for teacher roles)",
    required: false,
  })
  @IsOptional()
  teacherProfile?: {
    specialization?: string;
    experience?: number;
  };
}

export class UserResponseDto {
  @ApiProperty({
    description: "User unique identifier",
    example: "uuid-string",
  })
  id!: string;

  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  email?: string | null;

  @ApiProperty({
    description: "User first name",
    example: "John",
  })
  firstName!: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
  })
  lastName!: string;

  @ApiProperty({
    description: "User role",
    enum: UserRole,
    example: "INTERNAL_STUDENT",
  })
  role!: UserRole;

  @ApiProperty({
    description: "User phone number",
    example: "+1234567890",
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    description: "User avatar URL",
    example: "https://s3.amazonaws.com/bucket/avatars/user-id.jpg",
    required: false,
  })
  avatar?: string | null;
  @ApiProperty({
    description: "User status",
    enum: UserStatus,
    required: false,
  })
  status?: UserStatus;
  @ApiProperty({
    description: "User date of birth",
    example: "1990-01-01",
    required: false,
  })
  dateOfBirth?: Date | string | null;
  @ApiProperty({
    description: "User bio/description",
    required: false,
  })
  bio?: string | null;
  @ApiProperty({
    description: "Last login timestamp",
    required: false,
    example: "2024-01-01T00:00:00.000Z",
  })
  lastLoginAt?: Date | null;
  @ApiProperty({
    description: "Last logout timestamp",
    required: false,
    example: "2024-01-01T00:00:00.000Z",
  })
  lastLogoutAt?: Date | null;

  @ApiProperty({
    description: "Email verification status",
    example: true,
  })
  emailVerified?: boolean;

  @ApiProperty({
    description: "Account creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt?: Date;

  @ApiProperty({
    description: "Last profile update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt?: Date;
}
