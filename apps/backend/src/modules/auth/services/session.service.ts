import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@database/prisma.service";
import { User, UserRole } from "@prisma/client";
import { TokenPair, DeviceInfo, TokenPayload } from "../interfaces";
import { randomBytes, createHash } from "crypto";

/**
 * TokenUser interface - subset of User for token generation
 */
export interface TokenUser {
  id: string;
  email: string | null;
  role: UserRole;
}

/**
 * SessionService - Token and session management
 *
 * Responsibilities:
 * - Generate access and refresh tokens
 * - Manage user sessions with device tracking
 * - Refresh token rotation for security
 * - Session validation and invalidation
 * - Cleanup expired sessions
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Generate a token pair (access + refresh) for a user
   * Creates a new session and refresh token in the database
   */
  async generateTokenPair(
    user: User | TokenUser,
    deviceInfo?: DeviceInfo
  ): Promise<TokenPair> {
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate a unique device session ID
    // DISABLED: deviceSessionId field removed from schema
    // const deviceSessionId = randomBytes(32).toString("hex");

    // Calculate session expiration (30 days from now)
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

    // Generate fingerprint from device info
    const fingerprintData = JSON.stringify({
      deviceId: deviceInfo?.deviceId || "unknown",
      userAgent: deviceInfo?.userAgent || "unknown",
      ipAddress: deviceInfo?.ipAddress || "unknown",
    });
    const fingerprint = createHash("sha256")
      .update(fingerprintData)
      .digest("hex");

    // Create auth session
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        // deviceSessionId, // REMOVED: field no longer exists in schema
        fingerprint,
        deviceId: deviceInfo?.deviceId,
        deviceName: deviceInfo?.userAgent?.substring(0, 100),
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        expiresAt: sessionExpiresAt,
        lastActiveAt: new Date(),
      },
    });

    // Generate access token with session ID
    const accessToken = await this.generateAccessToken({
      ...tokenUser,
      sessionId: session.id,
    });

    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(
      user.id,
      session.id,
      deviceInfo
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate an access token
   */
  private async generateAccessToken(payload: {
    id: string;
    email: string | null;
    role: UserRole;
    sessionId?: string;
  }): Promise<string> {
    const tokenPayload: TokenPayload = {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>("jwt.secret"),
      expiresIn: this.configService.get<string>("jwt.expiresIn") || "15m",
      algorithm: "HS256",
      issuer: this.configService.get<string>("jwt.issuer") || "learnup",
      audience: this.configService.get<string>("jwt.audience") || "learnup-api",
    });
  }

  /**
   * Generate a refresh token and store it in the database
   */
  private async generateRefreshToken(
    userId: string,
    sessionId: string,
    deviceInfo?: DeviceInfo
  ): Promise<string> {
    // Generate a cryptographically secure random token
    const token = randomBytes(64).toString("hex");

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        sessionId,
        expiresAt,
        deviceId: deviceInfo?.deviceId,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      },
    });

    return token;
  }

  /**
   * Refresh tokens using a refresh token
   * Implements token rotation for security
   */
  async refreshTokens(
    refreshToken: string,
    deviceInfo?: DeviceInfo
  ): Promise<TokenPair> {
    // Find the refresh token in the database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: true,
        session: true,
      },
    });

    // Validate refresh token
    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (tokenRecord.revoked) {
      this.logger.warn(
        `Revoked refresh token used: ${tokenRecord.id} for user ${tokenRecord.userId}`
      );
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    if (!tokenRecord.session || tokenRecord.session.revokedAt) {
      throw new UnauthorizedException("Session has been revoked");
    }

    if (new Date() > tokenRecord.session.expiresAt) {
      throw new UnauthorizedException("Session has expired");
    }

    // Update last used timestamp and usage count
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    // Update session last active timestamp
    await this.prisma.authSession.update({
      where: { id: tokenRecord.sessionId },
      data: {
        lastActiveAt: new Date(),
      },
    });

    // Generate new access token
    const accessToken = await this.generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      sessionId: tokenRecord.sessionId,
    });

    // Token rotation: Generate new refresh token and revoke the old one
    const newRefreshToken = await this.generateRefreshToken(
      tokenRecord.userId,
      tokenRecord.sessionId,
      deviceInfo
    );

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "Token rotated",
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Validate a session by ID
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    userId?: string;
    reason?: string;
  }> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    if (session.revokedAt) {
      return {
        valid: false,
        reason: `Session revoked: ${session.revokedReason || "Unknown reason"}`,
      };
    }

    if (new Date() > session.expiresAt) {
      return { valid: false, reason: "Session expired" };
    }

    // Update last active timestamp
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    return { valid: true, userId: session.userId };
  }

  /**
   * Invalidate all sessions for a user
   * Used for logout all devices or security events
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    // Revoke all active sessions
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "User logged out from all devices",
      },
    });

    // Revoke all active refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: "User logged out from all devices",
      },
    });

    this.logger.log(`Invalidated all sessions for user ${userId}`);
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId: string, reason?: string): Promise<void> {
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason || "Session invalidated",
      },
    });

    // Revoke all refresh tokens for this session
    await this.prisma.refreshToken.updateMany({
      where: { sessionId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason || "Session invalidated",
      },
    });
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<
    Array<{
      id: string;
      // deviceSessionId: string; // REMOVED: field no longer exists in schema
      deviceId: string | null;
      deviceName: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      lastActiveAt: Date;
      expiresAt: Date;
      createdAt: Date;
    }>
  > {
    return this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        // deviceSessionId: true, // REMOVED: field no longer exists in schema
        deviceId: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Cleanup expired sessions and tokens
   * Should be called periodically by a scheduled task
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();

    // Delete expired sessions
    const deletedSessions = await this.prisma.authSession.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Delete expired refresh tokens
    const deletedTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    this.logger.log(
      `Cleaned up ${deletedSessions.count} expired sessions and ${deletedTokens.count} expired tokens`
    );
  }

  /**
   * Validate an access token
   * Returns the token payload if valid
   */
  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>("jwt.secret"),
        algorithms: ["HS256"],
        issuer: this.configService.get<string>("jwt.issuer") || "learnup",
        audience:
          this.configService.get<string>("jwt.audience") || "learnup-api",
        ignoreExpiration: false,
        clockTolerance: 0,
      });

      if (!payload || !payload.sub || !payload.role) {
        this.logger.warn("Invalid JWT payload: missing required fields");
        return null;
      }

      return payload;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Access token validation failed: ${errorMessage}`);
      return null;
    }
  }
}
