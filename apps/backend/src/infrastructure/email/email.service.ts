import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface NotificationEmailData {
  recipientName: string;
  recipientEmail: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  type: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>(
      "EMAIL_FROM",
      "noreply@learnup.com"
    );
    this.fromName = this.configService.get<string>(
      "EMAIL_FROM_NAME",
      "LearnUp Platform"
    );

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailEnabled =
      this.configService.get<string>("EMAIL_ENABLED", "false") === "true";

    if (!emailEnabled) {
      this.logger.warn(
        "Email service is disabled. Set EMAIL_ENABLED=true to enable."
      );
      return;
    }

    const emailHost = this.configService.get<string>("EMAIL_HOST");
    const emailPort = this.configService.get<number>("EMAIL_PORT", 587);
    const emailUser = this.configService.get<string>("EMAIL_USER");
    const emailPassword = this.configService.get<string>("EMAIL_PASSWORD");
    const emailSecure =
      this.configService.get<string>("EMAIL_SECURE", "false") === "true";

    if (!emailHost || !emailUser || !emailPassword) {
      this.logger.warn(
        "Email configuration incomplete. Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD"
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.logger.log("✉️ Email service initialized successfully");

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error("Email transporter verification failed:", error);
          this.transporter = null;
        } else {
          this.logger.log("✅ Email transporter verified and ready");
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        "Failed to initialize email transporter:",
        errorMessage
      );
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn("Email transporter not available. Email not sent.");
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to send email: ${errorMessage}`);
      return false;
    }
  }

  async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    const html = this.generateNotificationEmailHtml(data);
    const text = this.generateNotificationEmailText(data);

    return this.sendEmail({
      to: data.recipientEmail,
      subject: data.title,
      html,
      text,
    });
  }

  async sendBulkNotificationEmails(
    notifications: NotificationEmailData[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      const success = await this.sendNotificationEmail(notification);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(`Bulk email send complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  async sendDigestEmail(
    recipientEmail: string,
    recipientName: string,
    notifications: Array<{ title: string; message: string; createdAt: string }>
  ): Promise<boolean> {
    const html = this.generateDigestEmailHtml(recipientName, notifications);
    const text = this.generateDigestEmailText(recipientName, notifications);

    return this.sendEmail({
      to: recipientEmail,
      subject: `Daily Digest - ${notifications.length} Unread Notifications`,
      html,
      text,
    });
  }

  private generateNotificationEmailHtml(data: NotificationEmailData): string {
    const typeColors: Record<string, string> = {
      EXAM_UPDATE: "#3b82f6",
      CLASS_UPDATE: "#10b981",
      SYSTEM: "#6b7280",
      ANNOUNCEMENT: "#8b5cf6",
    };

    const color = typeColors[data.type] || "#6b7280";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LearnUp Platform</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">${data.title}</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.recipientName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                ${data.message}
              </p>
              ${
                data.actionUrl && data.actionText
                  ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="border-radius: 4px; background-color: ${color};">
                    <a href="${data.actionUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      ${data.actionText}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LearnUp Platform. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                You received this email because you are registered on LearnUp Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateNotificationEmailText(data: NotificationEmailData): string {
    let text = `${data.title}\n\n`;
    text += `Hi ${data.recipientName},\n\n`;
    text += `${data.message}\n\n`;

    if (data.actionUrl && data.actionText) {
      text += `${data.actionText}: ${data.actionUrl}\n\n`;
    }

    text += `© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.\n`;
    text += `You received this email because you are registered on LearnUp Platform.`;

    return text;
  }

  private generateDigestEmailHtml(
    recipientName: string,
    notifications: Array<{ title: string; message: string; createdAt: string }>
  ): string {
    const notificationItems = notifications
      .map(
        (notif) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="color: #333333; margin: 0 0 8px 0; font-size: 16px;">${notif.title}</h3>
          <p style="color: #666666; margin: 0 0 8px 0; line-height: 1.5;">${notif.message}</p>
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            ${new Date(notif.createdAt).toLocaleString()}
          </p>
        </td>
      </tr>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Daily Notification Digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${recipientName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                You have ${notifications.length} unread notification${notifications.length === 1 ? "" : "s"} waiting for you.
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${notificationItems}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 4px; background-color: #3b82f6;">
                    <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      View All Notifications
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LearnUp Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateDigestEmailText(
    recipientName: string,
    notifications: Array<{ title: string; message: string; createdAt: string }>
  ): string {
    let text = `Daily Notification Digest\n\n`;
    text += `Hi ${recipientName},\n\n`;
    text += `You have ${notifications.length} unread notification${notifications.length === 1 ? "" : "s"} waiting for you.\n\n`;

    notifications.forEach((notif, index) => {
      text += `${index + 1}. ${notif.title}\n`;
      text += `   ${notif.message}\n`;
      text += `   ${new Date(notif.createdAt).toLocaleString()}\n\n`;
    });

    text += `View all notifications: ${process.env.FRONTEND_URL}\n\n`;
    text += `© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.`;

    return text;
  }

  isAvailable(): boolean {
    return this.transporter !== null;
  }
}
