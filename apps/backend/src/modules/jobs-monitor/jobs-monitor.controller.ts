import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JobsMonitorService } from "./jobs-monitor.service";

@ApiTags("Jobs Monitor")
@ApiBearerAuth()
@Controller("system/jobs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsMonitorController {
  constructor(private readonly jobsMonitorService: JobsMonitorService) {}

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get job statistics across all queues" })
  async getJobsStats() {
    return this.jobsMonitorService.getJobsStats();
  }

  @Get("queues")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get status of all queues" })
  async getAllQueuesStatus() {
    return this.jobsMonitorService.getAllQueuesStatus();
  }

  @Get("queues/:queueName")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get status of a specific queue" })
  async getQueueStatus(@Param("queueName") queueName: string) {
    return this.jobsMonitorService.getQueueStatus(queueName);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get jobs by status" })
  async getJobs(@Query("status") status: string = "active") {
    return this.jobsMonitorService.getAllJobs(status);
  }

  @Get(":queueName/:jobId")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get job details by ID" })
  async getJobById(
    @Param("queueName") queueName: string,
    @Param("jobId") jobId: string
  ) {
    return this.jobsMonitorService.getJobById(queueName, jobId);
  }

  @Post(":queueName/:jobId/retry")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Retry a specific failed job" })
  async retryJob(
    @Param("queueName") queueName: string,
    @Param("jobId") jobId: string
  ) {
    return this.jobsMonitorService.retryJob(queueName, jobId);
  }

  @Post("retry-all-failed")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Retry all failed jobs across all queues" })
  async retryAllFailed() {
    return this.jobsMonitorService.retryAllFailed();
  }

  @Delete(":queueName/:jobId")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Remove a specific job" })
  async removeJob(
    @Param("queueName") queueName: string,
    @Param("jobId") jobId: string
  ) {
    return this.jobsMonitorService.removeJob(queueName, jobId);
  }

  @Delete("failed/clean")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Clean old failed jobs" })
  async cleanFailedJobs(@Query("grace") grace?: number) {
    return this.jobsMonitorService.cleanFailedJobs(grace);
  }

  @Patch("queues/:queueName/pause")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Pause a specific queue" })
  async pauseQueue(@Param("queueName") queueName: string) {
    return this.jobsMonitorService.pauseQueue(queueName);
  }

  @Patch("queues/:queueName/resume")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Resume a paused queue" })
  async resumeQueue(@Param("queueName") queueName: string) {
    return this.jobsMonitorService.resumeQueue(queueName);
  }
}
