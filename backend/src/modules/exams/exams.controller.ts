import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ExamsService } from "./exams.service";
import {
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  StartExamDto,
  SubmitExamDto,
} from "./dto/exam.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ExamStatus } from "@prisma/client";
import { UserRole } from "../../common/enums/user.enum";

@ApiTags("Exams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("exams")
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @UseGuards(RolesGuard)
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
    @Query("classId") classId?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException("Invalid pagination parameters");
    }

    return this.examsService.findAll(pageNum, limitNum, status, classId);
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
  async getStudentExams(@Request() req: any) {
    return this.examsService.getStudentExams(req.user.id);
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
    @Request() req: any
  ) {
    return this.examsService.addQuestion(
      examId,
      createQuestionDto,
      req.user.id
    );
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
    summary: "Get all attempts for an exam",
    description: "Teachers can view all student attempts for their exams",
  })
  @ApiParam({ name: "id", description: "Exam ID" })
  @ApiResponse({
    status: 200,
    description: "Exam attempts retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  async getExamAttempts(@Param("id") examId: string, @Request() req: any) {
    return this.examsService.getExamAttempts(examId, req.user.id);
  }
}
