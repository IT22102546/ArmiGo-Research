import { Process, Processor } from "@nestjs/bull";
import { Logger, Injectable } from "@nestjs/common";
import { Job } from "bull";
import { NotificationJobData } from "../../shared/services/queue.service";
import { PushNotificationService } from "../push/push-notification.service";
import { PrismaService } from "../../database/prisma.service";

@Processor("notifications")
@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private pushNotificationService: PushNotificationService,
    private prisma: PrismaService
  ) {}

  @Process("send-notification")
  async handleSendNotification(job: Job<NotificationJobData>) {
    this.logger.log(
      `Processing notification job ${job.id} for user ${job.data.userId}`
    );

    try {
      // Send push notification using Firebase
      const result = await this.sendPushNotification(job.data);

      // If push was successful to at least one device, mark as delivered (Double tick ✓✓)
      if (result.devicesSent > 0 && job.data.data?.notificationId) {
        await this.markNotificationDelivered(job.data.data.notificationId);
      }

      this.logger.log(
        `Notification processed for user ${job.data.userId} - Success: ${result.success}, Sent to ${result.devicesSent} devices`
      );
      return { userId: job.data.userId, ...result };
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${job.data.userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Mark notification as delivered (Double tick ✓✓)
   * Called when push notification is successfully sent to user's device
   */
  private async markNotificationDelivered(
    notificationId: string
  ): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { deliveredAt: new Date() },
      });
      this.logger.debug(
        `Notification ${notificationId} marked as delivered (double tick)`
      );
    } catch (error) {
      this.logger.warn(
        `Failed to mark notification ${notificationId} as delivered: ${error}`
      );
    }
  }

  private async sendPushNotification(data: NotificationJobData): Promise<{
    success: boolean;
    devicesSent: number;
    devicesFailed: number;
  }> {
    // Get user's active device tokens
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: {
        userId: data.userId,
        isActive: true,
      },
    });

    if (deviceTokens.length === 0) {
      this.logger.debug(`No active devices for user ${data.userId}`);
      return { success: true, devicesSent: 0, devicesFailed: 0 };
    }

    const tokens = deviceTokens.map((dt) => dt.token);

    // Send push notifications to all devices
    const result = await this.pushNotificationService.sendToDevices(tokens, {
      title: data.title,
      body: data.message,
      data: {
        type: data.type,
        notificationId: data.data?.notificationId || "",
        ...Object.fromEntries(
          Object.entries(data.data || {}).map(([k, v]) => [k, String(v)])
        ),
      },
    });

    // Deactivate invalid tokens
    if (result.invalidTokens.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: {
          token: { in: result.invalidTokens },
        },
        data: {
          isActive: false,
        },
      });
      this.logger.log(
        `Deactivated ${result.invalidTokens.length} invalid device tokens`
      );
    }

    return {
      success: result.successCount > 0 || deviceTokens.length === 0,
      devicesSent: result.successCount,
      devicesFailed: result.failureCount,
    };
  }
}
