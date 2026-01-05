import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";

export class StartExamProctoringDto {
  @ApiProperty({
    description: "Student ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: "Exam ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({
    description: "Student face image for verification (multipart upload)",
    type: "string",
    format: "binary",
  })
  image: any; // Will be handled by FileInterceptor
}

export class MonitorExamDto {
  @ApiProperty({
    description: "Exam attempt ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description:
      "AI session ID (optional, will be retrieved from attempt if not provided)",
    example: 12345,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  aiSessionId?: number;

  @ApiProperty({
    description: "Current video frame for monitoring (multipart upload)",
    type: "string",
    format: "binary",
  })
  image: any; // Will be handled by FileInterceptor
}

export class EndExamProctoringDto {
  @ApiProperty({
    description: "Exam attempt ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description: "Final status of the exam attempt",
    example: "SUBMITTED",
    enum: ["SUBMITTED", "GRADED", "FLAGGED"],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(["SUBMITTED", "GRADED", "FLAGGED"])
  status?: string;
}

export class ProctoringReportDto {
  @ApiProperty({
    description: "Exam attempt details",
  })
  attempt: {
    id: string;
    startTime: Date;
    endTime: Date | null;
    status: string;
    student: {
      name: string;
      email: string;
    };
    exam: {
      title: string;
      code: string;
    };
  };

  @ApiProperty({
    description: "Proctoring summary",
  })
  summary: {
    totalIncidents: number;
    severityCounts: Record<string, number>;
    typeCounts: Record<string, number>;
    wasLocked: boolean;
  };

  @ApiProperty({
    description: "Recent proctoring logs (last 50)",
  })
  logs: any[];
}
