import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsJSON, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ExamType, ExamStatus, QuestionType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateExamDto {
  @ApiProperty({
    description: "Exam title",
    example: "Midterm Mathematics Exam",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Exam description",
    example: "Comprehensive exam covering chapters 1-5",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Exam type",
    enum: ExamType,
    example: ExamType.MULTIPLE_CHOICE,
  })
  @IsEnum(ExamType)
  type: ExamType;

  @ApiProperty({
    description: "Exam duration in minutes",
    example: 120,
    minimum: 1,
    maximum: 480,
  })
  @IsNumber()
  @Min(1)
  @Max(480)
  duration: number;

  @ApiProperty({
    description: "Total marks for the exam",
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  totalMarks: number;

  @ApiProperty({
    description: "Minimum marks to pass",
    example: 60,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  passingMarks: number;

  @ApiProperty({
    description: "Number of attempts allowed",
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  attemptsAllowed: number;

  @ApiProperty({
    description: "Class ID this exam belongs to",
    example: "class_1234567890",
  })
  @IsString()
  classId: string;

  @ApiProperty({
    description: "Exam start time",
    example: "2025-02-01T09:00:00Z",
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: "Exam end time",
    example: "2025-02-01T18:00:00Z",
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: "Exam instructions for students",
    example: "Read all questions carefully. You have 2 hours to complete.",
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  // Enhanced exam format fields
  @ApiProperty({
    description:
      "Marks for Part 1 (auto-marked section: MCQ, matching, fill-in)",
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  part1Marks?: number;

  @ApiProperty({
    description:
      "Marks for Part 2 (subjective section requiring teacher correction)",
    example: 40,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  part2Marks?: number;

  // File upload settings
  @ApiProperty({
    description: "Allow students to upload answer files",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowFileUpload?: boolean;

  @ApiProperty({
    description: "Maximum file size in MB",
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxFileSize?: number;

  @ApiProperty({
    description: "Allowed file types for upload",
    example: ["pdf", "docx", "jpg", "png"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiProperty({
    description: "Instructions for file upload",
    example: "Upload your answer sheet as a single PDF file",
    required: false,
  })
  @IsOptional()
  @IsString()
  uploadInstructions?: string;

  // Windowed access
  @ApiProperty({
    description:
      "Window start time (students can only access during this window)",
    example: "2025-02-01T09:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  windowStart?: string;

  @ApiProperty({
    description: "Window end time",
    example: "2025-02-01T18:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  windowEnd?: string;

  @ApiProperty({
    description: "Allow late submission after window ends",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  lateSubmissionAllowed?: boolean;

  @ApiProperty({
    description: "Late submission penalty percentage",
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  latePenaltyPercent?: number;

  // Ranking settings
  @ApiProperty({
    description: "Enable ranking for this exam",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enableRanking?: boolean;

  @ApiProperty({
    description: "Ranking levels to calculate",
    example: ["ISLAND", "DISTRICT", "ZONE"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rankingLevels?: string[];

  // AI monitoring (optional, excluded from current implementation)
  @ApiProperty({
    description: "Enable AI monitoring for this exam",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  aiMonitoringEnabled?: boolean;

  @ApiProperty({
    description: "Require face verification before exam",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  faceVerificationRequired?: boolean;

  @ApiProperty({
    description: "Enable browser lock during exam",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  browseLockEnabled?: boolean;

  @ApiProperty({
    description: "Timezone for exam scheduling",
    example: "Asia/Colombo",
    required: false,
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiProperty({
    description: "Allowed resources during exam",
    example: ["Calculator", "Formula sheet"],
    required: false,
  })
  @IsOptional()
  @IsString()
  allowedResources?: string;
}

export class UpdateExamDto {
  @ApiProperty({
    description: "Exam title",
    example: "Midterm Mathematics Exam",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Exam description",
    example: "Comprehensive exam covering chapters 1-5",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Exam status",
    enum: ExamStatus,
    example: ExamStatus.PUBLISHED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiProperty({
    description: "Exam duration in minutes",
    example: 120,
    minimum: 1,
    maximum: 480,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  duration?: number;

  @ApiProperty({
    description: "Total marks for the exam",
    example: 100,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalMarks?: number;

  @ApiProperty({
    description: "Minimum marks to pass",
    example: 60,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiProperty({
    description: "Number of attempts allowed",
    example: 2,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  attemptsAllowed?: number;

  @ApiProperty({
    description: "Exam start time",
    example: "2025-02-01T09:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    description: "Exam end time",
    example: "2025-02-01T18:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({
    description: "Exam instructions for students",
    example: "Read all questions carefully. You have 2 hours to complete.",
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: "Enable AI monitoring for this exam",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  aiMonitoringEnabled?: boolean;

  @ApiProperty({
    description: "Require face verification before exam",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  faceVerificationRequired?: boolean;

  @ApiProperty({
    description: "Additional exam metadata",
    example: {
      allowCalculator: true,
      materials: ["Formula sheet provided"],
      restrictions: ["No mobile phones"],
    },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  @Transform(({ value }) =>
    typeof value === "string" ? value : JSON.stringify(value)
  )
  metadata?: string;
}

export class CreateQuestionDto {
  @ApiProperty({
    description: "Question type",
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    description: "Question text",
    example: "What is the derivative of x²?",
  })
  @IsString()
  question: string;

  @ApiProperty({
    description: "Answer options (JSON array)",
    example: ["2x", "x²", "2", "x"],
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    description: "Correct answer",
    example: "2x",
  })
  @IsString()
  correctAnswer: string;

  @ApiProperty({
    description: "Matching pairs for MATCHING type questions",
    example: '[{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]',
    required: false,
  })
  @IsOptional()
  @IsString()
  matchingPairs?: string;

  @ApiProperty({
    description: "Points for this question",
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({
    description: "Question order in exam",
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: "Exam part assignment (1 = auto-marked, 2 = subjective)",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  examPart?: number;

  @ApiProperty({
    description: "Image URL for the question",
    example: "https://storage.example.com/questions/diagram.png",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: "Video URL for the question",
    example: "https://storage.example.com/questions/tutorial.mp4",
    required: false,
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: "Attachment URL for the question",
    example: "https://storage.example.com/questions/reference.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({
    description: "Explanation for the answer",
    example: "The derivative of x² is 2x using the power rule",
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'question_1234567890',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: 'Selected answer',
    example: '2x',
  })
  @IsString()
  selectedAnswer: string;

  @ApiProperty({
    description: 'Time spent on this question in seconds',
    example: 45,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeSpent: number;
}

export class StartExamDto {
  @ApiProperty({
    description: 'Face verification data',
    example: 'base64-encoded-image-data',
    required: false,
  })
  @IsOptional()
  @IsString()
  faceVerificationData?: string;

  @ApiProperty({
    description: 'Browser information',
    example: 'Chrome 91.0.4472.124',
    required: false,
  })
  @IsOptional()
  @IsString()
  browserInfo?: string;
}

export class SubmitExamDto {
  @ApiProperty({
    description: 'Array of submitted answers',
    type: [SubmitAnswerDto],
  })
  @IsArray()
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @ApiProperty({
    description: 'Total time spent on exam in minutes',
    example: 105,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeSpent: number;

  @ApiProperty({
    description: 'AI monitoring events during exam',
    example: [
      { type: 'tab_switch', timestamp: '2025-01-01T10:15:00Z' },
      { type: 'face_not_detected', timestamp: '2025-01-01T10:30:00Z' }
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  monitoringEvents?: any[];
}

export class ExamResponseDto {
  @ApiProperty({
    description: 'Exam unique identifier',
    example: 'exam_1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Exam title',
    example: 'Midterm Mathematics Exam',
  })
  title: string;

  @ApiProperty({
    description: 'Exam description',
    example: 'Comprehensive exam covering chapters 1-5',
  })
  description?: string;

  @ApiProperty({
    description: 'Exam type',
    enum: ExamType,
    example: ExamType.MULTIPLE_CHOICE,
  })
  type: ExamType;

  @ApiProperty({
    description: 'Exam status',
    enum: ExamStatus,
    example: ExamStatus.PUBLISHED,
  })
  status: ExamStatus;

  @ApiProperty({
    description: 'Exam duration in minutes',
    example: 120,
  })
  duration: number;

  @ApiProperty({
    description: 'Total marks for the exam',
    example: 100,
  })
  totalMarks: number;

  @ApiProperty({
    description: 'Minimum marks to pass',
    example: 60,
  })
  passingMarks: number;

  @ApiProperty({
    description: 'Number of attempts allowed',
    example: 2,
  })
  attemptsAllowed: number;

  @ApiProperty({
    description: 'Exam start time',
    example: '2025-02-01T09:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Exam end time',
    example: '2025-02-01T18:00:00Z',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Class information',
    example: {
      id: 'class_1234567890',
      name: 'Advanced Mathematics',
      subject: 'Mathematics'
    },
  })
  class: {
    id: string;
    name: string;
    subject: string;
  };

  @ApiProperty({
    description: 'Number of questions in exam',
    example: 10,
  })
  questionCount: number;

  @ApiProperty({
    description: 'Exam creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}