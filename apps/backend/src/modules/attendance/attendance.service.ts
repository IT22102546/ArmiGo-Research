import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
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
  AttendanceType,
} from "./dto/attendance.dto";
import { AttendanceType as PrismaAttendanceType } from "@prisma/client";
import { UserRole } from "@prisma/client";

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mark attendance manually
   */
  async markAttendance(
    dto: MarkAttendanceDto,
    markedBy: string
  ): Promise<AttendanceResponseDto> {
    // Validate all required entities in parallel
    const [user, classData, session] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      dto.classId
        ? this.prisma.class.findUnique({ where: { id: dto.classId } })
        : Promise.resolve(null),
      dto.sessionId
        ? this.prisma.videoSession.findUnique({ where: { id: dto.sessionId } })
        : Promise.resolve(null),
    ]);

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    if (dto.classId && !classData) {
      throw AppException.notFound(ErrorCode.CLASS_NOT_FOUND, "Class not found");
    }

    if (dto.sessionId && !session) {
      throw AppException.notFound(
        ErrorCode.VIDEO_SESSION_NOT_FOUND,
        "Video session not found"
      );
    }

    // Parse dates
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const joinTime = dto.joinTime ? new Date(dto.joinTime) : undefined;
    const leaveTime = dto.leaveTime ? new Date(dto.leaveTime) : undefined;

    // Calculate duration if join/leave times provided
    let duration = dto.duration;
    if (joinTime && leaveTime && !duration) {
      duration = Math.floor((leaveTime.getTime() - joinTime.getTime()) / 60000); // Convert to minutes
    }

    // Use transaction to prevent race conditions on attendance marking
    const attendance = await this.prisma.$transaction(async (tx) => {
      // Check if attendance already exists
      const existing = await tx.attendance.findFirst({
        where: {
          userId: dto.userId,
          date,
          classId: dto.classId,
        },
      });

      if (existing) {
        // Update existing
        return await tx.attendance.update({
          where: { id: existing.id },
          data: {
            present: dto.present,
            joinTime,
            leaveTime,
            duration,
            notes: dto.notes,
            type:
              (dto.type as PrismaAttendanceType) || PrismaAttendanceType.CLASS,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      } else {
        // Create new
        return await tx.attendance.create({
          data: {
            userId: dto.userId,
            date,
            classId: dto.classId,
            classSessionId: dto.sessionId,
            present: dto.present,
            joinTime,
            leaveTime,
            duration,
            notes: dto.notes,
            type:
              (dto.type as PrismaAttendanceType) || PrismaAttendanceType.CLASS,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      }
    });

    // Return attendance with user details
    const result = await this.prisma.attendance.findUnique({
      where: { id: attendance.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update monthly summary
    await this.updateMonthlySummary(
      dto.userId,
      date.getMonth() + 1,
      date.getFullYear()
    );

    return this.mapToResponseDto(result);
  }

  /**
   * Bulk mark attendance
   */
  async bulkMarkAttendance(
    dto: BulkMarkAttendanceDto,
    markedBy: string
  ): Promise<AttendanceResponseDto[]> {
    const results: AttendanceResponseDto[] = [];

    for (const attendanceDto of dto.attendances) {
      try {
        const result = await this.markAttendance(attendanceDto, markedBy);
        results.push(result);
      } catch (error) {
        // Continue with other records - error handling without logging
      }
    }

    return results;
  }

  /**
   * Auto-mark attendance from video session
   */
  async autoMarkFromSession(
    dto: AutoMarkAttendanceDto
  ): Promise<AttendanceResponseDto[]> {
    const session = await this.prisma.videoSession.findUnique({
      where: { id: dto.sessionId },
      include: { participants: true, class: true },
    });

    if (!session) {
      throw AppException.notFound(
        ErrorCode.VIDEO_SESSION_NOT_FOUND,
        "Video session not found"
      );
    }

    if (!session.startedAt || !session.endedAt) {
      throw AppException.badRequest(
        ErrorCode.ATTENDANCE_SESSION_NOT_STARTED,
        "Session must be ended before auto-marking attendance"
      );
    }

    const sessionDuration = Math.floor(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
    ); // Minutes
    const minimumDuration = Math.floor(
      (sessionDuration * (dto.minimumAttendancePercentage || 50)) / 100
    );

    const attendances: AttendanceResponseDto[] = [];

    for (const participant of session.participants) {
      if (!participant.joinedAt) {continue;}

      const participantDuration = participant.leftAt
        ? Math.floor(
            (participant.leftAt.getTime() - participant.joinedAt.getTime()) /
              60000
          )
        : participant.duration || 0;

      const present = participantDuration >= minimumDuration;

      const markDto: MarkAttendanceDto = {
        userId: participant.userId,
        date:
          session.scheduledStartTime?.toISOString() ||
          session.startedAt.toISOString(),
        classId: session.classId || undefined,
        sessionId: session.id,
        present,
        joinTime: participant.joinedAt.toISOString(),
        leaveTime: participant.leftAt?.toISOString(),
        duration: participantDuration,
        notes: `Auto-marked from video session. Duration: ${participantDuration}/${sessionDuration} minutes`,
        type: AttendanceType.CLASS,
      };

      try {
        const attendance = await this.markAttendance(markDto, session.hostId);
        attendances.push(attendance);
      } catch (error) {
        // Continue with other participants - error handling without logging
      }
    }

    return attendances;
  }

  /**
   * Get attendance records with filters
   */
  async findAll(query: QueryAttendanceDto): Promise<AttendanceResponseDto[]> {
    const where: any = {};

    if (query.userId) {where.userId = query.userId;}
    if (query.classId) {where.classId = query.classId;}
    if (query.sessionId) {where.classSessionId = query.sessionId;}
    if (query.present !== undefined) {where.present = query.present;}
    if (query.type) {where.type = query.type;}

    // Date range filter
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {where.date.gte = new Date(query.startDate);}
      if (query.endDate) {where.date.lte = new Date(query.endDate);}
    }

    // Month/Year filter
    if (query.month && query.year) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Fetch class details for attendances with classId
    const results = await Promise.all(
      attendances.map(async (a) => {
        if (a.classId) {
          const classData = await this.prisma.class.findUnique({
            where: { id: a.classId },
            select: {
              id: true,
              name: true,
              subject: true,
            },
          });
          return this.mapToResponseDto({ ...a, class: classData });
        }
        return this.mapToResponseDto(a);
      })
    );

    return results;
  }

  /**
   * Get attendance by ID
   */
  async findOne(id: string): Promise<AttendanceResponseDto> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!attendance) {
      throw AppException.notFound(
        ErrorCode.ATTENDANCE_NOT_FOUND,
        "Attendance record not found"
      );
    }

    // Fetch class details if classId exists
    if (attendance.classId) {
      const classData = await this.prisma.class.findUnique({
        where: { id: attendance.classId },
        select: {
          id: true,
          name: true,
          subject: true,
        },
      });
      return this.mapToResponseDto({ ...attendance, class: classData });
    }

    return this.mapToResponseDto(attendance);
  }

  /**
   * Update attendance record
   */
  async update(
    id: string,
    dto: UpdateAttendanceDto,
    userId: string,
    userRole: UserRole
  ): Promise<AttendanceResponseDto> {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppException.notFound(
        ErrorCode.ATTENDANCE_NOT_FOUND,
        "Attendance record not found"
      );
    }

    // Calculate duration if times updated
    let duration = dto.duration;
    if (dto.joinTime && dto.leaveTime && !duration) {
      const joinTime = new Date(dto.joinTime);
      const leaveTime = new Date(dto.leaveTime);
      duration = Math.floor((leaveTime.getTime() - joinTime.getTime()) / 60000);
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.present !== undefined && { present: dto.present }),
        ...(dto.joinTime && { joinTime: new Date(dto.joinTime) }),
        ...(dto.leaveTime && { leaveTime: new Date(dto.leaveTime) }),
        ...(duration !== undefined && { duration }),
        ...(dto.notes && { notes: dto.notes }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update monthly summary
    await this.updateMonthlySummary(
      existing.userId,
      existing.date.getMonth() + 1,
      existing.date.getFullYear()
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete attendance record
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppException.notFound(
        ErrorCode.ATTENDANCE_NOT_FOUND,
        "Attendance record not found"
      );
    }

    // Only admin can delete
    if (userRole !== UserRole.ADMIN) {
      throw AppException.forbidden(
        ErrorCode.ONLY_ADMIN_DELETE_ATTENDANCE,
        "Only admins can delete attendance records"
      );
    }

    await this.prisma.attendance.delete({
      where: { id },
    });

    // Update monthly summary
    await this.updateMonthlySummary(
      existing.userId,
      existing.date.getMonth() + 1,
      existing.date.getFullYear()
    );
  }

  /**
   * Get attendance calendar for a user
   */
  async getCalendar(
    userId: string,
    month: number,
    year: number
  ): Promise<AttendanceCalendarDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fetch all unique class IDs
    const classIds: string[] = Array.from(
      new Set(attendances.filter((a) => a.classId).map((a) => a.classId!))
    );
    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, subject: true },
    });
    const classMap = new Map(classes.map((c) => [c.id, c]));

    // Group by date
    const dayMap: Record<string, any> = {};
    attendances.forEach((a) => {
      const dateStr = a.date.toISOString().split("T")[0];
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {
          date: dateStr,
          present: false,
          duration: 0,
          class: [],
        };
      }

      if (a.present) {dayMap[dateStr].present = true;}
      if (a.duration) {dayMap[dateStr].duration += a.duration;}

      if (a.classId) {
        const classData = classMap.get(a.classId);
        if (classData) {
          dayMap[dateStr].class.push({
            id: classData.id,
            name: classData.name,
            subject: classData.subject,
            attended: a.present,
          });
        }
      }
    });

    return {
      year,
      month,
      days: Object.values(dayMap),
    };
  }

  /**
   * Get monthly summary for a user
   */
  async getMonthlySummary(
    userId: string,
    month: number,
    year: number
  ): Promise<AttendanceSummaryResponseDto> {
    const summary = await this.prisma.attendanceSummary.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!summary) {
      // Calculate on the fly if not exists
      await this.updateMonthlySummary(userId, month, year);
      return this.getMonthlySummary(userId, month, year);
    }

    return this.mapSummaryToResponseDto(summary);
  }

  /**
   * Get attendance report for a user
   */
  async getReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceReportDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppException.notFound(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // Get all attendance in date range
    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalClasses = attendances.length;
    const attended = attendances.filter((a) => a.present).length;
    const absent = totalClasses - attended;
    const percentage =
      totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

    // Fetch all unique class IDs
    const classIds: string[] = Array.from(
      new Set(attendances.filter((a) => a.classId).map((a) => a.classId!))
    );
    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, subject: true },
    });
    const classLookup = new Map(classes.map((c) => [c.id, c]));

    // Class breakdown
    const classMap: Record<string, any> = {};
    attendances.forEach((a) => {
      if (!a.classId) {return;}

      const classData = classLookup.get(a.classId);
      if (!classData) {return;}

      if (!classMap[classData.id]) {
        classMap[classData.id] = {
          classId: classData.id,
          className: classData.name,
          subject: classData.subject,
          totalSessions: 0,
          attended: 0,
        };
      }

      classMap[classData.id].totalSessions++;
      if (a.present) {classMap[classData.id].attended++;}
    });

    const classBreakdown = Object.values(classMap).map((c: any) => ({
      ...c,
      percentage:
        c.totalSessions > 0
          ? Math.round((c.attended / c.totalSessions) * 100)
          : 0,
    }));

    // Monthly trend
    const monthMap: Record<string, any> = {};
    attendances.forEach((a) => {
      const monthKey = `${a.date.getFullYear()}-${a.date.getMonth() + 1}`;
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: new Date(
            a.date.getFullYear(),
            a.date.getMonth(),
            1
          ).toLocaleString("default", { month: "long" }),
          year: a.date.getFullYear(),
          attended: 0,
          total: 0,
        };
      }

      monthMap[monthKey].total++;
      if (a.present) {monthMap[monthKey].attended++;}
    });

    const monthlyTrend = Object.values(monthMap).map((m: any) => ({
      ...m,
      percentage: m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0,
    }));

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      period: { startDate, endDate },
      totalClasses,
      attended,
      absent,
      percentage,
      classBreakdown,
      monthlyTrend,
    };
  }

  /**
   * Get attendance statistics (admin)
   */
  async getStats(): Promise<AttendanceStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total records
    const totalRecords = await this.prisma.attendance.count();

    // Today's attendance
    const todayAttendance = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const presentToday = todayAttendance.filter((a) => a.present).length;
    const absentToday = todayAttendance.filter((a) => !a.present).length;

    // Average attendance rate
    const totalAttendance = await this.prisma.attendance.count({
      where: { present: true },
    });
    const averageAttendanceRate =
      totalRecords > 0 ? Math.round((totalAttendance / totalRecords) * 100) : 0;

    // Total users with attendance records
    const totalUsers = await this.prisma.attendance.groupBy({
      by: ["userId"],
    });

    // Low attendance alerts (< 75%)
    const summaries = await this.prisma.attendanceSummary.findMany({
      where: {
        percentage: {
          lt: 75,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        percentage: "asc",
      },
      take: 10,
    });

    const lowAttendanceAlerts = summaries.map((s) => ({
      userId: s.userId,
      userName: `${s.user.firstName} ${s.user.lastName}`,
      percentage: s.percentage,
    }));

    return {
      totalUsers: totalUsers.length,
      totalRecords,
      averageAttendanceRate,
      presentToday,
      absentToday,
      lowAttendanceAlerts,
    };
  }

  /**
   * Update monthly summary for a user
   */
  private async updateMonthlySummary(
    userId: string,
    month: number,
    year: number
  ): Promise<void> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalClasses = attendances.length;
    const attended = attendances.filter((a) => a.present).length;
    const percentage =
      totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

    await this.prisma.attendanceSummary.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      create: {
        userId,
        month,
        year,
        totalClasses,
        attended,
        percentage,
      },
      update: {
        totalClasses,
        attended,
        percentage,
      },
    });
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(attendance: any): AttendanceResponseDto {
    return {
      id: attendance.id,
      userId: attendance.userId,
      user: attendance.user,
      date: attendance.date,
      classId: attendance.classId,
      class: attendance.class,
      sessionId: attendance.sessionId,
      present: attendance.present,
      joinTime: attendance.joinTime,
      leaveTime: attendance.leaveTime,
      duration: attendance.duration,
      notes: attendance.notes,
      type: attendance.type,
      createdAt: attendance.createdAt,
    };
  }

  /**
   * Map summary to response DTO
   */
  private mapSummaryToResponseDto(summary: any): AttendanceSummaryResponseDto {
    return {
      id: summary.id,
      userId: summary.userId,
      user: summary.user,
      month: summary.month,
      year: summary.year,
      totalClasses: summary.totalClasses,
      attended: summary.attended,
      percentage: summary.percentage,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }
}
