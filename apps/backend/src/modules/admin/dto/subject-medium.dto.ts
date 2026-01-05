import { IsString, IsBoolean, IsOptional, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssignMediumsToSubjectDto {
  @ApiProperty({
    description: "Array of medium IDs to assign to subject",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  mediumIds: string[];
}

export class RemoveMediumFromSubjectDto {
  @ApiProperty({ description: "Medium ID to remove from subject" })
  @IsString()
  mediumId: string;
}

export class SubjectMediumResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  mediumId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ description: "Medium details" })
  medium?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiPropertyOptional({ description: "Subject details" })
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
}

export class BulkAssignMediumsDto {
  @ApiProperty({ description: "Subject ID" })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: "Array of medium IDs", type: [String] })
  @IsArray()
  @IsString({ each: true })
  mediumIds: string[];

  @ApiPropertyOptional({
    description: "Replace existing assignments",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}
