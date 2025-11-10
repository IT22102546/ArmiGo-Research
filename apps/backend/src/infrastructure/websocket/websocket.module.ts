import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminGateway } from "./admin.gateway";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("jwt.expiresIn") || "24h",
          algorithm: "HS256", // Explicit algorithm
          issuer: configService.get<string>("jwt.issuer"),
          audience: configService.get<string>("jwt.audience"),
        },
        verifyOptions: {
          algorithms: ["HS256"], // Only allow HS256
          clockTolerance: 0, // No clock tolerance
          issuer: configService.get<string>("jwt.issuer"),
          audience: configService.get<string>("jwt.audience"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminGateway],
  exports: [AdminGateway],
})
export class WebSocketModule {}
