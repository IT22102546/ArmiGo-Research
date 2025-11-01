import { IsString, IsOptional, IsDateString, IsEnum } from "class-validator";

export enum ReportPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export enum MetricType {
  USERS = "USERS",
  CLASSES = "CLASSES",
  ENROLLMENTS = "ENROLLMENTS",
  ATTENDANCE = "ATTENDANCE",
  EXAMS = "EXAMS",
  PAYMENTS = "PAYMENTS",
  VIDEO_SESSIONS = "VIDEO_SESSIONS",
}

export class QueryAnalyticsDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

// Dashboard DTOs
export class DashboardStatsDto {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
    activeClasses: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
  recentActivity: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    newClassesToday: number;
    newClassesThisWeek: number;
    newClassesThisMonth: number;
    enrollmentsToday: number;
    enrollmentsThisWeek: number;
    enrollmentsThisMonth: number;
  };
  quickStats: {
    averageClassSize: number;
    averageAttendanceRate: number;
    activeVideoSessions: number;
    pendingPayments: number;
    lowAttendanceAlerts: number;
  };
}

// User Analytics DTOs
export class UserAnalyticsDto {
  userId: string;
  userName: string;
  role: string;
  registrationDate: Date;
  lastLogin: Date;
  totalSessions: number;
  averageSessionDuration: number; // minutes
  enrolledClasses?: number;
  completedExams?: number;
  attendanceRate?: number;
  teachingClasses?: number;
  totalStudents?: number;
  averageClassRating?: number;
}

export class UserGrowthDto {
  period: string; // Date or month name
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
  churnRate: number;
}

export class UserEngagementDto {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionsPerUser: number;
  averageTimePerSession: number; // minutes
  retentionRate: number; // percentage
}

// Class Analytics DTOs
export class ClassAnalyticsDto {
  classId: string;
  className: string;
  subject: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalRevenue: number;
  averageRating?: number;
}

export class EnrollmentTrendsDto {
  period: string;
  newEnrollments: number;
  totalEnrollments: number;
  dropouts: number;
  retentionRate: number;
}

export class PopularClassesDto {
  classId: string;
  className: string;
  subject: string;
  grade: string;
  enrollmentCount: number;
  attendanceRate: number;
  rating: number;
  revenue: number;
}

// Financial Analytics DTOs
export class FinancialSummaryDto {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refunds: number;
  averageTransactionValue: number;
}

export class RevenueTrendsDto {
  period: string;
  revenue: number;
  payments: number;
  averageValue: number;
}

export class RevenueBySourceDto {
  source: string; // CLASS_FEE, EXAM_FEE, PUBLICATION, etc.
  revenue: number;
  count: number;
  percentage: number;
}

export class TopPayersDto {
  userId: string;
  userName: string;
  totalSpent: number;
  paymentCount: number;
  lastPayment: Date;
}

// Attendance Analytics DTOs
export class AttendanceOverviewDto {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  averageAttendanceRate: number;
  byClass: {
    classId: string;
    className: string;
    attendanceRate: number;
  }[];
  byGrade: {
    grade: string;
    attendanceRate: number;
  }[];
}

export class AttendanceTrendsDto {
  period: string;
  totalClasses: number;
  attended: number;
  attendanceRate: number;
}

export class LowAttendanceAlertsDto {
  userId: string;
  userName: string;
  classId: string;
  className: string;
  attendanceRate: number;
  lastAttended: Date;
}

// Exam Analytics DTOs
export class ExamPerformanceDto {
  examId: string;
  examName: string;
  subject: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageDuration: number; // minutes
}

export class ExamTrendsDto {
  period: string;
  totalExams: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
}

export class StudentPerformanceDto {
  userId: string;
  userName: string;
  totalExams: number;
  averageScore: number;
  highestScore: number;
  passRate: number;
  improvement: number; // percentage change
}

// Video Session Analytics DTOs
export class VideoSessionStatsDto {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  averageDuration: number; // minutes
  averageParticipants: number;
  totalParticipants: number;
  totalDuration: number; // minutes
}

export class VideoSessionTrendsDto {
  period: string;
  sessionsCount: number;
  averageDuration: number;
  averageParticipants: number;
  attendanceRate: number;
}

export class PopularSessionTimesDto {
  dayOfWeek: string;
  hour: number;
  sessionCount: number;
  averageParticipants: number;
}

// System Metrics DTOs
export class SystemMetricsDto {
  server: {
    uptime: number; // seconds
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number; // percentage
    };
  };
  database: {
    totalRecords: number;
    storageUsed: number; // bytes
    activeConnections: number;
    queryPerformance: {
      averageQueryTime: number; // ms
      slowQueries: number;
    };
  };
  api: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number; // ms
    errorRate: number;
    requestsPerMinute: number;
  };
}

export class ErrorLogsDto {
  timestamp: Date;
  level: string;
  message: string;
  stack?: string;
  userId?: string;
  endpoint?: string;
}

export class ActivityLogsDto {
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details?: string;
}

// Comprehensive Report DTO
export class ComprehensiveReportDto {
  period: {
    startDate: Date;
    endDate: Date;
  };
  users: {
    total: number;
    new: number;
    active: number;
    growth: number; // percentage
  };
  classes: {
    total: number;
    new: number;
    active: number;
    averageSize: number;
  };
  enrollments: {
    total: number;
    new: number;
    dropouts: number;
    retentionRate: number;
  };
  attendance: {
    totalRecords: number;
    averageRate: number;
    trend: "up" | "down" | "stable";
  };
  exams: {
    total: number;
    attempts: number;
    averageScore: number;
    passRate: number;
  };
  financial: {
    revenue: number;
    payments: number;
    pending: number;
    growth: number; // percentage
  };
  videoSessions: {
    total: number;
    completed: number;
    averageDuration: number;
    averageParticipants: number;
  };
}
