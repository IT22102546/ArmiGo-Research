// app.module.ts - Fixed version for ArmiGo
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";

// Configuration
import { DatabaseConfig, AppConfig, JwtConfig, SecurityConfig } from "./config";

// Database
import { DatabaseModule } from "./database";

// ARMIGO MODULES (Keep these)
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SystemSettingsModule } from "./modules/system-settings/system-settings.module";
import { PatientModule } from "./modules/patients/patient.module";
import { GeographyModule } from "./modules/geography/geography.module";
import { HospitalModule } from "./modules/hospitals/hospital.module";
import { AnnouncementsModule } from "@modules/announcements/announcements.module";
import { PublicationsModule } from "@modules/publications/publications.module";

// Infrastructure - ONLY keep what's necessary
import { HealthModule } from "./infrastructure/health/health.module";

// Guards
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

// Middleware
import { CorrelationIdMiddleware } from "./common/middleware";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, AppConfig, JwtConfig, SecurityConfig],
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    DatabaseModule,

    // Scheduling (cron jobs)
    ScheduleModule.forRoot(),

    // ARMIGO Feature Modules
    AuthModule,
    UsersModule,
    NotificationsModule,
    SystemSettingsModule,
    PatientModule,
    GeographyModule,
    HospitalModule,
    AnnouncementsModule,
    PublicationsModule,

    // Infrastructure - only Health module
    HealthModule,
  ],
  controllers: [],
  providers: [
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
    // Fixed: Use proper pattern instead of string wildcard
    consumer
      .apply(CorrelationIdMiddleware)
       .forRoutes('api/v1/*path');
  }
}