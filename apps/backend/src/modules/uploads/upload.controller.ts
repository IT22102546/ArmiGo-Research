import {
  Controller,
  Post,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { UploadService } from "./upload.service";
import { createMulterConfig } from "./multer.config";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import { PrismaService } from "@database/prisma.service";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";

/**
 * UPLOAD CONTROLLER
 *
 * Handles image uploads for exam questions.
 *
 * ENDPOINTS:
 * - POST /api/v1/exams/:examId/questions/:questionId/image
 *   Upload image for a specific question
 *
 * - PATCH /api/v1/questions/:questionId/image
 *   Update question with image URL (after upload)
 *
 * IMPORTANT NOTES:
 * - All endpoints require authentication
 * - File must be multipart/form-data, field name: "image"
 * - Only images are accepted (jpg, png, webp)
 * - File size validated against MAX_FILE_SIZE env
 * - Returns relative URL path for serving via /uploads static route
 */
@ApiTags("Uploads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("uploads")
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Upload image for exam question
   *
   * POST /api/v1/uploads/exam-question-image/:examId/:questionId
   *
   * Request:
   * - multipart/form-data
   * - Field: "image" (file)
   *
   * Response:
   * {
   *   "imageUrl": "/uploads/exams/{examId}/questions/{questionId}/image-1234567890.jpg",
   *   "fileName": "image-1234567890.jpg",
   *   "savedPath": "/absolute/path/to/file"
   * }
   */
  @Post("exam-question-image/:examId/:questionId")
  @UseInterceptors(
    FileInterceptor("image", createMulterConfig(new ConfigService()))
  )
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Upload image for exam question",
    description:
      "Upload an image file for a specific exam question. File should be multipart/form-data with field name 'image'.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "examId", description: "Exam ID" })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Image uploaded successfully",
    schema: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          example: "/uploads/exams/exam123/questions/q456/image-1234567890.jpg",
        },
        fileName: { type: "string", example: "image-1234567890.jpg" },
        savedPath: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  @ApiResponse({ status: 404, description: "Exam or question not found" })
  async uploadQuestionImage(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    // Validate file was provided
    if (!file) {
      throw new BadRequestException(
        "No file provided. Please upload an image with field name 'image'."
      );
    }

    // Verify exam exists and user has access
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND);
    }

    // Verify user is exam creator or admin
    const isCreator = exam.createdById === req.user.id;
    const isAdmin =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        "Only exam creator or admin can upload images"
      );
    }

    // Verify question exists and belongs to exam
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question || question.examId !== examId) {
      throw AppException.notFound(
        ErrorCode.QUESTION_NOT_FOUND,
        "Question not found in this exam"
      );
    }

    // Save file using UploadService
    const uploadResponse = await this.uploadService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        examId,
        questionId,
      }
    );

    return uploadResponse;
  }

  /**
   * Upload image for question (alternative endpoint)
   *
   * POST /api/v1/uploads/question-image/:questionId
   *
   * Similar to above but only requires questionId
   * Exam ID is derived from question record
   */
  @Post("question-image/:questionId")
  @UseInterceptors(
    FileInterceptor("image", createMulterConfig(new ConfigService()))
  )
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Upload image for question",
    description: "Upload an image file for a specific question",
  })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Image uploaded successfully",
  })
  async uploadImage(
    @Param("questionId") questionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Get question to find exam
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    // Verify access
    const exam = await this.prisma.exam.findUnique({
      where: { id: question.examId },
    });

    const isCreator = exam?.createdById === req.user.id;
    const isAdmin =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin) {
      throw AppException.forbidden(ErrorCode.FORBIDDEN);
    }

    // Save file
    const uploadResponse = await this.uploadService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        examId: question.examId,
        questionId,
      }
    );

    return uploadResponse;
  }

  /**
   * Update question with uploaded image URL
   *
   * PATCH /api/v1/questions/:questionId/image
   *
   * Request body:
   * {
   *   "imageUrl": "/uploads/exams/exam123/questions/q456/image-1234567890.jpg"
   * }
   *
   * This endpoint is called AFTER image is uploaded to set the imageUrl
   * on the question record.
   */
  @Patch("questions/:questionId/image")
  @Roles(
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  )
  @ApiOperation({
    summary: "Update question with image URL",
    description: "Set the imageUrl field on a question after uploading image",
  })
  @ApiParam({ name: "questionId", description: "Question ID" })
  @ApiResponse({
    status: 200,
    description: "Question updated with image URL",
  })
  async updateQuestionImage(
    @Param("questionId") questionId: string,
    @Request() req: any,
    @Body() body: { imageUrl: string }
  ) {
    // Validate imageUrl is provided and is a path (not base64)
    if (!body.imageUrl) {
      throw new BadRequestException("imageUrl is required");
    }

    if (body.imageUrl.startsWith("data:")) {
      throw new BadRequestException(
        "Base64 encoded images are not allowed. Use the image upload endpoint first."
      );
    }

    // Get question and verify access
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw AppException.notFound(ErrorCode.QUESTION_NOT_FOUND);
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: question.examId },
    });

    const isCreator = exam?.createdById === req.user.id;
    const isAdmin =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin) {
      throw AppException.forbidden(ErrorCode.FORBIDDEN);
    }

    // Update question with image URL
    const updatedQuestion = await this.prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        imageUrl: body.imageUrl,
      },
    });

    return updatedQuestion;
  }
}
