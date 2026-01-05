import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Matches,
  IsStrongPassword,
} from "class-validator";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @ApiProperty({
    example: "+94712345678",
    description:
      "Mobile phone number (primary identifier) - must be a valid phone format",
  })
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: "Phone number must be 9-15 digits, optionally starting with +",
  })
  phone: string;

  @ApiProperty({
    example: "john.doe@example.com",
    required: false,
    description: "Email address (optional)",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: "SecurePassword123!",
    description:
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 symbol",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  })
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "2001-05-12" })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: "INTERNAL_STUDENT" })
  @IsEnum(UserRole)
  role: UserRole;

  // ✅ ADD THESE OPTIONAL FIELDS
  @ApiProperty({
    required: false,
    example: "Colombo",
    description: "District (optional)",
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    required: false,
    example: "Colombo Central",
    description: "Zone (optional)",
  })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiProperty({
    required: false,
    example: "Grade 9",
    description: "Grade (optional)",
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({
    required: false,
    example: "Royal College",
    description: "School (optional)",
  })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({
    required: false,
    example: "English",
    description: "Medium (optional)",
  })
  @IsOptional()
  @IsString()
  medium?: string;

  @ApiProperty({
    required: true,
    example: "PEC",
    description:
      "Institution code (required for students) - e.g., PV, PEC, etc.",
  })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({
    required: false,
    example: "PromoCode12345",
    description: "Institution Code (optional)",
  })
  @IsOptional()
  @IsString()
  institutionCode?: string;
}

export class TeacherRegisterDto extends RegisterDto {
  @ApiProperty({
    enum: [UserRole.EXTERNAL_TEACHER],
    description: "Only external teachers can register through this endpoint",
  })
  @IsEnum([UserRole.EXTERNAL_TEACHER])
  role: "EXTERNAL_TEACHER";

  // Common teacher fields
  @ApiProperty({
    example: "+94712345678",
    description: "Teacher mobile phone number",
  })
  @IsString()
  phone: string;

  // External teacher (mutual transfer) specific fields - all required for registration
  @ApiProperty({
    description: "Teacher registration ID - required for external teachers",
  })
  @IsString()
  registrationId: string;

  @ApiProperty({
    description: "Current school - required for external teachers",
  })
  @IsString()
  currentSchool: string;

  @ApiProperty({
    description: "Current zone - required for external teachers",
  })
  @IsString()
  currentZone: string;

  @ApiProperty({
    description: "Current district - required for external teachers",
  })
  @IsString()
  currentDistrict: string;

  @ApiProperty({
    description: "Desired transfer zones - required for external teachers",
  })
  @IsArray()
  @IsString({ each: true })
  desiredZones: string[];

  @ApiProperty({
    description: "Subject specialization - required for external teachers",
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: "Medium of instruction - required for external teachers",
  })
  @IsString()
  medium: string;

  @ApiProperty({
    description: "Teaching level - required for external teachers",
  })
  @IsString()
  level: string;

  // Terms acceptance
  @ApiProperty({ description: "Must accept terms and conditions" })
  @IsBoolean()
  acceptTerms: boolean;
}

export class LoginDto {
  @ApiProperty({
    example: "+94712345678 or john.doe@example.com",
    description: "Phone number or email address for login",
  })
  @IsString()
  identifier: string; // Can be phone or email

  @ApiProperty({ example: "SecurePassword123!" })
  @IsString()
  password: string;

  @ApiProperty({
    required: false,
    isArray: true,
    enum: UserRole,
    description:
      "Allowed roles for this login (optional, used by role-specific portals)",
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true })
  allowedRoles?: UserRole[];
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: "NewSecurePassword123!" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  })
  newPassword: string;
}

// Mobile OTP DTOs (from development branch)
export class CheckAccountDto {
  @ApiProperty({
    example: "+94712345678 or john.doe@example.com",
    description: "Phone number or email to check",
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Keep as "identifier"
}

export class SendPasswordResetOtpDto {
  @ApiProperty({
    example: "+94712345678 or john.doe@example.com",
    description: "Phone number or email to send OTP to",
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Change from "emailOrPhone" to "identifier"

  @ApiProperty({
    example: true,
    description: "Whether the identifier is an email (true) or phone (false)",
  })
  @IsBoolean()
  isEmail: boolean;
}
export class VerifyPasswordResetOtpDto {
  @ApiProperty({
    example: "+94712345678 or john.doe@example.com",
    description: "Phone number or email",
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    example: true,
    description: "Whether the identifier is an email (true) or phone (false)",
  })
  @IsBoolean()
  isEmail: boolean;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordWithTokenDto {
  @ApiProperty({ description: "Reset token received from OTP verification" })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: "NewSecurePassword123!" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  })
  newPassword: string;
}

export class RequestMobileVerificationDto {
  @ApiProperty({ example: "+94712345678", description: "Mobile number" })
  @IsString()
  @IsNotEmpty()
  mobile: string;
}

export class VerifyMobileOtpDto {
  @ApiProperty({ example: "temp_user_id", description: "Temporary user ID" })
  @IsString()
  @IsNotEmpty()
  tempUserId: string;

  @ApiProperty({ example: "+94712345678", description: "Mobile number" })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class SendSignupOtpDto {
  @ApiProperty({
    example: "+94712345678",
    description: "Phone number for signup verification"
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: "Phone number must be 9-15 digits, optionally starting with +",
  })
  phone: string;
}

export class VerifySignupOtpDto {
  @ApiProperty({
    example: "+94712345678",
    description: "Phone number for signup verification",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: "Phone number must be 9-15 digits, optionally starting with +",
  })
  phone: string;

  @ApiProperty({
    example: "1234",
    description: "4-digit OTP code",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: "OTP must be exactly 4 digits",
  })
  otp: string;
}

export class CompleteSignupDto {
  @ApiProperty({ example: "temp_user_id", description: "Temporary user ID" })
  @IsString()
  @IsNotEmpty()
  tempUserId: string;

  @ApiProperty({ example: "john.doe@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "johndoe123" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: "+94712345678" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ enum: UserRole, example: "INTERNAL_STUDENT" })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: "SecurePassword123!" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  })
  password: string;
}
