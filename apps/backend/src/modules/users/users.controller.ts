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
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UserManagementService } from "./user-management.service";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./dto/user.dto";
import { TeacherWorkloadDto } from "./dto/user-management.dto";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import { mapPrismaError } from "@common/errors/prisma-error-mapper";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userManagementService: UserManagementService
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new user",
    description: "Creates a new user account with the provided information",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User created successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Email already exists",
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      // Map Prisma errors to user-friendly AppExceptions
      throw mapPrismaError(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all users",
    description:
      "Retrieves a paginated list of all users with optional filtering (Admin only)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 20,
  })
  @ApiQuery({
    name: "role",
    required: false,
    description: "Filter by role",
    example: "STUDENT",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status",
    example: "ACTIVE",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search in name and email",
    example: "john",
  })
  @ApiQuery({
    name: "grade",
    required: false,
    description: "Filter students by grade",
    example: "10",
  })
  @ApiQuery({
    name: "subject",
    required: false,
    description: "Filter teachers by teaching subject ID",
    example: "uuid-here",
  })
  @ApiQuery({
    name: "batch",
    required: false,
    description: "Filter students by batch",
    example: "A",
  })
  @ApiQuery({
    name: "medium",
    required: false,
    description: "Filter by medium",
    example: "English",
  })
  @ApiQuery({
    name: "institution",
    required: false,
    description: "Filter by institution",
    example: "Royal College",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Users retrieved successfully with pagination",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/UserResponseDto" },
        },
        total: {
          type: "number",
          description: "Total number of users",
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
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("grade") grade?: string,
    @Query("subject") subject?: string,
    @Query("batch") batch?: string,
    @Query("medium") medium?: string,
    @Query("institution") institution?: string
  ): Promise<any> {
    return this.usersService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
      role,
      status,
      search,
      grade,
      subject,
      batch,
      medium,
      institution
    );
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user statistics",
    description: "Get aggregated statistics about users filtered by role",
  })
  @ApiQuery({
    name: "role",
    required: false,
    description: "Filter stats by role",
    example: "INTERNAL_STUDENT",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User statistics retrieved successfully",
  })
  async getUserStats(@Query("role") role?: string): Promise<any> {
    return this.usersService.getUserStats(role);
  }

  @Post("bulk-action")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Perform bulk action on users",
    description: "Activate or deactivate multiple users at once",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to act upon",
        },
        action: {
          type: "string",
          enum: ["activate", "deactivate"],
          description: "Action to perform",
        },
      },
      required: ["userIds", "action"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bulk action completed successfully",
  })
  async bulkAction(
    @Body() body: { userIds: string[]; action: "activate" | "deactivate" }
  ): Promise<any> {
    return this.usersService.bulkUpdateStatus(body.userIds, body.action);
  }

  @Post("bulk-delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete multiple users",
    description: "Permanently delete multiple users (Super Admin only)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to delete",
        },
      },
      required: ["userIds"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Users deleted successfully",
  })
  async bulkDelete(@Body() body: { userIds: string[] }): Promise<any> {
    return this.usersService.bulkDelete(body.userIds);
  }

  @Post("bulk-reset-password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reset passwords for multiple users",
    description: "Send password reset emails to multiple users",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to reset passwords for",
        },
      },
      required: ["userIds"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password reset emails sent successfully",
  })
  async bulkResetPassword(@Body() body: { userIds: string[] }): Promise<any> {
    return this.usersService.bulkResetPassword(body.userIds);
  }

  @Post("bulk-notification")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Send notification to multiple users",
    description: "Send a notification to multiple users",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to send notification to",
        },
        message: {
          type: "string",
          description: "Notification message",
        },
        title: {
          type: "string",
          description: "Notification title",
        },
      },
      required: ["userIds"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notifications sent successfully",
  })
  async bulkNotification(
    @Body() body: { userIds: string[]; message?: string; title?: string }
  ): Promise<any> {
    return this.usersService.bulkSendNotification(
      body.userIds,
      body.title,
      body.message
    );
  }

  @Get("export")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Export users to CSV",
    description:
      "Exports a list of users to CSV format with optional filtering (Admin only)",
  })
  @ApiQuery({
    name: "role",
    required: false,
    description: "Filter by role",
    example: "STUDENT",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status",
    example: "ACTIVE",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search in name and email",
    example: "john",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Users exported successfully as CSV",
    content: {
      "text/csv": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async exportUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Res() res?: any
  ): Promise<void> {
    const csv = await this.usersService.exportUsers(role, status, search);
    const filename = `users_export_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user profile",
    description: "Retrieves the profile of the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async getProfile(@Request() req: { user: { id: string } }): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");}
    return user as unknown as UserResponseDto;
  }

  @Get(":id/teacher-stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get teacher stats",
    description:
      "Get aggregated attendance and performance stats for a teacher",
  })
  @ApiParam({ name: "id", description: "Teacher user id" })
  @ApiResponse({ status: HttpStatus.OK, description: "Teacher stats returned" })
  async getTeacherStats(@Param("id") id: string): Promise<Record<string, unknown>> {
    return this.usersService.getTeacherStats(id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update current user profile",
    description: "Updates the profile of the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Put("profile/avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException("Invalid file type"), false);
        }
        cb(null, true);
      },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload profile avatar",
    description:
      "Uploads a new profile picture for the currently authenticated user",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Avatar uploaded successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid file format",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async uploadAvatar(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw AppException.badRequest(ErrorCode.UPLOAD_FAILED, "No file uploaded");
    }
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @Put("profile/password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change password",
    description: "Changes the password for the currently authenticated user",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: {
          type: "string",
          example: "currentPassword123",
        },
        newPassword: {
          type: "string",
          example: "newPassword123",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password changed successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid current password",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() passwordDto: { currentPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(
      req.user.id,
      passwordDto.currentPassword,
      passwordDto.newPassword
    );
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user by ID",
    description: "Retrieves a specific user by their ID",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");}
    return user as unknown as UserResponseDto;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update user",
    description: "Updates user information",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any
  ): Promise<UserResponseDto> {
    // Check if the current user is an admin - if so, allow role/status changes
    const isAdmin =
      req?.user?.role === UserRole.ADMIN ||
      req?.user?.role === UserRole.SUPER_ADMIN;
    return this.usersService.update(id, updateUserDto, isAdmin);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete user",
    description:
      "Permanently deletes a user from the system. Super admin users can only be deleted by other super admins.",
  })
  @ApiParam({
    name: "id",
    description: "User unique identifier",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async remove(
    @Param("id") id: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    await this.usersService.hardDelete(id, req.user.id, req.user.role);
    return { message: "User deleted successfully" };
  }

  @Post(":id/subject-assignments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Assign subjects to a teacher",
    description:
      "Admin can assign subject-grade-medium combinations to a teacher using TeacherSubjectAssignment",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "uuid-string",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        assignments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subjectId: { type: "string", description: "Subject ID" },
              gradeId: { type: "string", description: "Grade ID" },
              mediumId: { type: "string", description: "Medium ID" },
              academicYearId: {
                type: "string",
                description: "Academic Year ID",
              },
              canCreateExams: {
                type: "boolean",
                description: "Whether teacher can create exams",
                default: true,
              },
              maxStudents: {
                type: "number",
                description: "Maximum number of students (optional)",
              },
            },
            required: ["subjectId", "gradeId", "mediumId", "academicYearId"],
          },
          description: "Array of subject assignments to create",
        },
      },
      required: ["assignments"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Subjects assigned successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User, subject, grade, medium, or academic year not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "User is not a teacher",
  })
  async assignSubjects(
    @Param("id") id: string,
    @Body()
    body: {
      assignments: Array<{
        subjectId: string;
        gradeId: string;
        mediumId: string;
        academicYearId: string;
        canCreateExams?: boolean;
        maxStudents?: number;
      }>;
    }
  ): Promise<any> {
    return this.usersService.assignSubjects(id, body.assignments);
  }

  @Get(":id/subject-assignments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get teacher's subject assignments",
    description:
      "Get all active subject-grade-medium assignments for a teacher",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "uuid-string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Subject assignments retrieved successfully",
  })
  async getTeacherSubjectAssignments(@Param("id") id: string): Promise<any> {
    return this.usersService.getTeacherSubjectAssignments(id);
  }

  @Delete(":id/subject-assignments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Remove subject assignments from a teacher",
    description: "Deactivate specific subject assignments for a teacher",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "uuid-string",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        assignmentIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of assignment IDs to remove",
        },
      },
      required: ["assignmentIds"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assignments removed successfully",
  })
  async removeSubjectAssignments(
    @Param("id") id: string,
    @Body() body: { assignmentIds: string[] }
  ): Promise<any> {
    return this.usersService.removeSubjectAssignments(id, body.assignmentIds);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update user status",
    description:
      "Admin can activate, deactivate, or suspend users (Admin only)",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "uuid-string",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"],
          description: "New status",
        },
      },
      required: ["status"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Status updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string }
  ): Promise<any> {
    return this.usersService.updateStatus(id, body.status);
  }

  @Post(":id/reset-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Admin reset user password",
    description:
      "Admin can reset a user's password without requiring the current password (Admin only)",
  })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "uuid-string",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        newPassword: {
          type: "string",
          minLength: 8,
          description: "New password (minimum 8 characters)",
          example: "NewSecurePassword123!",
        },
      },
      required: ["newPassword"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password reset successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async adminResetPassword(
    @Param("id") id: string,
    @Body() body: { newPassword: string },
    @Request() req: any
  ): Promise<{ message: string }> {
    return this.usersService.adminResetPassword(
      id,
      body.newPassword,
      req.user.id,
      req.user.role
    );
  }

  @Post(":id/reset-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reset user password (Admin)",
    description:
      "Reset password for a user, optionally sending reset link via email",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sendEmail: {
          type: "boolean",
          description: "Send reset link via email",
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password reset initiated",
  })
  async resetUserPassword(
    @Param("id") id: string,
    @Body() body: { sendEmail: boolean }
  ): Promise<{ message: string }> {
    return this.usersService.resetUserPassword(id, body.sendEmail);
  }

  @Post(":id/grant-temporary-access")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Grant temporary access to student (Admin)",
    description: "Grant temporary access for a specified number of days",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["days"],
      properties: {
        days: {
          type: "number",
          description: "Number of days to grant access",
          example: 7,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Temporary access granted",
  })
  async grantTemporaryAccess(
    @Param("id") id: string,
    @Body() body: { days: number }
  ): Promise<{ message: string; expiresAt: Date }> {
    return this.usersService.grantTemporaryAccess(id, body.days);
  }

  @Get(":id/wallet")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user wallet details (Admin)",
    description: "Retrieve wallet balance and transaction history",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Wallet details retrieved",
  })
  async getUserWallet(@Param("id") id: string): Promise<any> {
    return this.usersService.getUserWallet(id);
  }

  @Get(":id/payments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user payment history (Admin)",
    description: "Retrieve all payments and statistics",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment history retrieved",
  })
  async getUserPayments(@Param("id") id: string): Promise<any> {
    return this.usersService.getUserPayments(id);
  }

  @Get(":id/login-attempts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user login attempts (Admin)",
    description: "Retrieve login history and security information",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Login attempts retrieved",
  })
  async getUserLoginAttempts(@Param("id") id: string): Promise<any> {
    return this.usersService.getUserLoginAttempts(id);
  }

  @Get(":id/temporary-accesses")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user temporary accesses (Admin)",
    description: "Retrieve temporary access history for a student",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Temporary accesses retrieved",
  })
  async getUserTemporaryAccesses(@Param("id") id: string): Promise<any> {
    return this.usersService.getUserTemporaryAccesses(id);
  }

  @Patch(":id/student-profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update student profile (Admin)",
    description: "Update grade and medium for a student",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Student profile updated",
  })
  async updateStudentProfile(
    @Param("id") id: string,
    @Body() body: { grade?: number; medium?: string }
  ): Promise<any> {
    return this.usersService.updateStudentProfile(id, body);
  }

  @Post(":id/wallet/adjust")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Adjust student wallet (Admin)",
    description: "Add or deduct amount from student wallet",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Wallet adjusted",
  })
  async adjustWallet(
    @Param("id") id: string,
    @Body() body: { amount: number; type: "CREDIT" | "DEBIT"; reason: string }
  ): Promise<any> {
    return this.usersService.adjustWallet(id, body);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change user status (Admin)",
    description: "Activate or deactivate a user",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User status updated",
  })
  async changeUserStatus(
    @Param("id") id: string,
    @Body() body: { status: string }
  ): Promise<any> {
    return this.usersService.changeUserStatus(id, body.status);
  }

  // ============ EXTERNAL TEACHER ADMIN ENDPOINTS ============

  @Get("external-teachers/admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all external teachers with pagination (Admin)",
    description: "Retrieve paginated list of external teacher applications",
  })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["PENDING", "ACTIVE", "SUSPENDED"],
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by name, email, or registration ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "External teachers retrieved successfully",
  })
  async getAllExternalTeachers(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("status") status?: string,
    @Query("search") searchTerm?: string
  ): Promise<any> {
    return this.usersService.getAllExternalTeachers({
      page: Number(page),
      limit: Number(limit),
      status,
      searchTerm,
    });
  }

  @Get("external-teachers/admin/:id/detail")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get external teacher detail (Admin)",
    description:
      "Get detailed information about an external teacher application",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "External teacher detail retrieved successfully",
  })
  async getExternalTeacherDetail(@Param("id") id: string): Promise<any> {
    return this.usersService.getExternalTeacherDetail(id);
  }

  @Patch("external-teachers/admin/:id/approve")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Approve external teacher application (Admin)",
    description: "Approve an external teacher and set status to ACTIVE",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "External teacher approved successfully",
  })
  async approveExternalTeacher(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req: any
  ): Promise<any> {
    return this.usersService.approveExternalTeacher(
      id,
      body.notes,
      req.user.id
    );
  }

  @Patch("external-teachers/admin/:id/reject")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reject external teacher application (Admin)",
    description: "Reject an external teacher application with a reason",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "External teacher rejected successfully",
  })
  async rejectExternalTeacher(
    @Param("id") id: string,
    @Body() body: { reason: string },
    @Request() req: { user: { id: string } }
  ): Promise<Record<string, unknown>> {
    if (!body.reason) {
      throw AppException.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, "Rejection reason is required");
    }
    return this.usersService.rejectExternalTeacher(
      id,
      body.reason,
      req.user.id
    );
  }

  @Post("external-teachers/admin/:id/note")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Add internal note to external teacher (Admin)",
    description: "Add an internal admin note to external teacher application",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Note added successfully",
  })
  async addExternalTeacherNote(
    @Param("id") id: string,
    @Body() body: { note: string },
    @Request() req: { user: { id: string } }
  ): Promise<Record<string, unknown>> {
    if (!body.note) {
      throw AppException.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, "Note is required");
    }
    return this.usersService.addExternalTeacherNote(id, body.note, req.user.id);
  }

  @Get("teachers/workload")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all teachers with workload analysis",
    description:
      "Retrieves workload information for all teachers including weekly hours, class count, and utilization status",
  })
  @ApiQuery({
    name: "academicYear",
    required: false,
    description: "Academic year (defaults to current year)",
    example: "2024",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Teacher workload data retrieved successfully",
    type: [TeacherWorkloadDto],
  })
  async getAllTeachersWorkload(
    @Query("academicYear") academicYear?: string
  ): Promise<TeacherWorkloadDto[]> {
    const year = academicYear || new Date().getFullYear().toString();
    return this.userManagementService.getAllTeachersWithWorkload(year);
  }

  @Get("teachers/:id/workload")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get specific teacher workload",
    description:
      "Retrieves detailed workload information for a specific teacher",
  })
  @ApiParam({ name: "id", description: "Teacher profile ID" })
  @ApiQuery({
    name: "academicYear",
    required: false,
    description: "Academic year (defaults to current year)",
    example: "2024",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Teacher workload data retrieved successfully",
    type: TeacherWorkloadDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Teacher not found",
  })
  async getTeacherWorkload(
    @Param("id") id: string,
    @Query("academicYear") academicYear?: string
  ): Promise<TeacherWorkloadDto> {
    const year = academicYear || new Date().getFullYear().toString();
    return this.userManagementService.getTeacherWorkload(id, year);
  }

  // ==================== BULK USER UPLOAD ====================
  @Post("bulk-upload/validate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === "text/csv" ||
          file.mimetype === "application/vnd.ms-excel" ||
          file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException("Only CSV and Excel files are allowed"),
            false
          );
        }
      },
    })
  )
  @ApiOperation({
    summary: "Validate bulk user upload file",
    description:
      "Validate CSV/Excel file and return preview with errors (Admin only)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "File validated successfully",
  })
  async validateBulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw AppException.badRequest(ErrorCode.UPLOAD_FAILED, "No file uploaded");
    }

    return await this.usersService.validateBulkUpload(file);
  }

  @Post("bulk-upload/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Import validated users",
    description: "Create users from validated bulk upload data (Admin only)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              role: { type: "string" },
              grade: { type: "string" },
              medium: { type: "string" },
              zone: { type: "string" },
              password: { type: "string" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Users imported successfully",
  })
  async importBulkUsers(@Body() data: { users: any[] }) {
    return await this.usersService.importBulkUsers(data.users);
  }

  @Get("bulk-upload/template")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Download bulk upload template",
    description: "Download a CSV template for bulk user upload (Admin only)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Template downloaded successfully",
    content: {
      "text/csv": {
        schema: {
          type: "string",
        },
      },
    },
  })
  async downloadBulkUploadTemplate(@Res() res: any) {
    const template = `name,email,phone,role,grade,medium,zone,password
John Doe,john.doe@example.com,0771234567,INTERNAL_STUDENT,10,English,Zone A,
Jane Smith,jane.smith@example.com,0771234568,INTERNAL_STUDENT,11,Sinhala,Zone B,
Teacher One,teacher.one@example.com,0771234569,INTERNAL_TEACHER,,,Zone A,`;

    const filename = `user_bulk_upload_template_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(template);
  }
}
