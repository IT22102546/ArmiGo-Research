import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import axios from "axios";
import { PrismaService } from "@database/prisma.service";
import { UsersService } from "../users/users.service";
import { RegisterDto, TeacherRegisterDto, LoginDto } from "./dto";
import { JwtPayload } from "./strategies/jwt.strategy";
import {
  User,
  UserRole,
  Prisma,
  SecurityAuditLog,
  SecurityAction,
} from "@prisma/client";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { AppException, ErrorCode } from "@common/errors";
import { EmailService } from "../notifications/services/email.service";
import { AdminGateway } from "@infrastructure/websocket/admin.gateway";
import { RegistrationNumberService } from "../../shared/services/registration-number.service";

/**
 * Generate a cryptographically secure 6-digit OTP
 * Uses crypto.randomInt for secure random number generation
 */
function generateSecureOtp(): string {
  // Generate a random number between 100000 and 999999 (6 digits)
  return crypto.randomInt(100000, 1000000).toString();
}

// Type for user data needed for token generation
interface TokenUser {
  id: string;
  email: string | null;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

// Type for device info
interface DeviceInfo {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  isTrusted?: boolean;
}

// Type for security event logging
interface SecurityEvent {
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

export interface AuthResponse {
  user: {
    id: string;
    phone: string;
    email?: string | null;
    firstName: string;
    dateOfBirth?: string | Date | null;
    lastName: string;
    role: string;
    status?: string | null;
    registrationNumber?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

const QUICKSEND_CONFIG = {
  apiKey: process.env.QUICKSEND_API_KEY,
  senderID: process.env.QUICKSEND_SENDER_ID || "LearnApp",
  baseURL: "https://quicksend.lk/Client/api.php",
};

// Email transporter for OTP emails
// SECURITY: Credentials must be configured via environment variables
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Validate email configuration at startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn(
    "⚠️ EMAIL_USER and EMAIL_PASSWORD environment variables not set. Email functionality will not work."
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
    private readonly adminGateway: AdminGateway,
    private readonly registrationNumberService: RegistrationNumberService
  ) {}

  async register(
    registerDto: RegisterDto | TeacherRegisterDto,
    deviceInfo?: { deviceId?: string; ipAddress?: string; userAgent?: string },
    verificationToken?: string // Add this parameter
  ): Promise<AuthResponse> {
    try {
      this.logger.log(`Starting registration for phone: ${registerDto.phone}`);

      // PREVENT INTERNAL TEACHER SIGNUP
      if ("role" in registerDto && registerDto.role === "INTERNAL_TEACHER") {
        throw new BadRequestException(
          "Internal teacher accounts can only be created by administrators."
        );
      }

      // If verification token is provided, validate it
      if (verificationToken) {
        try {
          const decoded = this.jwtService.verify(verificationToken);

          if (
            decoded.type !== "signup_verification" ||
            decoded.phone !== registerDto.phone
          ) {
            throw new BadRequestException("Invalid verification token");
          }

          // Check if the temp signup record is verified
          const tempSignup = await this.prisma.tempSignup.findUnique({
            where: { phone: registerDto.phone.replace(/\D/g, "") },
          });

          if (!tempSignup || !tempSignup.verified) {
            throw new BadRequestException(
              "Phone number not verified. Please complete OTP verification first."
            );
          }
        } catch (error) {
          throw new BadRequestException(
            "Invalid or expired verification token"
          );
        }
      }

      // Check if user already exists
      const existingUser = await this.usersService.findByPhone(
        registerDto.phone
      );
      if (existingUser) {
        throw new ConflictException(
          "User with this phone number already exists"
        );
      }

      // Validate terms acceptance for teacher registration
      if ("acceptTerms" in registerDto && !registerDto.acceptTerms) {
        throw new BadRequestException(
          "You must accept the terms and conditions"
        );
      }

      // Hash password
      const saltRounds = this.configService.get<number>(
        "security.bcryptSaltRounds",
        12
      );
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        saltRounds
      );

      // Use transaction for ALL database operations
      return await this.prisma.$transaction(async (tx) => {
        // Create clean user data - only include fields that exist on User model
        const userData: any = {
          phone: registerDto.phone,
          email: registerDto.email || null,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          dateOfBirth: registerDto.dateOfBirth,
          role: registerDto.role,
          phoneVerified: true,
          status: "ACTIVE",
          username: `user_${registerDto.phone}_${Date.now()}`,
        };

        // Handle district relation if provided
        if (registerDto.district) {
          let district = await tx.district.findUnique({
            where: { name: registerDto.district },
          });

          if (!district) {
            district = await tx.district.create({
              data: { name: registerDto.district },
            });
          }

          userData.district = { connect: { id: district.id } };
        }

        this.logger.log(
          `Creating user with data: ${JSON.stringify({
            phone: userData.phone,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            // Don't log password for security
          })}`
        );

        // Create user within transaction - only include valid User model fields
        const user = await tx.user.create({
          data: userData,
        });

        this.logger.log(`✅ User created with ID: ${user.id}`);

        // For students, create StudentProfile with additional fields
        if (
          registerDto.role === UserRole.INTERNAL_STUDENT ||
          registerDto.role === UserRole.EXTERNAL_STUDENT
        ) {
          await this.handleStudentProfileCreationWithTx(
            user.id,
            registerDto,
            tx
          );
        }

        // Handle teacher-specific data (only for external teachers)
        else if (
          "role" in registerDto &&
          registerDto.role === UserRole.EXTERNAL_TEACHER
        ) {
          await this.handleTeacherRegistrationWithTx(
            user.id,
            registerDto as TeacherRegisterDto,
            tx
          );
          this.logger.log(`✅ Teacher profile created for user: ${user.id}`);
        }

        // Generate tokens WITHIN the same transaction
        const tokens = await this.generateTokensWithTx(user, tx, deviceInfo);

        this.logger.log(
          `✅ Tokens generated successfully for user: ${user.id}`
        );

        // Clean up temp signup record after successful registration
        if (verificationToken) {
          const cleanPhone = registerDto.phone.replace(/\D/g, "");
          await this.prisma.tempSignup
            .delete({
              where: { phone: cleanPhone },
            })
            .catch((error) => {
              this.logger.warn(
                `Failed to delete temp signup record: ${error.message}`
              );
            });
        }

        return {
          user: {
            id: user.id,
            phone: user.phone,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      });
    } catch (error) {
      this.logger.error(`Registration failed: `, error);
      throw error;
    }
  }

  /**
   * Handle student profile creation within transaction
   */
  private async handleStudentProfileCreationWithTx(
    userId: string,
    registerDto: RegisterDto,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const studentProfileData: any = {
      userId,
    };

    // Handle grade if provided - use gradeId directly
    if (registerDto.grade) {
      const grade = await tx.grade.findUnique({
        where: { name: registerDto.grade },
      });

      if (!grade) {
        this.logger.warn(
          `Grade "${registerDto.grade}" not found for student profile`
        );
      } else {
        studentProfileData.gradeId = grade.id; // Use gradeId directly
      }
    }

    // Handle medium if provided - use mediumId directly
    if (registerDto.medium) {
      const medium = await tx.medium.findUnique({
        where: { name: registerDto.medium },
      });

      if (!medium) {
        this.logger.warn(
          `Medium "${registerDto.medium}" not found for student profile`
        );
      } else {
        studentProfileData.mediumId = medium.id; // Use mediumId directly
      }
    }

    // Add other student-specific fields
    if (registerDto.school) {
      studentProfileData.schoolName = registerDto.school;
    }

    if (registerDto.zone) {
      // Store zone in a custom field or add it to the model later
      // For now, using guardianName as temporary storage
      studentProfileData.guardianName = registerDto.zone;
    }

    if (registerDto.institution) {
      studentProfileData.sourceInstitution = registerDto.institution;
    }

    // Create student profile
    await tx.studentProfile.create({
      data: studentProfileData,
    });

    this.logger.log(`✅ Student profile created for user: ${userId}`);
  }

  async login(
    loginDto: LoginDto,
    deviceInfo?: { deviceId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<AuthResponse> {
    this.logger.log(`Login attempt for identifier: ${loginDto.identifier}`);

    // Check if identifier is phone number (not email)
    const isPhoneNumber = !loginDto.identifier.includes("@");

    // Find user by phone or email
    const user = await this.usersService.findByPhoneOrEmail(
      loginDto.identifier
    );

    if (!user) {
      this.logger.warn(
        `Login failed: User not found for identifier: ${loginDto.identifier}`
      );
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, undefined, {
        identifier: loginDto.identifier,
      });
    }

    // SECURITY: Prevent admin users from logging in with phone numbers
    // Admins (ADMIN and SUPER_ADMIN) MUST use email for login
    if (
      isPhoneNumber &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
    ) {
      this.logger.warn(
        `Login failed: Admin user ${user.email} attempted to login with phone number`
      );
      throw new AppException(
        ErrorCode.INVALID_LOGIN_METHOD,
        "Administrators must login using their email address",
        { role: user.role, attemptedMethod: "phone" }
      );
    }

    this.logger.log(
      `User found: ${user.email || user.phone} (Role: ${user.role})`
    );

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed: Invalid password for user: ${user.email || user.phone}`
      );
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, undefined, {
        identifier: loginDto.identifier,
      });
    }

    this.logger.log(`Password verified for user: ${user.email || user.phone}`);

    // Validate role if allowedRoles is provided
    if (loginDto.allowedRoles && loginDto.allowedRoles.length > 0) {
      const isRoleAllowed = loginDto.allowedRoles.includes(
        user.role as UserRole
      );
      if (!isRoleAllowed) {
        // Log role mismatch details for server-side diagnostics but do not
        // include role/permission details in the client-visible error to avoid
        // leaking information about roles/permissions.
        this.logger.warn(
          `Login failed: Role ${user.role} not allowed for this endpoint. Allowed roles: ${loginDto.allowedRoles.join(", ")}`
        );

        // Return a sanitized error to the client so we do not leak sensitive
        // role/permission information. Use INVALID_CREDENTIALS so the client
        // receives a generic 401 response.
        throw new AppException(ErrorCode.INVALID_CREDENTIALS, undefined);
      }
      this.logger.log(`Role ${user.role} validated successfully`);
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    this.logger.log(`Login successful for user: ${user.email || user.phone}`);

    // Generate tokens with device info
    const tokens = await this.generateTokens(user, deviceInfo);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dateOfBirth: user.dateOfBirth || null,
        status: user.status,
      },
      // ✅ Return JWT tokens
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ========== MOBILE OTP VERIFICATION METHODS ==========

  async requestMobileVerification(dto: { mobile: string }) {
    const { mobile } = dto;

    // Check if mobile already registered
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: mobile },
    });

    if (existingUser) {
      throw new BadRequestException("Mobile number already registered");
    }

    // SECURITY: Use cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Use TempSignup table for OTP storage
    const tempSignup = await this.prisma.tempSignup.upsert({
      where: { phone: mobile },
      update: {
        otp,
        otpExpires,
        attempts: 0,
        verified: false,
      },
      create: {
        phone: mobile,
        otp,
        otpExpires,
      },
    });

    // Send OTP via SMS (implementation in sendSmsOtp)
    await this.sendSmsOtp(mobile, otp);

    return {
      success: true,
      message: "OTP sent successfully",
      tempSignupId: tempSignup.id,
      otpExpires: otpExpires,
    };
  }

  async verifyMobileWithOtp(dto: {
    mobile: string;
    otp: string;
    tempSignupId: string;
  }) {
    const { mobile, otp, tempSignupId } = dto;

    const tempSignup = await this.prisma.tempSignup.findFirst({
      where: {
        id: tempSignupId,
        phone: mobile,
        otp,
        otpExpires: { gt: new Date() },
        verified: false,
      },
    });

    if (!tempSignup) {
      // Increment attempt counter
      await this.prisma.tempSignup.updateMany({
        where: { phone: mobile },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Invalid or expired OTP");
    }

    // Mark TempSignup as verified
    await this.prisma.tempSignup.update({
      where: { id: tempSignup.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        otp: null,
      },
    });

    const tempToken = this.jwtService.sign(
      { tempSignupId: tempSignup.id, phone: mobile, temp: true },
      { expiresIn: "1h" }
    );

    return {
      success: true,
      message: "Mobile number verified successfully",
      tempToken,
      tempSignupId: tempSignup.id,
    };
  }

  async completeSignup(dto: {
    mobile?: string;
    email: string;
    fullName: string;
    dateOfBirth: string;
    userType: string;
    district?: string;
    zone?: string;
    grade?: string;
    school?: string;
    medium?: string;
    institution?: string;
    password: string;
  }) {
    const {
      mobile,
      email,
      fullName,
      dateOfBirth,
      userType,
      district,
      zone,
      grade,
      school,
      medium,
      institution,
      password,
    } = dto;

    // Verify that mobile was verified via TempSignup
    if (mobile) {
      const tempSignup = await this.prisma.tempSignup.findFirst({
        where: {
          phone: mobile,
          verified: true,
        },
      });

      if (!tempSignup) {
        throw new BadRequestException(
          "Mobile number not verified. Please verify OTP first."
        );
      }
    }

    // Generate username from full name
    const generateUsername = (fullName: string) => {
      const baseUsername = fullName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "")
        .replace(/\s+/g, "");

      // Use crypto for secure random suffix
      const randomSuffix = crypto.randomInt(1000, 10000);
      return `${baseUsername}${randomSuffix}`;
    };

    const username = generateUsername(fullName);

    // Check for existing users with same email, username, or phone
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }, ...(mobile ? [{ phone: mobile }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException("Email already registered");
      }
      if (existingUser.username === username) {
        throw new BadRequestException("Username already taken");
      }
      if (existingUser.phone === mobile) {
        throw new BadRequestException("Mobile number already registered");
      }
    }

    // SECURITY: Use configured salt rounds
    const saltRounds = this.configService.get<number>(
      "security.bcryptSaltRounds",
      12
    );
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Split fullName into firstName and lastName
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || nameParts[0];

    // Map userType string to UserRole enum
    const roleMap: { [key: string]: UserRole } = {
      teacher: UserRole.EXTERNAL_TEACHER,
      external_teacher: UserRole.EXTERNAL_TEACHER,
      internal_teacher: UserRole.INTERNAL_TEACHER,
      internal_student: UserRole.INTERNAL_STUDENT,
      external_student: UserRole.EXTERNAL_STUDENT,
      admin: UserRole.ADMIN,
      super_admin: UserRole.SUPER_ADMIN,
    };

    const role = roleMap[userType.toLowerCase()] || UserRole.INTERNAL_STUDENT;

    // Create the new user
    const newUser = await this.prisma.user.create({
      data: {
        phone: mobile!,
        email,
        firstName,
        lastName,
        username,
        role,
        password: hashedPassword,
        phoneVerified: true,
      },
    });

    // Clean up the TempSignup record
    if (mobile) {
      await this.prisma.tempSignup.deleteMany({
        where: { phone: mobile },
      });
    }

    // If user is external teacher, create teacher profile
    if (role === UserRole.EXTERNAL_TEACHER) {
      await this.prisma.teacherProfile.create({
        data: {
          userId: newUser.id,
          employeeId: `EMP_${newUser.id}`,
          sourceInstitution: institution || school || "Not specified",
        },
      });
    }

    return {
      success: true,
      message: "Signup completed successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
        username: newUser.username,
        role: newUser.role,
      },
    };
  }

  // ========== ACCOUNT MANAGEMENT METHODS ==========

  async checkAccountExists(emailOrPhone: string) {
    const isEmail = emailOrPhone.includes("@");
    let user = null;

    if (isEmail) {
      user = await this.prisma.user.findFirst({
        where: {
          email: emailOrPhone.toLowerCase(),
        },
      });
    } else {
      const cleanMobile = emailOrPhone.replace(/\D/g, "");

      // Check phone field with various formats
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanMobile },
            { phone: `94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `+94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `0${cleanMobile.substring(cleanMobile.length - 9)}` },
          ],
        },
      });
    }

    if (!user) {
      return {
        success: false,
        exists: false,
        message: isEmail
          ? "No account found with this email"
          : "No account found with this phone number",
      };
    }

    return {
      success: true,
      exists: true,
      message: "Account found",
      userType: user.role,
      isEmail: isEmail,
      userId: user.id,
    };
  }

  // ========== PASSWORD RESET WITH OTP METHODS ==========

  async sendPasswordResetOtp(emailOrPhone: string, isEmail: boolean) {
    let user;

    if (isEmail) {
      user = await this.prisma.user.findFirst({
        where: {
          email: emailOrPhone.toLowerCase(),
        },
      });
    } else {
      const cleanMobile = emailOrPhone.replace(/\D/g, "");

      // Check phone field with various formats
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanMobile },
            { phone: `94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `+94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `0${cleanMobile.substring(cleanMobile.length - 9)}` },
          ],
        },
      });
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // SECURITY: Use cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in PasswordReset table instead of User
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: otp,
        expiresAt: otpExpires,
      },
    });

    if (isEmail) {
      await this.sendEmailOtp(emailOrPhone, otp);
    } else {
      // Send SMS OTP using QuickSend
      await this.sendSmsOtp(emailOrPhone, otp);
    }

    return {
      success: true,
      message: `OTP sent successfully via ${isEmail ? "email" : "SMS"}`,
      emailOrPhone: isEmail
        ? emailOrPhone
        : emailOrPhone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2"),
      otpExpires: otpExpires,
      isEmail: isEmail,
      userId: user.id,
    };
  }

  private async sendEmailOtp(email: string, otp: string) {
    const mailOptions = {
      from: "Learn APP <projecttest088@gmail.com>",
      to: email,
      subject: "Learn APP - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; text-align: center;">Learn APP</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #000; margin-bottom: 10px;">Password Reset Request</h3>
            <p style="color: #666; margin-bottom: 20px;">
              Use the following OTP code to reset your password. This code will expire in 10 minutes.
            </p>
            <div style="background: #fff; padding: 15px; border-radius: 8px; text-align: center; border: 2px dashed #3b82f6;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
  }

  private async sendSmsOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Clean and format mobile number
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      // Format for QuickSend: Remove 94 prefix if present
      const formattedPhone = cleanPhone.startsWith("94")
        ? cleanPhone.substring(2) // Remove 94 prefix
        : cleanPhone;

      this.logger.log(`📱 Sending SMS OTP via QuickSend to: ${formattedPhone}`);
      this.logger.log(`📱 OTP: ${otp}`);
      this.logger.log(`📱 Sender ID: ${QUICKSEND_CONFIG.senderID}`);

      const message = `Your LearnApp verification code is: ${otp}. This code expires in 10 minutes.`;

      // Method 1: Using GET-style POST (as per your working code)
      const response = await axios.post(
        QUICKSEND_CONFIG.baseURL,
        null, // No body data
        {
          params: {
            FUN: "SEND_SINGLE",
            with_get: "true",
            up: QUICKSEND_CONFIG.apiKey,
            senderID: QUICKSEND_CONFIG.senderID,
            msg: message,
            to: formattedPhone,
          },
          headers: {
            Authorization: `Bearer ${QUICKSEND_CONFIG.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      this.logger.log(`📱 QuickSend API Response:`, response.data);

      // Check if SMS was sent successfully
      if (response.data && response.data.status === "success") {
        this.logger.log(`✅ SMS OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        throw new Error(response.data.message || "Failed to send SMS");
      }
    } catch (error: any) {
      this.logger.error(`❌ QuickSend SMS Error:`, {
        error: error.response?.data || error.message,
        status: error.response?.status,
        url: error.config?.url,
      });

      // Try fallback method
      return await this.tryAlternativeSmsMethod(phoneNumber, otp);
    }
  }
  private async tryAlternativeSmsMethod(
    phoneNumber: string,
    otp: string
  ): Promise<boolean> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("94")
        ? cleanPhone.substring(2)
        : cleanPhone;

      this.logger.log(
        `📱 Trying alternative SMS method for: ${formattedPhone}`
      );

      const message = `Your LearnApp verification code is: ${otp}. This code expires in 10 minutes.`;

      // Alternative: Try POST with JSON body
      const response = await axios.post(
        `${QUICKSEND_CONFIG.baseURL}?FUN=SEND_SINGLE`,
        {
          senderID: QUICKSEND_CONFIG.senderID,
          to: formattedPhone,
          msg: message,
        },
        {
          headers: {
            Authorization: `Bearer ${QUICKSEND_CONFIG.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      this.logger.log(`📱 QuickSend Alternative Response:`, response.data);

      if (response.data && response.data.status === "success") {
        this.logger.log(`✅ SMS sent successfully via alternative method`);
        return true;
      } else {
        throw new Error(response.data.message || "Failed to send SMS");
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Alternative SMS method failed:`,
        error.response?.data || error.message
      );

      // Fallback to email
      return await this.fallbackToEmail(phoneNumber, otp);
    }
  }

  /**
   * Fallback to email if SMS fails
   */
  private async fallbackToEmail(
    phoneNumber: string,
    otp: string
  ): Promise<boolean> {
    try {
      // Find user by phone number to get their email
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: `94${cleanPhone.substring(cleanPhone.length - 9)}` },
            { phone: `+94${cleanPhone.substring(cleanPhone.length - 9)}` },
            { phone: `0${cleanPhone.substring(cleanPhone.length - 9)}` },
          ],
        },
      });

      if (user?.email) {
        this.logger.log(`📧 Falling back to email OTP for ${user.email}`);
        await this.sendEmailOtp(user.email, otp);
        return true;
      }

      throw new BadRequestException(
        `Failed to send OTP. No email found for user.`
      );
    } catch (error: any) {
      this.logger.error(`❌ Email fallback failed:`, error.message);
      throw new BadRequestException(
        `Failed to send OTP via SMS or email. Please try again later.`
      );
    }
  }

  async verifyPasswordResetOtp(
    emailOrPhone: string,
    isEmail: boolean,
    otp: string
  ) {
    let user;

    if (isEmail) {
      user = await this.prisma.user.findFirst({
        where: {
          email: emailOrPhone.toLowerCase(),
        },
      });
    } else {
      const cleanMobile = emailOrPhone.replace(/\\D/g, "");

      // Check phone field with various formats
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanMobile },
            { phone: `94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `+94${cleanMobile.substring(cleanMobile.length - 9)}` },
            { phone: `0${cleanMobile.substring(cleanMobile.length - 9)}` },
          ],
        },
      });
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Look up OTP from PasswordReset table using token field
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        token: otp,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!passwordReset) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    // Mark the OTP as used
    await this.prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true, usedAt: new Date() },
    });

    const resetToken = this.jwtService.sign(
      { id: user.id, type: "password_reset" },
      { expiresIn: "1h" }
    );

    return {
      success: true,
      message: "OTP verified successfully",
      resetToken,
      userId: user.id,
    };
  }

  async resetPasswordWithToken(resetToken: string, newPassword: string) {
    const decoded = this.jwtService.verify(resetToken);

    if (decoded.type !== "password_reset") {
      throw new BadRequestException("Invalid reset token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all existing tokens for security
    await this.revokeAllUserTokens(user.id);

    return {
      success: true,
      message: "Password reset successfully",
    };
  }

  // ========== EXISTING AUTH METHODS (unchanged) ==========

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the refresh token with strict options
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        algorithms: ["HS256"], // Only allow HS256
        ignoreExpiration: false, // Reject expired tokens
        clockTolerance: 0, // No clock tolerance
      });

      // Check if refresh token exists and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        this.logger.warn(
          `Refresh token not found in database for user ${payload.sub}`
        );
        throw new AppException(
          ErrorCode.INVALID_TOKEN,
          "Invalid refresh token - please login again",
          { userId: payload.sub }
        );
      }

      if (storedToken.revoked) {
        this.logger.warn(
          `Revoked refresh token attempt for user ${payload.sub}`
        );
        // Delete the revoked token from database to clean up
        await this.prisma.refreshToken
          .delete({
            where: { token: refreshToken },
          })
          .catch(() => {
            // Ignore deletion errors
          });
        throw new AppException(
          ErrorCode.TOKEN_REVOKED,
          "Refresh token has been revoked - please login again",
          { userId: payload.sub }
        );
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await this.revokeToken(refreshToken);
        this.logger.warn(
          `Expired refresh token attempt for user ${payload.sub}`
        );
        throw new AppException(ErrorCode.TOKEN_EXPIRED, undefined, {
          userId: payload.sub,
        });
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`Refresh token for non-existent user ${payload.sub}`);
        throw new AppException(
          ErrorCode.USER_NOT_FOUND,
          "User associated with this token no longer exists",
          { userId: payload.sub }
        );
      }

      // Use rotateWithSlidingSession to preserve the existing session
      // This prevents session validation failures and ensures session continuity
      const newTokens = await this.rotateWithSlidingSession(refreshToken, user);
      this.logger.log(
        `Token refreshed successfully for user ${user.id} (session preserved)`
      );
      return newTokens;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }

      // Handle JWT verification errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(`Invalid refresh token: ${errorMessage}`);
      throw new AppException(
        ErrorCode.INVALID_TOKEN,
        "Invalid or malformed refresh token"
      );
    }
  }

  async validateUserById(userId: string) {
    return this.usersService.findById(userId);
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      // SECURITY FIX: Check if ANY valid (non-revoked, non-expired) refresh token exists for this session
      // This handles the race condition during token rotation where the old token is revoked
      // but new requests might still use the old access token momentarily
      const session = await this.prisma.refreshToken.findFirst({
        where: {
          sessionId,
          revoked: false,
          expiresAt: { gt: new Date() }, // Must not be expired
          session: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
        orderBy: {
          createdAt: "desc", // Get the most recent valid token
        },
      });
      return !!session;
    } catch (error) {
      this.logger.error(
        `Session validation error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async validateSessionToken(
    sessionId: string,
    refreshToken: string
  ): Promise<boolean> {
    try {
      const session = await this.prisma.refreshToken.findFirst({
        where: {
          sessionId,
          token: refreshToken,
          revoked: false,
          expiresAt: { gt: new Date() },
          session: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
      });
      return !!session;
    } catch (error) {
      this.logger.error(
        `Session token validation error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async logout(userId: string): Promise<void> {
    await this.tokenBlacklistService.blacklistAllUserTokens(
      userId,
      "User logout"
    );

    await this.revokeAllUserTokens(userId);

    await this.usersService.updateLastLogout(userId);

    this.logger.log(
      `User ${userId} logged out successfully - all sessions revoked`
    );
  }

  /**
   * Generate JWT access and refresh tokens for a user
   */
  private async generateTokens(
    user: TokenUser,
    deviceInfo?: DeviceInfo
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    // SECURITY: Generate cryptographically secure unique session ID to bind access and refresh tokens
    const sessionId = `sess_${crypto.randomUUID()}`;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.expiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"),
        audience: this.configService.get<string>("jwt.audience"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"),
        audience: this.configService.get<string>("jwt.audience"),
      }),
    ]);

    const refreshExpiresIn = this.configService.get<string>(
      "jwt.refreshExpiresIn",
      "7d"
    );
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);

    // Create auth session record
    try {
      await this.prisma.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          fingerprint: deviceInfo?.fingerprint || `session-${sessionId}`,
          deviceId: deviceInfo?.deviceId,
          deviceType: deviceInfo?.deviceType,
          browser: deviceInfo?.browser,
          os: deviceInfo?.os,
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
          isTrusted: false,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create auth session for user ${user.id}: ${error}`
      );
      throw new AppException(
        ErrorCode.DATABASE_ERROR,
        "Failed to create authentication session",
        { userId: user.id }
      );
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        sessionId,
        expiresAt,
        deviceId: deviceInfo?.deviceId,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      },
    });

    // Notify connected admin clients about new session
    this.adminGateway.notifySessionCreated({
      userId: user.id,
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email || "",
      deviceType: this.getDeviceType(deviceInfo?.userAgent),
      browser: this.getBrowser(deviceInfo?.userAgent),
      os: this.getOS(deviceInfo?.userAgent),
      ipAddress: deviceInfo?.ipAddress || "Unknown",
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateTokensWithTx(
    user: TokenUser,
    tx: Prisma.TransactionClient,
    deviceInfo?: DeviceInfo
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    // SECURITY: Generate cryptographically secure unique session ID to bind access and refresh tokens
    const sessionId = `sess_${crypto.randomUUID()}`;

    // NOTE: Do NOT include iss/aud in payload - they will be added by signOptions
    // This ensures consistency with generateTokens method
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.expiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"), // ✅ Here
        audience: this.configService.get<string>("jwt.audience"), // ✅ Here
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"), // ✅ Here
        audience: this.configService.get<string>("jwt.audience"), // ✅ Here
      }),
    ]);

    const refreshExpiresIn = this.configService.get<string>(
      "jwt.refreshExpiresIn",
      "7d"
    );
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);

    try {
      // Create the auth session record first to satisfy FK constraint
      await tx.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          fingerprint: deviceInfo?.fingerprint || `session-${sessionId}`,
          deviceId: deviceInfo?.deviceId,
          deviceType: deviceInfo?.deviceType,
          browser: deviceInfo?.browser,
          os: deviceInfo?.os,
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
          isTrusted: false,
          expiresAt,
        },
      });

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          sessionId,
          expiresAt,
          deviceId: deviceInfo?.deviceId,
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
        },
      });

      this.logger.log(` Refresh token created for user: ${user.id}`);

      // Notify connected admin clients about new session (defer until after transaction)
      setImmediate(() => {
        this.adminGateway.notifySessionCreated({
          userId: user.id,
          userRole: user.role,
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          userEmail: user.email || "",
          deviceType: this.getDeviceType(deviceInfo?.userAgent),
          browser: this.getBrowser(deviceInfo?.userAgent),
          os: this.getOS(deviceInfo?.userAgent),
          ipAddress: deviceInfo?.ipAddress || "Unknown",
        });
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to create refresh token for user ${user.id}:`,
        error
      );
      throw new AppException(
        ErrorCode.DATABASE_ERROR,
        "Failed to create authentication session",
        { userId: user.id }
      );
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async rotateToken(
    oldToken: string,
    user: TokenUser,
    deviceInfo?: DeviceInfo
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    // Revoke old token
    await this.revokeToken(oldToken);
    return this.generateTokens(user, deviceInfo);
  }

  /**
   * Rotate token with sliding session extension - used by refreshToken method
   */
  private async rotateWithSlidingSession(
    oldToken: string,
    user: TokenUser,
    deviceInfo?: DeviceInfo
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    // Get the old token's session info
    const oldTokenData = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: { session: true },
    });

    if (!oldTokenData || !oldTokenData.session) {
      // Fallback to regular rotation
      return this.rotateToken(oldToken, user, deviceInfo);
    }

    // Extend session expiry
    const refreshExpiresIn = this.configService.get<string>(
      "jwt.refreshExpiresIn",
      "7d"
    );
    const newExpiresAt = this.calculateExpiryDate(refreshExpiresIn);

    // Update session expiry and last activity
    await this.prisma.authSession.update({
      where: { id: oldTokenData.sessionId },
      data: {
        expiresAt: newExpiresAt,
        lastActiveAt: new Date(),
      },
    });

    // Generate new tokens with same session ID
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: oldTokenData.sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.expiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"),
        audience: this.configService.get<string>("jwt.audience"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn"),
        algorithm: "HS256",
        issuer: this.configService.get<string>("jwt.issuer"),
        audience: this.configService.get<string>("jwt.audience"),
      }),
    ]);

    // Store new refresh token BEFORE revoking old one
    // This prevents race condition where old access token fails validation
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        sessionId: oldTokenData.sessionId,
        expiresAt: newExpiresAt,
        deviceId: deviceInfo?.deviceId || oldTokenData.deviceId,
        ipAddress: deviceInfo?.ipAddress || oldTokenData.ipAddress,
        userAgent: deviceInfo?.userAgent || oldTokenData.userAgent,
      },
    });

    // Revoke old token AFTER creating new one
    // This ensures there's always at least one valid refresh token for the session
    await this.revokeToken(oldToken);

    this.logger.log(
      `Session extended for user ${user.id} - new expiry: ${newExpiresAt.toISOString()}`
    );

    return { accessToken, refreshToken };
  }

  /**
   * Parse duration string (e.g., "15m", "1h", "7d") to seconds
   */
  private parseDurationToSeconds(duration: string): number {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      this.logger.warn(
        `Invalid duration format: ${duration}, using default 15 minutes`
      );
      return 900; // 15 minutes default
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "d":
        return value * 24 * 60 * 60;
      case "h":
        return value * 60 * 60;
      case "m":
        return value * 60;
      case "s":
        return value;
      default:
        return 900; // 15 minutes default
    }
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revoked: true,
            revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });

    return result.count;
  }

  private calculateExpiryDate(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
      case "d":
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case "h":
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case "m":
        return new Date(now.getTime() + value * 60 * 1000);
      case "s":
        return new Date(now.getTime() + value * 1000);
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: "password-reset" },
      {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: "1h",
      }
    );

    // Send email with reset link
    await this.emailService.sendPasswordResetEmail(
      user.email!,
      `${user.firstName} ${user.lastName}`,
      resetToken
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("jwt.secret"),
        algorithms: ["HS256"],
      });

      if (payload.type !== "password-reset") {
        throw new AppException(
          ErrorCode.INVALID_TOKEN,
          "Token is not a valid password reset token",
          { tokenType: payload.type }
        );
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, undefined, {
          userId: payload.sub,
        });
      }

      const saltRounds = this.configService.get<number>(
        "security.bcryptSaltRounds",
        12
      );
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await Promise.all([
        this.usersService.updatePassword(user.id, hashedPassword),
        this.tokenBlacklistService.blacklistAllUserTokens(
          user.id,
          "Password reset"
        ),
      ]);

      this.logger.log(`Password reset successful for user ${user.id}`);
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.warn(
        `Password reset failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new AppException(
        ErrorCode.PASSWORD_RESET_EXPIRED,
        "Invalid or expired password reset token"
      );
    }
  }

  // LEGACY: Previously created teacher profile and transfer requests during registration. Kept for reference — remove or re-enable as required.

  /**
   * Handle teacher registration within transaction
   */
  private async handleTeacherRegistrationWithTx(
    userId: string,
    teacherDto: TeacherRegisterDto,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const {
      registrationId,
      currentSchool,
      currentZone,
      currentDistrict,
      desiredZones,
      subject,
      medium,
      level,
    } = teacherDto;

    await tx.teacherProfile.upsert({
      where: { userId },
      update: {
        employeeId: registrationId,
        isExternalTransferOnly: true,
        sourceInstitution: currentSchool,
      },
      create: {
        userId,
        employeeId: registrationId,
        isExternalTransferOnly: true,
        sourceInstitution: currentSchool,
      },
    });

    // Create transfer request if all required fields are provided
    if (
      registrationId &&
      currentSchool &&
      currentZone &&
      desiredZones?.length
    ) {
      try {
        // Look up Zone by name (required)
        const zone = await tx.zone.findFirst({
          where: { name: { equals: currentZone, mode: "insensitive" } },
        });

        if (!zone) {
          this.logger.warn(
            `External teacher registration: Zone "${currentZone}" not found, skipping transfer request`
          );
          return;
        }

        // Look up Subject by name (use "General" as default)
        const subjectRecord = await tx.subject.findFirst({
          where: {
            name: { equals: subject || "General", mode: "insensitive" },
          },
        });

        if (!subjectRecord) {
          this.logger.warn(
            `External teacher registration: Subject "${subject || "General"}" not found, skipping transfer request`
          );
          return;
        }

        // Look up Medium by name (use "English" as default)
        const mediumRecord = await tx.medium.findFirst({
          where: { name: { equals: medium || "English", mode: "insensitive" } },
        });

        if (!mediumRecord) {
          this.logger.warn(
            `External teacher registration: Medium "${medium || "English"}" not found, skipping transfer request`
          );
          return;
        }

        // Look up District if provided
        let districtId: string | null = null;
        if (currentDistrict) {
          const district = await tx.district.findFirst({
            where: { name: { equals: currentDistrict, mode: "insensitive" } },
          });
          districtId = district?.id || null;
        }

        // Look up desired zones
        const desiredZoneRecords = await tx.zone.findMany({
          where: {
            name: { in: desiredZones, mode: "insensitive" },
          },
        });

        // Create the transfer request
        const transferRequest = await tx.transferRequest.create({
          data: {
            requesterId: userId,
            uniqueId: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fromZoneId: zone.id,
            subjectId: subjectRecord.id,
            mediumId: mediumRecord.id,
            currentSchool,
            currentDistrictId: districtId,
            level: level || "A/L",
            isInternalTeacher: false,
            status: "PENDING",
          },
        });

        // Create desired zone relations
        if (desiredZoneRecords.length > 0) {
          await tx.transferRequestDesiredZone.createMany({
            data: desiredZoneRecords.map((z, index) => ({
              transferRequestId: transferRequest.id,
              zoneId: z.id,
              priority: index + 1,
            })),
          });
        }

        this.logger.log(
          `External teacher ${userId} transfer request created: ${transferRequest.uniqueId}`
        );
      } catch (error) {
        // Log error but don't fail registration - teacher profile is more important
        this.logger.error(
          `Failed to create transfer request for external teacher ${userId}:`,
          error
        );
      }
    }
  }

  /**
   * Generate impersonation token with original user ID
   * SECURITY: Impersonation tokens have a special "impersonation" type marker
   * and are strictly time-limited
   */
  async generateImpersonationToken(
    originalUserId: string,
    targetUser: TokenUser
  ): Promise<string> {
    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      originalUserId, // Store original admin user ID
      impersonationStartTime: Date.now(),
      tokenType: "impersonation", // SECURITY: Mark as impersonation token
    };

    // SECURITY: Use full signing options including issuer and audience
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("jwt.secret"),
      expiresIn: "1h", // Impersonation tokens expire in 1 hour
      algorithm: "HS256",
      issuer: this.configService.get<string>("jwt.issuer"),
      audience: this.configService.get<string>("jwt.audience"),
    });
  }

  /**
   * Generate regular access token
   * SECURITY: Uses full security claims (issuer, audience, algorithm)
   */
  async generateAccessToken(user: TokenUser): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // SECURITY: Use full signing options for consistency
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("jwt.secret"),
      expiresIn: this.configService.get<string>("jwt.expiresIn"),
      algorithm: "HS256",
      issuer: this.configService.get<string>("jwt.issuer"),
      audience: this.configService.get<string>("jwt.audience"),
    });
  }

  /**
   * Log security event to audit log
   */
  async logSecurityEvent(event: {
    userId: string;
    action: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, unknown>;
  }) {
    await this.prisma.securityAuditLog.create({
      data: {
        userId: event.userId,
        action: event.action as SecurityAction,
        resource: "auth",
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        success: true,
        metadata: event.details
          ? (JSON.parse(JSON.stringify(event.details)) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  /**
   * Get recent login activities for a user (for device management)
   */
  async getRecentLoginActivities(userId: string): Promise<SecurityAuditLog[]> {
    return this.prisma.securityAuditLog.findMany({
      where: {
        userId,
        action: { in: ["LOGIN_SUCCESS", "TWO_FACTOR_VERIFIED"] },
        success: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      distinct: ["ipAddress", "userAgent"],
    });
  }

  // Add to AuthService
  async sendSignupOtp(phone: string) {
    // First check if phone already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: phone,
      },
    });

    if (existingUser) {
      throw new ConflictException("Phone number already registered");
    }

    // Clean the phone number
    const cleanPhone = phone.replace(/\D/g, "");

    // SECURITY: Use cryptographically secure 4-digit OTP
    const otp = crypto.randomInt(1000, 10000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update a temporary signup record
    let tempSignup = await this.prisma.tempSignup.findUnique({
      where: { phone: cleanPhone },
    });

    if (tempSignup) {
      // Update existing record
      tempSignup = await this.prisma.tempSignup.update({
        where: { phone: cleanPhone },
        data: {
          otp,
          otpExpires,
          attempts: 0,
          verified: false,
        },
      });
    } else {
      // Create new record
      tempSignup = await this.prisma.tempSignup.create({
        data: {
          phone: cleanPhone,
          otp,
          otpExpires,
          attempts: 0,
          verified: false,
        },
      });
    }

    // Send SMS OTP
    await this.sendSmsOtp(phone, otp);

    return {
      success: true,
      message: "OTP sent successfully",
      tempSignupId: tempSignup.id,
      otpExpires: otpExpires,
    };
  }

  async verifySignupOtp(phone: string, otp: string) {
    const cleanPhone = phone.replace(/\D/g, "");

    const tempSignup = await this.prisma.tempSignup.findUnique({
      where: { phone: cleanPhone },
    });

    if (!tempSignup) {
      throw new BadRequestException(
        "No OTP request found. Please request a new OTP."
      );
    }

    if (tempSignup.verified) {
      throw new BadRequestException("Phone number already verified");
    }

    if (tempSignup.attempts >= 3) {
      throw new BadRequestException(
        "Too many attempts. Please request a new OTP."
      );
    }

    if (!tempSignup.otp || !tempSignup.otpExpires) {
      throw new BadRequestException("OTP expired. Please request a new one.");
    }

    if (new Date() > tempSignup.otpExpires) {
      await this.prisma.tempSignup.update({
        where: { phone: cleanPhone },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("OTP expired. Please request a new one.");
    }

    if (tempSignup.otp !== otp) {
      await this.prisma.tempSignup.update({
        where: { phone: cleanPhone },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Invalid OTP code. Please try again.");
    }

    // Mark as verified
    await this.prisma.tempSignup.update({
      where: { phone: cleanPhone },
      data: {
        verified: true,
        verifiedAt: new Date(),
        otp: null,
        otpExpires: null,
      },
    });

    // Generate a verification token for the frontend
    const verificationToken = this.jwtService.sign(
      {
        phone: cleanPhone,
        type: "signup_verification",
        tempSignupId: tempSignup.id,
      },
      { expiresIn: "1h" }
    );

    return {
      success: true,
      message: "Phone number verified successfully",
      verificationToken,
      tempSignupId: tempSignup.id,
    };
  }

  /**
   * Validate an access token for WebSocket authentication
   * Returns the user payload if valid, null if invalid
   *
   * @param token The JWT access token to validate
   * @returns User payload with id, email, role, or null if invalid
   */
  async validateAccessToken(token: string): Promise<{
    id: string;
    email: string | null;
    role: string;
    sessionId?: string;
  } | null> {
    try {
      // Verify the token with strict options
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("jwt.secret"),
        algorithms: ["HS256"],
        issuer: this.configService.get<string>("jwt.issuer"),
        audience: this.configService.get<string>("jwt.audience"),
        ignoreExpiration: false,
        clockTolerance: 0,
      });

      if (!payload || !payload.sub || !payload.role) {
        this.logger.warn(
          "Invalid JWT payload in socket auth: missing required fields"
        );
        return null;
      }

      // Check if session is still valid (if sessionId exists)
      if (payload.sessionId) {
        const sessionValid = await this.validateSession(payload.sessionId);
        if (!sessionValid) {
          this.logger.warn(
            `Socket auth: Session expired for user ${payload.sub}`
          );
          return null;
        }
      }

      // Validate user still exists
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`Socket auth: User ${payload.sub} not found`);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.debug(`Socket token validation failed: ${errorMessage}`);
      return null;
    }
  }

  // Helper methods for parsing user agent
  private getDeviceType(userAgent?: string): string {
    if (!userAgent) {
      return "desktop";
    }
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
      return "mobile";
    }
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return "tablet";
    }
    return "desktop";
  }

  private getBrowser(userAgent?: string): string {
    if (!userAgent) {
      return "Unknown";
    }
    if (/edg/i.test(userAgent)) {
      return "Edge";
    }
    if (/chrome/i.test(userAgent)) {
      return "Chrome";
    }
    if (/firefox/i.test(userAgent)) {
      return "Firefox";
    }
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      return "Safari";
    }
    if (/opera|opr/i.test(userAgent)) {
      return "Opera";
    }
    if (/msie|trident/i.test(userAgent)) {
      return "IE";
    }
    return "Unknown";
  }

  private getOS(userAgent?: string): string {
    if (!userAgent) {
      return "Unknown";
    }
    if (/windows/i.test(userAgent)) {
      return "Windows";
    }
    if (/macintosh|mac os/i.test(userAgent)) {
      return "macOS";
    }
    if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
      return "Linux";
    }
    if (/android/i.test(userAgent)) {
      return "Android";
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return "iOS";
    }
    return "Unknown";
  }

  /**
   * Get login activity/security audit logs for a user
   * Used by auth controller to display login history
   */
  async getSecurityAuditLogs(
    userId: string,
    options: {
      page: number;
      limit: number;
      actions?: string[];
    }
  ): Promise<{ logs: SecurityAuditLog[]; total: number }> {
    const where: Prisma.SecurityAuditLogWhereInput = {
      userId,
    };

    if (options.actions && options.actions.length > 0) {
      where.action = { in: options.actions as SecurityAction[] };
    }

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

