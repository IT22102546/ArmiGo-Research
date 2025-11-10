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
} from "@nestjs/common";
import {
  TeacherAvailabilityService,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityFilterDto,
  ApproveLeaveDto,
  RejectLeaveDto,
} from "./teacher-availability.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, LeaveType, LeaveStatus } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@Controller("teacher-availability")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherAvailabilityController {
  constructor(
    private readonly availabilityService: TeacherAvailabilityService
  ) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async createLeaveRequest(
    @Body()
    body: {
      teacherId: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      reason?: string;
      replacementTeacherId?: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const createDto: CreateAvailabilityDto = {
      teacherId: body.teacherId,
      leaveType: body.leaveType,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      reason: body.reason,
      replacementTeacherId: body.replacementTeacherId,
      requestedBy: req.user.id,
    };

    return this.availabilityService.createLeaveRequest(createDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getLeaveRequests(
    @Query("teacherId") teacherId?: string,
    @Query("status") status?: LeaveStatus,
    @Query("leaveType") leaveType?: LeaveType,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const filters: AvailabilityFilterDto = {
      teacherId,
      status,
      leaveType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    return this.availabilityService.getAvailabilityList(filters);
  }

  @Get("statistics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.availabilityService.getLeaveStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get("calendar/:teacherId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getTeacherCalendar(
    @Param("teacherId") teacherId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
  ) {
    return this.availabilityService.getTeacherLeaveCalendar(
      teacherId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get("suggestions/:teacherId")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getReplacementSuggestions(
    @Param("teacherId") teacherId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
  ) {
    return this.availabilityService.suggestReplacementTeachers(
      teacherId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getLeaveById(@Param("id") id: string) {
    return this.availabilityService.getAvailabilityById(id);
  }

  @Patch(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async updateLeaveRequest(
    @Param("id") id: string,
    @Body() body: UpdateAvailabilityDto
  ) {
    return this.availabilityService.updateLeaveRequest(id, body);
  }

  @Patch(":id/approve")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approveLeave(
    @Param("id") id: string,
    @Body() body: { replacementTeacherId?: string },
    @Request() req: AuthenticatedRequest
  ) {
    const approveDto: ApproveLeaveDto = {
      approvedBy: req.user.id,
      replacementTeacherId: body.replacementTeacherId,
    };

    return this.availabilityService.approveLeave(id, approveDto);
  }

  @Patch(":id/reject")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async rejectLeave(
    @Param("id") id: string,
    @Body() body: { rejectionReason: string },
    @Request() req: AuthenticatedRequest
  ) {
    const rejectDto: RejectLeaveDto = {
      rejectedBy: req.user.id,
      rejectionReason: body.rejectionReason,
    };

    return this.availabilityService.rejectLeave(id, rejectDto);
  }

  @Patch(":id/cancel")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async cancelLeave(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.availabilityService.cancelLeave(id, req.user.id);
  }
}
