import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";

// Core modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PublicationsModule } from "./modules/publications/publications.module";
import { VideoModule } from "./modules/video/video.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { StorageModule } from "./modules/storage/storage.module";
import { HealthModule } from "./modules/health/health.module";
import { TimetableModule } from "./modules/timetable/timetable.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { TransferModule } from "./modules/transfer/transfer.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { WebSocketModule } from "./websocket/websocket.module";

// Database
import { DatabaseModule } from "./database";

// Configuration
import { DatabaseConfig } from "./config/database.config";
import { AppConfig } from "./config/app.config";
import { JwtConfig } from "./config/jwt.config";
import { SecurityConfig } from "./config/security.config";

// Middleware
import { SanitizationMiddleware } from "./common/middleware/sanitization.middleware";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, AppConfig, JwtConfig, SecurityConfig],
      envFilePath: [".env.local", ".env"],
    }),

    // Database integration placeholder. We intentionally omit TypeORM here
    // to keep this bootstrap lean. Replace with TypeORM/Prisma configuration as needed.
    DatabaseModule,

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("jwt.secret"),
        signOptions: {
          expiresIn: configService.get("jwt.expiresIn"),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // Passport
    PassportModule.register({ defaultStrategy: "jwt" }),

    // Rate limiting (Stricter limits for security)
    // Using multiple tiers: short-term burst protection and long-term abuse prevention
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute window
      limit: 100, // 100 requests per minute (primary limit)
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    ClassesModule,
    ExamsModule,
    PaymentsModule,
    WalletModule,
    PublicationsModule,
    VideoModule,
    NotificationsModule,
    AnalyticsModule,
    StorageModule,
    HealthModule,
    TimetableModule,
    AttendanceModule,
    TransferModule,
    AuditLogsModule,
    SubjectsModule,
    WebSocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply sanitization middleware to all routes
    consumer.apply(SanitizationMiddleware).forRoutes('*');
  }
}