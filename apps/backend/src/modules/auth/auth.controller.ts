
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Put,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  Query,
  Param,
  Delete,
} from "@nestjs/common";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { PrismaService } from "@database/prisma.service";

import { AuthService } from "./auth.service";
import { AuthCoreService } from "./auth-core.service";
import {
  RegisterDto,
  TeacherRegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  // New DTOs
  CheckAccountDto,
  SendPasswordResetOtpDto,
  VerifyPasswordResetOtpDto,
  ResetPasswordWithTokenDto,
  RequestMobileVerificationDto,
  VerifyMobileOtpDto,
  CompleteSignupDto,
  VerifySignupOtpDto,
  SendSignupOtpDto,
} from "./dto";
import { JwtAuthGuard } from "@common/guards";
import { GetUser, Public } from "@common/decorators";
import { UsersService } from "../users/users.service";
import { UpdateUserDto } from "../users/dto/user.dto";
import { JwtService } from "@nestjs/jwt";
import { TwoFactorService } from "./services/two-factor.service";

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private authCoreService: AuthCoreService,
    private usersService: UsersService,
    private configService: ConfigService,
    private twoFactorService: TwoFactorService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  @Get("institutions")
  @Public()
  @ApiOperation({ summary: "Get list of active institutions with their codes" })
  @ApiResponse({
    status: 200,
    description: "List of institutions returned successfully",
  })
  async getInstitutions() {
    const institutions = await this.prisma.institution.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        city: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      institutions: institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        code: inst.code || "N/A",
        type: inst.type,
        city: inst.city,
      })),
    };
  }

@Post("register")
@Throttle(5, 3600000) // 5 registrations per hour
@ApiOperation({ summary: "Register a new user" })
@ApiResponse({ status: 201, description: "User successfully registered" })
@ApiResponse({ status: 409, description: "User already exists" })
@ApiResponse({ status: 429, description: "Too many registration attempts" })
@ApiResponse({ status: 400, description: "Invalid verification token" })
async register(
  @Body() registerDto: RegisterDto | TeacherRegisterDto,
  @Req() request: Request,
  @Res({ passthrough: true }) response: Response
) {
  // Extract device info from request
  const deviceInfo = {
    ipAddress:
      request.ip ||
      request.headers["x-forwarded-for"]?.toString() ||
      "Unknown",
    userAgent: request.headers["user-agent"] || "Unknown",
    deviceId: request.headers["x-device-id"]?.toString(),
  };

  // Extract verification token if provided
  const verificationToken = request.headers["x-verification-token"]?.toString();

  // Log the request for debugging
  this.logger.log(`Registration request for phone: ${registerDto.phone}`);
  this.logger.log(`Verification token provided: ${verificationToken ? 'Yes' : 'No'}`);

  const result = await this.authService.register(
    registerDto,
    deviceInfo,
    verificationToken
  );

    // Set httpOnly cookies for tokens
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    // CHECK IF CLIENT WANTS TOKENS IN RESPONSE
    const clientWantsTokens =
      request.headers["x-client-type"] === "mobile" ||
      request.headers["x-return-tokens"] === "true";

    if (clientWantsTokens) {
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } else {
      return { user: result.user };
    }
  }

  @Post("login")
  @Public()
  @Throttle(50, 60000) // 5 login attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({
    status: 429,
    description: "Too many requests - try again later",
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    // Log the original login attempt
    this.logger.log(`Login attempt for identifier: ${loginDto.identifier}`);

    // Extract device info from request
    const deviceInfo = {
      ipAddress:
        request.ip ||
        request.headers["x-forwarded-for"]?.toString() ||
        "Unknown",
      userAgent: request.headers["user-agent"] || "Unknown",
      deviceId: request.headers["x-device-id"]?.toString(),
    };

    // Clean up and format phone number if provided (not email)
    const originalIdentifier = loginDto.identifier;
    if (!loginDto.identifier.includes("@")) {
      // It's likely a phone number - clean and format it
      const cleanPhone = loginDto.identifier.replace(/\D/g, "");

      this.logger.log(
        `Phone number detected. Cleaned: ${cleanPhone}, Original: ${originalIdentifier}`
      );

      // Format to +94 format for Sri Lankan numbers
      if (cleanPhone.length === 9) {
        // Local format: 770380981 -> +94770380981
        loginDto.identifier = `+94${cleanPhone}`;
        this.logger.log(
          `Formatted 9-digit: ${cleanPhone} -> ${loginDto.identifier}`
        );
      } else if (cleanPhone.length === 10 && cleanPhone.startsWith("0")) {
        // Local format with 0: 0770380981 -> +94770380981
        loginDto.identifier = `+94${cleanPhone.substring(1)}`;
        this.logger.log(
          `Formatted 10-digit with 0: ${cleanPhone} -> ${loginDto.identifier}`
        );
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith("94")) {
        // Already with 94 but missing +: 94770380981 -> +94770380981
        loginDto.identifier = `+${cleanPhone}`;
        this.logger.log(
          `Formatted 11-digit with 94: ${cleanPhone} -> ${loginDto.identifier}`
        );
      } else if (cleanPhone.length === 12 && cleanPhone.startsWith("94")) {
        // Already with +94: +94770380981 (already correct)
        if (!loginDto.identifier.startsWith("+")) {
          loginDto.identifier = `+${cleanPhone}`;
        }
        this.logger.log(
          `Formatted 12-digit: ${cleanPhone} -> ${loginDto.identifier}`
        );
      } else {
        // For other international numbers
        if (!loginDto.identifier.startsWith("+") && cleanPhone.length > 0) {
          loginDto.identifier = `+${cleanPhone}`;
          this.logger.log(
            `Formatted international: ${cleanPhone} -> ${loginDto.identifier}`
          );
        }
      }
    } else {
      // It's an email - trim and lowercase
      loginDto.identifier = loginDto.identifier.trim().toLowerCase();
      this.logger.log(`Email detected: ${loginDto.identifier}`);
    }

    // Log the formatted identifier
    this.logger.log(`Final identifier for login: ${loginDto.identifier}`);

    try {
      const result = await this.authService.login(loginDto, deviceInfo);

      // Set httpOnly cookies for tokens
      this.setAuthCookies(response, result.accessToken, result.refreshToken);

      // CHECK IF CLIENT WANTS TOKENS IN RESPONSE (for mobile)
      const clientWantsTokens =
        request.headers["x-client-type"] === "mobile" ||
        request.headers["x-return-tokens"] === "true";

      if (clientWantsTokens) {
        // Return tokens in response for mobile clients
        return {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
      } else {
        // Return only user data for web clients (existing behavior)
        return { user: result.user };
      }
    } catch (error) {
      // Log the error with context
      this.logger.error(
        `Login failed for identifier: ${loginDto.identifier}`,
        error
      );

      // Re-throw the error so it can be handled by the global exception filter
      throw error;
    }
  }
  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60000) // 10 refresh attempts per minute
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token successfully refreshed" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  @ApiResponse({ status: 429, description: "Too many refresh attempts" })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies["refresh_token"];

    if (!refreshToken) {
      // Clear any stale cookies
      this.clearAuthCookies(response);
      throw AppException.unauthorized("No refresh token provided");
    }

    try {
      const result = await this.authService.refreshToken(refreshToken);

      // Set new cookies with new tokens
      this.setAuthCookies(response, result.accessToken, result.refreshToken);

      // CHECK IF CLIENT WANTS TOKENS IN RESPONSE
      const clientWantsTokens =
        request.headers["x-client-type"] === "mobile" ||
        request.headers["x-return-tokens"] === "true";

      if (clientWantsTokens) {
        return {
          message: "Token refreshed successfully",
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        };
      } else {
        return { message: "Token refreshed successfully" };
      }
    } catch (error) {
      // If refresh token is invalid/expired/revoked, clear cookies and force re-login
      this.clearAuthCookies(response);

      // Rethrow the error for proper error handling
      throw error;
    }
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "User successfully logged out" })
  async logout(
    @GetUser("id") userId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logout(userId);

    // Clear cookies
    this.clearAuthCookies(response);

    return { message: "Successfully logged out" };
  }

  @Post("forgot-password")
  @Public()
  @Throttle(3, 3600000) // 3 requests per hour (prevent email spam)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Password reset email sent" })
  @ApiResponse({ status: 429, description: "Too many password reset requests" })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: "If the email exists, a password reset link has been sent",
    };
  }

  @Post("reset-password")
  @Public()
  @Throttle(5, 3600000) // 5 reset attempts per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password successfully reset" })
  @ApiResponse({ status: 401, description: "Invalid or expired token" })
  @ApiResponse({ status: 429, description: "Too many password reset attempts" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
    return { message: "Password successfully reset" };
  }

  // Debug endpoint - only available in development
  @Get("debug-token")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  async debugToken(
    @GetUser() user: { id: string; role: string },
    @Req() request: Request
  ) {
    // Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      return { error: "Debug endpoint not available in production" };
    }

    const token = request.cookies?.access_token;
    if (token) {
      try {
        const decoded = this.jwtService.decode(token);
        return {
          decoded,
          user,
          cookies: Object.keys(request.cookies || {}), // Don't expose full cookies for security
        };
      } catch (error) {
        return { error: "Failed to decode token" };
      }
    }
    return { error: "No token found" };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@GetUser() user: any) {
    // Fetch full user details from database
    const fullUser = await this.usersService.findById(user.id);
    return { user: fullUser };
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateProfile(
    @GetUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Users cannot change their own status, email, or phone through profile update
    // These fields can only be changed by admins through the admin endpoints
    const { status, email, phone, ...allowedFields } = updateUserDto as any;

    const updatedUser = await this.usersService.update(user.id, allowedFields);
    return { user: updatedUser };
  }

  @Put("profile/avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException("Invalid file type"), false);
        }
        cb(null, true);
      },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload profile avatar" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Avatar uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file format" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async uploadAvatar(
    @GetUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw AppException.badRequest(
        ErrorCode.UPLOAD_FAILED,
        "No file uploaded"
      );
    }
    return this.usersService.updateAvatar(user.id, file);
  }

  @Put("profile/password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Change password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        currentPassword: { type: "string" },
        newPassword: { type: "string" },
      },
      required: ["currentPassword", "newPassword"],
    },
  })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Invalid current password" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async changePassword(
    @GetUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    await this.usersService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword
    );
    return { message: "Password changed successfully" };
  }

  @Get("health")
  @Public()
  @ApiOperation({ summary: "Health check for auth service" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  healthCheck() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "auth",
    };
  }

  @Get("impersonation-status")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get impersonation status" })
  @ApiResponse({
    status: 200,
    description: "Impersonation status retrieved successfully",
  })
  getImpersonationStatus(@GetUser() user: any) {
    return {
      isImpersonating: false,
      originalUser: null,
      impersonatedUser: null,
    };
  }

  @Get("registration-options")
  @Public()
  @ApiOperation({
    summary: "Get registration form options (zones, subjects, etc.))",
  })
  @ApiResponse({
    status: 200,
    description: "Registration options retrieved successfully",
  })
  getRegistrationOptions() {
    return {
      zones: [
        "Colombo",
        "Gampaha",
        "Kalutara",
        "Kandy",
        "Galle",
        "Matara",
        "Kurunegala",
        "Anuradhapura",
        "Ratnapura",
        "Badulla",
        "Ampara",
        "Trincomalee",
        "Batticaloa",
        "Jaffna",
        "Vavuniya",
        "Mannar",
        "Mullaitivu",
        "Kilinochchi",
        "Puttalam",
        "Hambantota",
        "Monaragala",
        "Kegalle",
        "Polonnaruwa",
        "Nuwara Eliya",
        "Matale",
      ],
      districts: [
        "Colombo",
        "Gampaha",
        "Kalutara",
        "Kandy",
        "Matale",
        "Nuwara Eliya",
        "Galle",
        "Matara",
        "Hambantota",
        "Jaffna",
        "Kilinochchi",
        "Mannar",
        "Mullaitivu",
        "Vavuniya",
        "Puttalam",
        "Kurunegala",
        "Anuradhapura",
        "Polonnaruwa",
        "Badulla",
        "Monaragala",
        "Ratnapura",
        "Kegalle",
        "Ampara",
        "Batticaloa",
        "Trincomalee",
      ],
      subjects: [
        "Mathematics",
        "Science",
        "Biology",
        "Physics",
        "Chemistry",
        "English",
        "Sinhala",
        "Tamil",
        "History",
        "Geography",
        "ICT",
        "Commerce",
        "Accounting",
        "Economics",
        "Business Studies",
        "Art",
        "Music",
        "Drama",
        "Physical Education",
        "Health Science",
        "Religion",
        "Civics",
        "Media Studies",
      ],
      mediums: ["Sinhala", "English", "Tamil"],
      levels: [
        "Primary (Grade 1-5)",
        "Junior Secondary (Grade 6-9)",
        "O/L (Grade 10-11)",
        "A/L (Grade 12-13)",
      ],
    };
  }

  // Helper methods for cookie management
  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string
  ) {
    const isProduction = this.configService.get("NODE_ENV") === "production";
    const isDevelopment = this.configService.get("NODE_ENV") === "development";
    const apiUrl =
      this.configService.get<string>("API_URL") || "http://localhost:5000";
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "";

    // Determine whether frontend and API are different origins (cross-site)
    let sameSiteOption: "none" | "lax" | "strict" = isDevelopment
      ? "lax"
      : "strict";
    let isCrossSite = false;
    try {
      if (frontendUrl) {
        const frontendOrigin = new URL(frontendUrl).origin;
        const apiOrigin = new URL(apiUrl).origin;
        if (frontendOrigin !== apiOrigin) {
          isCrossSite = true;
          // Only use SameSite=None if BOTH origins use HTTPS (required by browsers)
          const bothHttps = frontendUrl.startsWith("https://") && apiUrl.startsWith("https://");
          if (bothHttps) {
            sameSiteOption = "none";
          } else {
            // Cross-site but not both HTTPS - browsers will reject SameSite=None
            // Use Lax and log warning
            this.logger.warn(
              "Cross-site cookie detected but not both HTTPS - using SameSite=Lax. " +
              "Cookies may not work correctly. Use HTTPS in development or same origin."
            );
            sameSiteOption = "lax";
          }
        }
      }
    } catch (err) {
      // If URL parsing fails, fall back to defaults
      this.logger.warn(
        "Failed to parse FRONTEND_URL/API_URL for cookie config"
      );
    }
    // Secure flag: true only in production.
    // In local development we explicitly set secure=false so cookies are
    // sent over http://localhost.
    const secureCookie = isProduction;

    // Get JWT expiry times from config service (matches JWT token expiry)
    const accessTokenExpiry = this.parseExpiryToMs(
      this.configService.get<string>("jwt.expiresIn") || "1h"
    );
    const refreshTokenExpiry = this.parseExpiryToMs(
      this.configService.get<string>("jwt.refreshExpiresIn") || "7d"
    );

    // Access token cookie - matches JWT expiry (e.g., 1 hour)
    response.cookie("access_token", accessToken, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: secureCookie, // HTTPS in production or when frontend uses HTTPS
      sameSite: sameSiteOption, // Adjust to 'none' for cross-site
      maxAge: accessTokenExpiry, // Match JWT expiry exactly
      path: "/",
      domain: undefined, // Let browser determine the domain
    });

    // Refresh token cookie - matches JWT expiry (e.g., 7 days)
    // Use same path as access token for consistency and simplicity
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: secureCookie, // HTTPS in production or when frontend uses HTTPS
      sameSite: sameSiteOption, // Adjust to 'none' for cross-site
      maxAge: refreshTokenExpiry, // Match JWT expiry exactly
      path: "/", // Same path as access_token for consistency
      domain: undefined,
    });

    this.logger.log(
      `Set auth cookies (access: ${accessTokenExpiry}ms, refresh: ${refreshTokenExpiry}ms, secure=${secureCookie}, sameSite=${sameSiteOption})`
    );

    // Only warn about SameSite=None + Secure mismatch in production
    // In development, we already handle this with the bothHttps check above
    if (isProduction && sameSiteOption === "none" && !secureCookie) {
      this.logger.warn(
        "PRODUCTION WARNING: Cookie set to SameSite=None but secure flag is false - browsers will reject these cookies!"
      );
    }
  }

  // Parse JWT expiry string to milliseconds
  private parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      this.logger.warn(`Invalid expiry format: ${expiry}, defaulting to 1h`);
      return 60 * 60 * 1000; // Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default 1 hour
    }
  }

  private clearAuthCookies(response: Response) {
    const isProduction = this.configService.get("NODE_ENV") === "production";
    const apiUrl =
      this.configService.get<string>("API_URL") || "http://localhost:5000";
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "";

    let sameSiteOption: "none" | "lax" | "strict" = isProduction
      ? "strict"
      : "lax";
    try {
      if (frontendUrl) {
        const frontendOrigin = new URL(frontendUrl).origin;
        const apiOrigin = new URL(apiUrl).origin;
        if (frontendOrigin !== apiOrigin) {
          // Only use SameSite=None if BOTH origins use HTTPS
          const bothHttps = frontendUrl.startsWith("https://") && apiUrl.startsWith("https://");
          sameSiteOption = bothHttps ? "none" : "lax";
        }
      }
    } catch (err) {
      this.logger.warn(
        "Failed to parse FRONTEND_URL/API_URL for cookie clear config"
      );
    }
    const frontendUsesHttps = (frontendUrl || "").startsWith("https://");
    const apiUsesHttps = (apiUrl || "").startsWith("https://");
    const secureCookie = isProduction || (frontendUsesHttps && apiUsesHttps);

    // Clear access token
    response.clearCookie("access_token", {
      path: "/",
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSiteOption,
    });

    // Clear refresh token - must match the path used when setting the cookie
    response.clearCookie("refresh_token", {
      path: "/", // Must match the path used in setAuthCookies
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSiteOption,
    });

    this.logger.log("Cleared auth cookies");
  }
  @Post("check-account")
  @Throttle(5, 60000) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check if account exists for email or phone" })
  @ApiResponse({
    status: 200,
    description: "Account check completed successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests",
  })
  async checkAccount(@Body() checkAccountDto: CheckAccountDto) {
    const result = await this.authService.checkAccountExists(
      checkAccountDto.identifier // Change from emailOrPhone to identifier
    );
    return result;
  }

  // Add these endpoints to your AuthController

  @Post("send-password-reset-otp")
  @Throttle(5, 60000) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send password reset OTP via email or SMS" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async sendPasswordResetOtp(@Body() dto: SendPasswordResetOtpDto) {
    const result = await this.authService.sendPasswordResetOtp(
      dto.identifier,
      dto.isEmail
    );
    return result;
  }

  @Post("verify-password-reset-otp")
  @Throttle(5, 60000) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify password reset OTP" })
  @ApiResponse({ status: 200, description: "OTP verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired OTP" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async verifyPasswordResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    const result = await this.authService.verifyPasswordResetOtp(
      dto.identifier,
      dto.isEmail,
      dto.otp
    );
    return result;
  }

  // Add to AuthController
  @Post("send-signup-otp")
  @Throttle(5, 60000) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send OTP for signup verification" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiResponse({ status: 400, description: "Invalid phone number" })
  @ApiResponse({ status: 409, description: "Phone already registered" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async sendSignupOtp(@Body() dto: SendSignupOtpDto) {
    const result = await this.authService.sendSignupOtp(dto.phone);
    return result;
  }

  @Post("verify-signup-otp")
  @Throttle(5, 60000) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify signup OTP" })
  @ApiResponse({ status: 200, description: "OTP verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired OTP" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async verifySignupOtp(@Body() dto: VerifySignupOtpDto) {
    const result = await this.authService.verifySignupOtp(dto.phone, dto.otp);
    return result;
  }

  @Post("reset-password-with-token")
  @Throttle(5, 3600000) // 5 reset attempts per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token from OTP verification" })
  @ApiResponse({ status: 200, description: "Password successfully reset" })
  @ApiResponse({ status: 401, description: "Invalid or expired token" })
  @ApiResponse({ status: 429, description: "Too many password reset attempts" })
  async resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    const result = await this.authService.resetPasswordWithToken(
      dto.token,
      dto.newPassword
    );
    return result;
  }
}
