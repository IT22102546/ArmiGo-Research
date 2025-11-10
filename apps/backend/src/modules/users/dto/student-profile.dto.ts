import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsIn } from "class-validator";
import { GRADE_CONSTANTS, BATCH_CONSTANTS } from "../../../constants/index";

export class CreateStudentProfileDto {
  @ApiProperty({
    description: "Student ID",
    example: "STU001",
    required: false,
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({
    description: "Student grade (1-11)",
    enum: GRADE_CONSTANTS.ALLOWED_GRADES,
    example: "10",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(GRADE_CONSTANTS.ALLOWED_GRADES, {
    message: "Grade must be between 1 and 11",
  })
  grade?: string;

  @ApiProperty({
    description: "Student batch",
    enum: BATCH_CONSTANTS.ALLOWED_BATCHES,
    example: "Batch01",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(BATCH_CONSTANTS.ALLOWED_BATCHES, {
    message:
      "Batch must be one of: Batch01, Batch02, Batch03, Batch04, Batch05",
  })
  batch?: string;

  @ApiProperty({
    description: "Academic year",
    example: "2024",
    required: false,
  })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiProperty({
    description: "Guardian name",
    example: "Jane Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({
    description: "Guardian phone number",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiProperty({
    description: "Guardian email address",
    example: "guardian@example.com",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianEmail?: string;
}

export class UpdateStudentProfileDto {
  @ApiProperty({
    description: "Student grade (1-11)",
    enum: GRADE_CONSTANTS.ALLOWED_GRADES,
    example: "10",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(GRADE_CONSTANTS.ALLOWED_GRADES, {
    message: "Grade must be between 1 and 11",
  })
  grade?: string;

  @ApiProperty({
    description: "Student batch",
    enum: BATCH_CONSTANTS.ALLOWED_BATCHES,
    example: "Batch01",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(BATCH_CONSTANTS.ALLOWED_BATCHES, {
    message:
      "Batch must be one of: Batch01, Batch02, Batch03, Batch04, Batch05",
  })
  batch?: string;

  @ApiProperty({
    description: "Academic year",
    example: "2024",
    required: false,
  })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiProperty({
    description: "Guardian name",
    example: "Jane Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({
    description: "Guardian phone number",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiProperty({
    description: "Guardian email address",
    example: "guardian@example.com",
    required: false,
  })
  @IsOptional()
  @IsString()
  guardianEmail?: string;
}
