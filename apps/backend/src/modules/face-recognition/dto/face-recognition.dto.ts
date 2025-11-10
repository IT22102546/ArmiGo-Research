import { IsString, IsOptional, IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterFaceDto {
  @ApiProperty({
    description: "User ID of the student",
    example: "cmib8miw0001390m8zc3lder9",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Student name",
    example: "John Doe",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Student email",
    example: "john.doe@example.com",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: "Student roll number",
    example: "STU2025001",
  })
  @IsString()
  @IsOptional()
  rollNumber?: string;
}

export class VerifyFaceDto {
  @ApiPropertyOptional({
    description: "Class name for attendance",
    example: "Grade 10 - Mathematics",
  })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiPropertyOptional({
    description: "Session ID for tracking",
    example: "session-uuid",
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class StartExamMonitoringDto {
  @ApiProperty({
    description: "Exam attempt ID",
    example: "cmib8miw0001390m8zc3lder9",
  })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description: "Student user ID",
    example: "cmib8miw0001390m8zc3lder9",
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: "Exam code",
    example: "EXAM2025001",
  })
  @IsString()
  @IsNotEmpty()
  examCode: string;
}

export class MonitorExamDto {
  @ApiProperty({
    description: "Exam attempt ID",
    example: "cmib8miw0001390m8zc3lder9",
  })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description: "AI Service session ID",
    example: 123,
  })
  @IsNotEmpty()
  aiSessionId: number;
}

export class UnlockExamSessionDto {
  @ApiProperty({
    description: "AI Service session ID",
    example: 123,
  })
  @IsNotEmpty()
  aiSessionId: number;

  @ApiProperty({
    description: "Reason for unlocking",
    example: "Manual verification passed",
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AddFaceEmbeddingDto {
  @ApiProperty({
    description: "User ID of the student",
    example: "cmib8miw0001390m8zc3lder9",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class FaceRegistrationResponseDto {
  @ApiProperty({ description: "Operation status" })
  status: string;

  @ApiProperty({ description: "AI Service student ID" })
  aiStudentId: number;

  @ApiProperty({ description: "Face bounding box coordinates" })
  bbox: number[];

  @ApiProperty({ description: "Similarity score if applicable" })
  similarity?: number;
}

export class FaceVerificationResponseDto {
  @ApiProperty({ description: "Verification status: allowed or rejected" })
  status: "allowed" | "rejected";

  @ApiProperty({ description: "Matched student ID if allowed" })
  studentId?: number;

  @ApiProperty({ description: "Student name if allowed" })
  name?: string;

  @ApiProperty({ description: "Face similarity score" })
  similarity: number;

  @ApiProperty({ description: "Similarity threshold used" })
  threshold: number;

  @ApiProperty({ description: "Face bounding box" })
  bbox: number[];

  @ApiProperty({ description: "Rejection reason if rejected" })
  reason?: string;
}

export class ExamMonitoringResponseDto {
  @ApiProperty({ description: "Session status: active, locked, or completed" })
  status: "active" | "locked" | "completed";

  @ApiProperty({ description: "AI Service session ID" })
  aiSessionId: number;

  @ApiProperty({ description: "Reason if locked" })
  reason?: string;

  @ApiProperty({ description: "Face similarity score" })
  similarity?: number;
}

export class StartExamResponseDto {
  @ApiProperty({ description: "Operation status" })
  status: string;

  @ApiProperty({ description: "Exam attempt ID" })
  attemptId: string;

  @ApiProperty({ description: "AI Service session ID" })
  aiSessionId: number;

  @ApiProperty({ description: "Initial face similarity score" })
  similarity: number;

  @ApiProperty({ description: "Similarity threshold" })
  threshold: number;
}
