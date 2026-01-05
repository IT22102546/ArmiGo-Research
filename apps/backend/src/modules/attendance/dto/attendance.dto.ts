import {
  IsString,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export enum AttendanceType {
  CLASS = "CLASS",
  EXAM = "EXAM",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

// DTO for marking attendance manually
export class MarkAttendanceDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsBoolean()
  present: boolean;

  @IsOptional()
  @IsDateString()
  joinTime?: string;

  @IsOptional()
  @IsDateString()
  leaveTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // In minutes

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;
}

// DTO for bulk attendance marking
export class BulkMarkAttendanceDto {
  @IsArray()
  attendances: MarkAttendanceDto[];
}

// DTO for auto-marking from video session
export class AutoMarkAttendanceDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minimumAttendancePercentage?: number; // Default 50%
}

function Max(
  arg0: number
): (target: Object, propertyKey: string | symbol) => void {
  return (target: Object, propertyKey: string | symbol) => {
    // Implementation placeholder
  };
}

// DTO for querying attendance
export class QueryAttendanceDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  present?: boolean;

  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  month?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;
}

// DTO for updating attendance
export class UpdateAttendanceDto {
  @IsOptional()
  @IsBoolean()
  present?: boolean;

  @IsOptional()
  @IsDateString()
  joinTime?: string;

  @IsOptional()
  @IsDateString()
  leaveTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Response DTOs
export class AttendanceResponseDto {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  date: Date;
  classId?: string;
  class?: {
    id: string;
    name: string;
    subject: string;
  };
  sessionId?: string;
  present: boolean;
  joinTime?: Date;
  leaveTime?: Date;
  duration?: number;
  notes?: string;
  type: string;
  createdAt: Date;
}

export class AttendanceSummaryResponseDto {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  month: number;
  year: number;
  totalClasses: number;
  attended: number;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceCalendarDto {
  year: number;
  month: number;
  days: {
    date: string;
    present: boolean;
    duration?: number;
    class: {
      id: string;
      name: string;
      subject: string;
      attended: boolean;
    }[];
  }[];
}

export class AttendanceReportDto {
  userId: string;
  userName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalClasses: number;
  attended: number;
  absent: number;
  percentage: number;
  classBreakdown: {
    classId: string;
    className: string;
    subject: string;
    totalSessions: number;
    attended: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    year: number;
    attended: number;
    total: number;
    percentage: number;
  }[];
}

export class AttendanceStatsDto {
  totalUsers: number;
  totalRecords: number;
  averageAttendanceRate: number;
  presentToday: number;
  absentToday: number;
  lowAttendanceAlerts: {
    userId: string;
    userName: string;
    percentage: number;
    classId?: string;
    className?: string;
  }[];
}
