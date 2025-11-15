import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { EnrollmentStatus } from "@prisma/client";

export class CreateEnrollmentDto {
  @ApiProperty({ description: "Student ID" })
  @IsString()
  studentId: string;

  @ApiProperty({ description: "Class ID" })
  @IsString()
  classId: string;

  @ApiProperty({
    description: "Enrollment status",
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiProperty({ description: "Payment ID if already paid", required: false })
  @IsOptional()
  @IsString()
  paymentId?: string;
}

export class UpdateEnrollmentDto {
  @ApiProperty({
    description: "Enrollment status",
    enum: EnrollmentStatus,
    required: true,
    example: "COMPLETED",
  })
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;

  @ApiProperty({
    description: "Notes for status update",
    required: false,
    example: "Student completed the course successfully",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
