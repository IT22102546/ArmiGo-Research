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
  class: {
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

// Enrollment Analytics DTOs
export class EnrollmentFunnelDto {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  conversionRate: number;
}

export class EnrollmentCohortDto {
  cohortDate: string; // Month/Year
  totalStudents: number;
  activeStudents: number;
  retentionRate: number;
  averageRevenue: number;
  completionRate: number;
  churnCount: number;
}

export class CapacityPlanningDto {
  grade: string;
  currentEnrollment: number;
  maxCapacity: number;
  utilizationRate: number;
  projectedEnrollment: number;
  capacityGap: number;
  recommendedActions: string[];
}

export class EnrollmentHealthDto {
  grade: string;
  totalEnrollments: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
  examParticipationRate: number;
  engagementScore: number;
  atRiskCount: number;
}

export class GeographicDistributionDto {
  province: string;
  district?: string;
  enrollmentCount: number;
  percentage: number;
  revenue: number;
  averageAge: number;
}

export class DemographicBreakdownDto {
  category: string;
  label: string;
  count: number;
  percentage: number;
  revenue: number;
}

export class PredictiveEnrollmentDto {
  month: string;
  projectedEnrollments: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  trend: "up" | "down" | "stable";
  seasonalFactor: number;
}

export class EnrollmentAlertsDto {
  type: "warning" | "critical" | "info";
  title: string;
  message: string;
  affectedCount: number;
  priority: number;
  actionRequired: string;
}

export class PaymentEnrollmentDto {
  totalRevenue: number;
  averagePaymentPerStudent: number;
  paymentSuccessRate: number;
  outstandingPayments: number;
  outstandingCount: number;
  walletUsage: number;
  discountImpact: number;
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export class TrendComparisonDto {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: "up" | "down" | "stable";
  isPositive: boolean;
}

export class EnhancedDashboardStatsDto extends DashboardStatsDto {
  trends: {
    userGrowth: TrendComparisonDto;
    enrollmentGrowth: TrendComparisonDto;
    revenueGrowth: TrendComparisonDto;
    attendanceChange: TrendComparisonDto;
  };
  enrollmentHistory: {
    month: string;
    enrollments: number;
    activeClasses: number;
  }[];
  studentTypeDistribution: {
    internal: number;
    external: number;
  };
  alerts: EnrollmentAlertsDto[];
  topPerformingGrades: {
    grade: string;
    metric: string;
    value: number;
  }[];
  teacherUtilization: {
    teacherId: string;
    teacherName: string;
    activeClasses: number;
    totalStudents: number;
    utilizationRate: number;
  }[];
  realTimeMetrics: {
    activeClassesNow: number;
    studentsOnlineNow: number;
    liveVideoSessions: number;
    examsInProgress: number;
    pendingTransactions: number;
  };
}

export class EnhancedEnrollmentStatsDto {
  overview: {
    totalEnrolled: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageCompletionRate: number;
    monthOverMonthGrowth: number;
    yearOverYearGrowth: number;
  };
  funnel: EnrollmentFunnelDto[];
  cohorts: EnrollmentCohortDto[];
  capacityPlanning: CapacityPlanningDto[];
  healthMetrics: EnrollmentHealthDto[];
  geographicDistribution: GeographicDistributionDto[];
  demographics: {
    byMedium: DemographicBreakdownDto[];
    byStudentType: DemographicBreakdownDto[];
    byAgeGroup: DemographicBreakdownDto[];
  };
  predictions: PredictiveEnrollmentDto[];
  alerts: EnrollmentAlertsDto[];
  paymentAnalytics: PaymentEnrollmentDto;
  byGrade: {
    grade: number;
    count: number;
    completionRate: number;
    retentionRate: number;
    averageAttendance: number;
  }[];
  recentEnrollments: {
    id: string;
    studentId: string;
    subjectId: string;
    createdAt: string;
    student: {
      name: string;
      email: string;
    };
    subject: {
      name: string;
      grade: number;
    };
  }[];
}
