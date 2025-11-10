import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { SecurityAction } from "@prisma/client";

export class SecurityAuditFiltersDto {
  @ApiPropertyOptional({ description: "Page number", example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: "Filter by action type",
    enum: SecurityAction,
  })
  @IsOptional()
  action?: SecurityAction;

  @ApiPropertyOptional({ description: "Filter by success status" })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: "Minimum risk score (0-100)",
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  riskScoreMin?: number;

  @ApiPropertyOptional({
    description: "Maximum risk score (0-100)",
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  riskScoreMax?: number;

  @ApiPropertyOptional({ description: "Filter by IP address" })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: "Filter by resource type" })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: "Filter by user ID" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: "Start date (ISO format)" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "End date (ISO format)" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: "Search in resource or error message" })
  @IsOptional()
  @IsString()
  search?: string;
}
