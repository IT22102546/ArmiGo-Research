import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { PrismaService } from "@database/prisma.service";
import { FCMService, FCMPayload } from "./fcm.service";
import { DeviceTokenService } from "./device-token.service";

export type NotificationTriggerType =
  | "exam_reminder"
  | "class_reminder"
  | "payment_due"
  | "assignment_due"
  | "seminar_reminder"
  | "announcement"
  | "custom";

export interface ScheduledNotificationDto {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  triggerType: NotificationTriggerType;
  referenceId?: string; // examId, classId, etc.
  scheduledFor: Date;
  priority?: "high" | "normal";
  reminderMinutes?: number[]; // e.g., [5, 15, 60] for 5min, 15min, 1hr before
}

export interface BulkScheduleDto {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  triggerType: NotificationTriggerType;
  referenceId?: string;
  scheduledFor: Date;
  priority?: "high" | "normal";
}

@Injectable()
export class ScheduledNotificationService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledNotificationService.name);
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private fcmService: FCMService,
    private deviceTokenService: DeviceTokenService,
    private schedulerRegistry: SchedulerRegistry
  ) {}

  onModuleInit() {
    this.logger.log("📅 Scheduled Notification Service initialized");
  }

  /**
   * Schedule a notification for a specific user
   */
  async scheduleNotification(dto: ScheduledNotificationDto): Promise<string> {
    const notification = await this.prisma.scheduledNotification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        data: dto.data ? JSON.stringify(dto.data) : null,
        triggerType: dto.triggerType,
        referenceId: dto.referenceId,
        scheduledFor: dto.scheduledFor,
        priority: dto.priority || "normal",
        status: "PENDING",
      },
    });

    this.logger.log(
      `📅 Scheduled notification ${notification.id} for user ${dto.userId} at ${dto.scheduledFor}`
    );

    return notification.id;
  }

  /**
   * Schedule notifications for multiple users (e.g., exam reminders)
   */
  async scheduleBulkNotifications(dto: BulkScheduleDto): Promise<number> {
    const notifications = await this.prisma.scheduledNotification.createMany({
      data: dto.userIds.map((userId) => ({
        userId,
        title: dto.title,
        body: dto.body,
        data: dto.data ? JSON.stringify(dto.data) : null,
        triggerType: dto.triggerType,
        referenceId: dto.referenceId,
        scheduledFor: dto.scheduledFor,
        priority: dto.priority || "normal",
        status: "PENDING",
      })),
    });

    this.logger.log(
      `📅 Scheduled ${notifications.count} bulk notifications for ${dto.scheduledFor}`
    );

    return notifications.count;
  }

  /**
   * Schedule exam reminders with multiple time points (5min, 15min, 1hr before)
   */
  async scheduleExamReminders(
    examId: string,
    examTitle: string,
    examStartTime: Date,
    studentIds: string[],
    reminderMinutes: number[] = [5, 15, 60]
  ): Promise<void> {
    const reminders = reminderMinutes.map((minutes) => {
      const scheduledFor = new Date(examStartTime.getTime() - minutes * 60000);
      const timeLabel =
        minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} minutes`;

      return {
        scheduledFor,
        title: `⏰ Exam Reminder`,
        body: `"${examTitle}" starts in ${timeLabel}. Get ready!`,
        data: {
          examId,
          type: "exam_reminder",
          minutesBefore: String(minutes),
        },
      };
    });

    for (const reminder of reminders) {
      // Only schedule if the reminder time is in the future
      if (reminder.scheduledFor > new Date()) {
        await this.scheduleBulkNotifications({
          userIds: studentIds,
          title: reminder.title,
          body: reminder.body,
          data: reminder.data,
          triggerType: "exam_reminder",
          referenceId: examId,
          scheduledFor: reminder.scheduledFor,
          priority: "high",
        });
      }
    }

    this.logger.log(
      `📅 Scheduled exam reminders for ${studentIds.length} students, exam: ${examId}`
    );
  }

  /**
   * Schedule class/session reminders
   */
  async scheduleClassReminders(
    classId: string,
    className: string,
    startTime: Date,
    studentIds: string[],
    reminderMinutes: number[] = [5, 15]
  ): Promise<void> {
    for (const minutes of reminderMinutes) {
      const scheduledFor = new Date(startTime.getTime() - minutes * 60000);

      if (scheduledFor > new Date()) {
        await this.scheduleBulkNotifications({
          userIds: studentIds,
          title: `📚 Class Starting Soon`,
          body: `"${className}" starts in ${minutes} minutes`,
          data: {
            classId,
            type: "class_reminder",
            minutesBefore: String(minutes),
          },
          triggerType: "class_reminder",
          referenceId: classId,
          scheduledFor,
          priority: "normal",
        });
      }
    }
  }

  /**
   * Cancel scheduled notifications for a reference (e.g., when exam is cancelled)
   */
  async cancelScheduledNotifications(
    referenceId: string,
    triggerType?: NotificationTriggerType
  ): Promise<number> {
    const where: any = {
      referenceId,
      status: "PENDING",
    };

    if (triggerType) {
      where.triggerType = triggerType;
    }

    const result = await this.prisma.scheduledNotification.updateMany({
      where,
      data: {
        status: "CANCELLED",
        processedAt: new Date(),
      },
    });

    this.logger.log(
      `❌ Cancelled ${result.count} scheduled notifications for reference: ${referenceId}`
    );

    return result.count;
  }

  /**
   * Process pending notifications (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingNotifications(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent overlapping processing
    }

    this.isProcessing = true;

    try {
      const now = new Date();

      // Fetch notifications due for sending (scheduled time has passed)
      const pendingNotifications =
        await this.prisma.scheduledNotification.findMany({
          where: {
            status: "PENDING",
            scheduledFor: { lte: now },
          },
          take: 100, // Process in batches
          orderBy: { scheduledFor: "asc" },
        });

      if (pendingNotifications.length === 0) {
        return;
      }

      this.logger.log(
        `📤 Processing ${pendingNotifications.length} pending notifications`
      );

      for (const notification of pendingNotifications) {
        try {
          await this.sendScheduledNotification(notification);

          // Mark as sent
          await this.prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              processedAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.error(
            `Failed to send notification ${notification.id}:`,
            error
          );

          // Mark as failed
          await this.prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              processedAt: new Date(),
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send a scheduled notification via FCM
   */
  private async sendScheduledNotification(notification: {
    id: string;
    userId: string;
    title: string;
    body: string;
    data: string | null;
    priority: string;
  }): Promise<void> {
    // Get user's device tokens
    const deviceTokens = await this.deviceTokenService.getUserTokens(
      notification.userId
    );

    if (deviceTokens.length === 0) {
      this.logger.debug(
        `No active devices for user ${notification.userId}, storing notification only`
      );

      // Still create in-app notification even without push
      await this.createInAppNotification(notification);
      return;
    }

    const payload: FCMPayload = {
      title: notification.title,
      body: notification.body,
      data: notification.data ? JSON.parse(notification.data) : {},
      priority: notification.priority as "high" | "normal",
      sound: "default",
    };

    // Send to all user's devices based on platform
    const results = await Promise.all(
      deviceTokens.map((token) =>
        this.fcmService.sendByPlatform(
          token.token,
          token.platform as "android" | "ios" | "web",
          payload
        )
      )
    );

    // Deactivate invalid tokens
    const invalidTokens = deviceTokens
      .filter((_, idx) => {
        const result = results[idx];
        return (
          !result.success &&
          (result.error?.includes("not-registered") ||
            result.error?.includes("invalid"))
        );
      })
      .map((t) => t.token);

    if (invalidTokens.length > 0) {
      await this.deviceTokenService.deactivateMultipleTokens(invalidTokens);
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.debug(
      `Sent notification to ${successCount}/${deviceTokens.length} devices for user ${notification.userId}`
    );

    // Create in-app notification
    await this.createInAppNotification(notification);
  }

  /**
   * Create an in-app notification record
   */
  private async createInAppNotification(notification: {
    userId: string;
    title: string;
    body: string;
    data: string | null;
  }): Promise<void> {
    const parsedData = notification.data ? JSON.parse(notification.data) : {};
    const notificationType = this.mapTriggerTypeToNotificationType(
      parsedData.type || "SYSTEM"
    );

    await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notificationType,
        title: notification.title,
        message: notification.body,
        data: notification.data,
        sentAt: new Date(),
      },
    });
  }

  private mapTriggerTypeToNotificationType(
    triggerType: string
  ):
    | "EXAM_REMINDER"
    | "CLASS_UPDATE"
    | "PAYMENT_UPDATE"
    | "SYSTEM"
    | "CHAT_MESSAGE"
    | "ANNOUNCEMENT"
    | "GRADE_RELEASED"
    | "GENERAL" {
    const typeMap: Record<
      string,
      | "EXAM_REMINDER"
      | "CLASS_UPDATE"
      | "PAYMENT_UPDATE"
      | "SYSTEM"
      | "CHAT_MESSAGE"
      | "ANNOUNCEMENT"
      | "GRADE_RELEASED"
      | "GENERAL"
    > = {
      exam_reminder: "EXAM_REMINDER",
      class_reminder: "CLASS_UPDATE",
      payment_due: "PAYMENT_UPDATE",
      announcement: "ANNOUNCEMENT",
      custom: "GENERAL",
      assignment_due: "CLASS_UPDATE",
      seminar_reminder: "CLASS_UPDATE",
      grade_released: "GRADE_RELEASED",
      chat_message: "CHAT_MESSAGE",
    };
    return typeMap[triggerType] || "SYSTEM";
  }

  /**
   * Clean up old processed notifications (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.scheduledNotification.deleteMany({
      where: {
        status: { in: ["SENT", "FAILED", "CANCELLED"] },
        processedAt: { lt: thirtyDaysAgo },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `🧹 Cleaned up ${result.count} old scheduled notifications`
      );
    }
  }

  /**
   * Get statistics for scheduled notifications
   */
  async getStatistics(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const [pending, sent, failed, cancelled] = await Promise.all([
      this.prisma.scheduledNotification.count({ where: { status: "PENDING" } }),
      this.prisma.scheduledNotification.count({ where: { status: "SENT" } }),
      this.prisma.scheduledNotification.count({ where: { status: "FAILED" } }),
      this.prisma.scheduledNotification.count({
        where: { status: "CANCELLED" },
      }),
    ]);

    return { pending, sent, failed, cancelled };
  }
}
