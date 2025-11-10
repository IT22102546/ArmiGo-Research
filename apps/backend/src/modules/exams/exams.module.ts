import { Module } from "@nestjs/common";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { ExamNotificationService } from "./exam-notification.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PushModule } from "../../infrastructure/push/push.module";
import { DatabaseModule } from "@database/database.module";

@Module({
  imports: [NotificationsModule, PushModule, DatabaseModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamNotificationService],
  exports: [ExamsService, ExamNotificationService],
})
export class ExamsModule {}
