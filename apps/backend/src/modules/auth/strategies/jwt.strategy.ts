import { Injectable, Logger } from "@nestjs/common";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { TokenBlacklistService } from "../services/token-blacklist.service";

export interface JwtPayload {
  sub: string; // user id
  email: string | null; // nullable for external teachers who use phone
  role: string;
  sessionId?: string; // SECURITY: Session binding - links to refresh token
  iss?: string; // issuer
  aud?: string; // audience
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService
  ) {
    const secret = configService.get<string>("jwt.secret");
    const issuer = configService.get<string>("jwt.issuer");
    const audience = configService.get<string>("jwt.audience");

    // Validate secret is properly configured
    if (!secret || secret.includes("CHANGE_ME") || secret.length < 32) {
      throw new Error(
        "JWT_SECRET is not properly configured. Must be at least 32 characters and not contain placeholder text."
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // Fallback to Authorization header for API clients
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false, // CRITICAL: Reject expired tokens
      secretOrKey: secret, // CRITICAL: This enables signature verification
      algorithms: ["HS256"], // CRITICAL: Only allow expected algorithm
      issuer: issuer, // CRITICAL: Validate token issuer
      audience: audience, // CRITICAL: Validate token audience
      passReqToCallback: true, // Enable request access for token extraction
      jsonWebTokenOptions: {
        // Additional verification options
        complete: false, // Only return payload (not header)
        clockTolerance: 0, // No clock tolerance - strict expiration
      },
    } as StrategyOptions);
  }

  // LEGACY: Extended validation checks (issuer/aud/iats/timestamps/session binding).
  // Kept for reference. The active `validate` function implements necessary blacklist & session checks.

  async validate(req: Request, payload: JwtPayload) {
    // Extract the raw token for blacklist checking
    const token =
      req?.cookies?.access_token ||
      req?.headers?.authorization?.replace("Bearer ", "");

    // Check if token is blacklisted
    if (token) {
      const isBlacklisted =
        await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        this.logger.warn(`Blacklisted token attempt for user ${payload.sub}`);
        throw AppException.unauthorized("Token has been revoked");
      }
    }

    // FIX: More flexible payload validation
    if (!payload || !payload.sub || !payload.role) {
      this.logger.warn("Invalid JWT payload: missing required fields");
      throw AppException.unauthorized("Invalid token payload");
    }

    // For external teachers, email might be null - use phone instead
    if (!payload.email) {
      // Try to get user to see if they have email
      const user = await this.authService.validateUserById(payload.sub);
      if (user) {
        // Update payload with actual email/phone for validation
        payload.email = user.email || user.phone;
      } else {
        this.logger.warn(
          `User ${payload.sub} not found during token validation`
        );
        throw AppException.unauthorized("User not found");
      }
    }

    // CRITICAL: Session Validation
    if (payload.sessionId) {
      const sessionValid = await this.authService.validateSession(
        payload.sessionId
      );
      if (!sessionValid) {
        this.logger.warn(
          `Session validation failed: sessionId=${payload.sessionId}, user=${payload.sub}`
        );
        throw AppException.unauthorized(
          "Session expired or invalid - please login again"
        );
      }
    } else {
      // For backward compatibility, don't immediately reject
      this.logger.warn(
        `Access token without sessionId for user ${payload.sub}`
      );
      // Instead of throwing, we can allow it but log the issue
      // throw new UnauthorizedException("Invalid token format - please login again");
    }

    // Validate user still exists and is active
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      this.logger.warn(
        `Token validation failed: user ${payload.sub} not found or inactive`
      );
      throw AppException.unauthorized("Invalid authentication credentials");
    }

    // Return user data
    return {
      id: user.id,
      email: user.email,
      phone: user.phone, // Add phone for cases where email is null
      role: user.role,
    };
  }
}
