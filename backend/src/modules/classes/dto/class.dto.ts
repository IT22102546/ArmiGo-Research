import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsJSON, IsBoolean, Min, Max } from 'class-validator';
import { ClassStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateClassDto {
  @ApiProperty({
    description: "Class name",
    example: "Advanced Mathematics",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Class description",
    example: "Advanced mathematics covering calculus and linear algebra",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Subject area",
    example: "Mathematics",
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: "Grade level",
    example: "12",
  })
  @IsString()
  grade: string;

  @ApiProperty({
    description: "Class start date",
    example: "2025-01-15T00:00:00.000Z",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Class end date",
    example: "2025-06-15T00:00:00.000Z",
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: "Class schedule in JSON format",
    example: {
      days: ["Monday", "Wednesday", "Friday"],
      time: "10:00 AM",
      duration: 90,
      timezone: "UTC",
    },
  })
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  schedule: string;

  @ApiProperty({
    description: "Maximum number of students",
    example: 30,
    minimum: 1,
    maximum: 200,
  })
  @IsNumber()
  @Min(1)
  @Max(200)
  maxStudents: number;

  @ApiProperty({
    description: "Class fees in cents",
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @ApiProperty({
    description: "Whether the class requires payment",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({
    description: "Additional class metadata",
    example: {
      requirements: ["Calculator required"],
      materials: ["Textbook: Advanced Math 101"],
      location: "Room 205",
    },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  metadata?: string;

  @ApiProperty({
    description: "Meeting link for online classes",
    example: "https://meet.example.com/class-12345",
    required: false,
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({
    description: "Recording URL for the class",
    example: "https://storage.example.com/recordings/class-12345.mp4",
    required: false,
  })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiProperty({
    description: "Class materials as JSON",
    example: JSON.stringify([
      {
        name: "Lecture Notes.pdf",
        url: "https://example.com/notes.pdf",
        type: "pdf",
      },
      {
        name: "Assignment 1.docx",
        url: "https://example.com/assignment.docx",
        type: "document",
      },
    ]),
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  materials?: string;

  @ApiProperty({
    description: "Whether this is a recurring class",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: "Recurrence pattern in JSON format",
    example: JSON.stringify({
      pattern: "WEEKLY",
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      endDate: "2025-12-31",
    }),
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  recurrence?: string;
}

export class UpdateClassDto {
  @ApiProperty({
    description: "Class name",
    example: "Advanced Mathematics",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Class description",
    example: "Advanced mathematics covering calculus and linear algebra",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Subject area",
    example: "Mathematics",
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: "Grade level",
    example: "12",
    required: false,
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({
    description: "Class status",
    enum: ClassStatus,
    example: ClassStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;

  @ApiProperty({
    description: "Class start date",
    example: "2025-01-15T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: "Class end date",
    example: "2025-06-15T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: "Class schedule in JSON format",
    example: {
      days: ["Monday", "Wednesday", "Friday"],
      time: "10:00 AM",
      duration: 90,
      timezone: "UTC",
    },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  schedule?: string;

  @ApiProperty({
    description: "Maximum number of students",
    example: 30,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxStudents?: number;

  @ApiProperty({
    description: "Class fees in cents",
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @ApiProperty({
    description: "Whether the class requires payment",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({
    description: "Additional class metadata",
    example: {
      requirements: ["Calculator required"],
      materials: ["Textbook: Advanced Math 101"],
      location: "Room 205",
    },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  metadata?: string;

  @ApiProperty({
    description: "Meeting link for online classes",
    example: "https://meet.example.com/class-12345",
    required: false,
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({
    description: "Recording URL for the class",
    example: "https://storage.example.com/recordings/class-12345.mp4",
    required: false,
  })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiProperty({
    description: "Class materials as JSON",
    example: JSON.stringify([
      {
        name: "Lecture Notes.pdf",
        url: "https://example.com/notes.pdf",
        type: "pdf",
      },
      {
        name: "Assignment 1.docx",
        url: "https://example.com/assignment.docx",
        type: "document",
      },
    ]),
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  materials?: string;

  @ApiProperty({
    description: "Whether this is a recurring class",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: "Recurrence pattern in JSON format",
    example: JSON.stringify({
      pattern: "WEEKLY",
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      endDate: "2025-12-31",
    }),
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  recurrence?: string;
}

export class EnrollStudentDto {
  @ApiProperty({
    description: 'Student user ID',
    example: 'user_1234567890',
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    description: 'Payment confirmation if required',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}

export class ClassResponseDto {
  @ApiProperty({
    description: 'Class unique identifier',
    example: 'class_1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Class name',
    example: 'Advanced Mathematics',
  })
  name: string;

  @ApiProperty({
    description: 'Class description',
    example: 'Advanced mathematics covering calculus and linear algebra',
  })
  description?: string;

  @ApiProperty({
    description: 'Subject area',
    example: 'Mathematics',
  })
  subject: string;

  @ApiProperty({
    description: 'Grade level',
    example: '12',
  })
  grade: string;

  @ApiProperty({
    description: 'Class status',
    enum: ClassStatus,
    example: ClassStatus.ACTIVE,
  })
  status: ClassStatus;

  @ApiProperty({
    description: 'Class start date',
    example: '2025-01-15T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Class end date',
    example: '2025-06-15T00:00:00.000Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Current enrollment count',
    example: 25,
  })
  currentEnrollment: number;

  @ApiProperty({
    description: 'Maximum number of students',
    example: 30,
  })
  maxStudents: number;

  @ApiProperty({
    description: 'Teacher information',
    example: {
      id: 'user_teacher123',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@school.edu'
    },
  })
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({
    description: 'Class creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}