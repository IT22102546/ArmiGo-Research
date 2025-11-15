import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UserRole, ProctoringEventType, SeverityLevel } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class ProctoringService {
  constructor(private prisma: PrismaService) {}

  async getExamProctoringLogs(examId: string, user: any) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        creator: true,
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND, "Exam not found");
    }

    // Check permissions (INTERNAL_TEACHER must be assigned to exam)
    if (
      user.role === UserRole.INTERNAL_TEACHER &&
      exam.createdById !== user.id
    ) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have permission to view this exam"
      );
    }

    // Get all attempts for this exam
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        proctoringLogs: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    // Flatten all proctoring logs
    const logs = attempts.flatMap((attempt) =>
      attempt.proctoringLogs.map((log) => ({
        ...log,
        student: attempt.student,
      }))
    );

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getActiveAttempts(examId: string, user: any) {
    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        creator: true,
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND, "Exam not found");
    }

    // Check permissions
    if (
      user.role === UserRole.INTERNAL_TEACHER &&
      exam.createdById !== user.id
    ) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have permission to view this exam"
      );
    }

    // Get all active attempts (IN_PROGRESS)
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: "IN_PROGRESS",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        proctoringLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    return { attempts };
  }

  async getAttemptProctoringLogs(attemptId: string, user: any) {
    // Get attempt with exam and creator
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            creator: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        proctoringLogs: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        "Exam attempt not found"
      );
    }

    // Check permissions
    if (
      user.role === UserRole.INTERNAL_TEACHER &&
      attempt.exam.createdById !== user.id
    ) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have permission to view this attempt"
      );
    }

    return attempt.proctoringLogs;
  }

  async flagAttempt(
    attemptId: string,
    reason: string,
    flagged: boolean,
    user: any
  ) {
    // Get attempt with exam
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        "Exam attempt not found"
      );
    }

    // Check permissions
    if (
      user.role === UserRole.INTERNAL_TEACHER &&
      attempt.exam.createdById !== user.id
    ) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have permission to flag this attempt"
      );
    }

    // Update attempt monitoringData to include flag
    let currentData: any = {};
    try {
      currentData = attempt.monitoringData
        ? JSON.parse(attempt.monitoringData)
        : {};
    } catch (e) {
      currentData = {};
    }

    const updatedData = {
      ...currentData,
      flagged,
      flaggedBy: user.id,
      flaggedAt: new Date().toISOString(),
      flagReason: reason,
    };

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        monitoringData: JSON.stringify(updatedData),
        flaggedReasons: flagged ? reason : null,
      },
    });

    // Also create a proctoring log entry
    await this.prisma.proctoringLog.create({
      data: {
        attemptId,
        eventType: ProctoringEventType.SUSPICIOUS_ACTIVITY,
        severity: SeverityLevel.CRITICAL,
        description: `Attempt flagged by ${user.firstName} ${user.lastName}: ${reason}`,
      },
    });

    return {
      success: true,
      message: flagged
        ? "Attempt flagged successfully"
        : "Attempt unflagged successfully",
    };
  }

  async sendStudentMessage(
    studentId: string,
    examId: string,
    message: string,
    user: any
  ) {
    // Verify student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw AppException.notFound(
        ErrorCode.STUDENT_NOT_FOUND,
        "Student not found"
      );
    }

    // Verify exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        creator: true,
      },
    });

    if (!exam) {
      throw AppException.notFound(ErrorCode.EXAM_NOT_FOUND, "Exam not found");
    }

    // Check permissions
    if (
      user.role === UserRole.INTERNAL_TEACHER &&
      exam.createdById !== user.id
    ) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You do not have permission to message students for this exam"
      );
    }

    // In a real application, you would send this via WebSocket or notification system
    // For now, we'll just store it in the database (you'll need to create a messages table)
    // As a workaround, we'll create a proctoring log
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: "IN_PROGRESS",
      },
    });

    if (attempt) {
      await this.prisma.proctoringLog.create({
        data: {
          attemptId: attempt.id,
          eventType: ProctoringEventType.SUSPICIOUS_ACTIVITY,
          severity: SeverityLevel.INFO,
          description: `Message from ${user.firstName} ${user.lastName}: ${message}`,
          metadata: {
            type: "MESSAGE",
            from: user.id,
            to: studentId,
            message,
          },
        },
      });
    }

    return {
      success: true,
      message: "Message sent to student",
    };
  }

  async createProctoringEvent(data: {
    attemptId: string;
    eventType: string;
    severity: string;
    description?: string;
    snapshotUrl?: string;
    faceMatchScore?: number;
    tabSwitchCount?: number;
    suspiciousActions?: string[];
    metadata?: any;
  }) {
    // Verify attempt exists
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: data.attemptId },
    });

    if (!attempt) {
      throw AppException.notFound(
        ErrorCode.EXAM_ATTEMPT_NOT_FOUND,
        "Exam attempt not found"
      );
    }

    // Validate event type
    if (!Object.values(ProctoringEventType).includes(data.eventType as any)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_EVENT_TYPE,
        "Invalid event type"
      );
    }

    // Validate severity
    if (!Object.values(SeverityLevel).includes(data.severity as any)) {
      throw AppException.badRequest(
        ErrorCode.INVALID_SEVERITY_LEVEL,
        "Invalid severity level"
      );
    }

    // Create proctoring log
    const log = await this.prisma.proctoringLog.create({
      data: {
        attemptId: data.attemptId,
        eventType: data.eventType as ProctoringEventType,
        severity: data.severity as SeverityLevel,
        description: data.description,
        snapshotUrl: data.snapshotUrl,
        faceMatchScore: data.faceMatchScore,
        tabSwitchCount: data.tabSwitchCount,
        suspiciousActions: data.suspiciousActions,
        metadata: data.metadata,
      },
    });

    return log;
  }
}
