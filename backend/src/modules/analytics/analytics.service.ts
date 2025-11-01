import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RoleHelper } from "../../common/helpers/role.helper";
import {
  QueryAnalyticsDto,
  DashboardStatsDto,
  UserAnalyticsDto,
  UserGrowthDto,
  UserEngagementDto,
  ClassAnalyticsDto,
  EnrollmentTrendsDto,
  PopularClassesDto,
  FinancialSummaryDto,
  RevenueTrendsDto,
  RevenueBySourceDto,
  TopPayersDto,
  AttendanceOverviewDto,
  AttendanceTrendsDto,
  LowAttendanceAlertsDto,
  ExamPerformanceDto,
  ExamTrendsDto,
  StudentPerformanceDto,
  VideoSessionStatsDto,
  VideoSessionTrendsDto,
  PopularSessionTimesDto,
  SystemMetricsDto,
  ComprehensiveReportDto,
  ReportPeriod,
} from "./dto/analytics.dto";
import {
  UserRole,
  UserStatus,
  PaymentStatus,
  SessionStatus,
  EnrollmentStatus,
} from "@prisma/client";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      activeClasses,
      totalEnrollments,
      totalPayments,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      newClassesToday,
      newClassesWeek,
      newClassesMonth,
      enrollmentsToday,
      enrollmentsWeek,
      enrollmentsMonth,
      attendanceStats,
      activeSessions,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({
        where: {
          role: { in: [UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER] },
        },
      }),
      this.prisma.user.count({
        where: {
          role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
        },
      }),
      this.prisma.class.count(),
      this.prisma.class.count({ where: { status: "ACTIVE" } }),
      this.prisma.enrollment.count(),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.class.count({ where: { createdAt: { gte: today } } }),
      this.prisma.class.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.class.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.enrollment.count({ where: { enrolledAt: { gte: today } } }),
      this.prisma.enrollment.count({ where: { enrolledAt: { gte: weekAgo } } }),
      this.prisma.enrollment.count({
        where: { enrolledAt: { gte: monthAgo } },
      }),
      this.prisma.attendance.aggregate({
        _count: { _all: true },
        where: { present: true },
      }),
      this.prisma.videoSession.count({ where: { status: "ACTIVE" } }),
      this.prisma.payment.count({ where: { status: "PENDING" } }),
    ]);

    const totalAttendance = await this.prisma.attendance.count();
    const averageAttendanceRate =
      totalAttendance > 0
        ? Math.round((attendanceStats._count._all / totalAttendance) * 100)
        : 0;

    // Calculate average class size
    const classEnrollments = await this.prisma.enrollment.groupBy({
      by: ["classId"],
      _count: { classId: true },
    });
    const averageClassSize =
      classEnrollments.length > 0
        ? Math.round(totalEnrollments / classEnrollments.length)
        : 0;

    // Get low attendance alerts
    const lowAttendanceSummaries = await this.prisma.attendanceSummary.count({
      where: { percentage: { lt: 75 } },
    });

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalTeachers,
        totalStudents,
        totalClasses,
        activeClasses,
        totalEnrollments,
        totalRevenue: totalPayments._sum.amount || 0,
      },
      recentActivity: {
        newUsersToday,
        newUsersThisWeek: newUsersWeek,
        newUsersThisMonth: newUsersMonth,
        newClassesToday,
        newClassesThisWeek: newClassesWeek,
        newClassesThisMonth: newClassesMonth,
        enrollmentsToday,
        enrollmentsThisWeek: enrollmentsWeek,
        enrollmentsThisMonth: enrollmentsMonth,
      },
      quickStats: {
        averageClassSize,
        averageAttendanceRate,
        activeVideoSessions: activeSessions,
        pendingPayments,
        lowAttendanceAlerts: lowAttendanceSummaries,
      },
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalyticsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: true,
        examAttempts: true,
        attendanceRecords: true,
        createdClasses: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const totalSessions = await this.prisma.sessionParticipant.count({
      where: { userId },
    });

    const sessionDurations = await this.prisma.sessionParticipant.aggregate({
      where: { userId },
      _avg: { duration: true },
    });

    const attendedCount = user.attendanceRecords.filter(
      (a) => a.present
    ).length;
    const attendanceRate =
      user.attendanceRecords.length > 0
        ? Math.round((attendedCount / user.attendanceRecords.length) * 100)
        : 0;

    const result: UserAnalyticsDto = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      registrationDate: user.createdAt,
      lastLogin: user.lastLoginAt || user.createdAt,
      totalSessions,
      averageSessionDuration: sessionDurations._avg.duration || 0,
    };

    if (RoleHelper.isStudent(user.role)) {
      result.enrolledClasses = user.enrollments.length;
      result.completedExams = user.examAttempts.length;
      result.attendanceRate = attendanceRate;
    } else if (RoleHelper.isTeacher(user.role)) {
      result.teachingClasses = user.createdClasses.length;

      const studentCounts = await this.prisma.enrollment.groupBy({
        by: ["classId"],
        where: { classId: { in: user.createdClasses.map((c) => c.id) } },
        _count: { studentId: true },
      });

      result.totalStudents = studentCounts.reduce(
        (sum, c) => sum + c._count.studentId,
        0
      );
    }

    return result;
  }

  /**
   * Get user growth trends
   */
  async getUserGrowth(query: QueryAnalyticsDto): Promise<UserGrowthDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by period
    const groupedData = this.groupByPeriod(
      users,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    let cumulativeTotal = await this.prisma.user.count({
      where: { createdAt: { lt: startDate } },
    });

    return groupedData.map((group) => {
      const newUsers = group.data.length;
      cumulativeTotal += newUsers;

      const activeInPeriod = group.data.filter(
        (u: any) => u.lastLoginAt && u.lastLoginAt >= group.periodStart
      ).length;
      const churnRate =
        cumulativeTotal > 0
          ? Math.round(
              ((cumulativeTotal - activeInPeriod) / cumulativeTotal) * 100
            )
          : 0;

      return {
        period: group.label,
        newUsers,
        totalUsers: cumulativeTotal,
        activeUsers: activeInPeriod,
        churnRate,
      };
    });
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(): Promise<UserEngagementDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActive, weeklyActive, monthlyActive, totalUsers] =
      await Promise.all([
        this.prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
        this.prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
        this.prisma.user.count({ where: { lastLoginAt: { gte: monthAgo } } }),
        this.prisma.user.count(),
      ]);

    const sessionStats = await this.prisma.sessionParticipant.aggregate({
      _count: { userId: true },
      _avg: { duration: true },
    });

    const uniqueParticipants = await this.prisma.sessionParticipant.groupBy({
      by: ["userId"],
      _count: { userId: true },
    });

    const averageSessionsPerUser =
      uniqueParticipants.length > 0
        ? Math.round(sessionStats._count.userId / uniqueParticipants.length)
        : 0;

    const retentionRate =
      totalUsers > 0 ? Math.round((monthlyActive / totalUsers) * 100) : 0;

    return {
      dailyActiveUsers: dailyActive,
      weeklyActiveUsers: weeklyActive,
      monthlyActiveUsers: monthlyActive,
      averageSessionsPerUser,
      averageTimePerSession: sessionStats._avg.duration || 0,
      retentionRate,
    };
  }

  /**
   * Get class analytics
   */
  async getClassAnalytics(classId: string): Promise<ClassAnalyticsDto> {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    const [sessions, completedSessions, upcomingSessions, attendanceData] =
      await Promise.all([
        this.prisma.videoSession.count({ where: { classId } }),
        this.prisma.videoSession.count({
          where: { classId, status: SessionStatus.ENDED },
        }),
        this.prisma.videoSession.count({
          where: { classId, status: SessionStatus.SCHEDULED },
        }),
        this.prisma.attendance.aggregate({
          where: { classId },
          _count: { _all: true },
        }),
      ]);

    const presentCount = await this.prisma.attendance.count({
      where: { classId, present: true },
    });

    const totalStudents = classData.enrollments.length;
    const activeStudents = classData.enrollments.filter(
      (e) => e.status === "ACTIVE"
    ).length;
    const averageAttendance =
      attendanceData._count._all > 0
        ? Math.round((presentCount / attendanceData._count._all) * 100)
        : 0;

    return {
      classId: classData.id,
      className: classData.name,
      subject: classData.subject,
      grade: classData.grade,
      teacherId: classData.teacher.id,
      teacherName: `${classData.teacher.firstName} ${classData.teacher.lastName}`,
      totalStudents,
      activeStudents,
      averageAttendance,
      totalSessions: sessions,
      completedSessions,
      upcomingSessions,
      totalRevenue: 0, // Revenue calculation would need proper payment linkage
    };
  }

  /**
   * Get enrollment trends
   */
  async getEnrollmentTrends(
    query: QueryAnalyticsDto
  ): Promise<EnrollmentTrendsDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        enrolledAt: true,
        status: true,
      },
      orderBy: { enrolledAt: "asc" },
    });

    const groupedData = this.groupByPeriod(
      enrollments,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    let cumulativeTotal = await this.prisma.enrollment.count({
      where: { enrolledAt: { lt: startDate } },
    });

    return groupedData.map((group) => {
      const newEnrollments = group.data.length;
      const dropouts = group.data.filter(
        (e: any) => e.status === "DROPPED"
      ).length;
      cumulativeTotal += newEnrollments;

      const retentionRate =
        cumulativeTotal > 0
          ? Math.round(((cumulativeTotal - dropouts) / cumulativeTotal) * 100)
          : 100;

      return {
        period: group.label,
        newEnrollments,
        totalEnrollments: cumulativeTotal,
        dropouts,
        retentionRate,
      };
    });
  }

  /**
   * Get popular classes
   */
  async getPopularClasses(limit: number = 10): Promise<PopularClassesDto[]> {
    const classes = await this.prisma.class.findMany({
      include: {
        enrollments: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: limit,
    });

    const results = await Promise.all(
      classes.map(async (cls) => {
        const attendanceData = await this.prisma.attendance.aggregate({
          where: { classId: cls.id },
          _count: { _all: true },
        });

        const presentCount = await this.prisma.attendance.count({
          where: { classId: cls.id, present: true },
        });

        const attendanceRate =
          attendanceData._count._all > 0
            ? Math.round((presentCount / attendanceData._count._all) * 100)
            : 0;

        return {
          classId: cls.id,
          className: cls.name,
          subject: cls.subject,
          grade: cls.grade,
          enrollmentCount: cls._count.enrollments,
          attendanceRate,
          rating: 0, // Can be implemented with a rating system
          revenue: 0, // Would need proper payment linkage through enrollments
        };
      })
    );

    return results;
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(
    query: QueryAnalyticsDto
  ): Promise<FinancialSummaryDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const [completed, pending, failed, refunded] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.REFUNDED,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = completed._sum.amount || 0;
    const averageTransactionValue =
      completed._count._all > 0 ? totalRevenue / completed._count._all : 0;

    return {
      totalRevenue,
      totalExpenses: 0, // Can be implemented with expense tracking
      netProfit: totalRevenue,
      pendingPayments: pending._sum.amount || 0,
      completedPayments: completed._count._all,
      failedPayments: failed,
      refunds: refunded._sum.amount || 0,
      averageTransactionValue,
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(
    query: QueryAnalyticsDto
  ): Promise<RevenueTrendsDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const groupedData = this.groupByPeriod(
      payments,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    return groupedData.map((group) => {
      const revenue = group.data.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );
      const count = group.data.length;
      const averageValue = count > 0 ? revenue / count : 0;

      return {
        period: group.label,
        revenue,
        payments: count,
        averageValue,
      };
    });
  }

  /**
   * Get revenue by source
   */
  async getRevenueBySource(
    query: QueryAnalyticsDto
  ): Promise<RevenueBySourceDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const payments = await this.prisma.payment.groupBy({
      by: ["referenceType"],
      where: {
        status: PaymentStatus.COMPLETED,
        referenceType: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p._sum.amount || 0),
      0
    );

    return payments.map((p) => ({
      source: p.referenceType || "UNKNOWN",
      revenue: p._sum.amount || 0,
      count: p._count._all,
      percentage:
        totalRevenue > 0
          ? Math.round(((p._sum.amount || 0) / totalRevenue) * 100)
          : 0,
    }));
  }

  /**
   * Get top payers
   */
  async getTopPayers(limit: number = 10): Promise<TopPayersDto[]> {
    const payers = await this.prisma.payment.groupBy({
      by: ["userId"],
      where: { status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: limit,
    });

    const results = await Promise.all(
      payers.map(async (payer) => {
        const user = await this.prisma.user.findUnique({
          where: { id: payer.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });

        const lastPayment = await this.prisma.payment.findFirst({
          where: { userId: payer.userId, status: PaymentStatus.COMPLETED },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        return {
          userId: payer.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          totalSpent: payer._sum.amount || 0,
          paymentCount: payer._count._all,
          lastPayment: lastPayment?.createdAt || new Date(),
        };
      })
    );

    return results;
  }

  /**
   * Get attendance overview
   */
  async getAttendanceOverview(
    query: QueryAnalyticsDto
  ): Promise<AttendanceOverviewDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.classId) where.classId = query.classId;
    if (query.userId) where.userId = query.userId;

    const [total, present] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.count({ where: { ...where, present: true } }),
    ]);

    const averageAttendanceRate =
      total > 0 ? Math.round((present / total) * 100) : 0;

    // By class
    const byClassData = await this.prisma.attendance.groupBy({
      by: ["classId"],
      where: { ...where, classId: { not: null } },
      _count: { _all: true },
    });

    const byClass = await Promise.all(
      byClassData.map(async (item) => {
        const classData = await this.prisma.class.findUnique({
          where: { id: item.classId! },
          select: { id: true, name: true },
        });

        const presentCount = await this.prisma.attendance.count({
          where: { ...where, classId: item.classId, present: true },
        });

        return {
          classId: item.classId!,
          className: classData?.name || "Unknown",
          attendanceRate: Math.round((presentCount / item._count._all) * 100),
        };
      })
    );

    // By grade (would need to join through class)
    const byGrade: { grade: string; attendanceRate: number }[] = [];

    return {
      totalRecords: total,
      presentCount: present,
      absentCount: total - present,
      averageAttendanceRate,
      byClass,
      byGrade,
    };
  }

  /**
   * Get attendance trends
   */
  async getAttendanceTrends(
    query: QueryAnalyticsDto
  ): Promise<AttendanceTrendsDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        present: true,
      },
      orderBy: { date: "asc" },
    });

    const groupedData = this.groupByPeriod(
      attendance,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    return groupedData.map((group) => {
      const totalClasses = group.data.length;
      const attended = group.data.filter((a: any) => a.present).length;
      const attendanceRate =
        totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

      return {
        period: group.label,
        totalClasses,
        attended,
        attendanceRate,
      };
    });
  }

  /**
   * Get low attendance alerts
   */
  async getLowAttendanceAlerts(
    threshold: number = 75
  ): Promise<LowAttendanceAlertsDto[]> {
    const summaries = await this.prisma.attendanceSummary.findMany({
      where: { percentage: { lt: threshold } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { percentage: "asc" },
      take: 20,
    });

    // For each summary, get the last attendance record
    const results = await Promise.all(
      summaries.map(async (summary) => {
        const lastAttendance = await this.prisma.attendance.findFirst({
          where: {
            userId: summary.userId,
            present: true,
          },
          orderBy: { date: "desc" },
          select: {
            date: true,
            classId: true,
          },
        });

        let className = "N/A";
        if (lastAttendance?.classId) {
          const classData = await this.prisma.class.findUnique({
            where: { id: lastAttendance.classId },
            select: { name: true },
          });
          className = classData?.name || "N/A";
        }

        return {
          userId: summary.user.id,
          userName: `${summary.user.firstName} ${summary.user.lastName}`,
          classId: lastAttendance?.classId || "",
          className,
          attendanceRate: summary.percentage,
          lastAttended: lastAttendance?.date || summary.updatedAt,
        };
      })
    );

    return results;
  }

  /**
   * Get exam performance
   */
  async getExamPerformance(examId: string): Promise<ExamPerformanceDto> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          select: {
            totalScore: true,
            timeSpent: true,
            passed: true,
          },
        },
        class: {
          select: {
            subject: true,
          },
        },
      },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    const attempts = exam.attempts;
    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
      return {
        examId: exam.id,
        examName: exam.title,
        subject: exam.class.subject,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        averageDuration: 0,
      };
    }

    const scores = attempts.map((a) => a.totalScore || 0);
    const durations = attempts.map((a) => a.timeSpent || 0);
    const passed = attempts.filter((a) => a.passed).length;

    return {
      examId: exam.id,
      examName: exam.title,
      subject: exam.class.subject,
      totalAttempts,
      averageScore: Math.round(
        scores.reduce((sum, s) => sum + s, 0) / totalAttempts
      ),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: Math.round((passed / totalAttempts) * 100),
      averageDuration: Math.round(
        durations.reduce((sum, d) => sum + d, 0) / totalAttempts
      ),
    };
  }

  /**
   * Get exam trends
   */
  async getExamTrends(query: QueryAnalyticsDto): Promise<ExamTrendsDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalScore: true,
        passed: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const exams = await this.prisma.exam.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const groupedAttempts = this.groupByPeriod(
      attempts,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );
    const groupedExams = this.groupByPeriod(
      exams,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    return groupedAttempts.map((group, index) => {
      const totalAttempts = group.data.length;
      const averageScore =
        totalAttempts > 0
          ? Math.round(
              group.data.reduce(
                (sum: number, a: any) => sum + (a.totalScore || 0),
                0
              ) / totalAttempts
            )
          : 0;
      const passed = group.data.filter((a: any) => a.passed).length;
      const passRate =
        totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0;

      return {
        period: group.label,
        totalExams: groupedExams[index]?.data.length || 0,
        totalAttempts,
        averageScore,
        passRate,
      };
    });
  }

  /**
   * Get student performance
   */
  async getStudentPerformance(userId: string): Promise<StudentPerformanceDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        examAttempts: {
          select: {
            totalScore: true,
            passed: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const attempts = user.examAttempts;
    const totalExams = attempts.length;

    if (totalExams === 0) {
      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        totalExams: 0,
        averageScore: 0,
        highestScore: 0,
        passRate: 0,
        improvement: 0,
      };
    }

    const scores = attempts.map((a) => a.totalScore || 0);
    const passed = attempts.filter((a) => a.passed).length;

    // Calculate improvement (compare first half vs second half)
    const midPoint = Math.floor(totalExams / 2);
    const firstHalfAvg =
      scores.slice(0, midPoint).reduce((sum, s) => sum + s, 0) / midPoint;
    const secondHalfAvg =
      scores.slice(midPoint).reduce((sum, s) => sum + s, 0) /
      (totalExams - midPoint);
    const improvement =
      firstHalfAvg > 0
        ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
        : 0;

    return {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      totalExams,
      averageScore: Math.round(
        scores.reduce((sum, s) => sum + s, 0) / totalExams
      ),
      highestScore: Math.max(...scores),
      passRate: Math.round((passed / totalExams) * 100),
      improvement,
    };
  }

  /**
   * Get video session stats
   */
  async getVideoSessionStats(
    query: QueryAnalyticsDto
  ): Promise<VideoSessionStatsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.classId) where.classId = query.classId;

    const [total, completed, scheduled, cancelled] = await Promise.all([
      this.prisma.videoSession.count({ where }),
      this.prisma.videoSession.count({
        where: { ...where, status: SessionStatus.ENDED },
      }),
      this.prisma.videoSession.count({
        where: { ...where, status: SessionStatus.SCHEDULED },
      }),
      this.prisma.videoSession.count({
        where: { ...where, status: SessionStatus.CANCELLED },
      }),
    ]);

    const sessions = await this.prisma.videoSession.findMany({
      where: { ...where, status: SessionStatus.ENDED },
      select: {
        actualDuration: true,
        currentParticipants: true,
      },
    });

    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.actualDuration || 0),
      0
    );
    const totalParticipants = sessions.reduce(
      (sum, s) => sum + s.currentParticipants,
      0
    );
    const averageDuration =
      sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
    const averageParticipants =
      sessions.length > 0 ? Math.round(totalParticipants / sessions.length) : 0;

    return {
      totalSessions: total,
      completedSessions: completed,
      scheduledSessions: scheduled,
      cancelledSessions: cancelled,
      averageDuration,
      averageParticipants,
      totalParticipants,
      totalDuration,
    };
  }

  /**
   * Get video session trends
   */
  async getVideoSessionTrends(
    query: QueryAnalyticsDto
  ): Promise<VideoSessionTrendsDto[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const sessions = await this.prisma.videoSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        actualDuration: true,
        currentParticipants: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const groupedData = this.groupByPeriod(
      sessions,
      query.period || ReportPeriod.MONTHLY,
      startDate,
      endDate
    );

    return groupedData.map((group) => {
      const count = group.data.length;
      const totalDuration = group.data.reduce(
        (sum: number, s: any) => sum + (s.actualDuration || 0),
        0
      );
      const totalParticipants = group.data.reduce(
        (sum: number, s: any) => sum + s.currentParticipants,
        0
      );

      return {
        period: group.label,
        sessionsCount: count,
        averageDuration: count > 0 ? Math.round(totalDuration / count) : 0,
        averageParticipants:
          count > 0 ? Math.round(totalParticipants / count) : 0,
        attendanceRate: 85, // Can be calculated from actual attendance data
      };
    });
  }

  /**
   * Get popular session times
   */
  async getPopularSessionTimes(): Promise<PopularSessionTimesDto[]> {
    const sessions = await this.prisma.videoSession.findMany({
      where: { status: SessionStatus.ENDED },
      select: {
        scheduledStartTime: true,
        currentParticipants: true,
      },
    });

    const timeMap: Record<string, { count: number; participants: number }> = {};

    sessions.forEach((session) => {
      if (!session.scheduledStartTime) return;

      const dayOfWeek = session.scheduledStartTime.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const hour = session.scheduledStartTime.getHours();
      const key = `${dayOfWeek}-${hour}`;

      if (!timeMap[key]) {
        timeMap[key] = { count: 0, participants: 0 };
      }

      timeMap[key].count++;
      timeMap[key].participants += session.currentParticipants;
    });

    return Object.entries(timeMap)
      .map(([key, data]) => {
        const [dayOfWeek, hour] = key.split("-");
        return {
          dayOfWeek,
          hour: parseInt(hour, 10),
          sessionCount: data.count,
          averageParticipants: Math.round(data.participants / data.count),
        };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount);
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetricsDto> {
    // These would typically come from monitoring services
    // For now, returning mock data structure
    const totalRecords = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "users"
      UNION ALL SELECT COUNT(*) FROM "classes"
      UNION ALL SELECT COUNT(*) FROM "enrollments"
      UNION ALL SELECT COUNT(*) FROM "attendance"
      UNION ALL SELECT COUNT(*) FROM "payments"
    `;

    const recordCount = totalRecords.reduce(
      (sum, r) => sum + parseInt(r.count),
      0
    );

    return {
      server: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: Math.round(
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
              100
          ),
        },
        cpu: {
          usage: 0, // Would need CPU monitoring
        },
      },
      database: {
        totalRecords: recordCount,
        storageUsed: 0, // Would need database metrics
        activeConnections: 0, // Would need database metrics
        queryPerformance: {
          averageQueryTime: 0,
          slowQueries: 0,
        },
      },
      api: {
        totalRequests: 0, // Would need API monitoring
        successRate: 99.5,
        averageResponseTime: 120,
        errorRate: 0.5,
        requestsPerMinute: 0,
      },
    };
  }

  /**
   * Get comprehensive report
   */
  async getComprehensiveReport(
    query: QueryAnalyticsDto
  ): Promise<ComprehensiveReportDto> {
    const { startDate, endDate } = this.getDateRange(query);
    const previousStart = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime())
    );

    const [
      currentUsers,
      previousUsers,
      newUsers,
      activeUsers,
      currentClasses,
      newClasses,
      activeClasses,
      currentEnrollments,
      newEnrollments,
      dropouts,
      attendance,
      exams,
      examAttempts,
      payments,
      previousPayments,
      videoSessions,
      completedSessions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { lte: endDate } } }),
      this.prisma.user.count({ where: { createdAt: { lte: previousStart } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.class.count({ where: { createdAt: { lte: endDate } } }),
      this.prisma.class.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.class.count({ where: { status: "ACTIVE" } }),
      this.prisma.enrollment.count({ where: { enrolledAt: { lte: endDate } } }),
      this.prisma.enrollment.count({
        where: { enrolledAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.enrollment.count({
        where: {
          status: EnrollmentStatus.CANCELLED,
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.attendance.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _count: { _all: true },
      }),
      this.prisma.exam.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.examAttempt.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
        _avg: { totalScore: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: previousStart, lt: startDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.videoSession.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.videoSession.aggregate({
        where: {
          status: SessionStatus.ENDED,
          createdAt: { gte: startDate, lte: endDate },
        },
        _avg: { actualDuration: true, currentParticipants: true },
        _count: true,
      }),
    ]);

    const presentCount = await this.prisma.attendance.count({
      where: { date: { gte: startDate, lte: endDate }, present: true },
    });

    const passedCount = await this.prisma.examAttempt.count({
      where: { createdAt: { gte: startDate, lte: endDate }, passed: true },
    });

    const pendingPayments = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const userGrowth =
      currentUsers > 0 && previousUsers > 0
        ? Math.round(((currentUsers - previousUsers) / previousUsers) * 100)
        : 0;

    const revenueGrowth =
      payments._sum.amount && previousPayments._sum.amount
        ? Math.round(
            ((payments._sum.amount - previousPayments._sum.amount) /
              previousPayments._sum.amount) *
              100
          )
        : 0;

    const attendanceRate =
      attendance._count._all > 0
        ? Math.round((presentCount / attendance._count._all) * 100)
        : 0;

    const totalExamAttempts = examAttempts._count || 0;
    const passRate =
      totalExamAttempts > 0
        ? Math.round((passedCount / totalExamAttempts) * 100)
        : 0;

    const classEnrollments = await this.prisma.enrollment.groupBy({
      by: ["classId"],
    });

    const averageClassSize =
      classEnrollments.length > 0
        ? Math.round(currentEnrollments / classEnrollments.length)
        : 0;

    return {
      period: {
        startDate,
        endDate,
      },
      users: {
        total: currentUsers,
        new: newUsers,
        active: activeUsers,
        growth: userGrowth,
      },
      classes: {
        total: currentClasses,
        new: newClasses,
        active: activeClasses,
        averageSize: averageClassSize,
      },
      enrollments: {
        total: currentEnrollments,
        new: newEnrollments,
        dropouts,
        retentionRate:
          currentEnrollments > 0
            ? Math.round(
                ((currentEnrollments - dropouts) / currentEnrollments) * 100
              )
            : 100,
      },
      attendance: {
        totalRecords: attendance._count._all,
        averageRate: attendanceRate,
        trend: "stable", // Would need historical comparison
      },
      exams: {
        total: exams,
        attempts: totalExamAttempts,
        averageScore: Math.round(examAttempts._avg?.totalScore || 0),
        passRate,
      },
      financial: {
        revenue: payments._sum.amount || 0,
        payments: payments._count || 0,
        pending: pendingPayments._sum.amount || 0,
        growth: revenueGrowth,
      },
      videoSessions: {
        total: videoSessions,
        completed: completedSessions._count || 0,
        averageDuration: Math.round(
          completedSessions._avg?.actualDuration || 0
        ),
        averageParticipants: Math.round(
          completedSessions._avg?.currentParticipants || 0
        ),
      },
    };
  }

  /**
   * Helper: Get date range based on period
   */
  private getDateRange(query: QueryAnalyticsDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case ReportPeriod.DAILY:
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case ReportPeriod.WEEKLY:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case ReportPeriod.YEARLY:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case ReportPeriod.MONTHLY:
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    return { startDate, endDate };
  }

  /**
   * Helper: Group data by period
   */
  private groupByPeriod(
    data: any[],
    period: ReportPeriod,
    startDate: Date,
    endDate: Date
  ): any[] {
    const groups: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;

      switch (period) {
        case ReportPeriod.DAILY:
          periodStart = new Date(current);
          periodEnd = new Date(current);
          periodEnd.setHours(23, 59, 59);
          label = current.toLocaleDateString();
          current.setDate(current.getDate() + 1);
          break;
        case ReportPeriod.WEEKLY:
          periodStart = new Date(current);
          periodEnd = new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000);
          label = `Week of ${periodStart.toLocaleDateString()}`;
          current.setDate(current.getDate() + 7);
          break;
        case ReportPeriod.YEARLY:
          periodStart = new Date(current.getFullYear(), 0, 1);
          periodEnd = new Date(current.getFullYear(), 11, 31);
          label = current.getFullYear().toString();
          current.setFullYear(current.getFullYear() + 1);
          break;
        case ReportPeriod.MONTHLY:
        default:
          periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
          periodEnd = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            0
          );
          label = current.toLocaleDateString("default", {
            year: "numeric",
            month: "long",
          });
          current.setMonth(current.getMonth() + 1);
          break;
      }

      const periodData = data.filter((item) => {
        const itemDate = new Date(
          item.createdAt || item.date || item.enrolledAt
        );
        return itemDate >= periodStart && itemDate <= periodEnd;
      });

      groups.push({
        label,
        periodStart,
        periodEnd,
        data: periodData,
      });

      if (periodEnd >= endDate) break;
    }

    return groups;
  }
}
