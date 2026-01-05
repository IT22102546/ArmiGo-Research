import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as crypto from "crypto";
import { TwoFactorMethod } from "@prisma/client";
import { AppException } from "../../../common/errors/app-exception";
import { ErrorCode } from "../../../common/errors/error-codes.enum";

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = "aes-256-gcm";

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    // Use a dedicated encryption key for 2FA secrets
    this.encryptionKey =
      this.configService.get<string>("security.twoFactorEncryptionKey") ||
      this.configService.get<string>("security.sessionSecret") ||
      "x".repeat(32);

    if (!this.encryptionKey || this.encryptionKey.length < 32) {
      throw new Error(
        "TWO_FACTOR_ENCRYPTION_KEY must be at least 32 characters"
      );
    }
  }

  /**
   * Generate TOTP secret and QR code for user
   */
  async generateTotpSecret(
    userId: string,
    userEmail: string
  ): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `LearnApp Platform (${userEmail})`,
      issuer: "LearnApp",
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(8);

    // Encrypt secret and backup codes before storing
    const encryptedSecret = this.encrypt(secret.base32 || "");
    const encryptedBackupCodes = backupCodes.map((code) => this.encrypt(code));

    // Store in database (but don't enable 2FA yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
        twoFactorMethod: TwoFactorMethod.TOTP,
        // Don't set twoFactorEnabled yet - user must verify first
      },
    });

    this.logger.log(`TOTP secret generated for user ${userId}`);

    return {
      secret: secret.base32 || "",
      qrCode: qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnableTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      throw AppException.badRequest(
        ErrorCode.TWO_FA_NOT_SETUP,
        "2FA is not set up for this account"
      );
    }

    // Decrypt the secret
    const secret = this.decrypt(user.twoFactorSecret);

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      this.logger.warn(`Failed 2FA verification for user ${userId}`);
      throw AppException.unauthorized("Invalid 2FA token");
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    // Log security event
    await this.logSecurityEvent(userId, "TWO_FACTOR_ENABLED", true);

    this.logger.log(`2FA enabled for user ${userId}`);
    return true;
  }

  /**
   * Verify TOTP token during login
   */
  async verifyTotp(
    userId: string,
    token: string,
    isBackupCode = false
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      throw AppException.badRequest(
        ErrorCode.TWO_FA_NOT_ENABLED,
        "2FA is not enabled for this account"
      );
    }

    // If using backup code
    if (isBackupCode) {
      return this.verifyBackupCode(userId, token, user.twoFactorBackupCodes);
    }

    // Verify TOTP token
    const secret = this.decrypt(user.twoFactorSecret!);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    // Log the attempt
    await this.logSecurityEvent(
      userId,
      verified ? "TWO_FACTOR_VERIFIED" : "TWO_FACTOR_FAILED",
      verified
    );

    if (!verified) {
      this.logger.warn(`Failed 2FA verification for user ${userId}`);
      throw AppException.unauthorized("Invalid 2FA token");
    }

    return true;
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    userId: string,
    code: string,
    encryptedBackupCodes: string[]
  ): Promise<boolean> {
    // Decrypt all backup codes
    const backupCodes = encryptedBackupCodes.map((encrypted) =>
      this.decrypt(encrypted)
    );

    // Check if code matches any backup code
    const codeIndex = backupCodes.findIndex(
      (backupCode) => backupCode === code
    );

    if (codeIndex === -1) {
      await this.logSecurityEvent(userId, "TWO_FACTOR_FAILED", false);
      throw AppException.unauthorized("Invalid backup code");
    }

    // Remove used backup code
    const updatedCodes = [...encryptedBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: updatedCodes,
      },
    });

    // Log security event
    await this.logSecurityEvent(userId, "TWO_FACTOR_BACKUP_USED", true);

    this.logger.log(
      `Backup code used for user ${userId}. ${updatedCodes.length} codes remaining`
    );
    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, token: string): Promise<void> {
    // Verify token before disabling
    await this.verifyTotp(userId, token);

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorMethod: null,
      },
    });

    // Log security event
    await this.logSecurityEvent(userId, "TWO_FACTOR_DISABLED", true);

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    token: string
  ): Promise<string[]> {
    // Verify token before regenerating
    await this.verifyTotp(userId, token);

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(8);
    const encryptedBackupCodes = backupCodes.map((code) => this.encrypt(code));

    // Update database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);
    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Encrypt sensitive data (2FA secret, backup codes)
   */
  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      // Return: iv:authTag:encrypted
      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      this.logger.error("Encryption failed", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];

      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      this.logger.error("Decryption failed", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean
  ): Promise<void> {
    try {
      await this.prisma.securityAuditLog.create({
        data: {
          userId,
          action: action as any,
          resource: "two_factor_authentication",
          success,
          ipAddress: "system",
          userAgent: "system",
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      this.logger.error("Failed to log security event", error);
    }
  }
}
