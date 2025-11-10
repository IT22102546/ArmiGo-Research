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
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "../../shared";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { TimetableService } from "./timetable.service";
import {
  CreateTimetableDto,
  UpdateTimetableDto,
  CreateTimetableChangeDto,
  QueryTimetableDto,
  TimetableResponseDto,
  TimetableChangeResponseDto,
} from "./dto/timetable.dto";

@Controller("timetable")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  /**
   * Create a new timetable entry
   * Admin or Teacher only
   */
  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async create(
    @Body() createDto: CreateTimetableDto,
    @Request() req: any
  ): Promise<TimetableResponseDto> {
    return this.timetableService.create(createDto, req.user.id);
  }

  /**
   * Get all timetable entries with optional filters
   */
  @Get()
  async findAll(
    @Query() query: QueryTimetableDto
  ): Promise<TimetableResponseDto[]> {
    return this.timetableService.findAll(query);
  }

  /**
   * Check for scheduling conflicts
   */
  @Get("conflicts")
  async checkConflicts(
    @Query("teacherId") teacherId: string,
    @Query("dayOfWeek") dayOfWeek: string,
    @Query("startTime") startTime: string,
    @Query("endTime") endTime: string,
    @Query("excludeId") excludeId?: string
  ): Promise<any[]> {
    if (!teacherId || !dayOfWeek || !startTime || !endTime) {
      return [];
    }
    return this.timetableService.findConflicts(
      teacherId,
      parseInt(dayOfWeek),
      startTime,
      endTime,
      excludeId
    );
  }

  /**
   * Get available teachers for a time slot
   */
  @Get("available-teachers")
  async getAvailableTeachers(
    @Query("subject") subject: string,
    @Query("dayOfWeek") dayOfWeek: string,
    @Query("startTime") startTime: string,
    @Query("endTime") endTime: string
  ): Promise<any[]> {
    if (!dayOfWeek || !startTime || !endTime) {
      return [];
    }
    return this.timetableService.findAvailableTeachers(
      parseInt(dayOfWeek),
      startTime,
      endTime,
      subject
    );
  }

  /**
   * Get today's schedule
   * If user is a teacher, returns only their schedule
   */
  @Get("today")
  async getTodaySchedule(@Request() req: any): Promise<TimetableResponseDto[]> {
    const userId = RoleHelper.isTeacher(req.user.role)
      ? req.user.id
      : undefined;
    return this.timetableService.getTodaySchedule(userId);
  }

  /**
   * Get this week's schedule
   */
  @Get("week")
  async getWeekSchedule(
    @Query("startDate") startDate: string,
    @Request() req: any
  ): Promise<Record<string, TimetableResponseDto[]>> {
    const start = startDate ? new Date(startDate) : new Date();
    // Set to start of week (Sunday)
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const userId = RoleHelper.isTeacher(req.user.role)
      ? req.user.id
      : undefined;
    return this.timetableService.getWeekSchedule(start, userId);
  }

  /**
   * Get teacher's schedule
   * Teachers can view their own, admins can view any
   */
  @Get("teacher/:teacherId")
  async getTeacherSchedule(
    @Param("teacherId") teacherId: string,
    @Request() req: any
  ): Promise<TimetableResponseDto[]> {
    // Teachers can only view their own schedule
    if (RoleHelper.isTeacher(req.user.role) && req.user.id !== teacherId) {
      teacherId = req.user.id;
    }
    return this.timetableService.getTeacherSchedule(teacherId);
  }

  /**
   * Get timetable entry by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<TimetableResponseDto> {
    return this.timetableService.findOne(id);
  }

  /**
   * Update timetable entry
   * Admin or owning teacher only
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
    @Body() updateDto: UpdateTimetableDto,
    @Request() req: any
  ): Promise<TimetableResponseDto> {
    return this.timetableService.update(
      id,
      updateDto,
      req.user.id,
      req.user.role
    );
  }

  /**
   * Delete timetable entry
   * ADMIN ONLY - Only admins can delete timetable entries
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req: any): Promise<void> {
    return this.timetableService.remove(id, req.user.id, req.user.role);
  }

  /**
   * Create a timetable change (cancel, subject change, etc.)
   * Admin or Teacher only
   */
  @Post(":id/change")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async createChange(
    @Body() changeDto: CreateTimetableChangeDto,
    @Request() req: any
  ): Promise<TimetableChangeResponseDto> {
    return this.timetableService.createChange(changeDto, req.user.id);
  }

  /**
   * Get all changes for a timetable entry
   */
  @Get(":id/changes")
  async getChanges(
    @Param("id") id: string
  ): Promise<TimetableChangeResponseDto[]> {
    return this.timetableService.getChanges(id);
  }

  /**
   * Delete a timetable change
   * Admin or creator only
   */
  @Delete("change/:changeId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeChange(
    @Param("changeId") changeId: string,
    @Request() req: any
  ): Promise<void> {
    return this.timetableService.removeChange(
      changeId,
      req.user.id,
      req.user.role
    );
  }
}
