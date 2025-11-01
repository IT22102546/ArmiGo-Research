import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
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
} from "./dto/analytics.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user.enum";
import { RoleHelper } from "../../common/helpers/role.helper";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get dashboard statistics
   * GET /analytics/dashboard
   * Roles: ADMIN, TEACHER
   */
  @Get("dashboard")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.analyticsService.getDashboardStats();
  }

  /**
   * Get user analytics
   * GET /analytics/users?userId=xxx
   * Roles: ADMIN, TEACHER, STUDENT (own data)
   */
  @Get("users")
  async getUserAnalytics(
    @Query("userId") userId: string
  ): Promise<UserAnalyticsDto> {
    return this.analyticsService.getUserAnalytics(userId);
  }

  /**
   * Get user growth trends
   * GET /analytics/users/growth?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN
   */
  @Get("users/growth")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUserGrowth(
    @Query() query: QueryAnalyticsDto
  ): Promise<UserGrowthDto[]> {
    return this.analyticsService.getUserGrowth(query);
  }

  /**
   * Get user engagement metrics
   * GET /analytics/users/engagement
   * Roles: ADMIN
   */
  @Get("users/engagement")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUserEngagement(): Promise<UserEngagementDto> {
    return this.analyticsService.getUserEngagement();
  }

  /**
   * Get class analytics
   * GET /analytics/classes/:classId
   * Roles: ADMIN, TEACHER
   */
  @Get("classes/:classId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getClassAnalytics(
    @Param("classId") classId: string
  ): Promise<ClassAnalyticsDto> {
    return this.analyticsService.getClassAnalytics(classId);
  }

  /**
   * Get enrollment trends
   * GET /analytics/enrollments/trends?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER
   */
  @Get("enrollments/trends")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getEnrollmentTrends(
    @Query() query: QueryAnalyticsDto
  ): Promise<EnrollmentTrendsDto[]> {
    return this.analyticsService.getEnrollmentTrends(query);
  }

  /**
   * Get popular classes
   * GET /analytics/classes/popular?limit=10
   * Roles: ADMIN, TEACHER
   */
  @Get("classes/popular")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getPopularClasses(
    @Query("limit") limit?: string
  ): Promise<PopularClassesDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getPopularClasses(parsedLimit);
  }

  /**
   * Get financial summary
   * GET /analytics/financial/summary?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN
   */
  @Get("financial/summary")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getFinancialSummary(
    @Query() query: QueryAnalyticsDto
  ): Promise<FinancialSummaryDto> {
    return this.analyticsService.getFinancialSummary(query);
  }

  /**
   * Get revenue trends
   * GET /analytics/financial/revenue-trends?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN
   */
  @Get("financial/revenue-trends")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRevenueTrends(
    @Query() query: QueryAnalyticsDto
  ): Promise<RevenueTrendsDto[]> {
    return this.analyticsService.getRevenueTrends(query);
  }

  /**
   * Get revenue by source
   * GET /analytics/financial/revenue-by-source?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN
   */
  @Get("financial/revenue-by-source")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRevenueBySource(
    @Query() query: QueryAnalyticsDto
  ): Promise<RevenueBySourceDto[]> {
    return this.analyticsService.getRevenueBySource(query);
  }

  /**
   * Get top payers
   * GET /analytics/financial/top-payers?limit=10
   * Roles: ADMIN
   */
  @Get("financial/top-payers")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTopPayers(@Query("limit") limit?: string): Promise<TopPayersDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopPayers(parsedLimit);
  }

  /**
   * Get attendance overview
   * GET /analytics/attendance/overview?classId=xxx&userId=xxx&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER, STUDENT (own data)
   */
  @Get("attendance/overview")
  async getAttendanceOverview(
    @Query() query: QueryAnalyticsDto
  ): Promise<AttendanceOverviewDto> {
    return this.analyticsService.getAttendanceOverview(query);
  }

  /**
   * Get attendance trends
   * GET /analytics/attendance/trends?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER
   */
  @Get("attendance/trends")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getAttendanceTrends(
    @Query() query: QueryAnalyticsDto
  ): Promise<AttendanceTrendsDto[]> {
    return this.analyticsService.getAttendanceTrends(query);
  }

  /**
   * Get low attendance alerts
   * GET /analytics/attendance/alerts?threshold=75
   * Roles: ADMIN, TEACHER
   */
  @Get("attendance/alerts")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getLowAttendanceAlerts(
    @Query("threshold") threshold?: string
  ): Promise<LowAttendanceAlertsDto[]> {
    const parsedThreshold = threshold ? parseInt(threshold, 10) : 75;
    return this.analyticsService.getLowAttendanceAlerts(parsedThreshold);
  }

  /**
   * Get exam performance
   * GET /analytics/exams/performance/:examId
   * Roles: ADMIN, TEACHER
   */
  @Get("exams/performance/:examId")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getExamPerformance(
    @Param("examId") examId: string
  ): Promise<ExamPerformanceDto> {
    return this.analyticsService.getExamPerformance(examId);
  }

  /**
   * Get exam trends
   * GET /analytics/exams/trends?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER
   */
  @Get("exams/trends")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getExamTrends(
    @Query() query: QueryAnalyticsDto
  ): Promise<ExamTrendsDto[]> {
    return this.analyticsService.getExamTrends(query);
  }

  /**
   * Get student performance
   * GET /analytics/exams/students/:userId
   * Roles: ADMIN, TEACHER, STUDENT (own data)
   */
  @Get("exams/students/:userId")
  async getStudentPerformance(
    @Param("userId") userId: string
  ): Promise<StudentPerformanceDto> {
    return this.analyticsService.getStudentPerformance(userId);
  }

  /**
   * Get video session statistics
   * GET /analytics/video-sessions/stats?classId=xxx&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER
   */
  @Get("video-sessions/stats")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getVideoSessionStats(
    @Query() query: QueryAnalyticsDto
  ): Promise<VideoSessionStatsDto> {
    return this.analyticsService.getVideoSessionStats(query);
  }

  /**
   * Get video session trends
   * GET /analytics/video-sessions/trends?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN, TEACHER
   */
  @Get("video-sessions/trends")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getVideoSessionTrends(
    @Query() query: QueryAnalyticsDto
  ): Promise<VideoSessionTrendsDto[]> {
    return this.analyticsService.getVideoSessionTrends(query);
  }

  /**
   * Get popular session times
   * GET /analytics/video-sessions/popular-times
   * Roles: ADMIN, TEACHER
   */
  @Get("video-sessions/popular-times")
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getPopularSessionTimes(): Promise<PopularSessionTimesDto[]> {
    return this.analyticsService.getPopularSessionTimes();
  }

  /**
   * Get system metrics
   * GET /analytics/system/metrics
   * Roles: ADMIN
   */
  @Get("system/metrics")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSystemMetrics(): Promise<SystemMetricsDto> {
    return this.analyticsService.getSystemMetrics();
  }

  /**
   * Get comprehensive report
   * GET /analytics/reports/comprehensive?period=MONTHLY&startDate=...&endDate=...
   * Roles: ADMIN
   */
  @Get("reports/comprehensive")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getComprehensiveReport(
    @Query() query: QueryAnalyticsDto
  ): Promise<ComprehensiveReportDto> {
    return this.analyticsService.getComprehensiveReport(query);
  }
}
