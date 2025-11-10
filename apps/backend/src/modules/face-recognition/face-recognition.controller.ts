import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { FaceRecognitionService } from "./face-recognition.service";
import {
  RegisterFaceDto,
  VerifyFaceDto,
  StartExamMonitoringDto,
  MonitorExamDto,
  UnlockExamSessionDto,
  AddFaceEmbeddingDto,
  FaceRegistrationResponseDto,
  FaceVerificationResponseDto,
  ExamMonitoringResponseDto,
  StartExamResponseDto,
} from "./dto/face-recognition.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Face Recognition")
@Controller("face-recognition")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FaceRecognitionController {
  constructor(
    private readonly faceRecognitionService: FaceRecognitionService
  ) {}

  @Post("register")
  @ApiOperation({
    summary: "Register student face with image",
    description:
      "Register a student face for recognition system using a single image",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["userId", "name", "image"],
      properties: {
        userId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        rollNumber: { type: "string" },
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Face registered successfully",
    type: FaceRegistrationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "No face detected or invalid image",
  })
  @UseInterceptors(FileInterceptor("image"))
  @Roles("ADMIN", "TEACHER", "STUDENT")
  async registerFace(
    @Body() dto: RegisterFaceDto,
    @UploadedFile() image: Express.Multer.File
  ): Promise<FaceRegistrationResponseDto> {
    if (!image) {
      throw new HttpException("Image file is required", HttpStatus.BAD_REQUEST);
    }

    const result = await this.faceRecognitionService.registerStudentFace(
      dto.userId,
      image.buffer,
      {
        name: dto.name,
        email: dto.email,
        roll_number: dto.rollNumber,
      }
    );

    return {
      status: result.status,
      aiStudentId: result.student_id,
      bbox: result.bbox,
      similarity: result.similarity,
    };
  }

  @Post("register-video")
  @ApiOperation({
    summary: "Register student face with video",
    description:
      "Register a student face using video (extracts best frame automatically)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["userId", "name", "video"],
      properties: {
        userId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        rollNumber: { type: "string" },
        video: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Face registered from video successfully",
    type: FaceRegistrationResponseDto,
  })
  @UseInterceptors(FileInterceptor("video"))
  @Roles("ADMIN", "TEACHER", "STUDENT")
  async registerFaceFromVideo(
    @Body() dto: RegisterFaceDto,
    @UploadedFile() video: Express.Multer.File
  ): Promise<FaceRegistrationResponseDto> {
    if (!video) {
      throw new HttpException("Video file is required", HttpStatus.BAD_REQUEST);
    }

    const result =
      await this.faceRecognitionService.registerStudentFaceFromVideo(
        dto.userId,
        video.buffer,
        {
          name: dto.name,
          email: dto.email,
          roll_number: dto.rollNumber,
        }
      );

    return {
      status: result.status,
      aiStudentId: result.student_id,
      bbox: result.bbox,
      similarity: result.similarity,
    };
  }

  @Post("add-embedding")
  @ApiOperation({
    summary: "Add additional face embedding",
    description:
      "Add an additional face angle/embedding for better recognition accuracy",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["userId", "image"],
      properties: {
        userId: { type: "string" },
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Embedding added successfully" })
  @UseInterceptors(FileInterceptor("image"))
  @Roles("ADMIN", "TEACHER", "STUDENT")
  async addEmbedding(
    @Body() dto: AddFaceEmbeddingDto,
    @UploadedFile() image: Express.Multer.File
  ): Promise<FaceRegistrationResponseDto> {
    if (!image) {
      throw new HttpException("Image file is required", HttpStatus.BAD_REQUEST);
    }

    const result = await this.faceRecognitionService.addFaceEmbedding(
      dto.userId,
      image.buffer
    );

    return {
      status: result.status,
      aiStudentId: result.student_id,
      bbox: result.bbox,
      similarity: result.similarity,
    };
  }

  @Post("verify")
  @ApiOperation({
    summary: "Verify face for attendance or access",
    description:
      "Verify a face against registered students for attendance marking",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["image"],
      properties: {
        className: { type: "string" },
        sessionId: { type: "string" },
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Face verification result",
    type: FaceVerificationResponseDto,
  })
  @UseInterceptors(FileInterceptor("image"))
  @Roles("ADMIN", "TEACHER")
  async verifyFace(
    @Body() dto: VerifyFaceDto,
    @UploadedFile() image: Express.Multer.File
  ): Promise<FaceVerificationResponseDto> {
    if (!image) {
      throw new HttpException("Image file is required", HttpStatus.BAD_REQUEST);
    }

    return await this.faceRecognitionService.verifyFace(
      image.buffer,
      dto.className,
      dto.sessionId
    );
  }

  @Post("exam/start")
  @ApiOperation({
    summary: "Start exam monitoring session",
    description: "Start AI-powered exam proctoring with face verification",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["attemptId", "studentId", "examCode", "image"],
      properties: {
        attemptId: { type: "string" },
        studentId: { type: "string" },
        examCode: { type: "string" },
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Exam monitoring started",
    type: StartExamResponseDto,
  })
  @UseInterceptors(FileInterceptor("image"))
  @Roles("STUDENT")
  async startExamMonitoring(
    @Body() dto: StartExamMonitoringDto,
    @UploadedFile() image: Express.Multer.File
  ): Promise<StartExamResponseDto> {
    if (!image) {
      throw new HttpException("Image file is required", HttpStatus.BAD_REQUEST);
    }

    const result = await this.faceRecognitionService.startExamSession(
      dto.attemptId,
      dto.studentId,
      dto.examCode,
      image.buffer
    );

    return {
      status: "started",
      attemptId: dto.attemptId,
      aiSessionId: result.aiSessionId,
      similarity: result.similarity,
      threshold: result.threshold,
    };
  }

  @Post("exam/monitor")
  @ApiOperation({
    summary: "Monitor ongoing exam session",
    description:
      "Continuous monitoring for cheating detection (call every 5-10 seconds)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["attemptId", "aiSessionId", "image"],
      properties: {
        attemptId: { type: "string" },
        aiSessionId: { type: "number" },
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Monitoring result",
    type: ExamMonitoringResponseDto,
  })
  @UseInterceptors(FileInterceptor("image"))
  @Roles("STUDENT")
  async monitorExam(
    @Body() dto: MonitorExamDto,
    @UploadedFile() image: Express.Multer.File
  ): Promise<ExamMonitoringResponseDto> {
    if (!image) {
      throw new HttpException("Image file is required", HttpStatus.BAD_REQUEST);
    }

    const result = await this.faceRecognitionService.monitorExamSession(
      dto.attemptId,
      dto.aiSessionId,
      image.buffer
    );

    return {
      status: result.sessionLocked ? "locked" : "active",
      aiSessionId: dto.aiSessionId,
      reason: result.issues.length > 0 ? result.issues.join(", ") : undefined,
    };
  }

  @Post("exam/unlock")
  @ApiOperation({
    summary: "Unlock locked exam session",
    description: "Manually unlock exam session (admin/teacher intervention)",
  })
  @ApiResponse({ status: 200, description: "Exam session unlocked" })
  @Roles("ADMIN", "TEACHER")
  async unlockExamSession(@Body() dto: UnlockExamSessionDto): Promise<{
    status: string;
    message: string;
  }> {
    await this.faceRecognitionService.unlockExamSession(dto.aiSessionId);
    return {
      status: "unlocked",
      message: `Exam session ${dto.aiSessionId} unlocked successfully`,
    };
  }

  @Get("status/:userId")
  @ApiOperation({
    summary: "Check face registration status",
    description: "Check if a user has registered face data",
  })
  @ApiResponse({ status: 200, description: "Face registration status" })
  @Roles("ADMIN", "TEACHER", "STUDENT")
  async getFaceRegistrationStatus(@Param("userId") userId: string): Promise<{
    registered: boolean;
    verified: boolean;
    data?: any;
  }> {
    const faceData =
      await this.faceRecognitionService.getFaceRecognitionData(userId);

    if (!faceData) {
      return {
        registered: false,
        verified: false,
      };
    }

    return {
      registered: true,
      verified: faceData.verified,
      data: {
        verifiedAt: faceData.verifiedAt,
        lastVerifiedAt: faceData.lastVerifiedAt,
        failedAttempts: faceData.failedAttempts,
      },
    };
  }

  @Delete(":userId")
  @ApiOperation({
    summary: "Delete face recognition data",
    description: "Remove face data for a user (admin only)",
  })
  @ApiResponse({ status: 200, description: "Face data deleted successfully" })
  @Roles("ADMIN")
  async deleteFaceData(@Param("userId") userId: string): Promise<{
    status: string;
    message: string;
  }> {
    await this.faceRecognitionService.deleteFaceRecognition(userId);
    return {
      status: "deleted",
      message: `Face recognition data deleted for user ${userId}`,
    };
  }
}
