import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@database/prisma.service";
import { UsersService } from "../users/users.service";
import { RegisterDto, TeacherRegisterDto, LoginDto } from "./dto";
import { User, UserRole, Prisma } from "@prisma/client";
import { AppException, ErrorCode } from "@common/errors";
import { AdminGateway } from "@infrastructure/websocket/admin.gateway";
import { RegistrationNumberService } from "../../shared/services/registration-number.service";
import {
  PasswordService,
  OtpService,
  SessionService,
  TokenBlacklistService,
} from "./services";
import { AuthResponse, DeviceInfo, TokenUser } from "./interfaces";

/**
 * AuthCoreService - Core authentication service
 *
 * Orchestrates authentication flows by coordinating specialized services:
 * - PasswordService: Password hashing and verification
 * - OtpService: OTP generation and verification
 * - SessionService: Token and session management
 * - TokenBlacklistService: Token invalidation
 *
 * Responsibilities:
 * - User registration (students, teachers)
 * - User login with role-based validation
 * - Password reset flows
 * - Token refresh
 * - User validation
 */
@Injectable()
export class AuthCoreService {
  private readonly logger = new Logger(AuthCoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly adminGateway: AdminGateway,
    private readonly registrationNumberService: RegistrationNumberService
  ) {}

  // ==================== REGISTRATION ====================

  /**
   * Register a new user (student or teacher)
   * @param registerDto - Registration data
   * @param deviceInfo - Optional device information for session tracking
   * @returns AuthResponse with user data and tokens
   */
  async register(
    registerDto: RegisterDto | TeacherRegisterDto,
    deviceInfo?: DeviceInfo
  ): Promise<AuthResponse> {
    try {
      this.logger.log(`Starting registration for phone: ${registerDto.phone}`);

      // Prevent internal teacher signup
      if ("role" in registerDto && registerDto.role === "INTERNAL_TEACHER") {
        throw new BadRequestException(
          "Internal teacher accounts can only be created by administrators."
        );
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

      // Hash password using PasswordService
      const hashedPassword = await this.passwordService.hashPassword(
        registerDto.password
      );

      // Use transaction for atomic operation - user creation only
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user data
        const userData = await this.buildUserData(
          registerDto,
          hashedPassword,
          tx
        );

        // Create user
        const user = await tx.user.create({ data: userData });
        this.logger.log(`✅ User created with ID: ${user.id}`);

        // Handle role-specific data
        let registrationNumber: string | undefined;
        if ("role" in registerDto) {
          if (registerDto.role === UserRole.EXTERNAL_TEACHER) {
            await this.handleTeacherRegistration(
              user.id,
              registerDto as TeacherRegisterDto,
              tx
            );
          } else if (
            registerDto.role === UserRole.INTERNAL_STUDENT ||
            registerDto.role === UserRole.EXTERNAL_STUDENT
          ) {
            registrationNumber = await this.handleStudentRegistration(
              user.id,
              registerDto,
              tx
            );
          }
        }

        return { user, registrationNumber };
      });

      // Generate tokens after transaction commits
      const tokens = await this.sessionService.generateTokenPair(
        result.user as TokenUser,
        deviceInfo
      );

      this.logger.log(`✅ Registration completed for user: ${result.user.id}`);

      return {
        user: {
          id: result.user.id,
          phone: result.user.phone,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          registrationNumber: result.registrationNumber || null,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error(`Registration failed:`, error);
      throw error;
    }
  }

  /**
   * Build user data object for creation
   */
  private async buildUserData(
    registerDto: RegisterDto | TeacherRegisterDto,
    hashedPassword: string,
    tx: Prisma.TransactionClient
  ): Promise<any> {
    const userData: any = {
      phone: registerDto.phone,
      email: registerDto.email || null,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      dateOfBirth: registerDto.dateOfBirth,
      role: registerDto.role,
      isVerified: true,
      status: "ACTIVE",
      username: `user_${registerDto.phone}_${Date.now()}`,
    };

    // Handle district relation
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

    // Note: Fields like grade, school, medium, institution are handled
    // in handleStudentRegistration/handleTeacherRegistration, not on User model

    return userData;
  }

  /**
   * Handle teacher-specific registration
   */
  private async handleTeacherRegistration(
    userId: string,
    registerDto: TeacherRegisterDto,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // Resolve subject ID from single subject field
    let subjectId: string | undefined;
    if (registerDto.subject) {
      const subject = await tx.subject.findFirst({
        where: {
          OR: [
            { name: { equals: registerDto.subject, mode: "insensitive" } },
            { code: { equals: registerDto.subject, mode: "insensitive" } },
          ],
        },
      });
      if (subject) {
        subjectId = subject.id;
      }
    }

    // Resolve grade ID from level field
    let gradeId: string | undefined;
    if (registerDto.level) {
      const grade = await tx.grade.findFirst({
        where: {
          OR: [
            { name: { equals: registerDto.level, mode: "insensitive" } },
            { code: { equals: registerDto.level, mode: "insensitive" } },
          ],
        },
      });
      if (grade) {
        gradeId = grade.id;
      }
    }

    const teacherData: any = {
      userId,
      registrationId: registerDto.registrationId,
      currentSchool: registerDto.currentSchool,
      currentZone: registerDto.currentZone,
      currentDistrict: registerDto.currentDistrict,
      desiredZones: registerDto.desiredZones,
      subject: registerDto.subject,
      medium: registerDto.medium,
      level: registerDto.level,
    };

    if (subjectId) {
      teacherData.subjects = { connect: [{ id: subjectId }] };
    }
    if (gradeId) {
      teacherData.grades = { connect: [{ id: gradeId }] };
    }

    await tx.teacherProfile.create({ data: teacherData });

    this.logger.log(`✅ Teacher profile created for user: ${userId}`);
  }

  /**
   * Handle student-specific registration
   */
  private async handleStudentRegistration(
    userId: string,
    registerDto: RegisterDto | TeacherRegisterDto,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    // Resolve grade ID
    let gradeId: string | undefined;
    if (registerDto.grade) {
      const grade = await tx.grade.findFirst({
        where: {
          OR: [
            { name: { equals: registerDto.grade, mode: "insensitive" } },
            { code: { equals: registerDto.grade, mode: "insensitive" } },
          ],
        },
      });
      if (grade) {
        gradeId = grade.id;
      }
    }

    // Resolve institution ID from code
    let institutionId: string | undefined;
    if (registerDto.institution) {
      const institution = await tx.institution.findFirst({
        where: {
          OR: [
            { code: { equals: registerDto.institution, mode: "insensitive" } },
            { name: { equals: registerDto.institution, mode: "insensitive" } },
          ],
        },
      });
      if (institution) {
        institutionId = institution.id;
      } else {
        this.logger.warn(
          `Institution not found: ${registerDto.institution}, using default`
        );
      }
    }

    // Generate registration number with institution code
    const registrationNumber =
      await this.registrationNumberService.generateRegistrationNumber(
        registerDto.role as UserRole,
        gradeId,
        institutionId
      );

    // Resolve medium ID
    let mediumId: string | undefined;
    if (registerDto.medium) {
      const medium = await tx.medium.findFirst({
        where: {
          OR: [
            { name: { equals: registerDto.medium, mode: "insensitive" } },
            { code: { equals: registerDto.medium, mode: "insensitive" } },
          ],
        },
      });
      if (medium) {
        mediumId = medium.id;
      }
    }

    const studentData: any = {
      userId,
      studentId: registrationNumber,
      academicYear: new Date().getFullYear().toString(),
      schoolName: registerDto.school || null,
    };

    if (gradeId) {
      studentData.gradeId = gradeId;
    }
    if (mediumId) {
      studentData.mediumId = mediumId;
    }

    await tx.studentProfile.create({ data: studentData });

    this.logger.log(
      `✅ Student profile created with registration number: ${registrationNumber}`
    );

    return registrationNumber;
  }

  // ==================== LOGIN ====================

  /**
   * Authenticate user and generate tokens
   * @param loginDto - Login credentials
   * @param deviceInfo - Optional device information
   * @returns AuthResponse with user data and tokens
   */
  async login(
    loginDto: LoginDto,
    deviceInfo?: DeviceInfo
  ): Promise<AuthResponse> {
    this.logger.log(`Login attempt for identifier: ${loginDto.identifier}`);

    const isPhoneNumber = !loginDto.identifier.includes("@");

    // Find user
    const user = await this.usersService.findByPhoneOrEmail(
      loginDto.identifier
    );

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.identifier}`);
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    // SECURITY: Prevent admin login with phone
    if (
      isPhoneNumber &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
    ) {
      this.logger.warn(`Admin user ${user.email} attempted phone login`);
      throw new AppException(
        ErrorCode.INVALID_LOGIN_METHOD,
        "Administrators must login using their email address"
      );
    }

    // Verify password using PasswordService
    const isPasswordValid = await this.passwordService.verifyPassword(
      loginDto.password,
      user.password
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password for user: ${user.email || user.phone}`
      );
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    // Validate role if specified
    if (loginDto.allowedRoles && loginDto.allowedRoles.length > 0) {
      const isRoleAllowed = loginDto.allowedRoles.includes(
        user.role as UserRole
      );
      if (!isRoleAllowed) {
        this.logger.warn(
          `Role ${user.role} not allowed. Allowed: ${loginDto.allowedRoles.join(", ")}`
        );
        throw new AppException(ErrorCode.INVALID_CREDENTIALS);
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens using SessionService
    const tokens = await this.sessionService.generateTokenPair(
      user as TokenUser,
      deviceInfo
    );

    this.logger.log(
      `✅ Login successful for user: ${user.email || user.phone}`
    );

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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Send password reset OTP
   * @param emailOrPhone - User's email or phone number
   * @param isEmail - Whether the identifier is an email
   * @returns Success response
   */
  async sendPasswordResetOtp(
    emailOrPhone: string,
    isEmail: boolean
  ): Promise<{ success: boolean; method: string }> {
    // Find user
    const user = await this.usersService.findByPhoneOrEmail(emailOrPhone);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check rate limiting
    const canRequest = await this.otpService.canRequestNewOtp(user.id);
    if (!canRequest) {
      throw new BadRequestException("Please wait before requesting a new OTP");
    }

    // Send OTP
    const result = await this.otpService.sendOtpWithFallback(
      user.id,
      emailOrPhone,
      isEmail
    );

    return {
      success: result.success,
      method: result.method,
    };
  }

  /**
   * Verify password reset OTP
   * @param emailOrPhone - User's email or phone number
   * @param otp - OTP code to verify
   * @returns Reset token for password change
   */
  async verifyPasswordResetOtp(
    emailOrPhone: string,
    otp: string
  ): Promise<{ resetToken: string }> {
    const user = await this.usersService.findByPhoneOrEmail(emailOrPhone);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isValid = await this.otpService.verifyOtp(user.id, otp);
    if (!isValid) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    // Clear OTP
    await this.otpService.clearOtp(user.id);

    // Generate reset token (short-lived)
    const resetToken = this.sessionService["jwtService"].sign(
      { sub: user.id, type: "password-reset" },
      { expiresIn: "15m" }
    );

    return { resetToken };
  }

  /**
   * Reset password using reset token
   * @param resetToken - Password reset token
   * @param newPassword - New password
   * @returns Success status
   */
  async resetPasswordWithToken(
    resetToken: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    // Verify reset token
    let payload: any;
    try {
      payload = this.sessionService["jwtService"].verify(resetToken);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    if (payload.type !== "password-reset") {
      throw new UnauthorizedException("Invalid token type");
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    // Invalidate all user sessions
    await this.sessionService.invalidateAllUserSessions(payload.sub);

    this.logger.log(`Password reset successful for user: ${payload.sub}`);

    return { success: true };
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Current refresh token
   * @param deviceInfo - Optional device information
   * @returns New token pair
   */
  async refreshToken(
    refreshToken: string,
    deviceInfo?: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.sessionService.refreshTokens(refreshToken, deviceInfo);
  }

  /**
   * Logout user and invalidate tokens
   * @param userId - User ID
   * @param accessToken - Access token to blacklist
   * @returns void
   */
  async logout(userId: string, accessToken?: string): Promise<void> {
    // Invalidate all user sessions
    await this.sessionService.invalidateAllUserSessions(userId);

    // Blacklist access token if provided
    if (accessToken) {
      // Blacklist the access token to prevent reuse
      await this.tokenBlacklistService.blacklistToken(
        accessToken,
        userId,
        "User logout"
      );
    }

    this.logger.log(`User ${userId} logged out successfully`);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate user by ID
   * @param userId - User ID to validate
   * @returns User object or null
   */
  async validateUserById(userId: string): Promise<User | null> {
    return await this.usersService.findById(userId);
  }

  /**
   * Validate session by ID
   * @param sessionId - Session ID to validate
   * @returns Boolean indicating if session is valid
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const result = await this.sessionService.validateSession(sessionId);
    return result.valid;
  }
}
