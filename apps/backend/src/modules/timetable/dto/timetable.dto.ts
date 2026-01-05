import {
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ChangeType } from "@prisma/client";

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// DTO for creating a timetable entry
export class CreateTimetableDto {
  @IsString()
  grade: string; // DEPRECATED: Use gradeId

  @IsString()
  gradeId: string; // FK to Grade model

  @IsInt()
  @Min(2020)
  @Max(2100)
  academicYear: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  term?: number;

  @IsString()
  classLink: string;

  @IsString()
  subject: string; // DEPRECATED: Use subjectId

  @IsOptional()
  @IsString()
  subjectId?: string; // FK to Subject model

  @IsOptional()
  @IsString()
  medium?: string; // DEPRECATED: Use mediumId

  @IsString()
  mediumId: string; // FK to Medium model

  @IsString()
  teacherId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string; // Format: "HH:MM"

  @IsString()
  endTime: string; // Format: "HH:MM"

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @IsOptional()
  @IsString()
  excludeDates?: string; // JSON array of dates

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// DTO for updating a timetable entry
export class UpdateTimetableDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  academicYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  term?: number;

  @IsOptional()
  @IsString()
  classLink?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  medium?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @IsOptional()
  @IsString()
  excludeDates?: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// DTO for creating a timetable change
export class CreateTimetableChangeDto {
  @IsString()
  timetableId: string;

  @IsEnum(ChangeType)
  changeType: ChangeType;

  @IsDateString()
  changeDate: string;

  @IsOptional()
  @IsString()
  newSubject?: string;

  @IsOptional()
  @IsString()
  newTeacherId?: string;

  @IsOptional()
  @IsString()
  newStartTime?: string;

  @IsOptional()
  @IsString()
  newEndTime?: string;

  @IsOptional()
  @IsString()
  newClassLink?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO for querying timetable
export class QueryTimetableDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  academicYear?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  term?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  mediumId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dayOfWeek?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}

// Response DTO
export class TimetableResponseDto {
  id: string;
  gradeId: string;
  grade: {
    id: string;
    name: string;
    level: number;
  };
  academicYear: number;
  term: number;
  classLink: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  mediumId: string;
  medium?: {
    id: string;
    name: string;
  };
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  teacherAssignmentId?: string;
  dayOfWeek: number;
  dayOfWeekName: string;
  startTime: string;
  endTime: string;
  validFrom: Date;
  validUntil: Date;
  recurrencePattern?: string;
  excludeDates?: string;
  roomNumber?: string;
  color?: string;
  notes?: string;
  recurring: boolean;
  active: boolean;
  changes?: TimetableChangeResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class TimetableChangeResponseDto {
  id: string;
  timetableId: string;
  changeType: string;
  changeDate: Date;
  newSubject?: string;
  newTeacherId?: string;
  newTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  newStartTime?: string;
  newEndTime?: string;
  newClassLink?: string;
  reason?: string;
  notificationSent: boolean;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}
