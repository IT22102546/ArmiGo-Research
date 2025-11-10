import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { APP_GUARD } from "@nestjs/core";
import * as path from "path";
import * as config from './config';

// Configuration
import {
  DatabaseConfig,
  AppConfig,
  JwtConfig,
  SecurityConfig,
  RedisConfig,
  VideoConfig,
} from "./config";

// Database & Core Infrastructure
import { DatabaseModule } from "./database";
import { CommonServicesModule } from "./shared/services/common-services.module";
import { QueueModule } from "./shared/services/queue.module";

// Feature Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CourseMaterialsModule } from "./modules/course-materials/course-materials.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { ProctoringModule } from "./modules/proctoring/proctoring.module";
import { FaceRecognitionModule } from "./modules/face-recognition/face-recognition.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PublicationsModule } from "./modules/publications/publications.module";
import { VideoModule } from "./modules/video/video.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { TimetableModule } from "./modules/timetable/timetable.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { TransferModule } from "./modules/transfer/transfer.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { AdminModule } from "./modules/admin/admin.module";
import { TeacherAssignmentsModule } from "./modules/teacher-assignments/teacher-assignments.module";
import { BatchModule } from "./modules/batch/batch.module";
import { SystemSettingsModule } from "./modules/system-settings/system-settings.module";
import { GradesModule } from "./modules/grades/grades.module";
import { MediumsModule } from "./modules/mediums/mediums.module";
import { AcademicYearsModule } from "./modules/academic-years/academic-years.module";
import { EnrollmentsModule } from "./modules/enrollments/enrollments.module";
import { TemporaryAccessModule } from "./modules/temporary-access/temporary-access.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { SecurityAuditModule } from "./modules/security-audit/security-audit.module";
import { SearchModule } from "./modules/search/search.module";
import { ErrorLogModule } from "./modules/error-logs/error-log.module";
import { JobsMonitorModule } from "./modules/jobs-monitor/jobs-monitor.module";
import { TeacherAvailabilityModule } from "./modules/teacher-availability/teacher-availability.module";
import { ClassReschedulingModule } from "./modules/class-rescheduling/class-rescheduling.module";
import { PaymentReconciliationModule } from "./modules/payment-reconciliation/payment-reconciliation.module";
import { InvoiceModule } from "./modules/invoice/invoice.module";

// Infrastructure Modules
import { StorageModule } from "./infrastructure/storage/storage.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { HealthModule } from "./infrastructure/health/health.module";
import { WebSocketModule } from "./infrastructure/websocket/websocket.module";

// Middleware
import {
  SanitizationMiddleware,
  MetricsMiddleware,
  CorrelationIdMiddleware,
} from "./common/middleware";

// Guards
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        DatabaseConfig,
        AppConfig,
        JwtConfig,
        SecurityConfig,
        RedisConfig,
        VideoConfig,
      ],
      envFilePath: [".env.local", ".env"],
    }),

    // Database integration placeholder. We intentionally omit TypeORM here
    // to keep this bootstrap lean. Replace with TypeORM/Prisma configuration as needed.
    DatabaseModule,

    // Passport
    PassportModule.register({ defaultStrategy: "jwt" }),

    // Rate limiting - PERFORMANCE OPTIMIZED
    // Increased limits to prevent false positives during normal usage
    // Individual endpoints can set stricter limits via @Throttle() decorator
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute window
      limit: 200, // 200 requests per minute (increased from 100 for better UX)
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Serve static files from uploads directory
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),

    // Feature modules
    CommonServicesModule,
    CacheModule,
    QueueModule.forRoot(), // Conditionally enabled based on REDIS_ENABLED
    AuthModule,
    UsersModule,
    ClassesModule,
    CourseMaterialsModule,
    ExamsModule,
    ProctoringModule,
    FaceRecognitionModule,
    PaymentsModule,
    WalletModule,
    PublicationsModule,
    VideoModule,
    NotificationsModule,
    AnalyticsModule,
    MetricsModule,
    StorageModule,
    HealthModule,
    TimetableModule,
    AttendanceModule,
    TransferModule,
    AuditLogsModule,
    SubjectsModule,
    AdminModule,
    TeacherAssignmentsModule,
    BatchModule,
    WebSocketModule,
    SystemSettingsModule,
    GradesModule,
    MediumsModule,
    AcademicYearsModule,
    EnrollmentsModule,
    TemporaryAccessModule,
    AnnouncementsModule,
    SecurityAuditModule,
    SearchModule,
    ErrorLogModule,
    JobsMonitorModule,
    TeacherAvailabilityModule,
    ClassReschedulingModule,
    PaymentReconciliationModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [
    // Global guards - applied to all routes by default
    // Use @Public() decorator to bypass JwtAuthGuard on specific routes
    // Use @Roles() decorator to require specific roles on protected routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID first so downstream can log it
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");

    // Apply metrics middleware to all routes for monitoring
    consumer.apply(MetricsMiddleware).forRoutes("*");

    // Apply sanitization middleware to all routes
    consumer.apply(SanitizationMiddleware).forRoutes("*");
  }
}
