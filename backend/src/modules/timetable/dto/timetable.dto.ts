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

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum ChangeType {
  CANCEL = "CANCEL",
  SUBJECT_CHANGE = "SUBJECT_CHANGE",
  TEACHER_CHANGE = "TEACHER_CHANGE",
  TIME_CHANGE = "TIME_CHANGE",
  ROOM_CHANGE = "ROOM_CHANGE",
}

// DTO for creating a timetable entry
export class CreateTimetableDto {
  @IsString()
  grade: string;

  @IsString()
  classLink: string;

  @IsString()
  subject: string;

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
  @IsBoolean()
  active?: boolean;
}

// DTO for updating a timetable entry
export class UpdateTimetableDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  classLink?: string;

  @IsOptional()
  @IsString()
  subject?: string;

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
  subject?: string;

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
  grade: string;
  classLink: string;
  subject: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dayOfWeek: number;
  dayOfWeekName: string;
  startTime: string;
  endTime: string;
  validFrom: Date;
  validUntil: Date;
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
