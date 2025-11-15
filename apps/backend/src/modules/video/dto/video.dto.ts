import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";
import { SessionStatus } from "@prisma/client";

export class CreateRoomDto {
  @IsString()
  classId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  recordSession?: boolean;
}

export class JoinSessionDto {
  @IsString()
  sessionId!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class TeacherControlDto {
  @IsString()
  sessionId!: string;

  @IsOptional()
  @IsBoolean()
  muteAll?: boolean;

  @IsOptional()
  @IsBoolean()
  videoDisabled?: boolean;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  recordSession?: boolean;
}

export class SessionQueryDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class RecordingActionDto {
  @IsString()
  sessionId!: string;
}

export class SessionMetricsDto {
  @IsString()
  sessionId!: string;
}
