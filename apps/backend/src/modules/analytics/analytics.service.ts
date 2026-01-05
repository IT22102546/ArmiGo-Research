import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { CacheService } from "../../shared/services/cache.service";
import { RoleHelper } from "../../shared/helpers/role.helper";
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
  ExamStatus,
} from "@prisma/client";

// Cache TTLs for analytics data
const CACHE_TTL = {
  DASHBOARD: 60, // 1 minute - dashboard stats change frequently
  DASHBOARD_ENHANCED: 120, // 2 minutes - enhanced dashboard is heavier
  USER_ANALYTICS: 300, // 5 minutes - user-specific data
  TRENDS: 600, // 10 minutes - trends data
  STATIC_REPORTS: 1800, // 30 minutes - comprehensive reports
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  /**
   * Get dashboard statistics (with caching)
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const cacheKey = "analytics:dashboard:stats";

    return this.cache.cacheFunction(
      cacheKey,
      () => this.getDashboardStatsInternal(),
      CACHE_TTL.DASHBOARD
    );
  }

  /**
   * Internal method to fetch dashboard stats from DB
   */
  private async getDashboardStatsInternal(): Promise<DashboardStatsDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
   * Get dashboard statistics with trends and alerts (with caching)
   */
  async getEnhancedDashboardStats() {
    const cacheKey = "analytics:dashboard:enhanced";

    return this.cache.cacheFunction(
      cacheKey,
      () => this.getEnhancedDashboardStatsInternal(),
      CACHE_TTL.DASHBOARD_ENHANCED
    );
  }

  /**
   * Internal method to fetch enhanced dashboard stats from DB
   */
  private async getEnhancedDashboardStatsInternal() {
    const basicStats = await this.getDashboardStatsInternal(); // Use internal to avoid double caching
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastYear = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate()
    );

    // Calculate trend comparisons
    const [
      usersLastMonth,
      enrollmentsLastMonth,
      revenueLastMonth,
      attendanceLastMonth,
      usersLastYear,
      enrollmentsLastYear,
      revenueLastYear,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            lt: lastMonth,
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.enrollment.count({
        where: {
          createdAt: {
            lt: lastMonth,
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            lt: lastMonth,
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.attendance.aggregate({
        _count: { _all: true },
        where: {
          present: true,
          date: {
            lt: lastMonth,
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            lt: lastYear,
            gte: new Date(lastYear.getFullYear(), lastYear.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.enrollment.count({
        where: {
          createdAt: {
            lt: lastYear,
            gte: new Date(lastYear.getFullYear(), lastYear.getMonth() - 1, 1),
          },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            lt: lastYear,
            gte: new Date(lastYear.getFullYear(), lastYear.getMonth() - 1, 1),
          },
        },
      }),
    ]);

    const calculateTrend = (
      current: number,
      previous: number,
      isRevenueOrCount: boolean = true
    ) => {
      const change = current - previous;
      const changePercentage = previous > 0 ? (change / previous) * 100 : 0;
      const trend =
        changePercentage > 5 ? "up" : changePercentage < -5 ? "down" : "stable";
      const isPositive = isRevenueOrCount ? change > 0 : change < 0; // For metrics where lower is better
      return { current, previous, change, changePercentage, trend, isPositive };
    };

    const trends = {
      userGrowth: calculateTrend(
        basicStats.recentActivity.newUsersThisMonth,
        usersLastMonth
      ),
      enrollmentGrowth: calculateTrend(
        basicStats.recentActivity.enrollmentsThisMonth,
        enrollmentsLastMonth
      ),
      revenueGrowth: calculateTrend(
        Number(basicStats.overview.totalRevenue),
        Number(revenueLastMonth._sum.amount || 0)
      ),
      attendanceChange: calculateTrend(
        basicStats.quickStats.averageAttendanceRate,
        attendanceLastMonth._count._all
      ),
    };

    // Generate alerts
    const alerts: any[] = [];

    if (basicStats.quickStats.lowAttendanceAlerts > 10) {
      alerts.push({
        type: "warning",
        title: "Low Attendance Alert",
        message: `${basicStats.quickStats.lowAttendanceAlerts} students have attendance below 75%`,
        affectedCount: basicStats.quickStats.lowAttendanceAlerts,
        priority: 2,
        actionRequired: "Review and contact at-risk students",
      });
    }

    if (basicStats.quickStats.pendingPayments > 20) {
      alerts.push({
        type: "critical",
        title: "High Pending Payments",
        message: `${basicStats.quickStats.pendingPayments} payments require attention`,
        affectedCount: basicStats.quickStats.pendingPayments,
        priority: 1,
        actionRequired: "Process pending payments immediately",
      });
    }

    if (trends.enrollmentGrowth.trend === "down") {
      alerts.push({
        type: "warning",
        title: "Declining Enrollments",
        message: `Enrollment growth is ${trends.enrollmentGrowth.changePercentage.toFixed(1)}% lower than last month`,
        affectedCount: Math.abs(trends.enrollmentGrowth.change),
        priority: 2,
        actionRequired: "Review marketing strategy and student feedback",
      });
    }

    // Get top performing grades
    const gradePerformance = await this.prisma.enrollment.groupBy({
      by: ["classId"],
      _count: { _all: true },
      _avg: { progress: true },
      orderBy: { _avg: { progress: "desc" } },
      take: 5,
    });

    const topPerformingGrades = await Promise.all(
      gradePerformance.map(async (gp) => {
        const classInfo = await this.prisma.class.findUnique({
          where: { id: gp.classId },
          select: { grade: { select: { name: true } } },
        });
        return {
          grade: classInfo?.grade?.name || "Unknown",
          metric: "Completion Rate",
          value: gp._avg.progress || 0,
        };
      })
    );

    // Get teacher utilization
    const teachers = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER] },
      },
      include: {
        createdClasses: {
          where: { status: "ACTIVE" },
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
      take: 10,
    });

    const teacherUtilization = teachers.map((teacher) => {
      const activeClasses = teacher.createdClasses.length;
      const totalStudents = teacher.createdClasses.reduce(
        (sum, cls: any) => sum + cls._count.enrollments,
        0
      );
      const utilizationRate =
        activeClasses > 0 ? (totalStudents / (activeClasses * 30)) * 100 : 0;

      return {
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        activeClasses,
        totalStudents,
        utilizationRate: Math.min(utilizationRate, 100),
      };
    });

    // Real-time metrics
    const realTimeMetrics = {
      activeClassesNow: await this.prisma.class.count({
        where: {
          status: "ACTIVE",
          isLive: true,
        },
      }),
      studentsOnlineNow: await this.prisma.user.count({
        where: {
          role: { in: [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT] },
          lastLoginAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
        },
      }),
      liveVideoSessions: basicStats.quickStats.activeVideoSessions,
      examsInProgress: await this.prisma.examAttempt.count({
        where: { status: "IN_PROGRESS" },
      }),
      pendingTransactions: basicStats.quickStats.pendingPayments,
    };

    // Calculate enrollment history for the last 7 months
    const enrollmentHistory = [];
    const currentDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0,
        23,
        59,
        59
      );

      const [enrollments, activeClasses] = await Promise.all([
        this.prisma.enrollment.count({
          where: {
            enrolledAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
        this.prisma.class.count({
          where: {
            status: "ACTIVE",
            createdAt: {
              lte: monthEnd,
            },
          },
        }),
      ]);

      enrollmentHistory.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        enrollments,
        activeClasses,
      });
    }

    // Get student type distribution
    const [internalStudents, externalStudents] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.INTERNAL_STUDENT },
      }),
      this.prisma.user.count({
        where: { role: UserRole.EXTERNAL_STUDENT },
      }),
    ]);

    const studentTypeDistribution = {
      internal: internalStudents,
      external: externalStudents,
    };

    // Get payment data
    const [
      paymentTotalRevenue,
      pendingPaymentsCount,
      completedToday,
      failedPayments,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
      this.prisma.payment.count({
        where: { status: "PENDING" },
      }),
      this.prisma.payment.count({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.payment.count({
        where: { status: "FAILED" },
      }),
      this.prisma.payment.findMany({
        where: { status: { in: ["COMPLETED", "PENDING"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const payments = {
      totalRevenue: Number(paymentTotalRevenue._sum.amount || 0),
      pendingPayments: pendingPaymentsCount,
      completedToday,
      failedPayments,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        studentName: `${p.user.firstName} ${p.user.lastName}`,
        amount: Number(p.amount),
        status: p.status.toLowerCase(),
        date: p.createdAt.toISOString(),
      })),
    };

    // Get upcoming sessions from VideoSession model
    const upcomingSessions = await this.prisma.videoSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledStartTime: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
      orderBy: { scheduledStartTime: "asc" },
      take: 5,
      include: {
        host: {
          select: { firstName: true, lastName: true },
        },
        class: {
          include: {
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    const upcomingSessionsList = upcomingSessions.map((session) => ({
      id: session.id,
      title: session.title,
      scheduledAt: session.scheduledStartTime?.toISOString() || "",
      teacherName: `${session.host.firstName} ${session.host.lastName}`,
      enrolledStudents: session.class._count.enrollments,
    }));

    // Get chat approvals (mock for now - implement when chat module exists)
    const chatApprovals = {
      pending: 0,
      approved: 0,
      rejected: 0,
      recentRequests: [],
    };

    // Get transfer approvals
    const [
      pendingTransfers,
      approvedTransfers,
      rejectedTransfers,
      pendingTransfersList,
    ] = await Promise.all([
      this.prisma.transferRequest.count({
        where: { status: "PENDING" },
      }),
      this.prisma.transferRequest.count({
        where: { status: "MATCHED" },
      }),
      this.prisma.transferRequest.count({
        where: { status: "CANCELLED" },
      }),
      this.prisma.transferRequest.findMany({
        where: { status: { in: ["PENDING", "VERIFIED"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          requester: {
            select: { firstName: true, lastName: true },
          },
          fromZone: {
            select: { name: true },
          },
          desiredZones: {
            include: {
              zone: {
                select: { name: true },
              },
            },
            orderBy: { priority: "asc" },
          },
        },
      }),
    ]);

    const transferApprovals = {
      pending: pendingTransfers,
      approved: approvedTransfers,
      rejected: rejectedTransfers,
      pendingTransfers: pendingTransfersList.map((t) => ({
        id: t.id,
        teacherName: `${t.requester.firstName} ${t.requester.lastName}`,
        fromZone: t.fromZone?.name || "N/A",
        toZone: t.desiredZones.map((dz) => dz.zone?.name || "N/A").join(", "),
        requestedAt: t.createdAt.toISOString(),
        status: t.status.toLowerCase(),
      })),
    };

    // Get exam data
    const [upcomingExams, ongoingExams, completedTodayCount] =
      await Promise.all([
        this.prisma.exam.findMany({
          where: {
            startTime: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
            deletedAt: null,
          },
          orderBy: { startTime: "asc" },
          take: 5,
          include: {
            subject: {
              select: { name: true },
            },
            grade: {
              select: { name: true },
            },
            _count: {
              select: { attempts: true },
            },
          },
        }),
        this.prisma.examAttempt.findMany({
          where: { status: "IN_PROGRESS" },
          include: {
            exam: {
              select: {
                title: true,
                duration: true,
                grade: {
                  select: { name: true },
                },
              },
            },
          },
        }),
        this.prisma.examAttempt.count({
          where: {
            status: "GRADED",
            submittedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    const exams = {
      upcoming: upcomingExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        grade: exam.grade?.name || "N/A",
        subject: exam.subject?.name || "N/A",
        scheduledAt: exam.startTime.toISOString(),
        registeredStudents: exam._count.attempts,
      })),
      ongoing: ongoingExams.map((attempt) => ({
        id: attempt.id,
        title: attempt.exam.title,
        grade: attempt.exam.grade?.name || "N/A",
        activeStudents: 1, // Each attempt represents one active student
        startedAt: attempt.startedAt.toISOString(),
        duration: attempt.exam.duration,
      })),
      completedToday: completedTodayCount,
    };

    // Aggregate ongoing exams by exam
    const ongoingExamsGrouped = exams.ongoing.reduce((acc: any[], curr) => {
      const existing = acc.find((e) => e.title === curr.title);
      if (existing) {
        existing.activeStudents += 1;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []);

    // Get publications data
    const [
      totalPublications,
      publishedThisMonth,
      totalDownloads,
      publicationRevenue,
      topPublications,
    ] = await Promise.all([
      this.prisma.publication.count(),
      this.prisma.publication.count({
        where: {
          publishedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
      this.prisma.publication.aggregate({
        _sum: { downloads: true },
      }),
      this.prisma.publicationPurchase.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.publication.findMany({
        orderBy: { downloads: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          author: true,
          downloads: true,
          price: true,
          purchases: {
            select: {
              amount: true,
            },
          },
        },
      }),
    ]);

    const publications = {
      total: totalPublications,
      publishedThisMonth,
      totalDownloads: totalDownloads._sum.downloads || 0,
      revenue: publicationRevenue._sum.amount || 0,
      topPublications: topPublications.map((pub) => ({
        id: pub.id,
        title: pub.title,
        author: pub.author || "Unknown",
        downloads: pub.downloads,
        revenue: pub.purchases.reduce((sum, p) => sum + p.amount, 0),
      })),
    };

    // Get seminars data (mock for now - implement when seminar module exists)
    const seminars = {
      upcoming: 0,
      ongoing: 0,
      completedThisMonth: 0,
      upcomingList: [],
    };

    // Get stats for comprehensive dashboard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    // Stats cards data
    const stats = {
      students: {
        total: basicStats.overview.totalStudents,
        internal: internalStudents,
        external: externalStudents,
      },
      teachers: {
        total: basicStats.overview.totalTeachers,
        internal: await this.prisma.user.count({
          where: { role: UserRole.INTERNAL_TEACHER },
        }),
        external: await this.prisma.user.count({
          where: { role: UserRole.EXTERNAL_TEACHER },
        }),
      },
      classes: {
        activeNow: realTimeMetrics.activeClassesNow,
        totalToday: await this.prisma.class.count({
          where: {
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
      },
      exams: {
        today: await this.prisma.exam.count({
          where: {
            startTime: { gte: today, lt: tomorrow },
            deletedAt: null,
          },
        }),
        next7Days: await this.prisma.exam.count({
          where: {
            startTime: { gte: today, lt: next7Days },
            deletedAt: null,
          },
        }),
        pendingApprovals: await this.prisma.exam.count({
          where: {
            approvalStatus: "PENDING",
            deletedAt: null,
          },
        }),
      },
      payments: {
        pendingPayments: pendingPaymentsCount,
        pendingSlipVerifications: await this.prisma.payment.count({
          where: {
            status: "PENDING",
            method: "BANK_SLIP",
          },
        }),
        totalPending: pendingPaymentsCount,
      },
      chat: {
        pendingMessages: await this.prisma.chatMessage.count({
          where: {
            approvalStatus: "PENDING",
          },
        }),
        pendingApprovals: await this.prisma.chatMessage.count({
          where: {
            approvalStatus: "PENDING",
          },
        }),
      },
      transfers: {
        pendingRequests: pendingTransfers,
      },
    };

    // Today's Timeline
    // Get today's timetable entries
    const dayOfWeek = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][today.getDay()];

    const todayTimetable = await this.prisma.timetable.findMany({
      where: {
        dayOfWeek: [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ].indexOf(dayOfWeek),
        active: true,
      },
      include: {
        grade: true,
        subject: true,
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const todayTimeline = {
      classes: todayTimetable.map((tt) => ({
        id: tt.id,
        time: tt.startTime,
        grade: tt.grade.name,
        subject: tt.subject.name,
        teacherName: `${tt.teacher.firstName} ${tt.teacher.lastName}`,
        status: this.determineClassStatus(tt.startTime, tt.endTime),
        studentsEnrolled: 0, // Would need to query through class
      })),
      exams: await this.getTodayExamsTimeline(today, tomorrow),
    };

    // Alerts Panel
    const alertsPanel = {
      expiringAccess: await this.getExpiringAccessAlerts(),
      scheduledDeletions: await this.getScheduledDeletions(),
      systemWarnings: await this.getSystemWarnings(),
    };

    return {
      ...basicStats,
      stats,
      todayTimeline,
      alerts: alertsPanel,
      trends,
      enrollmentHistory,
      studentTypeDistribution,
      topPerformingGrades,
      teacherUtilization,
      realTimeMetrics,
      payments,
      upcomingSessions: upcomingSessionsList,
      chatApprovals: {
        pending: 0,
        approved: 0,
        rejected: 0,
        recentRequests: [],
      },
      transferApprovals,
      exams: {
        ...exams,
        ongoing: ongoingExamsGrouped,
      },
      publications,
      seminars,
    };
  }

  private determineClassStatus(
    startTime: string,
    endTime: string
  ): "upcoming" | "live" | "completed" {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

    if (currentTime < startTime) {
      return "upcoming";
    } else if (currentTime >= startTime && currentTime < endTime) {
      return "live";
    } else {
      return "completed";
    }
  }

  private async getTodayExamsTimeline(today: Date, tomorrow: Date) {
    const todayExams = await this.prisma.exam.findMany({
      where: {
        startTime: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
      include: {
        grade: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const activeAttempts = await this.prisma.examAttempt.groupBy({
      by: ["examId"],
      where: {
        status: "IN_PROGRESS",
      },
      _count: { _all: true },
    });

    const activeAttemptsMap = new Map(
      activeAttempts.map((a) => [a.examId, a._count._all])
    );

    return todayExams.map((exam) => {
      const now = new Date();
      const examEnd = new Date(
        exam.startTime.getTime() + exam.duration * 60000
      );
      let status: "not-started" | "live" | "completed";

      if (now < exam.startTime) {
        status = "not-started";
      } else if (now >= exam.startTime && now < examEnd) {
        status = "live";
      } else {
        status = "completed";
      }

      return {
        id: exam.id,
        title: exam.title,
        time: exam.startTime.toTimeString().slice(0, 5),
        grade: exam.grade.name,
        subject: exam.subject.name,
        status,
        registeredStudents: exam._count.attempts,
        activeStudents: activeAttemptsMap.get(exam.id) || 0,
      };
    });
  }

  private async getExpiringAccessAlerts() {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    // Find students with temporary access expiring soon
    const expiringStudents = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.EXTERNAL_STUDENT] },
        // Assuming there's an accessExpiryDate field, adjust if needed
        // For now, return empty array
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        // accessExpiryDate: true,
      },
      take: 10,
    });

    return []; // Return empty for now until field is available
  }

  private async getScheduledDeletions() {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    // Recording model doesn't have scheduledDeleteAt field
    // Return empty array for now
    return [];
  }

  private async getSystemWarnings() {
    const warnings: Array<{
      type: "sms" | "email" | "storage" | "other";
      message: string;
      severity: "low" | "medium" | "high";
      balance?: number;
    }> = [];

    // Mock system warnings - replace with actual system checks
    // Example: Check SMS/Email balance from third-party service
    // Example: Check storage usage

    // Low payment success rate warning
    const recentPayments = await this.prisma.payment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const failedPayments = await this.prisma.payment.count({
      where: {
        status: "FAILED",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentPayments > 0 && failedPayments / recentPayments > 0.1) {
      warnings.push({
        type: "other",
        message: `High payment failure rate: ${((failedPayments / recentPayments) * 100).toFixed(1)}% of payments failed in the last 7 days`,
        severity: "high",
      });
    }

    return warnings;
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
        subject: {
          select: {
            name: true,
          },
        },
        grade: {
          select: {
            name: true,
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
      subject: classData.subject?.name || "N/A",
      grade: classData.grade?.name || "N/A",
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
        subject: {
          select: {
            name: true,
          },
        },
        grade: {
          select: {
            name: true,
          },
        },
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
          subject: cls.subject?.name || "N/A",
          grade: cls.grade?.name || "N/A",
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

    if (query.classId) {where.classId = query.classId;}
    if (query.userId) {where.userId = query.userId;}

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
        subject: {
          select: {
            name: true,
          },
        },
        attempts: {
          select: {
            totalScore: true,
            timeSpent: true,
            passed: true,
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
        subject: exam.subject?.name || "N/A",
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
      subject: exam.subject?.name || "N/A",
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

    if (query.classId) {where.classId = query.classId;}

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
      if (!session.scheduledStartTime) {return;}

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
      class: {
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

      if (periodEnd >= endDate) {break;}
    }

    return groups;
  }
}
