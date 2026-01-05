import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { PrismaModule } from "@database/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("jwt.expiresIn") || "24h",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: "ChatGateway",
      useExisting: forwardRef(() => ChatGateway),
    },
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
