import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MaterialType } from "@prisma/client";

export class CreateCourseMaterialDto {
  @ApiPropertyOptional({
    description: "Class ID to associate material with",
    example: "clp1234567890abcdef",
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({
    description: "Grades this material applies to",
    example: ["10", "11", "12"],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  grade: string[];

  @ApiPropertyOptional({
    description: "Subject ID (FK to Subject) - preferred over subject string",
    example: "clp1234567890abcdef",
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: "Subject this material applies to (DEPRECATED: use subjectId)",
    example: "Mathematics",
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: "Title of the material",
    example: "Calculus Notes",
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: "Description of the material",
    example: "Comprehensive notes covering differential and integral calculus",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Type of material",
    enum: MaterialType,
    example: "NOTES",
  })
  @IsEnum(MaterialType)
  type: MaterialType;

  @ApiProperty({
    description: "URL to the uploaded file",
    example: "https://s3.amazonaws.com/bucket/file.pdf",
  })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({
    description: "Size of file in bytes",
    example: 1048576,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({
    description: "MIME type of the file",
    example: "application/pdf",
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    description: "URL to thumbnail image",
    example: "https://s3.amazonaws.com/bucket/thumbnail.jpg",
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: "Whether material is publicly accessible",
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: "Date from which material is valid",
    example: "2025-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: "Date until which material is valid",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    description: "Additional metadata as JSON",
    example: { tags: ["important", "exam-prep"] },
  })
  @IsOptional()
  metadata?: any;
}

export class UpdateCourseMaterialDto {
  @ApiPropertyOptional({
    description: "Title of the material",
    example: "Calculus Notes - Updated",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "Description of the material",
    example:
      "Updated comprehensive notes covering differential and integral calculus",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Grades this material applies to",
    example: ["10", "11", "12"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grade?: string[];

  @ApiPropertyOptional({
    description: "Subject this material applies to",
    example: "Mathematics",
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: "Type of material",
    enum: MaterialType,
    example: "SLIDES",
  })
  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @ApiPropertyOptional({
    description: "Whether material is publicly accessible",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: "Date from which material is valid",
    example: "2025-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: "Date until which material is valid",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    description: "Additional metadata as JSON",
    example: { tags: ["important", "exam-prep"] },
  })
  @IsOptional()
  metadata?: any;
}

export class CourseMaterialResponseDto {
  @ApiProperty({ description: "Material ID" })
  id: string;

  @ApiPropertyOptional({ description: "Associated class ID" })
  classId?: string;

  @ApiProperty({ description: "Applicable grades" })
  grade: string[];

  @ApiPropertyOptional({ description: "Subject" })
  subject?: string;

  @ApiProperty({ description: "Material title" })
  title: string;

  @ApiPropertyOptional({ description: "Material description" })
  description?: string;

  @ApiProperty({ description: "Material type", enum: MaterialType })
  type: MaterialType;

  @ApiProperty({ description: "File URL" })
  fileUrl: string;

  @ApiPropertyOptional({ description: "File size in bytes" })
  fileSize?: number;

  @ApiPropertyOptional({ description: "File MIME type" })
  fileType?: string;

  @ApiPropertyOptional({ description: "Thumbnail URL" })
  thumbnailUrl?: string;

  @ApiProperty({ description: "Is publicly accessible" })
  isPublic: boolean;

  @ApiProperty({ description: "Uploader ID" })
  uploadedById: string;

  @ApiProperty({ description: "Download count" })
  downloads: number;

  @ApiProperty({ description: "View count" })
  views: number;

  @ApiPropertyOptional({ description: "Valid from date" })
  validFrom?: Date;

  @ApiPropertyOptional({ description: "Valid until date" })
  validUntil?: Date;

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata?: any;

  @ApiProperty({ description: "Creation date" })
  createdAt: Date;

  @ApiProperty({ description: "Last updated date" })
  updatedAt: Date;
}

export class CourseMaterialQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Filter by grade",
    example: "12",
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({
    description: "Filter by subject",
    example: "Mathematics",
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: "Filter by material type",
    enum: MaterialType,
    example: "NOTES",
  })
  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @ApiPropertyOptional({
    description: "Filter by public access",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: "Search in title and description",
    example: "calculus",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by class ID",
    example: "clp1234567890abcdef",
  })
  @IsOptional()
  @IsUUID()
  classId?: string;
}
