import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { ExamsService } from "./exams.service";
import {
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  StartExamDto,
  SubmitExamDto,
  ApproveExamDto,
  RejectExamDto,
  BulkCreateQuestionsDto,
  ReorderQuestionsDto,
  ExamSectionDto,
  QuestionGroupDto,
  GradeAnswerDto,
  AutoAssignMarksDto,
} from "./dto/exam.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { ExamStatus } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

@ApiTags("Exams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller("exams")
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Throttle(10, 60000) // 10 exams per minute
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Create a new exam",
    description: "Teachers and admins can create exams for their classes",
  })
  @ApiResponse({
    status: 201,
    description: "Exam created successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        classId: { type: "string" },
        status: { enum: ["DRAFT", "PUBLISHED", "CANCELLED"] },
        createdAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only teachers and admins can create exams",
  })
  async create(@Body() createExamDto: CreateExamDto, @Request() req: any) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get all exams with pagination",
    description: "Retrieve exams with optional filtering by status and class",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ExamStatus,
    description: "Filter by exam status",
  })
  @ApiQuery({
    name: "classId",
    required: false,
    type: String,
    description: "Filter by class ID",
  })
  @ApiResponse({
    status: 200,
    description: "Exams retrieved successfully",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              status: { enum: ["DRAFT", "PUBLISHED", "CANCELLED"] },
              questionCount: { type: "number" },
              attemptCount: { type: "number" },
            },
          },
        },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            pages: { type: "number" },
            hasNext: { type: "boolean" },
            hasPrev: { type: "boolean" },
          },
        },
      },
    },
  })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: ExamStatus,
    @Query("classId") classId?: string,
    @Query("teacherId") teacherId?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        "Invalid pagination parameters"
      );
    }

    return this.examsService.findAll(
      pageNum,
      limitNum,
      status,
      classId,
      teacherId
    );
  }

  @Get("live")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get all currently live exams",
    description:
      "Retrieve exams that are currently in progress for live proctoring",
  })
  @ApiResponse({
    status: 200,
    description: "Live exams retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          duration: { type: "number" },
          alertCount: { type: "number" },
          subject: { type: "object" },
          grade: { type: "object" },
          _count: { type: "object" },
        },
      },
    },
  })
  async getLiveExams() {
    return this.examsService.getLiveExams();
  }

  @Get("student/my-exams")
  @ApiOperation({
    summary: "Get exams for current student",
    description:
      "Retrieve all exams available to the current student from enrolled classes",
  })
  @ApiResponse({
    status: 200,
    description: "Student exams retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          attemptsUsed: { type: "number" },
          attemptsAllowed: { type: "number" },
          class: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              subject: { type: "string" },
            },
          },
        },
      },
    },
  })
  async getStudentExams(@Request() req: { user: { id: string } }) {
    return this.examsService.getStudentExams(req.user.id);
  }

  @Post(":id/sections/bulk")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({ summary: "Create exam sections in bulk" })
  @ApiResponse({ status: 201, description: "Sections created successfully" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  @ApiResponse({ status: 403, description: "Forbidden - no permission" })
  async createSections(
    @Param("id") examId: string,
    @Body() createSectionsDto: { sections: ExamSectionDto[] }
  ) {
    return this.examsService.createExamSections(
      examId,
      createSectionsDto.sections
    );
  }
  @Post(":id/questions")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Add question to exam",
    description: "Add a new question to an existing exam in draft status",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 201,
    description: "Question added successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        question: { type: "string" },
        type: { type: "string" },
        points: { type: "number" },
        order: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Cannot add questions to published or cancelled exams",
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async addQuestion(
    @Param("id") examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.examsService.addQuestion(
      examId,
      createQuestionDto,
      req.user.id
    );
  }

  @Post(":id/questions/bulk")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Add multiple questions to exam",
    description: "Bulk create questions for an exam in draft status",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 201,
    description: "Questions added successfully",
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async bulkAddQuestions(
    @Param("id") examId: string,
    @Body() dto: BulkCreateQuestionsDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.examsService.bulkAddQuestions(
      examId,
      dto.questions,
      req.user.id
    );
  }

  @Put(":id/questions/reorder")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Reorder questions in exam",
    description: "Update the order of questions in an exam",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Questions reordered successfully",
  })
  async reorderQuestions(
    @Param("id") examId: string,
    @Body() dto: ReorderQuestionsDto,
    @Request() req: { user: { id: string } }
  ) {
    return this.examsService.reorderQuestions(
      examId,
      dto.questionOrders,
      req.user.id
    );
  }

  @Get(":id/questions")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all questions for an exam",
    description:
      "Retrieve all questions with section and group information for hierarchical exams",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Questions retrieved with hierarchical structure",
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getQuestions(@Param("id") examId: string) {
    return this.examsService.getQuestions(examId);
  }

  @Get(":id/questions/by-part")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get questions segregated by part",
    description:
      "Retrieve questions grouped into Part 1 (auto-marked) and Part 2 (manual). For hierarchical exams, questions are also grouped by section and group.",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description:
      "Questions grouped by part and hierarchical structure if applicable",
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getQuestionsByPart(@Param("id") examId: string) {
    return this.examsService.getQuestionsByPartHierarchical(examId);
  }

  @Patch("questions/:questionId")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Update a question",
    description: "Update an existing question in a draft exam",
  })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Question updated successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        question: { type: "string" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Cannot update questions in published or cancelled exams",
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  async updateQuestion(
    @Param("questionId") questionId: string,
    @Body() updateData: Partial<CreateQuestionDto>,
    @Request() req: any
  ) {
    return this.examsService.updateQuestion(
      questionId,
      updateData,
      req.user.id
    );
  }

  @Delete("questions/:questionId")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Remove a question",
    description: "Remove a question from a draft exam",
  })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({ status: 200, description: "Question removed successfully" })
  @ApiResponse({
    status: 400,
    description: "Cannot remove questions from published or cancelled exams",
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  async removeQuestion(
    @Param("questionId") questionId: string,
    @Request() req: any
  ) {
    await this.examsService.removeQuestion(questionId, req.user.id);
    return { message: "Question removed successfully" };
  }

  @Post(":id/start")
  @UseGuards(RolesGuard)
  @Throttle(10, 60000) // 10 start attempts per minute
  @Roles(UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT)
  @ApiOperation({
    summary: "Start an exam",
    description:
      "Students can start taking an exam if they are enrolled and have attempts remaining",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 201,
    description: "Exam started successfully",
    schema: {
      type: "object",
      properties: {
        attempt: {
          type: "object",
          properties: {
            id: { type: "string" },
            attemptNumber: { type: "number" },
            status: { type: "string" },
          },
        },
        exam: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            duration: { type: "number" },
            totalMarks: { type: "number" },
          },
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              type: { type: "string" },
              options: { type: "array" },
              points: { type: "number" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Exam not available or maximum attempts exceeded",
  })
  @ApiResponse({ status: 403, description: "Not enrolled in class" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async startExam(
    @Param("id") examId: string,
    @Body() startExamDto: StartExamDto,
    @Request() req: any
  ) {
    return this.examsService.startExam(examId, req.user.id, startExamDto);
  }

  @Post("attempts/:attemptId/submit")
  @UseGuards(RolesGuard)
  @Throttle(5, 60000) // 5 submissions per minute per user
  @Roles(UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT)
  @ApiOperation({
    summary: "Submit an exam",
    description: "Students submit their completed exam with answers",
  })
  @ApiParam({ name: "attemptId", description: "Exam attempt ID" })
  @ApiResponse({
    status: 200,
    description: "Exam submitted successfully",
    schema: {
      type: "object",
      properties: {
        attempt: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string" },
            submittedAt: { type: "string", format: "date-time" },
          },
        },
        score: { type: "number" },
        maxScore: { type: "number" },
        percentage: { type: "number" },
        passed: { type: "boolean" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Exam attempt not in progress" })
  @ApiResponse({ status: 404, description: "Exam attempt not found" })
  async submitExam(
    @Param("attemptId") attemptId: string,
    @Body() submitExamDto: SubmitExamDto,
    @Request() req: any
  ) {
    return this.examsService.submitExam(attemptId, submitExamDto, req.user.id);
  }

  @Get(":id/results")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get exam results",
    description: "Teachers and admins can view detailed results for an exam",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam results retrieved successfully",
    schema: {
      type: "object",
      properties: {
        exam: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            totalMarks: { type: "number" },
            passingMarks: { type: "number" },
          },
        },
        attempts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              student: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                },
              },
              totalScore: { type: "number" },
              percentage: { type: "number" },
              passed: { type: "boolean" },
              submittedAt: { type: "string", format: "date-time" },
            },
          },
        },
        statistics: {
          type: "object",
          properties: {
            totalAttempts: { type: "number" },
            averageScore: { type: "number" },
            passRate: { type: "number" },
            highestScore: { type: "number" },
            lowestScore: { type: "number" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getExamResults(@Param("id") examId: string, @Request() req: any) {
    return this.examsService.getExamResults(examId, req.user.id);
  }

  @Get("teacher/my-exams")
  @UseGuards(RolesGuard)
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER)
  @ApiOperation({
    summary: "Get teacher's exams",
    description: "Retrieve all exams created by the current teacher",
  })
  @ApiResponse({
    status: 200,
    description: "Teacher exams retrieved successfully",
  })
  async getTeacherExams(@Request() req: any) {
    return this.examsService.getTeacherExams(req.user.id);
  }

  @Get("marking/grades-with-exams")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all grades with their exams for marking",
    description:
      "Retrieve grades and their associated exams that have submitted attempts requiring marking",
  })
  @ApiResponse({
    status: 200,
    description: "Grades with exams retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          exams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                totalMarks: { type: "number" },
                attemptCount: { type: "number" },
                pendingCount: { type: "number" },
              },
            },
          },
        },
      },
    },
  })
  async getGradesWithExams(@Request() req: any) {
    return this.examsService.getGradesWithExamsForMarking(
      req.user.id,
      req.user.role
    );
  }

  @Get("marking/by-grade/:gradeId")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get exams for a specific grade that need marking",
    description:
      "Retrieve all exams for a specific grade with student attempt counts and marking progress",
  })
  @ApiParam({ name: "gradeId", description: "Grade ID" })
  @ApiResponse({
    status: 200,
    description: "Exams retrieved successfully",
  })
  async getExamsByGradeForMarking(
    @Param("gradeId") gradeId: string,
    @Request() req: any
  ) {
    return this.examsService.getExamsByGradeForMarking(gradeId, req.user.id);
  }

  @Get("marking/:examId/students")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all students who attempted an exam",
    description:
      "Retrieve list of students with their attempt details and marking status",
  })
  @ApiParam({ name: "examId", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Students retrieved successfully",
  })
  async getStudentsForExamMarking(
    @Param("examId") examId: string,
    @Request() req: any
  ) {
    return this.examsService.getStudentsForExamMarking(examId, req.user.id);
  }

  @Patch(":id/publish")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Publish an exam",
    description:
      "Change exam status from DRAFT to PUBLISHED, making it available to students",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam published successfully",
  })
  @ApiResponse({
    status: 400,
    description:
      "Exam cannot be published (missing questions or already published)",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async publishExam(@Param("id") examId: string, @Request() req: any) {
    return this.examsService.publishExam(examId, req.user.id);
  }

  @Get(":id/attempts")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all attempts for an exam with filtering",
    description:
      "Teachers can view all student attempts for their exams with optional filters",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiQuery({
    name: "grade",
    required: false,
    description: "Filter by student grade",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["marked", "unmarked", "partial"],
    description: "Filter by marking status",
  })
  @ApiQuery({
    name: "studentType",
    required: false,
    description: "Filter by student type",
  })
  @ApiResponse({
    status: 200,
    description: "Exam attempts retrieved successfully with marking status",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getExamAttempts(
    @Param("id") examId: string,
    @Query("grade") grade?: string,
    @Query("status") status?: "marked" | "unmarked" | "partial",
    @Query("studentType") studentType?: string,
    @Request() req?: any
  ) {
    // If filters are provided, use the enhanced method
    if (grade || status || studentType) {
      return this.examsService.getExamAttemptsWithFilters(examId, req.user.id, {
        grade,
        status,
        studentType,
      });
    }
    // Otherwise use the original method
    return this.examsService.getExamAttempts(examId, req.user.id);
  }

  @Get("attempts/:attemptId")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get a single exam attempt with all details",
    description:
      "Retrieve a specific exam attempt with student info, exam details, all answers with questions, and marking progress",
  })
  @ApiParam({ name: "attemptId", description: "Exam Attempt ID" })
  @ApiResponse({
    status: 200,
    description: "Exam attempt retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam attempt not found" })
  async getAttemptById(
    @Param("attemptId") attemptId: string,
    @Request() req: any
  ) {
    return this.examsService.getAttemptById(attemptId, req.user.id);
  }

  @Get("attempts/:attemptId/answers")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all answers for an exam attempt",
    description:
      "Retrieve all ExamAnswer records for the attempt with question details",
  })
  @ApiParam({ name: "attemptId", description: "Exam Attempt ID" })
  @ApiResponse({
    status: 200,
    description: "Answers retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam attempt not found" })
  async getAttemptAnswers(
    @Param("attemptId") attemptId: string,
    @Request() req: any
  ) {
    return this.examsService.getAttemptAnswers(attemptId, req.user.id);
  }

  @Get("rankings")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get exam rankings by subject",
    description:
      "Get student rankings grouped by subject. Admins see all subjects, teachers see only their subjects",
  })
  @ApiQuery({
    name: "subjectId",
    required: false,
    description: "Filter by subject ID",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of top students per subject (default 100)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number for pagination (default 1)",
  })
  @ApiQuery({
    name: "pageSize",
    required: false,
    description: "Number of items per page (default 10)",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sort by field (default: score)",
  })
  @ApiQuery({
    name: "order",
    required: false,
    description: "Sort order: asc or desc (default: desc)",
  })
  @ApiResponse({
    status: 200,
    description: "Rankings retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getExamRankings(
    @Request() req: any,
    @Query("subjectId") subjectId?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: string
  ) {
    const queryOptions = {
      subjectId,
      limit: limit ? parseInt(limit, 10) : 100,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      sortBy: sortBy || "score",
      order: (order as "asc" | "desc") || "desc",
    };

    return this.examsService.getExamRankings(
      req.user.id,
      req.user.role,
      queryOptions
    );
  }

  @Get("pending-approval")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get exams pending approval",
    description: "Get all exams that are pending admin approval",
  })
  @ApiResponse({
    status: 200,
    description: "Pending exams retrieved successfully",
  })
  async getPendingExams(@Request() req: any) {
    return this.examsService.getPendingExams();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get exam by ID",
    description:
      "Retrieve detailed information about a specific exam including questions (for teachers)",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam retrieved successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              type: { type: "string" },
              points: { type: "number" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async findOne(@Param("id") id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Update an exam",
    description: "Teachers can update their exams (admins can update any exam)",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam updated successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({ status: 403, description: "Forbidden - Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async update(
    @Param("id") id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Request() req: any
  ) {
    return this.examsService.update(id, updateExamDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Delete an exam",
    description:
      "Teachers can delete their exams (admins can delete any exam). Soft deletes if attempts exist.",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({ status: 200, description: "Exam deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden - Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async remove(@Param("id") id: string, @Request() req: any) {
    await this.examsService.remove(id, req.user.id);
    return { message: "Exam deleted successfully" };
  }

  @Patch(":id/approve")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Approve an exam",
    description:
      "Admin approves an exam. Once approved and start time is reached, it will be automatically published",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam approved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async approveExam(
    @Param("id") examId: string,
    @Body() dto: ApproveExamDto,
    @Request() req: any
  ) {
    return this.examsService.approveExam(examId, req.user.id, dto);
  }

  @Patch(":id/reject")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Reject an exam",
    description: "Admin rejects an exam with a reason",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam rejected successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async rejectExam(
    @Param("id") examId: string,
    @Body() dto: RejectExamDto,
    @Request() req: any
  ) {
    return this.examsService.rejectExam(examId, req.user.id, dto);
  }

  @Get("pending-approval")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get exams pending approval",
    description: "Retrieve all exams that are waiting for admin approval",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "List of pending exams",
  })
  async getPendingApprovals(
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.examsService.getPendingApprovals(page, limit);
  }

  @Get(":id/preview")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get exam preview for approval",
    description: "Get complete exam with all questions for admin review",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam preview data",
  })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getExamPreview(@Param("id") examId: string) {
    return this.examsService.getExamPreview(examId);
  }

  @Get(":id/rankings")
  @ApiOperation({
    summary: "Get exam rankings",
    description: "Retrieve rankings for an exam with optional filters",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiQuery({
    name: "level",
    required: false,
    enum: ["ISLAND", "DISTRICT", "ZONE"],
    description: "Ranking level filter",
  })
  @ApiQuery({
    name: "studentType",
    required: false,
    enum: ["INTERNAL", "EXTERNAL"],
    description: "Student type filter",
  })
  @ApiQuery({
    name: "district",
    required: false,
    type: String,
    description: "District filter",
  })
  @ApiQuery({
    name: "zone",
    required: false,
    type: String,
    description: "Zone filter",
  })
  @ApiResponse({
    status: 200,
    description: "Rankings data",
  })
  async getRankings(
    @Param("id") examId: string,
    @Query("level") level?: "ISLAND" | "DISTRICT" | "ZONE",
    @Query("studentType") studentType?: "INTERNAL" | "EXTERNAL",
    @Query("district") district?: string,
    @Query("zone") zone?: string
  ) {
    return this.examsService.getRankings(examId, {
      level,
      studentType,
      district,
      zone,
    });
  }

  @Post(":id/rankings/recalculate")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @ApiOperation({
    summary: "Recalculate exam rankings",
    description: "Manually trigger ranking recalculation for an exam",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Rankings recalculated successfully",
  })
  async recalculateRankings(@Param("id") examId: string) {
    await this.examsService.calculateRankingsForExam(examId);
    return { message: "Rankings recalculated successfully" };
  }

  @Get(":id/rankings/visibility")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @ApiOperation({ summary: "Get ranking visibility" })
  async getRankingVisibility(@Param("id") examId: string) {
    return this.examsService.getRankingVisibility(examId);
  }

  @Patch(":id/rankings/visibility")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update ranking visibility" })
  async updateRankingVisibility(
    @Param("id") examId: string,
    @Body() body: { visible: boolean },
    @Request() req: any
  ) {
    return this.examsService.updateRankingVisibility(
      examId,
      !!body.visible,
      req.user.id
    );
  }

  @Get(":id/rankings/export")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @ApiOperation({ summary: "Export rankings as CSV or PDF" })
  async exportRankings(
    @Param("id") examId: string,
    @Query("format") format?: string,
    @Query("level") level?: string,
    @Query("studentType") studentType?: string,
    @Request() req?: any,
    @Res() res?: any
  ) {
    const result = await this.examsService.exportRankings(examId, {
      format: (format as any) || "csv",
      level,
      studentType,
    });
    if (result && result.type && result.data) {
      if (res) {
        res.setHeader("Content-Type", result.type);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=rankings-${examId}.${format || "csv"}`
        );
        res.send(result.data);
      } else {
        // Return the data so framework can handle response
        return {
          data: result.data,
          type: result.type,
        };
      }
    } else {
      return { message: "No data to export" };
    }
  }

  @Post(":id/duplicate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Duplicate exam as template",
    description: "Create a copy of an exam with all questions and settings",
  })
  @ApiParam({ name: "id", description: "Exam ID to duplicate" })
  @ApiResponse({
    status: 200,
    description: "Exam duplicated successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async duplicateExam(@Param("id") examId: string, @Request() req: any) {
    return this.examsService.duplicateExam(examId, req.user.id);
  }

  @Patch(":id/visibility")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Update exam visibility",
    description: "Change who can see and access the exam",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Visibility updated successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async updateVisibility(
    @Param("id") examId: string,
    @Body() body: { visibility: string },
    @Request() req: any
  ) {
    return this.examsService.updateVisibility(
      examId,
      body.visibility,
      req.user.id
    );
  }

  @Patch(":id/force-close")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Force close exam",
    description:
      "Immediately close an active exam and end all ongoing attempts",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam force closed successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async forceCloseExam(
    @Param("id") examId: string,
    @Body() body: { reason?: string },
    @Request() req: any
  ) {
    return this.examsService.forceCloseExam(examId, req.user.id, body.reason);
  }

  // =============== MARKING ENDPOINTS ===============

  @Get(":examId/questions/:questionId/answers")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Get all student answers for a specific question",
    description: "Retrieve student answers for marking purposes",
  })
  @ApiParam({ name: "examId", description: "Exam ID" })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Student answers retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam or question not found" })
  async getQuestionAnswers(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @Request() req: any
  ) {
    return this.examsService.getQuestionAnswers(
      examId,
      questionId,
      req.user.id
    );
  }

  @Patch("answers/:answerId/grade")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Grade a student answer",
    description: "Assign marks and feedback to a student answer",
  })
  @ApiParam({ name: "answerId", description: "Answer ID" })
  @ApiResponse({
    status: 200,
    description: "Answer graded successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Answer not found" })
  async gradeAnswer(
    @Param("answerId") answerId: string,
    @Body() gradeAnswerDto: any,
    @Request() req: any
  ) {
    return this.examsService.gradeAnswer(answerId, gradeAnswerDto, req.user.id);
  }

  @Post(":examId/questions/:questionId/auto-assign")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Auto-assign marks to all answers for a question",
    description: "Bulk assign marks to student answers",
  })
  @ApiParam({ name: "examId", description: "Exam ID" })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Marks auto-assigned successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam or question not found" })
  async autoAssignMarks(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @Body() autoAssignDto: any,
    @Request() req: any
  ) {
    return this.examsService.autoAssignMarks(
      examId,
      questionId,
      autoAssignDto,
      req.user.id
    );
  }

  @Post(":examId/publish-results")
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Publish exam results and calculate rankings",
    description: "Finalize marking and make results visible to students",
  })
  @ApiParam({ name: "examId", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Results published successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async publishExamResults(
    @Param("examId") examId: string,
    @Request() req: any
  ) {
    return this.examsService.publishResults(examId, req.user.id);
  }
}
