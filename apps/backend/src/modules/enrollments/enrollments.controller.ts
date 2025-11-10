import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import {
  EnrollmentsService,
  StudentEnrollmentSummary,
} from "./enrollments.service";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { EnrollmentStatus } from "@prisma/client";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

@ApiTags("Enrollments")
@Controller("enrollments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({
    summary: "Get enrollments",
    description:
      "Retrieves enrollments with optional filtering by classId and status",
  })
  @ApiQuery({
    name: "classId",
    required: false,
    description: "Filter by class ID",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: EnrollmentStatus,
    description: "Filter by enrollment status",
  })
  @ApiQuery({
    name: "studentId",
    required: false,
    description: "Filter by student ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Enrollments retrieved successfully",
  })
  async findAll(
    @Query("classId") classId?: string,
    @Query("status") status?: EnrollmentStatus,
    @Query("studentId") studentId?: string
  ): Promise<Record<string, unknown>[]> {
    return this.enrollmentsService.findAll({ classId, status, studentId });
  }

  @Get("grouped")
  @ApiOperation({
    summary: "Get enrollments grouped by student",
    description:
      "Retrieves all enrollment types (class, seminar, exam) grouped by student with expandable details",
  })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["class", "seminar", "exam"],
    description: "Filter by enrollment type",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by student name or email",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status (varies by type)",
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
    description: "Items per page (default: 20)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Grouped enrollments retrieved successfully",
  })
  async findGroupedByStudent(
    @Query("type") type?: "class" | "seminar" | "exam",
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ): Promise<Record<string, unknown>> {
    return this.enrollmentsService.findGroupedByStudent({
      type,
      search,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("student/:studentId")
  @ApiOperation({
    summary: "Get all enrollments for a specific student",
    description:
      "Retrieves all enrollment types (class, seminar, exam) for a specific student",
  })
  @ApiParam({
    name: "studentId",
    description: "The ID of the student",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Student enrollments retrieved successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Student not found",
  })
  async findStudentEnrollments(
    @Param("studentId") studentId: string
  ): Promise<StudentEnrollmentSummary> {
    const result =
      await this.enrollmentsService.findStudentEnrollments(studentId);
    if (!result) {
      throw AppException.notFound(
        ErrorCode.USER_NOT_FOUND,
        `Student with ID ${studentId} not found`
      );
    }
    return result;
  }

  @Get("available-classes")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Get available classes for enrollment",
    description:
      "Retrieves all active classes that students can be enrolled in",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Available classes retrieved successfully",
  })
  async getAvailableClasses() {
    return this.enrollmentsService.getAvailableClasses();
  }

  @Get("available-classes/:studentId")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Get available classes for a specific student",
    description:
      "Retrieves classes filtered by student grade, excluding already enrolled classes",
  })
  @ApiParam({
    name: "studentId",
    description: "The student ID to get available classes for",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Available classes for student retrieved successfully",
  })
  async getAvailableClassesForStudent(@Param("studentId") studentId: string) {
    return this.enrollmentsService.getAvailableClassesForStudent(studentId);
  }

  @Get("available-students")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Get available students for enrollment",
    description: "Retrieves students that can be enrolled in classes",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by student name or email",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Available students retrieved successfully",
  })
  async getAvailableStudents(@Query("search") search?: string) {
    return this.enrollmentsService.getAvailableStudents(search);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Create a new enrollment",
    description: "Enrolls a student in a class",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["studentId", "classId"],
      properties: {
        studentId: { type: "string", description: "The student ID" },
        classId: { type: "string", description: "The class ID" },
        status: {
          type: "string",
          enum: Object.values(EnrollmentStatus),
          description: "Enrollment status (default: ACTIVE)",
        },
        isPaid: {
          type: "boolean",
          description: "Payment status (default: false)",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Enrollment created successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request or enrollment already exists",
  })
  async createEnrollment(
    @Body()
    body: {
      studentId: string;
      classId: string;
      status?: EnrollmentStatus;
      isPaid?: boolean;
    }
  ): Promise<Record<string, unknown>> {
    try {
      return await this.enrollmentsService.createEnrollment(body);
    } catch (error) {
      throw AppException.badRequest(
        ErrorCode.INVALID_INPUT,
        (error as Error).message
      );
    }
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Update an enrollment",
    description: "Updates enrollment status, payment status, or progress",
  })
  @ApiParam({
    name: "id",
    description: "The enrollment ID",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: Object.values(EnrollmentStatus),
          description: "Enrollment status",
        },
        isPaid: { type: "boolean", description: "Payment status" },
        progress: {
          type: "number",
          description: "Progress percentage (0-100)",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Enrollment updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Enrollment not found",
  })
  async updateEnrollment(
    @Param("id") id: string,
    @Body()
    body: {
      status?: EnrollmentStatus;
      isPaid?: boolean;
      progress?: number;
    }
  ) {
    try {
      return await this.enrollmentsService.updateEnrollment(id, body);
    } catch (error) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        (error as Error).message
      );
    }
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({
    summary: "Delete an enrollment",
    description: "Soft deletes an enrollment",
  })
  @ApiParam({
    name: "id",
    description: "The enrollment ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Enrollment deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Enrollment not found",
  })
  async deleteEnrollment(@Param("id") id: string) {
    try {
      return await this.enrollmentsService.deleteEnrollment(id);
    } catch (error) {
      throw AppException.notFound(
        ErrorCode.RESOURCE_NOT_FOUND,
        (error as Error).message
      );
    }
  }
}
