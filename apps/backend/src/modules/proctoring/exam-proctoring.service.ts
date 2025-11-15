import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { FaceRecognitionService } from "../face-recognition/face-recognition.service";
import {
  StartExamProctoringDto,
  MonitorExamDto,
  EndExamProctoringDto,
} from "./dto/proctoring.dto";
import {
  ProctoringEventType,
  SeverityLevel,
  AttemptStatus,
} from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class ExamProctoringService {
  private readonly logger = new Logger(ExamProctoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly faceRecognitionService: FaceRecognitionService
  ) {}

  /** Start exam proctoring: verify identity, create attempt, and start AIS monitoring. */
  async startExamProctoring(dto: StartExamProctoringDto) {
    this.logger.log(
      `Starting exam proctoring for student ${dto.studentId}, exam ${dto.examId}`
    );

    // Find the exam
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });

    if (!exam) {
      throw AppException.notFound(
        ErrorCode.EXAM_NOT_FOUND,
        `Exam with ID ${dto.examId} not found`
      );
    }

    // Verify student is enrolled (only if exam is class-specific)
    if (exam.classId) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          studentId: dto.studentId,
          classId: exam.classId,
        },
      });

      if (!enrollment) {
        throw AppException.notFound(
          ErrorCode.ENROLLMENT_NOT_FOUND,
          `Student ${dto.studentId} is not enrolled in the class for exam ${exam.title}`
        );
      }
    }

    // Get the next attempt number for this student
    const existingAttempts = await this.prisma.examAttempt.count({
      where: {
        examId: exam.id,
        studentId: dto.studentId,
      },
    });

    // Create exam attempt record
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: dto.studentId,
        attemptNumber: existingAttempts + 1,
        startedAt: new Date(),
        status: AttemptStatus.IN_PROGRESS,
        maxScore: exam.totalMarks,
      },
    });

    // Start face recognition and AI monitoring
    try {
      const monitoringResult =
        await this.faceRecognitionService.startExamSession(
          attempt.id,
          dto.studentId,
          exam.id,
          dto.image
        );

      // Store AI session ID in monitoringData as JSON string
      const monitoringData = JSON.stringify({
        aiSessionId: monitoringResult.aiSessionId,
        similarity: monitoringResult.similarity,
        threshold: monitoringResult.threshold,
        startedAt: new Date().toISOString(),
      });

      await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          monitoringData,
          faceVerificationScore: monitoringResult.similarity,
        },
      });

      return {
        success: true,
        message: "Exam proctoring started successfully",
        attemptId: attempt.id,
        aiSessionId: monitoringResult.aiSessionId,
        similarity: monitoringResult.similarity,
      };
    } catch (error) {
      const err = error as Error & { response?: { data?: unknown } };
      // Delete the attempt if monitoring fails
      await this.prisma.examAttempt.delete({
        where: { id: attempt.id },
      });

      return {
        success: false,
        message: err.message || "Failed to start exam monitoring",
        error: err.response?.data,
      };
    }
  }

  /**
   * Monitor exam session periodically
   * - Should be called every 5-10 seconds from frontend
   * - Captures video frame and sends to AI service
   * - Logs incidents automatically
   */
  async monitorExamSession(dto: MonitorExamDto) {
    this.logger.debug(`Monitoring exam session for attempt ${dto.attemptId}`);

    // Get attempt
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: dto.attemptId },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        `Exam attempt ${dto.attemptId} not found`
      );
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return {
        success: false,
        message: `Exam attempt is not in progress (status: ${attempt.status})`,
      };
    }

    // Get AI session ID from monitoringData
    let aiSessionId = dto.aiSessionId;
    if (!aiSessionId && attempt.monitoringData) {
      try {
        const monitoringData = JSON.parse(attempt.monitoringData);
        aiSessionId = Number(monitoringData.aiSessionId);
      } catch (error) {
        this.logger.error("Failed to parse monitoringData:", error);
      }
    }

    if (!aiSessionId) {
      throw AppException.notFound(
        ErrorCode.PROCTORING_SESSION_NOT_FOUND,
        "AI session ID not found for this exam attempt"
      );
    }

    // Monitor via face recognition service
    const result = await this.faceRecognitionService.monitorExamSession(
      dto.attemptId,
      aiSessionId,
      dto.image
    );

    // If session is locked, update attempt status
    if (result.sessionLocked) {
      await this.prisma.examAttempt.update({
        where: { id: dto.attemptId },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedReason: "Too many suspicious activities detected",
          suspiciousActivityCount: { increment: 1 },
        },
      });
    } else if (result.incidentsCount > 0) {
      // Increment suspicious activity count
      await this.prisma.examAttempt.update({
        where: { id: dto.attemptId },
        data: {
          suspiciousActivityCount: { increment: result.incidentsCount },
        },
      });
    }

    return result;
  }

  /**
   * End exam proctoring session
   * - Finalizes exam attempt
   * - Stops AI monitoring
   */
  async endExamProctoring(dto: EndExamProctoringDto) {
    this.logger.log(`Ending exam proctoring for attempt ${dto.attemptId}`);

    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: dto.attemptId },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        `Exam attempt ${dto.attemptId} not found`
      );
    }

    // Get AI session ID from monitoringData
    let aiSessionId: number | null = null;
    if (attempt.monitoringData) {
      try {
        const monitoringData = JSON.parse(attempt.monitoringData);
        aiSessionId = monitoringData.aiSessionId;
      } catch (error) {
        this.logger.error("Failed to parse monitoringData:", error);
      }
    }

    if (aiSessionId) {
      try {
        // End AI monitoring session
        await this.faceRecognitionService.endExamSession(aiSessionId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(`Failed to end AI session: ${message}`);
      }
    }

    // Map status string to AttemptStatus enum
    let status: AttemptStatus = AttemptStatus.GRADED;
    if (dto.status === "SUBMITTED") {
      status = AttemptStatus.SUBMITTED;
    } else if (dto.status === "FLAGGED") {
      status = AttemptStatus.FLAGGED;
    }

    // Update attempt status
    await this.prisma.examAttempt.update({
      where: { id: dto.attemptId },
      data: {
        submittedAt: new Date(),
        status,
      },
    });

    return {
      success: true,
      message: "Exam proctoring ended successfully",
    };
  }

  /**
   * Unlock exam session (admin/teacher only)
   * - Used when student is falsely locked out
   * - Requires manual review
   */
  async unlockExamSession(attemptId: string) {
    this.logger.log(`Unlocking exam session for attempt ${attemptId}`);

    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        `Exam attempt ${attemptId} not found`
      );
    }

    // Get AI session ID from monitoringData
    let aiSessionId: number | null = null;
    if (attempt.monitoringData) {
      try {
        const monitoringData = JSON.parse(attempt.monitoringData);
        aiSessionId = monitoringData.aiSessionId;
      } catch (error) {
        this.logger.error("Failed to parse monitoringData:", error);
      }
    }

    if (aiSessionId) {
      try {
        // Unlock in AI service
        await this.faceRecognitionService.unlockExamSession(aiSessionId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(`Failed to unlock AI session: ${message}`);
      }
    }

    // Update attempt status
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        isLocked: false,
        status: AttemptStatus.IN_PROGRESS,
        unlockedAt: new Date(),
      },
    });

    // Log unlock event
    await this.prisma.proctoringLog.create({
      data: {
        attemptId,
        eventType: ProctoringEventType.FACE_DETECTED,
        severity: SeverityLevel.INFO,
        description: "Session manually unlocked by admin/teacher",
        metadata: {
          action: "manual_unlock",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: "Exam session unlocked successfully",
    };
  }

  /**
   * Get proctoring logs for an exam attempt
   */
  async getProctoringLogs(attemptId: string) {
    const logs = await this.prisma.proctoringLog.findMany({
      where: { attemptId },
      orderBy: { timestamp: "desc" },
    });

    return logs;
  }

  /**
   * Get proctoring summary for an exam attempt
   */
  async getProctoringReport(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        `Exam attempt ${attemptId} not found`
      );
    }

    const logs = await this.getProctoringLogs(attemptId);

    // Count incidents by severity
    const severityCounts = logs.reduce(
      (acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Count incidents by type
    const typeCounts = logs.reduce(
      (acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        isLocked: attempt.isLocked,
        suspiciousActivityCount: attempt.suspiciousActivityCount,
        student: {
          name: `${attempt.student.firstName} ${attempt.student.lastName}`,
          email: attempt.student.email,
        },
        exam: {
          id: attempt.exam.id,
          title: attempt.exam.title,
        },
      },
      summary: {
        totalIncidents: logs.length,
        severityCounts,
        typeCounts,
        wasLocked: attempt.isLocked,
      },
      logs: logs.slice(0, 50), // Return last 50 logs
    };
  }
}
