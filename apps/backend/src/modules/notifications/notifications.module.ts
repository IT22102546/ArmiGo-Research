// src/modules/notifications/notifications.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { EmailService } from "./services/email.service";
import { SessionReminderService } from "./services/session-reminder.service";
import { UsersModule } from "@modules/users/users.module";

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, SessionReminderService, PrismaService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}