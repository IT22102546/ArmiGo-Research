import {
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsNumber,
  IsDateString,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateAcademicYearDto {
  @IsString()
  @Matches(/^\d{4}$/, {
    message: "Year must be a 4-digit number (e.g., 2025)",
  })
  year: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, {
    message: "Year must be a 4-digit number (e.g., 2025)",
  })
  year?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AcademicYearQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean = false;
}
