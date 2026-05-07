import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveShoulderElbowSensorDto {
  @ApiProperty({ description: 'Patient display ID (e.g. AG-0001)' })
  @IsString()
  player_id: string;

  @ApiProperty()
  @IsString()
  exercise_type: string;

  @ApiProperty()
  @IsString()
  session_id: string;

  @ApiProperty({ description: 'ISO 8601 datetime string' })
  @IsString()
  timestamp: string;

  @ApiProperty()
  @IsString()
  sensor_name: string;

  @ApiProperty()
  @IsNumber()
  qx: number;

  @ApiProperty()
  @IsNumber()
  qy: number;

  @ApiProperty()
  @IsNumber()
  qz: number;

  @ApiProperty()
  @IsNumber()
  qw: number;

  @ApiProperty()
  @IsNumber()
  arm_angle: number;

  @ApiProperty()
  @IsInt()
  rep_count: number;
}

export class SaveFingerSensorDto {
  @ApiProperty({ description: 'Patient display ID (e.g. AG-0001)' })
  @IsString()
  player_id: string;

  @ApiProperty()
  @IsString()
  exercise_type: string;

  @ApiProperty()
  @IsString()
  session_id: string;

  @ApiProperty({ description: 'ISO 8601 datetime string' })
  @IsString()
  timestamp: string;

  @ApiProperty()
  @IsInt()
  thumb_value: number;

  @ApiProperty()
  @IsInt()
  index_value: number;

  @ApiProperty()
  @IsInt()
  middle_value: number;

  @ApiProperty()
  @IsInt()
  ring_value: number;

  @ApiProperty()
  @IsInt()
  pinky_value: number;

  @ApiProperty()
  @IsNumber()
  thumb_yaw: number;

  @ApiProperty()
  @IsNumber()
  thumb_pitch: number;

  @ApiProperty()
  @IsNumber()
  thumb_roll: number;

  @ApiProperty()
  @IsNumber()
  thumb_flex_pct: number;

  @ApiProperty()
  @IsNumber()
  index_flex_pct: number;

  @ApiProperty()
  @IsNumber()
  middle_flex_pct: number;

  @ApiProperty()
  @IsNumber()
  ring_flex_pct: number;

  @ApiProperty()
  @IsNumber()
  pinky_flex_pct: number;

  @ApiProperty()
  @IsInt()
  rep_count: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exercise_state?: string;
}

export class SaveGameResultDto {
  @ApiProperty({ description: 'Patient display ID (e.g. AG-0001)' })
  @IsString()
  player_id: string;

  @ApiProperty()
  @IsString()
  exercise_type: string;

  @ApiProperty()
  @IsString()
  session_id: string;

  @ApiProperty()
  @IsInt()
  final_score: number;

  @ApiProperty()
  @IsInt()
  reps_completed: number;

  @ApiProperty({ description: 'Duration in seconds' })
  @IsInt()
  duration: number;

  @ApiProperty({ description: 'ISO 8601 datetime string' })
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Shoulder/elbow only' })
  @IsOptional()
  @IsNumber()
  max_angle?: number;

  @ApiPropertyOptional({ description: 'Shoulder/elbow only' })
  @IsOptional()
  @IsNumber()
  average_angle?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  max_thumb?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  max_index?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  max_middle?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  max_ring?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  max_pinky?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  avg_thumb?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  avg_index?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  avg_middle?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  avg_ring?: number;

  @ApiPropertyOptional({ description: 'Finger only' })
  @IsOptional()
  @IsInt()
  avg_pinky?: number;
}
