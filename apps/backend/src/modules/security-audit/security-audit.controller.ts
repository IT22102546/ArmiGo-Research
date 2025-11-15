import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import { SecurityAuditService } from "./security-audit.service";
import { SecurityAuditFiltersDto } from "./dto";

@ApiTags("Security Audit")
@Controller("security-audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Get()
  @ApiOperation({
    summary: "Get all security audit logs",
    description:
      "Retrieves all security audit logs with filtering - Admin only",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 50,
  })
  @ApiQuery({
    name: "action",
    required: false,
    description: "Filter by action type",
  })
  @ApiQuery({
    name: "success",
    required: false,
    description: "Filter by success status",
  })
  @ApiQuery({
    name: "riskScoreMin",
    required: false,
    description: "Minimum risk score (0-100)",
  })
  @ApiQuery({
    name: "riskScoreMax",
    required: false,
    description: "Maximum risk score (0-100)",
  })
  @ApiQuery({
    name: "ipAddress",
    required: false,
    description: "Filter by IP address",
  })
  @ApiQuery({
    name: "resource",
    required: false,
    description: "Filter by resource type",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    description: "Filter by user ID",
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    description: "Start date (ISO format)",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    description: "End date (ISO format)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search in resource or error message",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Security audit logs retrieved successfully",
  })
  async getAll(@Query() filters: SecurityAuditFiltersDto) {
    return this.securityAuditService.getAll(filters);
  }

  @Get("stats")
  @ApiOperation({
    summary: "Get security audit statistics",
    description: "Retrieves overall security audit statistics - Admin only",
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    description: "Start date (ISO format)",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    description: "End date (ISO format)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Statistics retrieved successfully",
  })
  async getStats(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.securityAuditService.getStats({ dateFrom, dateTo });
  }

  @Get("high-risk")
  @ApiOperation({
    summary: "Get high-risk security audit logs",
    description:
      "Retrieves security audit logs with high risk scores (70+) - Admin only",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 50,
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    description: "Start date (ISO format)",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    description: "End date (ISO format)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "High-risk logs retrieved successfully",
  })
  async getHighRisk(@Query() filters: SecurityAuditFiltersDto) {
    return this.securityAuditService.getHighRisk(filters);
  }

  @Get("user/:userId")
  @ApiOperation({
    summary: "Get security audit logs for a specific user",
    description:
      "Retrieves all security audit logs for a specific user - Admin only",
  })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User security audit logs retrieved successfully",
  })
  async getUserLogs(
    @Param("userId") userId: string,
    @Query() filters: SecurityAuditFiltersDto
  ) {
    return this.securityAuditService.getUserLogs(userId, filters);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get security audit log detail",
    description:
      "Retrieves detailed information for a specific security audit log - Admin only",
  })
  @ApiParam({ name: "id", description: "Security audit log ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Security audit log detail retrieved successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Security audit log not found",
  })
  async getDetail(@Param("id") id: string) {
    return this.securityAuditService.getDetail(id);
  }
}
