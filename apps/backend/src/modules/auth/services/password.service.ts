import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

/**
 * PasswordService
 *
 * Handles all password-related operations including:
 * - Password hashing with configurable salt rounds
 * - Password verification
 * - Password strength validation
 * - Secure password generation
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    this.saltRounds = this.configService.get<number>(
      "security.bcryptSaltRounds",
      12
    );
  }

  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      this.logger.debug("Password hashed successfully");
      return hash;
    } catch (error) {
      this.logger.error("Failed to hash password:", error);
      throw new Error("Password hashing failed");
    }
  }

  /**
   * Verify a password against its hash
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      this.logger.debug(
        `Password verification: ${isValid ? "SUCCESS" : "FAILED"}`
      );
      return isValid;
    } catch (error) {
      this.logger.error("Password verification error:", error);
      return false;
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and message
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one special character",
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a secure random password using cryptographically secure randomness
   * @param length - Length of the password (default: 16)
   * @returns Randomly generated password meeting complexity requirements
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = lowercase + uppercase + numbers + special;
    const passwordArray: string[] = [];

    // SECURITY: Use crypto.randomInt for secure random selection
    // Ensure at least one of each required character type
    passwordArray.push(lowercase[crypto.randomInt(lowercase.length)]);
    passwordArray.push(uppercase[crypto.randomInt(uppercase.length)]);
    passwordArray.push(numbers[crypto.randomInt(numbers.length)]);
    passwordArray.push(special[crypto.randomInt(special.length)]);

    // Fill the rest randomly using crypto
    for (let i = passwordArray.length; i < length; i++) {
      passwordArray.push(allChars[crypto.randomInt(allChars.length)]);
    }

    // SECURITY: Shuffle using Fisher-Yates with crypto random
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    return passwordArray.join("");
  }
}
