// src/modules/notifications/services/email.service.ts
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    
    // Placeholder - implement actual email sending later
    console.log(`
      ===== EMAIL =====
      To: ${to}
      Subject: ${subject}
      Body: ${body}
      ================
    `);

    return { success: true };
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${process.env.WEB_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    const subject = "Reset Your ArmiGo Password";
    const body = `
      Hello ${name},
      
      You requested to reset your password. Click the link below to proceed:
      
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      ArmiGo Team
    `;

    return this.sendEmail(email, subject, body);
  }
}