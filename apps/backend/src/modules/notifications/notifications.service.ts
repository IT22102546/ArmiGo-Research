// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { EmailService } from "./services/email.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private emailService: EmailService) {}

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
  }) {
    this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`);
    
    // Store in database - you can implement this later
    // For now, just log and return
    return {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
    };
  }

  async notifyAboutApproval(
    userId: string,
    title: string,
    name: string,
    approved: boolean,
    reason?: string
  ) {
    const message = approved
      ? `Your ${title} has been approved! Welcome to ArmiGo.`
      : `Your ${title} has been rejected. Reason: ${reason || "Not specified"}`;

    await this.createNotification({
      userId,
      title: `${title} ${approved ? "Approved" : "Rejected"}`,
      message,
      type: "GENERAL",
    });

    // You can also send email if needed
    // This would require user email lookup
  }
}