import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { GetUser } from "../../common/decorators/get-user.decorator";
import {
  ScheduledNotificationService,
  NotificationTriggerType,
} from "./scheduled-notification.service";
import { FCMService } from "./fcm.service";
import { DeviceTokenService } from "./device-token.service";

class ScheduleNotificationDto {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  triggerType: NotificationTriggerType;
  referenceId?: string;
  scheduledFor: string; // ISO date string
  priority?: "high" | "normal";
}

class ScheduleExamReminderDto {
  examId: string;
  examTitle: string;
  examStartTime: string; // ISO date string
  studentIds: string[];
  reminderMinutes?: number[];
}

class TestPushDto {
  token: string;
  platform: "android" | "ios" | "web";
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Controller("push-notifications")
@UseGuards(JwtAuthGuard)
export class ScheduledNotificationController {
  constructor(
    private scheduledNotificationService: ScheduledNotificationService,
    private fcmService: FCMService,
    private deviceTokenService: DeviceTokenService
  ) {}

  /**
   * Schedule a notification for a user
   */
  @Post("schedule")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "TEACHER")
  async scheduleNotification(@Body() dto: ScheduleNotificationDto) {
    const id = await this.scheduledNotificationService.scheduleNotification({
      ...dto,
      scheduledFor: new Date(dto.scheduledFor),
    });

    return {
      success: true,
      notificationId: id,
      message: "Notification scheduled successfully",
    };
  }

  /**
   * Schedule exam reminders for multiple students
   */
  @Post("schedule/exam-reminders")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "TEACHER")
  async scheduleExamReminders(@Body() dto: ScheduleExamReminderDto) {
    await this.scheduledNotificationService.scheduleExamReminders(
      dto.examId,
      dto.examTitle,
      new Date(dto.examStartTime),
      dto.studentIds,
      dto.reminderMinutes
    );

    return {
      success: true,
      message: `Exam reminders scheduled for ${dto.studentIds.length} students`,
    };
  }

  /**
   * Cancel scheduled notifications for a reference
   */
  @Delete("schedule/:referenceId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "TEACHER")
  async cancelScheduledNotifications(
    @Param("referenceId") referenceId: string,
    @Query("triggerType") triggerType?: NotificationTriggerType
  ) {
    const count =
      await this.scheduledNotificationService.cancelScheduledNotifications(
        referenceId,
        triggerType
      );

    return {
      success: true,
      cancelledCount: count,
      message: `Cancelled ${count} scheduled notifications`,
    };
  }

  /**
   * Get scheduled notification statistics
   */
  @Get("schedule/stats")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async getScheduleStatistics() {
    const stats = await this.scheduledNotificationService.getStatistics();
    return {
      success: true,
      statistics: stats,
    };
  }

  /**
   * Get device token statistics
   */
  @Get("tokens/stats")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async getTokenStatistics() {
    const stats = await this.deviceTokenService.getTokenStatistics();
    return {
      success: true,
      statistics: stats,
    };
  }

  /**
   * Test push notification (admin only)
   */
  @Post("test")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async testPushNotification(@Body() dto: TestPushDto) {
    const result = await this.fcmService.sendByPlatform(
      dto.token,
      dto.platform,
      {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        priority: "high",
      }
    );

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Check FCM service status
   */
  @Get("status")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  async getServiceStatus() {
    return {
      fcmReady: this.fcmService.isReady(),
      schedulerActive: true,
    };
  }

  /**
   * Get user's registered devices
   */
  @Get("my-devices")
  async getMyDevices(@GetUser("id") userId: string) {
    const tokens = await this.deviceTokenService.getUserTokens(userId);
    return {
      success: true,
      devices: tokens.map((t) => ({
        id: t.id,
        platform: t.platform,
        deviceId: t.deviceId,
        lastUsed: t.lastUsed,
        isActive: t.isActive,
      })),
    };
  }
}
