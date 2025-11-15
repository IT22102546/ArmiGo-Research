import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ClassReschedulingService } from "./class-rescheduling.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, RescheduleStatus } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@Controller("class-rescheduling")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassReschedulingController {
  constructor(
    private readonly classReschedulingService: ClassReschedulingService
  ) {}

  /**
   * Create a new class rescheduling request
   */
  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async createRescheduling(
    @Body() createDto: any,
    @Request() req: AuthenticatedRequest
  ) {
    return this.classReschedulingService.createRescheduling(
      createDto,
      req.user.userId
    );
  }

  /**
   * Get list of rescheduling requests with filters
   */
  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getReschedulingList(
    @Query("originalClassId") originalClassId?: string,
    @Query("teacherId") teacherId?: string,
    @Query("status") status?: RescheduleStatus,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.classReschedulingService.getReschedulingList({
      originalClassId,
      teacherId,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get rescheduling statistics
   */
  @Get("statistics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const filters: any = {};
    if (startDate) {filters.startDate = new Date(startDate);}
    if (endDate) {filters.endDate = new Date(endDate);}

    return this.classReschedulingService.getReschedulingStatistics(filters);
  }

  /**
   * Get rescheduling history for a class
   */
  @Get("history/:classId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getClassHistory(@Param("classId") classId: string) {
    return this.classReschedulingService.getClassReschedulingHistory(classId);
  }

  /**
   * Get rescheduling by ID
   */
  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getReschedulingById(@Param("id") id: string) {
    return this.classReschedulingService.getReschedulingById(id);
  }

  /**
   * Update rescheduling request
   */
  @Patch(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async updateRescheduling(
    @Param("id") id: string,
    @Body() updateDto: any,
    @Request() req: AuthenticatedRequest
  ) {
    return this.classReschedulingService.updateRescheduling(
      id,
      updateDto,
      req.user.userId
    );
  }

  /**
   * Approve rescheduling request
   */
  @Patch(":id/approve")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approveRescheduling(
    @Param("id") id: string,
    @Body() approveDto: any,
    @Request() req: AuthenticatedRequest
  ) {
    return this.classReschedulingService.approveRescheduling(
      id,
      req.user.userId,
      approveDto
    );
  }

  /**
   * Reject rescheduling request
   */
  @Patch(":id/reject")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async rejectRescheduling(
    @Param("id") id: string,
    @Body() rejectDto: any,
    @Request() req: AuthenticatedRequest
  ) {
    return this.classReschedulingService.rejectRescheduling(
      id,
      req.user.userId,
      rejectDto
    );
  }

  /**
   * Cancel rescheduling request
   */
  @Patch(":id/cancel")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async cancelRescheduling(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.classReschedulingService.cancelRescheduling(
      id,
      req.user.userId
    );
  }

  /**
   * Mark rescheduling as completed
   */
  @Patch(":id/complete")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async completeRescheduling(@Param("id") id: string) {
    return this.classReschedulingService.completeRescheduling(id);
  }
}
