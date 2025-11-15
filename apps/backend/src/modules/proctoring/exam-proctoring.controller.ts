import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ExamProctoringService } from "./exam-proctoring.service";
import {
  StartExamProctoringDto,
  MonitorExamDto,
  EndExamProctoringDto,
} from "./dto/proctoring.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Exam Proctoring")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("exam-proctoring")
export class ExamProctoringController {
  constructor(private readonly examProctoringService: ExamProctoringService) {}

  @Post("start")
  @Roles(UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT)
  @ApiOperation({
    summary: "Start exam proctoring session",
    description:
      "Starts AI-powered exam monitoring with face verification. Creates exam attempt and initializes monitoring session.",
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("image"))
  async startProctoring(
    @Body() dto: StartExamProctoringDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.examProctoringService.startExamProctoring({
      ...dto,
      image: file,
    });
  }

  @Post("monitor")
  @Roles(UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT)
  @ApiOperation({
    summary: "Monitor exam session",
    description:
      "Periodic monitoring endpoint called every 5-10 seconds during exam. Detects cheating behaviors and logs incidents.",
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("image"))
  async monitorSession(
    @Body() dto: MonitorExamDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.examProctoringService.monitorExamSession({
      ...dto,
      image: file,
    });
  }

  @Post("end")
  @Roles(
    UserRole.INTERNAL_STUDENT,
    UserRole.EXTERNAL_STUDENT,
    UserRole.INTERNAL_TEACHER,
    UserRole.ADMIN
  )
  @ApiOperation({
    summary: "End exam proctoring session",
    description:
      "Finalizes exam attempt and stops AI monitoring. Can be called by student (submit) or teacher/admin (force end).",
  })
  async endProctoring(@Body() dto: EndExamProctoringDto) {
    return this.examProctoringService.endExamProctoring(dto);
  }

  @Patch("unlock/:attemptId")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Unlock exam session",
    description:
      "Manually unlock a locked exam session. Requires teacher/admin review. Used for false positives.",
  })
  async unlockSession(@Param("attemptId") attemptId: string) {
    return this.examProctoringService.unlockExamSession(attemptId);
  }

  @Get("logs/:attemptId")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Get proctoring logs for exam attempt",
    description:
      "Retrieves all proctoring incidents and events for a specific exam attempt.",
  })
  async getLogs(@Param("attemptId") attemptId: string) {
    return this.examProctoringService.getProctoringLogs(attemptId);
  }

  @Get("report/:attemptId")
  @Roles(UserRole.INTERNAL_TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Get proctoring report",
    description:
      "Generates comprehensive proctoring report with incident summary and analysis.",
  })
  async getReport(@Param("attemptId") attemptId: string) {
    return this.examProctoringService.getProctoringReport(attemptId);
  }
}
