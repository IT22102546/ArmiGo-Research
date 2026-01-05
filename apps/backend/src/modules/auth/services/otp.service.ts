import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@database/prisma.service";
import { EmailService } from "../../notifications/services/email.service";
import * as crypto from "crypto";
import axios from "axios";

/**
 * OtpService
 *
 * Handles all OTP-related operations including:
 * - Secure OTP generation using crypto.randomInt
 * - OTP sending via SMS and Email
 * - OTP verification with expiry checking
 * - Rate limiting for OTP requests
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpExpiryMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {
    this.otpExpiryMinutes = this.configService.get<number>(
      "security.otpExpiryMinutes",
      10
    );
  }

  /**
   * Generate a cryptographically secure 6-digit OTP
   * @returns 6-digit OTP string
   */
  generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Calculate OTP expiry date
   * @returns Date object representing OTP expiry time
   */
  private getOtpExpiry(): Date {
    return new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
  }

  /**
   * Send OTP via email
   * @param email - Recipient email address
   * @param otp - OTP code to send
   * @returns Promise<boolean> indicating success
   */
  async sendEmailOtp(email: string, otp: string): Promise<boolean> {
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset OTP</h2>
            <p>Your OTP for password reset is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #007bff; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              ${otp}
            </div>
            <p>This OTP is valid for ${this.otpExpiryMinutes} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`Email OTP sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email OTP to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send OTP via SMS using QuickSend API
   * @param phoneNumber - Recipient phone number
   * @param otp - OTP code to send
   * @returns Promise<boolean> indicating success
   */
  async sendSmsOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const apiKey = this.configService.get<string>("sms.quicksend.apiKey");
    const senderID = this.configService.get<string>(
      "sms.quicksend.senderID",
      "LearnApp"
    );

    if (!apiKey) {
      this.logger.warn("QuickSend API key not configured");
      return false;
    }

    try {
      const message = `Your LearnApp password reset OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`;
      const response = await axios.get(
        "https://quicksend.lk/Client/api.php",
        {
          params: {
            email: this.configService.get<string>("sms.quicksend.email"),
            password: apiKey,
            to: phoneNumber,
            message: message,
            sender_id: senderID,
          },
          timeout: 10000,
        }
      );

      if (response.data.success || response.status === 200) {
        this.logger.log(`SMS OTP sent successfully to ${phoneNumber}`);
        return true;
      }

      this.logger.warn(`SMS API returned non-success: ${response.data}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to send SMS OTP to ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Store OTP in database
   * @param userId - User ID
   * @param otp - OTP code
   * @returns Promise<void>
   */
  async storeOtp(userId: string, otp: string): Promise<void> {
    // DISABLED: OTP fields removed from schema
    // const otpExpires = this.getOtpExpiry();

    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     otp,
    //     otpExpires,
    //   },
    // });

    this.logger.warn(`OTP storage disabled - OTP fields removed from schema`);
    throw new Error("OTP functionality not implemented");
  }

  /**
   * Verify OTP for a user
   * @param userId - User ID
   * @param otp - OTP code to verify
   * @returns Promise<boolean> indicating if OTP is valid
   */
  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    // DISABLED: OTP fields removed from schema
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    //   select: {
    //     otp: true,
    //     otpExpires: true,
    //   },
    // });

    // if (!user || !user.otp || !user.otpExpires) {
    //   this.logger.warn(`OTP verification failed: No OTP found for user ${userId}`);
    //   return false;
    // }

    // if (user.otpExpires < new Date()) {
    //   this.logger.warn(`OTP verification failed: Expired OTP for user ${userId}`);
    //   return false;
    // }

    // if (user.otp !== otp) {
    //   this.logger.warn(`OTP verification failed: Invalid OTP for user ${userId}`);
    //   return false;
    // }

    // this.logger.log(`OTP verified successfully for user ${userId}`);
    this.logger.warn(
      `OTP verification disabled - OTP fields removed from schema`
    );
    throw new Error("OTP functionality not implemented");
  }

  /**
   * Clear OTP from database
   * @param userId - User ID
   * @returns Promise<void>
   */
  async clearOtp(userId: string): Promise<void> {
    // DISABLED: OTP fields removed from schema
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     otp: null,
    //     otpExpires: null,
    //   },
    // });

    this.logger.debug(`OTP clear disabled - OTP fields removed from schema`);
  }

  /**
   * Check if user can request new OTP (rate limiting)
   * @param userId - User ID
   * @returns Promise<boolean> indicating if new OTP can be requested
   */
  async canRequestNewOtp(userId: string): Promise<boolean> {
    // DISABLED: OTP fields removed from schema
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    //   select: {
    //     otpExpires: true,
    //   },
    // });

    // if (!user || !user.otpExpires) {
    //   return true;
    // }

    // // Only allow new OTP if previous one has expired or about to expire (1 minute buffer)
    // const oneMinuteFromNow = new Date(Date.now() + 60 * 1000);
    // return user.otpExpires < oneMinuteFromNow;

    this.logger.warn(
      `OTP rate limiting disabled - OTP fields removed from schema`
    );
    return true; // Always allow for now
  }

  /**
   * Send OTP with automatic fallback (SMS -> Email)
   * @param userId - User ID
   * @param emailOrPhone - Email or phone number
   * @param isEmail - Whether to send to email or phone
   * @returns Promise<object> with success status and method used
   */
  async sendOtpWithFallback(
    userId: string,
    emailOrPhone: string,
    isEmail: boolean
  ): Promise<{ success: boolean; method: "email" | "sms"; otp: string }> {
    const otp = this.generateSecureOtp();
    await this.storeOtp(userId, otp);

    if (isEmail) {
      const emailSent = await this.sendEmailOtp(emailOrPhone, otp);
      if (emailSent) {
        return { success: true, method: "email", otp };
      }
      throw new BadRequestException("Failed to send OTP via email");
    } else {
      const smsSent = await this.sendSmsOtp(emailOrPhone, otp);
      if (smsSent) {
        return { success: true, method: "sms", otp };
      }

      // Fallback to email if SMS fails and user has email
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user?.email) {
        const emailSent = await this.sendEmailOtp(user.email, otp);
        if (emailSent) {
          this.logger.log(`Fell back to email for user ${userId}`);
          return { success: true, method: "email", otp };
        }
      }

      throw new BadRequestException(
        "Failed to send OTP via SMS and email fallback"
      );
    }
  }
}
