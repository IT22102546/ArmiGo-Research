import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePhysioAssignmentDto {
  @ApiPropertyOptional({ example: 'cmhospitalid123' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'cmphysioid123' })
  @IsOptional()
  @IsString()
  physiotherapistId?: string;

  @ApiProperty({ example: 'cmchildid123' })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({ example: 'Week 4 Finger Exercise Plan' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Please complete daily exercises as described.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/assignments/plan.pdf' })
  @IsOptional()
  @IsString()
  assignmentPdf?: string;

  @ApiPropertyOptional({ example: 'exercise-plan.pdf' })
  @IsOptional()
  @IsString()
  assignmentPdfName?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdatePhysioAssignmentDto {
  @ApiPropertyOptional({ example: 'Week 4 Finger Exercise Plan (Updated)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated instructions.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/assignments/plan_v2.pdf' })
  @IsOptional()
  @IsString()
  assignmentPdf?: string;

  @ApiPropertyOptional({ example: 'exercise-plan-v2.pdf' })
  @IsOptional()
  @IsString()
  assignmentPdfName?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
