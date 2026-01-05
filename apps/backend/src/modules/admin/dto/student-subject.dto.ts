import { IsString, IsBoolean, IsOptional, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssignSubjectsToStudentDto {
  @ApiProperty({
    description: "Array of subject IDs to assign to student",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];

  @ApiProperty({ description: "Academic year for the assignment" })
  @IsString()
  academicYear: string;
}

export class RemoveSubjectFromStudentDto {
  @ApiProperty({ description: "Subject ID to remove from student" })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: "Academic year" })
  @IsString()
  academicYear: string;
}

export class StudentSubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentProfileId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  enrolledAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ description: "Subject details" })
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string;
    imageUrl?: string;
  };

  @ApiPropertyOptional({ description: "Student profile details" })
  studentProfile?: {
    id: string;
    userId: string;
    studentId?: string;
    gradeId?: string;
    user: {
      firstName: string;
      lastName: string;
      email?: string;
    };
  };
}

export class BulkAssignStudentSubjectsDto {
  @ApiProperty({ description: "Student profile ID" })
  @IsString()
  studentProfileId: string;

  @ApiProperty({ description: "Array of subject IDs", type: [String] })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];

  @ApiProperty({ description: "Academic year" })
  @IsString()
  academicYear: string;

  @ApiPropertyOptional({
    description: "Replace existing assignments",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}
