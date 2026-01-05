import { Process, Processor } from "@nestjs/bull";
import { Logger, Injectable } from "@nestjs/common";
import { Job } from "bull";
import { EmailJobData } from "../../shared/services/queue.service";
import { EmailService } from "../../modules/notifications/services/email.service";

@Processor("email")
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process("send-email")
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} for ${job.data.to}`);

    try {
      // Use the EmailService to send actual emails
      const success = await this.emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        html: this.generateEmailHtml(job.data),
        text: job.data.data?.text,
      });

      if (success) {
        this.logger.log(`Email sent successfully to ${job.data.to}`);
        return { success: true, recipient: job.data.to };
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML content based on template
   */
  private generateEmailHtml(data: EmailJobData): string {
    // If HTML is already provided, use it
    if (data.data?.html) {
      return data.data.html;
    }

    // Generate based on template
    switch (data.template) {
      case "welcome":
        return this.getWelcomeTemplate(data);
      case "password-reset":
        return this.getPasswordResetTemplate(data);
      case "notification":
        return this.getNotificationTemplate(data);
      case "payment-confirmation":
        return this.getPaymentConfirmationTemplate(data);
      default:
        return this.getDefaultTemplate(data);
    }
  }

  private getWelcomeTemplate(data: EmailJobData): string {
    const name = data.data?.name || "User";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to LearnUp!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Welcome to LearnUp Platform. We're excited to have you on board!</p>
              <p>Start exploring our courses and learning materials today.</p>
              <a href="${data.data?.loginUrl || "#"}" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(data: EmailJobData): string {
    const resetUrl = data.data?.resetUrl || "#";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
            </div>
            <div class="content">
              <p>You requested a password reset. Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getNotificationTemplate(data: EmailJobData): string {
    const title = data.data?.title || data.subject;
    const message = data.data?.message || "";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPaymentConfirmationTemplate(data: EmailJobData): string {
    const amount = data.data?.amount || "0.00";
    const transactionId = data.data?.transactionId || "N/A";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Confirmed</h1>
            </div>
            <div class="content">
              <p>Your payment has been successfully processed.</p>
              <div class="details">
                <p><strong>Amount:</strong> LKR ${amount}</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p>Thank you for your payment!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getDefaultTemplate(data: EmailJobData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.subject}</h1>
            </div>
            <div class="content">
              <p>${data.data?.message || "No content provided."}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnUp Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
