import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsJSON,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsIn,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  ExamType,
  ExamStatus,
  QuestionType,
  ExamFormat,
  ExamVisibility,
} from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { GRADE_CONSTANTS } from "../../../constants/index";
import {
  IsLessThanOrEqualToTotalMarks,
  PartMarksSumEqualsTotal,
  IsAfterStartTime,
  DurationFitsInTimeWindow,
  WindowWithinExamTime,
  IsFutureDate,
  CorrectAnswerInOptions,
  HasBlankMarker,
} from "../validators/exam.validators";

export class ExamSectionDto {
  @ApiProperty({
    description: "Section title",
    example: "Part A - Multiple Choice Questions",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Section description",
    example: "Answer all questions in this section",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Order of the section in the exam",
    example: 1,
  })
  @IsNumber()
  order: number;

  @ApiProperty({
    description: "Exam part (1 or 2)",
    example: 1,
    required: false,
    minimum: 1,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  examPart?: number;

  @ApiProperty({
    description: "Default question type for questions in this section",
    enum: QuestionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  defaultQuestionType?: QuestionType;
}

export class CreateExamSectionsDto {
  @ApiProperty({
    description: "Array of exam sections to create",
    type: [ExamSectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamSectionDto)
  sections: ExamSectionDto[];
}

export class QuestionGroupDto {
  @ApiProperty({
    description: "Group title",
    example: "Reading Comprehension",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Instructions for this group of questions",
    example: "Read the passage and answer the following questions",
    required: false,
  })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiProperty({
    description: "Order of the group within the section",
    example: 1,
  })
  @IsNumber()
  order: number;
}

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
  @DurationFitsInTimeWindow({
    message:
      "Exam duration must fit within the time window between start and end time",
  })
  duration: number;

  @ApiProperty({
    description: "Total marks for the exam",
    example: 100,
    minimum: 0.5,
  })
  @IsNumber()
  @Min(0.5)
  totalMarks: number;

  @ApiProperty({
    description: "Minimum marks to pass",
    example: 60,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsLessThanOrEqualToTotalMarks({
    message: "Passing marks cannot exceed total marks",
  })
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
    required: false,
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    description: "Subject ID (FK to Subject model)",
    example: "cm3abc123...",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({
    description: "Grade ID (FK to Grade model)",
    example: "cm3xyz789...",
  })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiProperty({
    description: "Medium ID (FK to Medium model)",
    example: "mdn1234567890",
    required: true,
  })
  @IsString()
  mediumId: string;

  @ApiProperty({
    description: "Grade level for the exam (1-11) - DEPRECATED: use gradeId",
    example: "10",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(GRADE_CONSTANTS.ALLOWED_GRADES, {
    message: "Grade must be between 1 and 11",
  })
  grade?: string;

  @ApiProperty({
    description: "Exam start time",
    example: "2025-02-01T09:00:00Z",
  })
  @IsDateString()
  @IsFutureDate({
    message: "Exam start time must be in the future",
  })
  startTime: string;

  @ApiProperty({
    description: "Exam end time",
    example: "2025-02-01T18:00:00Z",
  })
  @IsDateString()
  @IsAfterStartTime({
    message: "End time must be after start time",
  })
  endTime: string;

  @ApiProperty({
    description: "Exam instructions for students",
    example: "Read all questions carefully. You have 2 hours to complete.",
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  // exam format fields
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
  @PartMarksSumEqualsTotal({
    message: "For MIXED exams, Part 1 + Part 2 marks must equal total marks",
  })
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
  @WindowWithinExamTime({
    message: "Access window must be within exam start and end time",
  })
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

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @ApiProperty({
    description: "Exam format",
    enum: ExamFormat,
    example: ExamFormat.FULL_ONLINE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExamFormat)
  format?: ExamFormat;

  @ApiProperty({
    description: "Exam visibility",
    enum: ExamVisibility,
    example: ExamVisibility.BOTH,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExamVisibility)
  visibility?: ExamVisibility;

  // Hierarchical exam structure
  @ApiProperty({
    description: "Enable hierarchical structure for organizing questions",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useHierarchicalStructure?: boolean;

  @ApiProperty({
    description: "Sections for organizing questions hierarchically",
    type: [ExamSectionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamSectionDto)
  sections?: ExamSectionDto[];
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
    example: "PUBLISHED",
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
    minimum: 0.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
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
    description: "Grade level for the exam (1-11)",
    example: "10",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(GRADE_CONSTANTS.ALLOWED_GRADES, {
    message: "Grade must be between 1 and 11",
  })
  grade?: string;

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
  @HasBlankMarker({
    message: "Fill in the blank questions must contain [BLANK] marker",
  })
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
  @CorrectAnswerInOptions({
    message:
      "Correct answer must be one of the provided options for MCQ/True-False questions",
  })
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
    example: 10.5,
    minimum: 0.5,
  })
  @IsNumber()
  @Min(0.5)
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
    description: "Question section (PART_I, PART_II, PART_III)",
    example: "PART_I",
    required: false,
  })
  @IsOptional()
  @IsString()
  section?: string;

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
    description: "Answer image URL (for questions where answer contains image)",
    example: "https://storage.example.com/answers/solution.png",
    required: false,
  })
  @IsOptional()
  @IsString()
  answerImageUrl?: string;

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
    description: "Question ID",
    example: "question_1234567890",
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: "Selected answer",
    example: "2x",
  })
  @IsString()
  selectedAnswer: string;

  @ApiProperty({
    description: "Time spent on this question in seconds",
    example: 45,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeSpent: number;
}

export class StartExamDto {
  @ApiProperty({
    description: "Face verification data",
    example: "base64-encoded-image-data",
    required: false,
  })
  @IsOptional()
  @IsString()
  faceVerificationData?: string;

  @ApiProperty({
    description: "Browser information",
    example: "Chrome 91.0.4472.124",
    required: false,
  })
  @IsOptional()
  @IsString()
  browserInfo?: string;
}

export class SubmitExamDto {
  @ApiProperty({
    description: "Array of submitted answers",
    type: [SubmitAnswerDto],
  })
  @IsArray()
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @ApiProperty({
    description: "Total time spent on exam in minutes",
    example: 105,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeSpent: number;

  @ApiProperty({
    description: "AI monitoring events during exam",
    example: [
      { type: "tab_switch", timestamp: "2025-01-01T10:15:00Z" },
      { type: "face_not_detected", timestamp: "2025-01-01T10:30:00Z" },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  monitoringEvents?: any[];
}

export class ExamResponseDto {
  @ApiProperty({
    description: "Exam unique identifier",
    example: "exam_1234567890",
  })
  id: string;

  @ApiProperty({
    description: "Exam title",
    example: "Midterm Mathematics Exam",
  })
  title: string;

  @ApiProperty({
    description: "Exam description",
    example: "Comprehensive exam covering chapters 1-5",
  })
  description?: string;

  @ApiProperty({
    description: "Exam type",
    enum: ExamType,
    example: ExamType.MULTIPLE_CHOICE,
  })
  type: ExamType;

  @ApiProperty({
    description: "Exam status",
    enum: ExamStatus,
    example: "PUBLISHED",
  })
  status: ExamStatus;

  @ApiProperty({
    description: "Exam duration in minutes",
    example: 120,
  })
  duration: number;

  @ApiProperty({
    description: "Total marks for the exam",
    example: 100,
  })
  totalMarks: number;

  @ApiProperty({
    description: "Minimum marks to pass",
    example: 60,
  })
  passingMarks: number;

  @ApiProperty({
    description: "Number of attempts allowed",
    example: 2,
  })
  attemptsAllowed: number;

  @ApiProperty({
    description: "Exam start time",
    example: "2025-02-01T09:00:00Z",
  })
  startTime: Date;

  @ApiProperty({
    description: "Exam end time",
    example: "2025-02-01T18:00:00Z",
  })
  endTime: Date;

  @ApiProperty({
    description: "Class information",
    example: {
      id: "class_1234567890",
      name: "Mathematics",
      subject: "Mathematics",
    },
  })
  class: {
    id: string;
    name: string;
    subject: string;
  };

  @ApiProperty({
    description: "Number of questions in exam",
    example: 10,
  })
  questionCount: number;

  @ApiProperty({
    description: "Exam creation timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}

// ============================================
// Exam Approval & Preview DTOs
// ============================================

export class ExamPreviewDto {
  @ApiProperty({
    description: "Exam details",
  })
  exam: any; // Full exam object

  @ApiProperty({
    description: "All questions in the exam",
    isArray: true,
  })
  questions: any[];

  @ApiProperty({
    description: "Total number of questions",
    example: 20,
  })
  questionCount: number;

  @ApiProperty({
    description: "Number of Part 1 questions (auto-marked)",
    example: 15,
  })
  part1QuestionCount: number;

  @ApiProperty({
    description: "Number of Part 2 questions (manual marking)",
    example: 5,
  })
  part2QuestionCount: number;

  @ApiProperty({
    description: "Estimated duration based on questions",
    example: 120,
  })
  estimatedDuration: number;
}

export class ApproveExamDto {
  @ApiProperty({
    description: "Optional notes from admin",
    example: "Exam approved with minor suggestions",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: "Scheduled publish date/time",
    example: "2025-02-01T09:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledPublishDate?: string;
}

export class RejectExamDto {
  @ApiProperty({
    description: "Reason for rejection",
    example: "Questions need more clarity",
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: "Detailed feedback for teacher",
    example: "Please review questions 3, 5, and 7 for clarity",
  })
  @IsString()
  feedback: string;

  @ApiProperty({
    description: "Specific changes requested",
    example: ["Clarify question 3", "Add more options to question 5"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestChanges?: string[];
}

// ============================================
// Question Management DTOs
// ============================================

export class MCQOption {
  @ApiProperty({
    description: "Option ID",
    example: "opt_1",
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "Option text",
    example: "2x",
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: "Is this the correct answer",
    example: true,
  })
  @IsBoolean()
  isCorrect: boolean;
}

export class MatchingPairItem {
  @ApiProperty({
    description: "Item ID",
    example: "item_1",
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "Item text",
    example: "Apple",
  })
  @IsString()
  text: string;
}

export class MatchingPairsDto {
  @ApiProperty({
    description: "Left side items",
    type: [MatchingPairItem],
  })
  @IsArray()
  left: MatchingPairItem[];

  @ApiProperty({
    description: "Right side items",
    type: [MatchingPairItem],
  })
  @IsArray()
  right: MatchingPairItem[];

  @ApiProperty({
    description: "Correct pairs",
    example: [{ leftId: "item_1", rightId: "item_a" }],
  })
  @IsArray()
  correctPairs: { leftId: string; rightId: string }[];
}

export class SubQuestionDto {
  @ApiProperty({
    description: "Part number",
    example: 1,
  })
  @IsNumber()
  partNumber: number;

  @ApiProperty({
    description: "Part text",
    example: "Calculate the derivative",
  })
  @IsString()
  partText: string;

  @ApiProperty({
    description: "Points for this part",
    example: 2,
  })
  @IsNumber()
  @Min(0.5)
  points: number;

  @ApiProperty({
    description: "Correct answer for this part",
    example: "2x",
  })
  @IsString()
  correctAnswer: string;
}

export class CreateQuestionBulkDto {
  @ApiProperty({
    description: "Question type",
    enum: QuestionType,
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    description: "Question text",
  })
  @IsString()
  question: string;

  @ApiProperty({
    description: "Question order in exam",
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: "Exam part (1 = auto-marked, 2 = manual)",
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(2)
  examPart: number;

  @ApiProperty({
    description: "Section identifier",
    example: "PART_I",
    required: false,
  })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({
    description: "Points for this question",
  })
  @IsNumber()
  @Min(0.5)
  points: number;

  // MCQ specific fields
  @ApiProperty({
    description: "MCQ options",
    type: [MCQOption],
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: MCQOption[];

  // Matching specific fields
  @ApiProperty({
    description: "Matching pairs configuration",
    type: MatchingPairsDto,
    required: false,
  })
  @IsOptional()
  matchingPairs?: MatchingPairsDto;

  // Fill-in-blank specific fields
  @ApiProperty({
    description: "Fill-in-blank text with [BLANK] markers",
    example: "The capital of France is [BLANK]",
    required: false,
  })
  @IsOptional()
  @IsString()
  fillInBlankText?: string;

  @ApiProperty({
    description: "Correct answers for blanks",
    example: ["Paris"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fillInBlankAnswers?: string[];

  // Sub-questions
  @ApiProperty({
    description: "Sub-questions (parts a, b, c, etc.)",
    type: [SubQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  subQuestions?: SubQuestionDto[];

  // Media fields
  @ApiProperty({
    description: "Image URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: "Video URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: "Attachment URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({
    description: "Answer as correct answer (for simple questions)",
    required: false,
  })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  // Hierarchical exam structure fields
  @ApiProperty({
    description: "Section ID for hierarchical organization",
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({
    description: "Question group ID within a section",
    required: false,
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    description: "Question parts (JSON array)",
    required: false,
  })
  @IsOptional()
  parts?: any[];

  @ApiProperty({
    description: "Show question number in display",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showNumber?: boolean;

  @ApiProperty({
    description: "Custom numbering string (e.g., 'A.1', 'Q1a')",
    required: false,
  })
  @IsOptional()
  @IsString()
  numbering?: string;

  @ApiProperty({
    description: "URLs for option images in MCQ",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionImages?: string[];
}

export class BulkCreateQuestionsDto {
  @ApiProperty({
    description: "Array of questions to create",
    type: [CreateQuestionBulkDto],
  })
  @IsArray()
  questions: CreateQuestionBulkDto[];
}

export class ReorderQuestionsDto {
  @ApiProperty({
    description:
      "Array of question ID and new order pairs. For hierarchical exams, can include sectionId and groupId",
    example: [
      { questionId: "q1", newOrder: 1, sectionId: "s1", groupId: "g1" },
      { questionId: "q2", newOrder: 2, sectionId: "s1", groupId: "g1" },
    ],
  })
  @IsArray()
  questionOrders: {
    questionId: string;
    newOrder: number;
    sectionId?: string;
    groupId?: string;
  }[];
}

export class GradeAnswerDto {
  @ApiProperty({
    description: "Points awarded for this answer",
    example: 15.5,
  })
  @IsNumber()
  @Min(0)
  pointsAwarded: number;

  @ApiProperty({
    description: "Comments or feedback for the student",
    example: "Good explanation but missing some key points.",
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class AutoAssignMarksDto {
  @ApiProperty({
    description: "Points to assign",
    example: 10,
  })
  @IsNumber()
  @Min(0)
  points: number;

  @ApiProperty({
    description: "Apply to unanswered questions only",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  applyToUnanswered?: boolean;
}
