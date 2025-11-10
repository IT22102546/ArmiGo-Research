import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance, AxiosError } from "axios";
import FormData from "form-data";
import { PrismaService } from "@/database/prisma.service";
import { ProctoringEventType, SeverityLevel } from "@prisma/client";
import {
  FaceRegistrationResponse,
  FaceRegistrationVideoResponse,
  AddEmbeddingResponse,
  FaceVerificationResponse,
  ExamSessionStartResponse,
  ExamSessionEndResponse,
  ExamSessionUnlockResponse,
  PythonApiError,
} from "./types/python-api.types";

export interface ExamMonitoringResult {
  success: boolean;
  issues: string[];
  incidentsCount: number;
  sessionLocked: boolean;
  status?: string;
  warnings?: string[];
}

export interface FaceRegistrationResult {
  status: string;
  student_id: number;
  bbox: number[];
  similarity?: number;
}

export interface FaceVerificationResult {
  status: "allowed" | "rejected";
  student_id?: number;
  name?: string;
  similarity: number;
  threshold: number;
  bbox: number[];
  reason?: string;
}

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private readonly aiServiceClient: AxiosInstance;
  private readonly aiServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.aiServiceUrl =
      this.configService.get<string>("AI_SERVICE_URL") ||
      "http://localhost:8000";

    this.aiServiceClient = axios.create({
      baseURL: this.aiServiceUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    this.logger.log(
      `Face Recognition Service initialized with AI Service URL: ${this.aiServiceUrl}`
    );
  }

  /**
   * Register a student's face for recognition
   * Used during student profile creation
   */
  async registerStudentFace(
    userId: string,
    imageBuffer: Buffer,
    metadata?: {
      name: string;
      email?: string;
      roll_number?: string;
    }
  ): Promise<FaceRegistrationResult> {
    try {
      const formData = new FormData();
      formData.append("name", metadata?.name || userId);
      if (metadata?.email) {formData.append("email", metadata.email);}
      if (metadata?.roll_number)
        {formData.append("roll_number", metadata.roll_number);}
      formData.append("image", imageBuffer, {
        filename: "face.jpg",
        contentType: "image/jpeg",
      });

      const response = await this.aiServiceClient.post<FaceRegistrationResult>(
        "/students/register",
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      // Store face recognition data in our database
      await this.prisma.faceRecognition.upsert({
        where: { userId },
        create: {
          userId,
          faceEncodingData: JSON.stringify(response.data),
          verified: true,
          verifiedAt: new Date(),
          metadata: {
            aiServiceStudentId: response.data.student_id,
            bbox: response.data.bbox,
          },
        },
        update: {
          faceEncodingData: JSON.stringify(response.data),
          verified: true,
          verifiedAt: new Date(),
          lastVerifiedAt: new Date(),
          metadata: {
            aiServiceStudentId: response.data.student_id,
            bbox: response.data.bbox,
          },
        },
      });

      this.logger.log(
        `Face registered successfully for user ${userId}, AI Student ID: ${response.data.student_id}`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to register face for user ${userId}: ${axiosError.message}`
      );
      throw new HttpException(
        `Face registration failed: ${axiosError.response?.data?.detail || axiosError.message}`,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Register a student's face using video
   * More accurate as it can extract the best frame
   */
  async registerStudentFaceFromVideo(
    userId: string,
    videoBuffer: Buffer,
    metadata?: {
      name: string;
      email?: string;
      roll_number?: string;
    }
  ): Promise<FaceRegistrationResult> {
    try {
      const formData = new FormData();
      formData.append("name", metadata?.name || userId);
      if (metadata?.email) {formData.append("email", metadata.email);}
      if (metadata?.roll_number)
        {formData.append("roll_number", metadata.roll_number);}
      formData.append("video", videoBuffer, {
        filename: "face_video.mp4",
        contentType: "video/mp4",
      });

      const response = await this.aiServiceClient.post<FaceRegistrationResult>(
        "/students/register_video",
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      // Store face recognition data
      await this.prisma.faceRecognition.upsert({
        where: { userId },
        create: {
          userId,
          faceEncodingData: JSON.stringify(response.data),
          verificationVideo: "stored_in_ai_service",
          verified: true,
          verifiedAt: new Date(),
          metadata: {
            aiServiceStudentId: response.data.student_id,
            bbox: response.data.bbox,
            source: "video",
          },
        },
        update: {
          faceEncodingData: JSON.stringify(response.data),
          verificationVideo: "stored_in_ai_service",
          verified: true,
          verifiedAt: new Date(),
          lastVerifiedAt: new Date(),
          metadata: {
            aiServiceStudentId: response.data.student_id,
            bbox: response.data.bbox,
            source: "video",
          },
        },
      });

      this.logger.log(
        `Face registered from video for user ${userId}, AI Student ID: ${response.data.student_id}`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to register face from video for user ${userId}: ${axiosError.message}`
      );
      throw new HttpException(
        `Face video registration failed: ${axiosError.response?.data?.detail || axiosError.message}`,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Add additional face embedding for a student (multi-angle)
   */
  async addFaceEmbedding(
    userId: string,
    imageBuffer: Buffer
  ): Promise<FaceRegistrationResult> {
    try {
      const faceData = await this.prisma.faceRecognition.findUnique({
        where: { userId },
      });

      if (!faceData) {
        throw new HttpException(
          "User face not registered. Please register first.",
          HttpStatus.NOT_FOUND
        );
      }

      const aiStudentId = (faceData.metadata as any)?.aiServiceStudentId;
      if (!aiStudentId) {
        throw new HttpException(
          "AI Service student ID not found",
          HttpStatus.BAD_REQUEST
        );
      }

      const formData = new FormData();
      formData.append("image", imageBuffer, {
        filename: "face_additional.jpg",
        contentType: "image/jpeg",
      });

      const response = await this.aiServiceClient.post<FaceRegistrationResult>(
        `/students/${aiStudentId}/add-embedding`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      this.logger.log(`Additional face embedding added for user ${userId}`);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to add face embedding for user ${userId}: ${axiosError.message}`
      );
      throw new HttpException(
        `Add face embedding failed: ${axiosError.response?.data?.detail || axiosError.message}`,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify a face for attendance or access control
   */
  async verifyFace(
    imageBuffer: Buffer,
    className?: string,
    sessionId?: string
  ): Promise<FaceVerificationResult> {
    try {
      const formData = new FormData();
      if (className) {formData.append("class_name", className);}
      if (sessionId) {formData.append("session_id", sessionId);}
      formData.append("image", imageBuffer, {
        filename: "verify.jpg",
        contentType: "image/jpeg",
      });

      const response = await this.aiServiceClient.post<FaceVerificationResult>(
        "/attendance/mark",
        formData,
        {
          headers: formData.getHeaders(),
          validateStatus: (status) => status < 500, // Accept 403 as valid response
        }
      );

      if (response.data.status === "allowed") {
        this.logger.log(
          `Face verified successfully: Student ${response.data.student_id}, Similarity: ${response.data.similarity}`
        );
      } else {
        this.logger.warn(
          `Face verification rejected: ${response.data.reason}, Similarity: ${response.data.similarity}`
        );
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(`Face verification failed: ${axiosError.message}`);
      throw new HttpException(
        `Face verification failed: ${axiosError.response?.data?.detail || axiosError.message}`,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Start an exam session with face verification
   */
  async startExamSession(
    attemptId: string,
    studentId: string,
    examCode: string,
    imageBuffer: Buffer
  ): Promise<{
    aiSessionId: number;
    similarity: number;
    threshold: number;
  }> {
    try {
      const faceData = await this.prisma.faceRecognition.findUnique({
        where: { userId: studentId },
      });

      if (!faceData) {
        throw new HttpException(
          "Face not registered for this student",
          HttpStatus.BAD_REQUEST
        );
      }

      const aiStudentId = (faceData.metadata as any)?.aiServiceStudentId;

      const formData = new FormData();
      formData.append("student_id", aiStudentId.toString());
      formData.append("exam_code", examCode);
      formData.append("image", imageBuffer, {
        filename: "exam_start.jpg",
        contentType: "image/jpeg",
      });

      const response = await this.aiServiceClient.post(
        "/exam/start",
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      this.logger.log(
        `Exam session started for attempt ${attemptId}, AI Session: ${response.data.session_id}`
      );

      return {
        aiSessionId: response.data.session_id,
        similarity: response.data.similarity,
        threshold: response.data.threshold,
      };
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to start exam session for attempt ${attemptId}: ${axiosError.message}`
      );
      throw new HttpException(
        `Exam session start failed: ${axiosError.response?.data?.detail || axiosError.message}`,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Monitor exam session for cheating detection
   * This should be called periodically (e.g., every 5-10 seconds)
   */
  async monitorExamSession(
    attemptId: string,
    aiSessionId: number,
    imageBuffer: Buffer
  ): Promise<ExamMonitoringResult> {
    try {
      const formData = new FormData();
      formData.append("session_id", aiSessionId.toString());
      formData.append("image", imageBuffer, {
        filename: "exam_monitor.jpg",
        contentType: "image/jpeg",
      });

      const response = await this.aiServiceClient.post<any>(
        "/exam/monitor",
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      const issues = response.data.issues || [];
      const sessionLocked = response.data.status === "locked";

      // Log proctoring events to our database
      if (sessionLocked) {
        await this.logProctoringEvent(
          attemptId,
          ProctoringEventType.SUSPICIOUS_ACTIVITY,
          SeverityLevel.CRITICAL,
          response.data.reason || "Session locked due to suspicious activity"
        );
      }

      return {
        success: true,
        issues,
        incidentsCount: issues.length,
        sessionLocked,
      };
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Exam monitoring failed for attempt ${attemptId}: ${axiosError.message}`
      );
      // Don't throw error to avoid disrupting exam, just log
      return {
        success: false,
        issues: [],
        incidentsCount: 0,
        sessionLocked: false,
      };
    }
  }

  /**
   * End exam session
   */
  async endExamSession(aiSessionId: number): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("session_id", aiSessionId.toString());

      await this.aiServiceClient.post("/exam/end", formData, {
        headers: formData.getHeaders(),
      });

      this.logger.log(`Exam session ${aiSessionId} ended successfully`);
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to end exam session ${aiSessionId}: ${axiosError.message}`
      );
      // Don't throw, just log
    }
  }

  /**
   * Unlock an exam session (manual intervention)
   */
  async unlockExamSession(aiSessionId: number): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("session_id", aiSessionId.toString());

      await this.aiServiceClient.post("/exam/unlock", formData, {
        headers: formData.getHeaders(),
      });

      this.logger.log(`Exam session ${aiSessionId} unlocked successfully`);
    } catch (error) {
      const axiosError = error as AxiosError<PythonApiError>;
      this.logger.error(
        `Failed to unlock exam session ${aiSessionId}: ${axiosError.message}`
      );
      throw new HttpException(
        `Failed to unlock exam session`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Log proctoring event to database
   */
  private async logProctoringEvent(
    attemptId: string,
    eventType: string,
    severity: "INFO" | "WARNING" | "CRITICAL",
    description?: string
  ): Promise<void> {
    try {
      await this.prisma.proctoringLog.create({
        data: {
          attemptId,
          eventType: eventType as any,
          severity: severity as any,
          description,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to log proctoring event: ${err.message}`);
    }
  }

  /**
   * Map AI service reasons to proctoring event types
   */
  private mapReasonToEventType(reason?: string): string {
    if (!reason) {return "SUSPICIOUS_ACTIVITY";}

    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes("no face")) {return "FACE_NOT_DETECTED";}
    if (lowerReason.includes("multiple face")) {return "MULTIPLE_FACES";}
    if (lowerReason.includes("mismatch")) {return "SUSPICIOUS_ACTIVITY";}
    if (lowerReason.includes("looking away")) {return "SUSPICIOUS_ACTIVITY";}
    return "SUSPICIOUS_ACTIVITY";
  }

  /**
   * Get face recognition data for a user
   */
  async getFaceRecognitionData(userId: string) {
    return this.prisma.faceRecognition.findUnique({
      where: { userId },
    });
  }

  /**
   * Check if user has registered face
   */
  async hasFaceRegistered(userId: string): Promise<boolean> {
    const faceData = await this.prisma.faceRecognition.findUnique({
      where: { userId },
      select: { verified: true },
    });
    return faceData?.verified || false;
  }

  /**
   * Delete face recognition data
   */
  async deleteFaceRecognition(userId: string): Promise<void> {
    await this.prisma.faceRecognition.delete({
      where: { userId },
    });
    this.logger.log(`Face recognition data deleted for user ${userId}`);
  }
}
