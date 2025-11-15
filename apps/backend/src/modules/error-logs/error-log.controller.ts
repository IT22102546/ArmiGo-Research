import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { ErrorLogService } from "./error-log.service";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole, ErrorLevel } from "@prisma/client";

@ApiTags("Error Logs")
@Controller("system/error-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get all error logs",
    description: "Retrieves system error logs with filtering and pagination",
  })
  @ApiQuery({ name: "level", required: false, enum: ErrorLevel })
  @ApiQuery({ name: "resolved", required: false, type: Boolean })
  @ApiQuery({ name: "dateFrom", required: false, type: String })
  @ApiQuery({ name: "dateTo", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "route", required: false, type: String })
  @ApiQuery({ name: "method", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Error logs retrieved successfully",
  })
  async getErrorLogs(
    @Query("level") level?: ErrorLevel,
    @Query("resolved") resolved?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("search") search?: string,
    @Query("route") route?: string,
    @Query("method") method?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.errorLogService.getErrorLogs({
      level,
      resolved:
        resolved === "true" ? true : resolved === "false" ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search,
      route,
      method,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get error statistics",
    description:
      "Retrieves error log statistics including counts by level and route",
  })
  @ApiQuery({ name: "dateFrom", required: false, type: String })
  @ApiQuery({ name: "dateTo", required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Error statistics retrieved successfully",
  })
  async getErrorStats(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.errorLogService.getErrorStats({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get("grouped")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get grouped errors",
    description:
      "Retrieves errors grouped by message and route with occurrence counts",
  })
  @ApiQuery({ name: "level", required: false, enum: ErrorLevel })
  @ApiQuery({ name: "resolved", required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Grouped errors retrieved successfully",
  })
  async getGroupedErrors(
    @Query("level") level?: ErrorLevel,
    @Query("resolved") resolved?: string
  ) {
    return this.errorLogService.getGroupedErrors({
      level,
      resolved:
        resolved === "true" ? true : resolved === "false" ? false : undefined,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get error log by ID",
    description: "Retrieves detailed information for a specific error log",
  })
  @ApiParam({ name: "id", description: "Error log ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Error log retrieved successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Error log not found",
  })
  async getErrorById(@Param("id") id: string) {
    return this.errorLogService.getErrorById(id);
  }

  @Patch(":id/resolve")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Mark error as resolved",
    description: "Marks an error log as resolved with optional notes",
  })
  @ApiParam({ name: "id", description: "Error log ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Error marked as resolved successfully",
  })
  async markAsResolved(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req: any
  ) {
    return this.errorLogService.markAsResolved(id, req.user.id, body.notes);
  }

  @Delete("cleanup")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Delete old resolved logs",
    description:
      "Deletes resolved error logs older than specified days (default 90)",
  })
  @ApiQuery({ name: "daysOld", required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Old logs deleted successfully",
  })
  async deleteOldLogs(@Query("daysOld") daysOld?: string) {
    const days = daysOld ? parseInt(daysOld) : 90;
    return this.errorLogService.deleteOldLogs(days);
  }
}
