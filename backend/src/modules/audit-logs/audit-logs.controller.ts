import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuditLogsService, AuditLogQueryDto } from "./audit-logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user.enum";
import { AuditAction } from "@prisma/client";

@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Get all audit logs with filtering
   * Admin only
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(
    @Query("userId") userId?: string,
    @Query("action") action?: AuditAction,
    @Query("resource") resource?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const query: AuditLogQueryDto = {
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    };

    return this.auditLogsService.findAll(query);
  }

  /**
   * Get my audit logs (current user)
   */
  @Get("my-activity")
  async getMyActivity(@Request() req, @Query("limit") limit?: string) {
    return this.auditLogsService.findByUser(
      req.user.id,
      limit ? parseInt(limit) : 50
    );
  }

  /**
   * Get recent activity
   * Admin only
   */
  @Get("recent")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRecentActivity(@Query("limit") limit?: string) {
    return this.auditLogsService.getRecentActivity(
      limit ? parseInt(limit) : 100
    );
  }

  /**
   * Get activity statistics
   * Admin only
   */
  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getActivityStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.auditLogsService.getActivityStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * Get audit log by ID
   * Admin only
   */
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@Param("id") id: string) {
    return this.auditLogsService.findOne(id);
  }

  /**
   * Get audit logs for a specific resource
   * Admin only
   */
  @Get("resource/:resource/:resourceId")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findByResource(
    @Param("resource") resource: string,
    @Param("resourceId") resourceId: string,
    @Query("limit") limit?: string
  ) {
    return this.auditLogsService.findByResource(
      resource,
      resourceId,
      limit ? parseInt(limit) : 50
    );
  }
}
