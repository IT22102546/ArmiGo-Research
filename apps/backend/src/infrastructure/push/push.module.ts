import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PushNotificationService } from "./push-notification.service";
import { FCMService } from "./fcm.service";
import { DeviceTokenService } from "./device-token.service";
import { DeviceTokenController } from "./device-token.controller";
import { ScheduledNotificationService } from "./scheduled-notification.service";
import { ScheduledNotificationController } from "./scheduled-notification.controller";
import { PrismaModule } from "@database/prisma.module";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [DeviceTokenController, ScheduledNotificationController],
  providers: [
    PushNotificationService,
    FCMService,
    DeviceTokenService,
    ScheduledNotificationService,
  ],
  exports: [
    PushNotificationService,
    FCMService,
    DeviceTokenService,
    ScheduledNotificationService,
  ],
})
export class PushModule {}
