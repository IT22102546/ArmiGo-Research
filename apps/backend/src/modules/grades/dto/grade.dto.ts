import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateGradeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  level: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateGradeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  level?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class GradeQueryDto {
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
