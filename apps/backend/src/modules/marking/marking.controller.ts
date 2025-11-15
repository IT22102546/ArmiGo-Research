import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MarkingService } from "./marking.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { GetUser } from "../../common/decorators/get-user.decorator";

@Controller("marking")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarkingController {
  constructor(private readonly markingService: MarkingService) {}

  @Post(":answerId/mark")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async markAnswer(
    @Param("answerId") answerId: string,
    @Body() markData: { pointsAwarded: number; feedback?: string },
    @GetUser() user: any
  ) {
    return this.markingService.markAnswer(answerId, markData, user.id);
  }

  @Get("exam/:examId/questions")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async getQuestionsForMarking(
    @Param("examId") examId: string,
    @GetUser() user: any
  ) {
    return this.markingService.getQuestionsForMarking(examId, user);
  }

  @Get("exam/:examId/question/:questionId/answers")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async getQuestionAnswers(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @GetUser() user: any
  ) {
    return this.markingService.getQuestionAnswers(examId, questionId, user);
  }

  @Get("exam/:examId/progress")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async getMarkingProgress(
    @Param("examId") examId: string,
    @GetUser() user: any
  ) {
    return this.markingService.getMarkingProgress(examId, user);
  }

  @Post("exam/:examId/auto-assign")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async autoAssignMarks(
    @Param("examId") examId: string,
    @Body() data: { questionId: string; strategy: "ZERO" | "FULL" },
    @GetUser() user: any
  ) {
    return this.markingService.autoAssignMarks(
      examId,
      data.questionId,
      data.strategy,
      user
    );
  }

  @Post("exam/:examId/calculate-marks")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async calculateFinalMarks(
    @Param("examId") examId: string,
    @GetUser() user: any
  ) {
    return this.markingService.calculateFinalMarks(examId, user);
  }

  @Post("exam/:examId/publish")
  @Roles("ADMIN", "SUPER_ADMIN", "INTERNAL_TEACHER")
  async publishResults(@Param("examId") examId: string, @GetUser() user: any) {
    return this.markingService.publishResults(examId, user);
  }
}
