import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// ==================== GRADE DTOs ====================
export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  level: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateGradeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  level?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== PROVINCE DTOs ====================
export class CreateProvinceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateProvinceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== DISTRICT DTOs ====================
export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  provinceId?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateDistrictDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  provinceId?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== ZONE DTOs ====================
export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  districtId?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  districtId?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== MEDIUM DTOs ====================
export class CreateMediumDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMediumDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==================== ACADEMIC YEAR DTOs ====================
export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty()
  year: string; // e.g., "2024/2025"

  @IsString()
  @IsNotEmpty()
  startDate: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  endDate: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateAcademicYearDto {
  @IsString()
  @IsOptional()
  year?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== SUBJECT CODE DTOs ====================
export class CreateSubjectCodeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSubjectCodeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==================== INSTITUTION DTOs ====================
export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty()
  type: string; // "GOVERNMENT", "PRIVATE", "SEMI_GOVERNMENT"

  @IsString()
  @IsOptional()
  category?: string; // "1AB", "1C", "TYPE_2", "TYPE_3"

  @IsString()
  @IsOptional()
  zoneId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  principal?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateInstitutionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  zoneId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  principal?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ReorderItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  sortOrder: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

// ==================== TEACHER SUBJECT ASSIGNMENT DTOs ====================
export class CreateTeacherSubjectAssignmentDto {
  @IsString()
  @IsNotEmpty()
  teacherProfileId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @IsString()
  @IsNotEmpty()
  mediumId: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  canCreateExams?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTeacherSubjectAssignmentDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  canCreateExams?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
