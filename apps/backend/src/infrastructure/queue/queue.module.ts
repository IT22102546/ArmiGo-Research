import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QueueService } from "../../shared/services/queue.service";
import { EmailProcessor } from "../../infrastructure/processors/email.processor";
import { NotificationProcessor } from "../../infrastructure/processors/notification.processor";
import { FileProcessor } from "../../infrastructure/processors/file.processor";
import { ExamProcessor } from "../../infrastructure/processors/exam.processor";
import { PrismaModule } from "../../database/prisma.module";
import { NotificationsModule } from "../../modules/notifications/notifications.module";
import { PushModule } from "../push/push.module";

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PushModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: parseInt(configService.get("REDIS_PORT", "6379")),
          password: configService.get("REDIS_PASSWORD"),
          db: parseInt(configService.get("REDIS_QUEUE_DB", "1")),
        },
        prefix: configService.get("REDIS_PREFIX", "learnup:dev:") + "queue:",
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: "email" },
      { name: "notifications" },
      { name: "file-processing" },
      { name: "exam-processing" }
    ),
  ],
  providers: [
    QueueService,
    EmailProcessor,
    NotificationProcessor,
    FileProcessor,
    ExamProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
