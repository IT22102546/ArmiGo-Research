import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ProctoringService } from "./proctoring.service";

@Controller("proctoring")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProctoringController {
  constructor(private readonly proctoringService: ProctoringService) {}

  @Get("exam/:examId/logs")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INTERNAL_TEACHER)
  async getExamProctoringLogs(
    @Param("examId") examId: string,
    @Request() req: any
  ) {
    return this.proctoringService.getExamProctoringLogs(examId, req.user);
  }

  @Get("exam/:examId/active-attempts")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INTERNAL_TEACHER)
  async getActiveAttempts(
    @Param("examId") examId: string,
    @Request() req: any
  ) {
    return this.proctoringService.getActiveAttempts(examId, req.user);
  }

  @Get("attempt/:attemptId/logs")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INTERNAL_TEACHER)
  async getAttemptProctoringLogs(
    @Param("attemptId") attemptId: string,
    @Request() req: any
  ) {
    return this.proctoringService.getAttemptProctoringLogs(attemptId, req.user);
  }

  @Patch("attempt/:attemptId/flag")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INTERNAL_TEACHER)
  async flagAttempt(
    @Param("attemptId") attemptId: string,
    @Body() body: { reason: string; flagged: boolean },
    @Request() req: any
  ) {
    return this.proctoringService.flagAttempt(
      attemptId,
      body.reason,
      body.flagged,
      req.user
    );
  }

  @Post("student/:studentId/message")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INTERNAL_TEACHER)
  async sendStudentMessage(
    @Param("studentId") studentId: string,
    @Body() body: { message: string; examId: string },
    @Request() req: any
  ) {
    return this.proctoringService.sendStudentMessage(
      studentId,
      body.examId,
      body.message,
      req.user
    );
  }

  @Post("event")
  async createProctoringEvent(
    @Body()
    body: {
      attemptId: string;
      eventType: string;
      severity: string;
      description?: string;
      snapshotUrl?: string;
      faceMatchScore?: number;
      tabSwitchCount?: number;
      suspiciousActions?: string[];
      metadata?: any;
    }
  ) {
    return this.proctoringService.createProctoringEvent(body);
  }
}
