import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";

export class CreateSubjectDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: "At least one grade must be assigned" })
  @ValidateNested({ each: true })
  @Type(() => SubjectGradeAssignmentDto)
  gradeAssignments: SubjectGradeAssignmentDto[];
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubjectGradeAssignmentDto)
  gradeAssignments?: SubjectGradeAssignmentDto[];
}

export class SubjectGradeAssignmentDto {
  @IsString()
  gradeId: string;

  @IsString()
  medium: string; // Sinhala, English, Tamil

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
