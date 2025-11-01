import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";
import { SessionStatus } from "@prisma/client";

export class CreateRoomDto {
  @IsUUID()
  classId: string;

  @IsString()
  title: string;

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
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class TeacherControlDto {
  @IsUUID()
  sessionId: string;

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
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
  @IsUUID()
  sessionId: string;
}

export class SessionMetricsDto {
  @IsUUID()
  sessionId: string;
}
