import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AdminService } from "../admin/admin.service";
import { JwtAuthGuard, RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import {
  CreateTeacherSubjectAssignmentDto,
  UpdateTeacherSubjectAssignmentDto,
} from "../admin/dto/admin.dto";

@Controller("teacher-assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherAssignmentsController {
  constructor(private readonly adminService: AdminService) {}

  @Get("teacher/:teacherProfileId")
  async getByTeacher(
    @Param("teacherProfileId") teacherProfileId: string,
    @Query("academicYear") academicYear?: string,
    @Query("includeInactive") includeInactive?: string
  ) {
    const filters: any = { teacherProfileId };
    if (academicYear) {filters.academicYear = academicYear;}
    if (includeInactive !== undefined)
      {filters.includeInactive = includeInactive === "true";}
    const res = await this.adminService.getTeacherAssignments(filters);
    return { assignments: res.assignments || [] };
  }

  @Get()
  async getFiltered(
    @Query("subjectId") subjectId?: string,
    @Query("gradeId") gradeId?: string,
    @Query("mediumId") mediumId?: string,
    @Query("academicYear") academicYear?: string
  ) {
    const res = await this.adminService.getTeacherAssignments({
      subjectId,
      gradeId,
      mediumId,
      academicYear,
    });
    return { assignments: res.assignments || [] };
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.adminService.getTeacherAssignmentById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Body() dto: CreateTeacherSubjectAssignmentDto,
    @Request() req: any
  ) {
    return this.adminService.createTeacherAssignment(dto);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTeacherSubjectAssignmentDto
  ) {
    return this.adminService.updateTeacherAssignment(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param("id") id: string) {
    return this.adminService.deleteTeacherAssignment(id);
  }

  @Patch(":id/toggle-active")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleActive(
    @Param("id") id: string,
    @Body() body: { isActive: boolean }
  ) {
    return this.adminService.updateTeacherAssignment(id, {
      isActive: body.isActive,
    });
  }
}
