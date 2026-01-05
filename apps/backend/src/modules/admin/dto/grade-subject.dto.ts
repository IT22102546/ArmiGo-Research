import { IsString, IsBoolean, IsOptional, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssignSubjectsToGradeDto {
  @ApiProperty({
    description: "Array of subject IDs to assign to grade",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];
}

export class RemoveSubjectFromGradeDto {
  @ApiProperty({ description: "Subject ID to remove from grade" })
  @IsString()
  subjectId: string;
}

export class GradeSubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  gradeId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  isActive: boolean;

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

  @ApiPropertyOptional({ description: "Grade details" })
  grade?: {
    id: string;
    name: string;
    code: string;
    level: number;
  };
}

export class BulkAssignSubjectsDto {
  @ApiProperty({ description: "Grade ID" })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: "Array of subject IDs", type: [String] })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];

  @ApiPropertyOptional({
    description: "Replace existing assignments",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}
