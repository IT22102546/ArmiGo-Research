import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthCoreService } from "./auth-core.service";
import { JwtStrategy } from "./strategies";
import { UsersModule } from "../users/users.module";
import { TokenCleanupTask } from "./tasks/token-cleanup.task";
import { PrismaModule } from "@database/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WebSocketModule } from "@infrastructure/websocket/websocket.module";
import { CommonServicesModule } from "../../shared/services/common-services.module";

// Import refactored services
import {
  PasswordService,
  OtpService,
  SessionService,
  TokenBlacklistService,
  TwoFactorService,
} from "./services";

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    NotificationsModule,
    WebSocketModule,
    CommonServicesModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("jwt.expiresIn"),
          algorithm: "HS256",
          issuer: configService.get<string>("jwt.issuer"),
          audience: configService.get<string>("jwt.audience"),
        },
        verifyOptions: {
          algorithms: ["HS256"],
          clockTolerance: 0,
          issuer: configService.get<string>("jwt.issuer"),
          audience: configService.get<string>("jwt.audience"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Core auth service (keep existing for backward compatibility)
    AuthService,

    // New refactored auth core service
    AuthCoreService,

    // Refactored specialized services
    PasswordService,
    OtpService,
    SessionService,
    TokenBlacklistService,
    TwoFactorService,

    // JWT strategy and tasks
    JwtStrategy,
    TokenCleanupTask,
  ],
  exports: [
    AuthService,
    AuthCoreService,
    PasswordService,
    OtpService,
    SessionService,
    TokenBlacklistService,
    TwoFactorService,
    JwtStrategy,
  ],
})
export class AuthModule {}
