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
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { AdminService } from "./admin.service";
import { AdminGateway } from "@infrastructure/websocket/admin.gateway";
import { NotificationsGateway } from "@infrastructure/websocket/notifications.gateway";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { UserRole } from "@prisma/client";
import {
  CreateGradeDto,
  UpdateGradeDto,
  CreateProvinceDto,
  UpdateProvinceDto,
  CreateDistrictDto,
  UpdateDistrictDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateMediumDto,
  UpdateMediumDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSubjectCodeDto,
  UpdateSubjectCodeDto,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  CreateTeacherSubjectAssignmentDto,
  UpdateTeacherSubjectAssignmentDto,
  ReorderDto,
} from "./dto/admin.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EXTERNAL_TEACHER, UserRole.INTERNAL_TEACHER)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminGateway: AdminGateway,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  // ==================== GRADES ====================
  @Get("grades")
  async getGrades() {
    return this.adminService.getGrades();
  }

  @Post("grades")
  async createGrade(@Body() dto: CreateGradeDto) {
    return this.adminService.createGrade(dto);
  }

  @Put("grades/:id")
  async updateGrade(@Param("id") id: string, @Body() dto: UpdateGradeDto) {
    return this.adminService.updateGrade(id, dto);
  }

  @Delete("grades/:id")
  async deleteGrade(@Param("id") id: string) {
    return this.adminService.deleteGrade(id);
  }
  @Post("grades/reorder")
  async reorderGrades(@Body() dto: ReorderDto) {
    return this.adminService.reorderGrades(dto.items);
  }

  // ==================== PROVINCES ====================
  @Get("provinces")
  async getProvinces() {
    return this.adminService.getProvinces();
  }

  @Post("provinces")
  async createProvince(@Body() dto: CreateProvinceDto) {
    return this.adminService.createProvince(dto);
  }

  @Put("provinces/:id")
  async updateProvince(
    @Param("id") id: string,
    @Body() dto: UpdateProvinceDto
  ) {
    return this.adminService.updateProvince(id, dto);
  }

  @Post("provinces/reorder")
  async reorderProvinces(@Body() dto: ReorderDto) {
    return this.adminService.reorderProvinces(dto.items);
  }

  @Delete("provinces/:id")
  async deleteProvince(@Param("id") id: string) {
    return this.adminService.deleteProvince(id);
  }

  // ==================== DISTRICTS ====================
  @Get("districts")
  async getDistricts(@Query("provinceId") provinceId?: string) {
    return this.adminService.getDistricts(provinceId);
  }

  @Post("districts")
  async createDistrict(@Body() dto: CreateDistrictDto) {
    return this.adminService.createDistrict(dto);
  }

  @Post("districts/reorder")
  async reorderDistricts(@Body() dto: ReorderDto) {
    return this.adminService.reorderDistricts(dto.items);
  }

  @Put("districts/:id")
  async updateDistrict(
    @Param("id") id: string,
    @Body() dto: UpdateDistrictDto
  ) {
    return this.adminService.updateDistrict(id, dto);
  }

  @Delete("districts/:id")
  async deleteDistrict(@Param("id") id: string) {
    return this.adminService.deleteDistrict(id);
  }

  // ==================== ZONES ====================
  @Get("zones")
  async getZones(@Query("districtId") districtId?: string) {
    return this.adminService.getZones(districtId);
  }

  @Post("zones")
  async createZone(@Body() dto: CreateZoneDto) {
    return this.adminService.createZone(dto);
  }

  @Post("zones/reorder")
  async reorderZones(@Body() dto: ReorderDto) {
    return this.adminService.reorderZones(dto.items);
  }

  @Put("zones/:id")
  async updateZone(@Param("id") id: string, @Body() dto: UpdateZoneDto) {
    return this.adminService.updateZone(id, dto);
  }

  @Delete("zones/:id")
  async deleteZone(@Param("id") id: string) {
    return this.adminService.deleteZone(id);
  }

  // ==================== MEDIUMS ====================
  @Get("mediums")
  async getMediums() {
    return this.adminService.getMediums();
  }

  @Post("mediums")
  async createMedium(@Body() dto: CreateMediumDto) {
    return this.adminService.createMedium(dto);
  }

  @Put("mediums/:id")
  async updateMedium(@Param("id") id: string, @Body() dto: UpdateMediumDto) {
    return this.adminService.updateMedium(id, dto);
  }

  @Delete("mediums/:id")
  async deleteMedium(@Param("id") id: string) {
    return this.adminService.deleteMedium(id);
  }

  // ==================== ACADEMIC YEARS ====================
  @Get("academic-years")
  async getAcademicYears() {
    return this.adminService.getAcademicYears();
  }

  @Post("academic-years")
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.adminService.createAcademicYear(dto);
  }

  @Post("academic-years/reorder")
  async reorderAcademicYears(@Body() dto: ReorderDto) {
    return this.adminService.reorderAcademicYears(dto.items);
  }

  @Put("academic-years/:id")
  async updateAcademicYear(
    @Param("id") id: string,
    @Body() dto: UpdateAcademicYearDto
  ) {
    return this.adminService.updateAcademicYear(id, dto);
  }

  @Delete("academic-years/:id")
  async deleteAcademicYear(@Param("id") id: string) {
    return this.adminService.deleteAcademicYear(id);
  }

  // ==================== STUDENT ENROLLMENT STATS ====================
  @Get("enrollment-stats")
  async getEnrollmentStats() {
    return this.adminService.getEnrollmentStats();
  }

  @Get("enrollment-stats/enhanced")
  async getEnhancedEnrollmentStats() {
    return this.adminService.getEnhancedEnrollmentStats();
  }

  // ==================== INSTITUTIONS ====================
  @Get("institutions")
  async getInstitutions(@Query("zoneId") zoneId?: string) {
    return this.adminService.getInstitutions(zoneId);
  }

  @Get("institutions/:id")
  async getInstitution(@Param("id") id: string) {
    return this.adminService.getInstitution(id);
  }

  @Post("institutions")
  async createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.adminService.createInstitution(dto);
  }

  @Post("institutions/reorder")
  async reorderInstitutions(@Body() dto: ReorderDto) {
    return this.adminService.reorderInstitutions(dto.items);
  }

  @Put("institutions/:id")
  async updateInstitution(
    @Param("id") id: string,
    @Body() dto: UpdateInstitutionDto
  ) {
    return this.adminService.updateInstitution(id, dto);
  }

  @Delete("institutions/:id")
  async deleteInstitution(@Param("id") id: string) {
    return this.adminService.deleteInstitution(id);
  }

  // ==================== SEMINARS ====================
  @Get("seminars")
  async getSeminars() {
    return this.adminService.getSeminars();
  }

  @Post("seminars")
  async createSeminar(
    @Body()
    dto: {
      title: string;
      description?: string;
      date: string;
      location?: string;
    }
  ) {
    return this.adminService.createSeminar(dto);
  }

  @Put("seminars/:id")
  async updateSeminar(
    @Param("id") id: string,
    @Body()
    dto: {
      title?: string;
      description?: string;
      date?: string;
      location?: string;
    }
  ) {
    return this.adminService.updateSeminar(id, dto);
  }

  @Delete("seminars/:id")
  async deleteSeminar(@Param("id") id: string) {
    return this.adminService.deleteSeminar(id);
  }

  // ==================== BATCHES ====================
  @Get("batches")
  async getBatches(@Query("gradeId") gradeId?: string) {
    return this.adminService.getBatches(gradeId);
  }
  @Post("batches")
  async createBatch(
    @Body()
    dto: {
      name: string;
      code?: string;
      gradeId: string;
      sortOrder?: number;
    }
  ) {
    return this.adminService.createBatch(dto);
  }

  @Put("batches/:id")
  async updateBatch(
    @Param("id") id: string,
    @Body()
    dto: {
      name?: string;
      code?: string;
      gradeId?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    return this.adminService.updateBatch(id, dto);
  }

  @Post("batches/reorder")
  async reorderBatches(@Body() dto: ReorderDto) {
    return this.adminService.reorderBatches(dto.items);
  }

  @Delete("batches/:id")
  async deleteBatch(@Param("id") id: string) {
    return this.adminService.deleteBatch(id);
  }

  // ==================== TEACHER SUBJECT ASSIGNMENTS ====================
  @Get("teacher-assignments")
  async getTeacherAssignments(
    @Query("teacherProfileId") teacherProfileId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("gradeId") gradeId?: string,
    @Query("mediumId") mediumId?: string
  ) {
    return this.adminService.getTeacherAssignments({
      teacherProfileId,
      subjectId,
      gradeId,
      mediumId,
    });
  }

  @Post("teacher-assignments")
  async createTeacherAssignment(
    @Body() dto: CreateTeacherSubjectAssignmentDto
  ) {
    return this.adminService.createTeacherAssignment(dto);
  }

  @Put("teacher-assignments/:id")
  async updateTeacherAssignment(
    @Param("id") id: string,
    @Body() dto: UpdateTeacherSubjectAssignmentDto
  ) {
    return this.adminService.updateTeacherAssignment(id, dto);
  }

  @Delete("teacher-assignments/:id")
  async deleteTeacherAssignment(@Param("id") id: string) {
    return this.adminService.deleteTeacherAssignment(id);
  }

  // ==================== FILTERED DROPDOWNS ====================
  // Get all teachers
  @Get("teachers")
  async getTeachers() {
    return this.adminService.getTeachers();
  }

  // Get subjects available for a specific grade and medium
  @Get("subjects/filtered")
  async getFilteredSubjects(
    @Query("gradeId") gradeId?: string,
    @Query("mediumId") mediumId?: string
  ) {
    return this.adminService.getFilteredSubjects(gradeId, mediumId);
  }

  // Get teachers who can teach a specific subject, grade, and medium
  @Get("teachers/filtered")
  async getFilteredTeachers(
    @Query("subjectId") subjectId?: string,
    @Query("gradeId") gradeId?: string,
    @Query("mediumId") mediumId?: string
  ) {
    return this.adminService.getFilteredTeachers(subjectId, gradeId, mediumId);
  }

  // Get all combinations for a teacher (what subjects/grades/mediums they can teach)
  @Get("teachers/:teacherProfileId/capabilities")
  async getTeacherCapabilities(
    @Param("teacherProfileId") teacherProfileId: string
  ) {
    return this.adminService.getTeacherCapabilities(teacherProfileId);
  }

  // ==================== SESSION MANAGEMENT ====================
  @Get("security/sessions")
  async getAllSessions(
    @Req() req: any,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("search") search?: string,
    @Query("role") role?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const currentUser = req.user;
    const currentUserId = currentUser?.id;

    // Build user filter for role-based access control
    let userWhere: any = {};

    // Roles that both admins and super admins can see
    const teacherAndStudentRoles: UserRole[] = [
      UserRole.INTERNAL_TEACHER,
      UserRole.EXTERNAL_TEACHER,
      UserRole.INTERNAL_STUDENT,
      UserRole.EXTERNAL_STUDENT,
    ];

    // Role-based access control:
    // - SUPER_ADMIN: Can see all admins + teachers + students + their own sessions (but NOT other super admins)
    // - ADMIN: Can see teachers + students + their own sessions (but NOT other admins or super admins)

    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      // Super admin can see: all admins, all teachers/students, and themselves
      // But NOT other super admins
      userWhere.OR = [
        { role: UserRole.ADMIN as any }, // All admins
        { role: { in: teacherAndStudentRoles as any } }, // All teachers and students
        { id: currentUserId }, // Their own sessions (even though they're super admin)
      ];
    } else if (currentUser?.role === UserRole.ADMIN) {
      // Admin can see: teachers, students, and their own sessions
      // But NOT other admins or super admins
      userWhere.OR = [
        { role: { in: teacherAndStudentRoles as any } }, // All teachers and students
        { id: currentUserId }, // Their own sessions
      ];
    }

    // Apply role filter if specified
    if (role && role !== "all") {
      if (currentUser?.role === UserRole.SUPER_ADMIN) {
        // Super admin can filter by: ADMIN, teachers, students (not SUPER_ADMIN unless it's themselves)
        if (role === UserRole.SUPER_ADMIN) {
          // Only show their own super admin session
          userWhere = { id: currentUserId, role: UserRole.SUPER_ADMIN as any };
        } else if (
          role === UserRole.ADMIN ||
          teacherAndStudentRoles.includes(role as UserRole)
        ) {
          userWhere = { role: role as UserRole as any };
        }
      } else if (currentUser?.role === UserRole.ADMIN) {
        // Admin can filter by: teachers, students, or ADMIN (only themselves)
        if (role === UserRole.ADMIN) {
          // Only show their own admin session
          userWhere = { id: currentUserId, role: UserRole.ADMIN as any };
        } else if (teacherAndStudentRoles.includes(role as UserRole)) {
          userWhere = { role: role as UserRole as any };
        }
        // If admin tries to filter by SUPER_ADMIN, show nothing (keep original filter)
      }
    }

    // Apply search filter to user
    if (search) {
      userWhere.AND = [
        ...(userWhere.AND || []),
        {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // First, get distinct users who have active sessions
    const usersWithSessions = await this.adminService.prisma.user.findMany({
      where: {
        ...(userWhere),
        authSessions: {
          some: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
      },
      orderBy: { lastName: "asc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        authSessions: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { lastActiveAt: "desc" },
          select: {
            id: true,
            fingerprint: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            browser: true,
            os: true,
            ipAddress: true,
            userAgent: true,
            isTrusted: true,
            lastActiveAt: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    // Count total users with active sessions
    const totalUsers = await this.adminService.prisma.user.count({
      where: {
        ...(userWhere),
        authSessions: {
          some: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
      },
    });

    // Format response - group sessions by user
    const formattedUsers = usersWithSessions.map((user) => ({
      userId: user.id,
      userName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
      userEmail: user.email || "Unknown",
      userRole: user.role || "UNKNOWN",
      sessionCount: user.authSessions.length,
      sessions: user.authSessions.map((session) => {
        const deviceInfo = this.parseUserAgent(session.userAgent);
        return {
          id: session.id,
          sessionId: session.id,
          fingerprint: session.fingerprint,
          deviceType: deviceInfo.type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceName: session.deviceName,
          ipAddress: session.ipAddress || "Unknown",
          lastActive: session.lastActiveAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        };
      }),
    }));

    return {
      users: formattedUsers,
      total: totalUsers,
      page: pageNum,
      totalPages: Math.ceil(totalUsers / limitNum),
    };
  }

  @Delete("security/sessions/:sessionId")
  async terminateSession(
    @Req() req: any,
    @Param("sessionId") sessionId: string
  ) {
    const currentUser = req.user;
    // Authorization: Only allow terminating sessions that current user is permitted to manage
    const session = await this.adminService.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    // If session doesn't exist, behave idempotently and return success
    if (!session) {
      return { message: "Session terminated successfully" };
    }

    // Permission check
    const teacherAndStudentRoles: UserRole[] = [
      UserRole.INTERNAL_TEACHER,
      UserRole.EXTERNAL_TEACHER,
      UserRole.INTERNAL_STUDENT,
      UserRole.EXTERNAL_STUDENT,
    ];

    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      // Super admin cannot terminate other super admins
      if (
        session.user.role === UserRole.SUPER_ADMIN &&
        session.user.id !== currentUser.id
      ) {
        throw AppException.forbidden(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          "Super Admins cannot terminate other Super Admin sessions"
        );
      }
    }

    if (currentUser?.role === UserRole.ADMIN) {
      // Admin can terminate only teachers/students or their own sessions
      if (
        session.user.id !== currentUser.id &&
        !teacherAndStudentRoles.includes(session.user.role)
      ) {
        throw AppException.forbidden(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          "You are not allowed to terminate sessions for this user"
        );
      }
    }

    // Revoke all refresh tokens linked to this session
    await this.adminService.prisma.refreshToken.updateMany({
      where: { sessionId, revoked: false },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "Session terminated by admin",
      },
    });

    // Then revoke the auth session
    await this.adminService.prisma.authSession
      .update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: "Terminated by admin",
        },
      })
      .catch(() => {
        // Ignore if not found
      });

    // Notify connected clients about session termination
    this.adminGateway.notifySessionTerminated({
      sessionId,
      userId: session.userId,
      terminatedBy: currentUser?.id || "system",
      reason: "Session terminated by admin",
    });

    // Force logout the user by sending a forceLogout event to their connected sockets
    this.notificationsGateway.forceLogoutSession(
      session.userId,
      sessionId,
      "Your session has been terminated by an administrator"
    );

    return {
      message: "Session terminated successfully",
    };
  }

  @Delete("security/sessions/user/:userId")
  async terminateUserSessions(
    @Req() req: any,
    @Param("userId") userId: string
  ) {
    const currentUser = req.user;

    // Authorization checks
    const targetUser = await this.adminService.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!targetUser) {
      return { message: "All user sessions terminated successfully" };
    }

    const teacherAndStudentRoles: UserRole[] = [
      UserRole.INTERNAL_TEACHER,
      UserRole.EXTERNAL_TEACHER,
      UserRole.INTERNAL_STUDENT,
      UserRole.EXTERNAL_STUDENT,
    ];

    // Admin role limits
    if (currentUser?.role === UserRole.ADMIN) {
      if (
        targetUser.id !== currentUser.id &&
        !teacherAndStudentRoles.includes(targetUser.role)
      ) {
        throw AppException.forbidden(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          "You are not allowed to terminate sessions for this user"
        );
      }
    }

    // Super Admin cannot terminate other super admins
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      if (
        targetUser.role === UserRole.SUPER_ADMIN &&
        targetUser.id !== currentUser.id
      ) {
        throw AppException.forbidden(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          "Super Admins cannot terminate other Super Admin sessions"
        );
      }
    }
    // First, get all session IDs for this user
    const sessions = await this.adminService.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    // Revoke all refresh tokens for these sessions
    if (sessionIds.length > 0) {
      await this.adminService.prisma.refreshToken.updateMany({
        where: {
          sessionId: { in: sessionIds },
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: "All user sessions terminated by admin",
        },
      });
    }

    // Revoke all auth sessions for this user
    await this.adminService.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: "All sessions terminated by admin",
      },
    });

    // Notify connected clients about all terminated sessions
    sessionIds.forEach((sessionId) => {
      this.adminGateway.notifySessionTerminated({
        sessionId,
        userId,
        terminatedBy: currentUser?.id || "system",
        reason: "All user sessions terminated by admin",
      });
    });

    // Force logout the user from all their connected sockets
    this.notificationsGateway.forceLogoutUser(
      userId,
      "All your sessions have been terminated by an administrator"
    );

    return {
      message: "All user sessions terminated successfully",
    };
  }

  @Post("security/sessions/terminate-all")
  async terminateAllSessions(@Req() req: any) {
    const currentUser = req.user;
    const currentUserId = currentUser?.id;

    const teacherAndStudentRoles = [
      UserRole.INTERNAL_TEACHER,
      UserRole.EXTERNAL_TEACHER,
      UserRole.INTERNAL_STUDENT,
      UserRole.EXTERNAL_STUDENT,
    ];

    // Build filter of sessions allowed to be terminated based on current user's role
    const sessionFilter: any = { revokedAt: null };

    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      // Super admin: can terminate sessions for Admins, Teachers, Students except other super admins
      sessionFilter.AND = [
        {
          user: {
            role: {
              in: ([UserRole.ADMIN] as any).concat(
                teacherAndStudentRoles as any
              ),
            },
          },
        },
        { userId: { not: currentUserId } },
      ];
    } else if (currentUser?.role === UserRole.ADMIN) {
      // Admin: can terminate sessions for Teachers, Students, and their own (but not other admins or super admins)
      sessionFilter.AND = [
        { user: { role: { in: teacherAndStudentRoles as any } } },
      ];
    }

    // Find sessions matching filter
    const sessions = await this.adminService.prisma.authSession.findMany({
      where: sessionFilter,
      select: { id: true, userId: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    // Revoke all refresh tokens for these sessions
    if (sessionIds.length > 0) {
      await this.adminService.prisma.refreshToken.updateMany({
        where: {
          sessionId: { in: sessionIds },
          revoked: false,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: "All sessions terminated by admin",
        },
      });
    }

    // Revoke all matching auth sessions
    await this.adminService.prisma.authSession.updateMany({
      where: sessionFilter,
      data: {
        revokedAt: new Date(),
        revokedReason: "All sessions terminated by admin",
      },
    });

    // Notify connected clients about all terminated sessions
    sessions.forEach((session) => {
      this.adminGateway.notifySessionTerminated({
        sessionId: session.id,
        userId: session.userId,
        terminatedBy: currentUser?.id || "system",
        reason: "All sessions terminated by admin",
      });
    });

    // Force logout all affected users
    const uniqueUserIds = [...new Set(sessions.map((s) => s.userId))];
    uniqueUserIds.forEach((userId) => {
      this.notificationsGateway.forceLogoutUser(
        userId,
        "All sessions have been terminated by an administrator"
      );
    });

    return {
      message: "All sessions terminated successfully",
    };
  }

  // Helper method to parse user agent
  private parseUserAgent(userAgent?: string | null): {
    type: "desktop" | "mobile" | "tablet";
    browser: string;
    os: string;
  } {
    const ua = userAgent ?? "";

    // If empty or not provided, return default values
    if (!ua || ua === "Unknown") {
      return { type: "desktop", browser: "Unknown", os: "Unknown" };
    }

    const isMobile =
      /Mobile|Android|iPhone|iPod|BlackBerry|Opera Mini|IEMobile/i.test(ua);
    const isTablet = /Tablet|iPad|PlayBook|Silk/i.test(ua);

    // Browser detection - order matters (Edge contains Chrome, Chrome contains Safari)
    let browser = "Unknown";
    if (/Edg/i.test(ua)) {browser = "Edge";}
    else if (/OPR|Opera/i.test(ua)) {browser = "Opera";}
    else if (/Firefox/i.test(ua)) {browser = "Firefox";}
    else if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) {browser = "Chrome";}
    else if (/Safari/i.test(ua) && !/Chrome|Edg|OPR/i.test(ua))
      {browser = "Safari";}
    else if (/MSIE|Trident/i.test(ua)) {browser = "Internet Explorer";}

    // OS detection
    let os = "Unknown";
    if (/Windows NT 10/i.test(ua)) {os = "Windows 10/11";}
    else if (/Windows NT 6\.3/i.test(ua)) {os = "Windows 8.1";}
    else if (/Windows NT 6\.2/i.test(ua)) {os = "Windows 8";}
    else if (/Windows NT 6\.1/i.test(ua)) {os = "Windows 7";}
    else if (/Windows/i.test(ua)) {os = "Windows";}
    else if (/Mac OS X/i.test(ua)) {os = "macOS";}
    else if (/Android/i.test(ua)) {os = "Android";}
    else if (/iPhone|iPad|iPod/i.test(ua)) {os = "iOS";}
    else if (/Linux/i.test(ua)) {os = "Linux";}
    else if (/CrOS/i.test(ua)) {os = "Chrome OS";}

    return {
      type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
      browser,
      os,
    };
  }

  // ==================== USER LOGIN RESTRICTIONS ====================
  @Get("users/:userId/restrictions")
  async getUserRestrictions(@Param("userId") userId: string) {
    return this.adminService.getUserRestrictions(userId);
  }

  @Post("users/:userId/restrictions/block")
  async blockUserLogin(
    @Param("userId") userId: string,
    @Body() data: { reason: string; duration?: number }
  ) {
    return this.adminService.blockUserLogin(userId, data.reason, data.duration);
  }

  @Post("users/:userId/restrictions/unblock")
  async unblockUserLogin(@Param("userId") userId: string) {
    return this.adminService.unblockUserLogin(userId);
  }

  @Post("users/:userId/restrictions/suspend")
  async suspendUser(
    @Param("userId") userId: string,
    @Body() data: { reason: string; until: string }
  ) {
    return this.adminService.suspendUser(
      userId,
      data.reason,
      new Date(data.until)
    );
  }

  @Get("users/:userId/restrictions/history")
  async getRestrictionHistory(
    @Param("userId") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.adminService.getRestrictionHistory(userId, pageNum, limitNum);
  }
}
