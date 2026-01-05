import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "../../shared";
import { RoleHelper } from "../../shared/helpers/role.helper";
import {
  MarkAttendanceDto,
  BulkMarkAttendanceDto,
  AutoMarkAttendanceDto,
  QueryAttendanceDto,
  UpdateAttendanceDto,
  AttendanceResponseDto,
  AttendanceSummaryResponseDto,
  AttendanceCalendarDto,
  AttendanceReportDto,
  AttendanceStatsDto,
} from "./dto/attendance.dto";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Mark attendance manually
   */
  @Post("mark")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async markAttendance(
    @Body() dto: MarkAttendanceDto,
    @Req() req: any
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.markAttendance(dto, req.user.id);
  }

  /**
   * Mark attendance for multiple students
   */
  @Post("bulk-mark")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async bulkMarkAttendance(
    @Body() dto: BulkMarkAttendanceDto,
    @Req() req: any
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.bulkMarkAttendance(dto, req.user.id);
  }

  /**
   * Auto-mark attendance from video session
   */
  @Post("auto-mark")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async autoMarkFromSession(
    @Body() dto: AutoMarkAttendanceDto
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.autoMarkFromSession(dto);
  }

  /**
   * Get attendance statistics (admin only)
   */
  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats(): Promise<AttendanceStatsDto> {
    return this.attendanceService.getStats();
  }

  /**
   * Get attendance records with filters
   */
  @Get()
  async findAll(
    @Query() query: QueryAttendanceDto,
    @Req() req: any
  ): Promise<AttendanceResponseDto[]> {
    // Students can only view their own attendance
    if (RoleHelper.isStudent(req.user.role)) {
      query.userId = req.user.id;
    }

    return this.attendanceService.findAll(query);
  }

  /**
   * Get attendance by ID
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Req() req: any
  ): Promise<AttendanceResponseDto> {
    const attendance = await this.attendanceService.findOne(id);

    // Students can only view their own attendance
    if (
      RoleHelper.isStudent(req.user.role) &&
      attendance.userId !== req.user.id
    ) {
      throw new Error("Forbidden");
    }

    return attendance;
  }

  /**
   * Get student attendance records
   */
  @Get("student/:userId")
  async getStudentAttendance(
    @Param("userId") userId: string,
    @Query() query: QueryAttendanceDto,
    @Req() req: any
  ): Promise<AttendanceResponseDto[]> {
    // Students can only view their own attendance
    if (RoleHelper.isStudent(req.user.role) && userId !== req.user.id) {
      throw new Error("Forbidden");
    }

    query.userId = userId;
    return this.attendanceService.findAll(query);
  }

  /**
   * Get attendance calendar view
   */
  @Get("calendar/:userId")
  async getCalendar(
    @Param("userId") userId: string,
    @Query("month") month: string,
    @Query("year") year: string,
    @Req() req: any
  ): Promise<AttendanceCalendarDto> {
    // Students can only view their own calendar
    if (RoleHelper.isStudent(req.user.role) && userId !== req.user.id) {
      throw new Error("Forbidden");
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    return this.attendanceService.getCalendar(userId, monthNum, yearNum);
  }

  /**
   * Get monthly summary
   */
  @Get("summary/:userId")
  async getMonthlySummary(
    @Param("userId") userId: string,
    @Query("month") month: string,
    @Query("year") year: string,
    @Req() req: any
  ): Promise<AttendanceSummaryResponseDto> {
    // Students can only view their own summary
    if (RoleHelper.isStudent(req.user.role) && userId !== req.user.id) {
      throw new Error("Forbidden");
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    return this.attendanceService.getMonthlySummary(userId, monthNum, yearNum);
  }

  /**
   * Get attendance report
   */
  @Get("report/:userId")
  async getReport(
    @Param("userId") userId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Req() req: any
  ): Promise<AttendanceReportDto> {
    // Students can only view their own report
    if (RoleHelper.isStudent(req.user.role) && userId !== req.user.id) {
      throw new Error("Forbidden");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.attendanceService.getReport(userId, start, end);
  }

  /**
   * Update attendance record
   */
  @Put(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateAttendanceDto,
    @Req() req: any
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.update(id, dto, req.user.id, req.user.role);
  }

  /**
   * Delete attendance record
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param("id") id: string, @Req() req: any): Promise<void> {
    return this.attendanceService.remove(id, req.user.id, req.user.role);
  }
}
