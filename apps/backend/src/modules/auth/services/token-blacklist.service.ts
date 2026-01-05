import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";

/**
 * Service to manage blacklisted tokens for security
 * This prevents compromised tokens from being used even if they haven't expired
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // In-memory cache for faster lookups (optional, for high-traffic scenarios)
  private blacklistCache = new Set<string>();
  private cacheLastRefreshed: Date = new Date();

  constructor(private readonly prisma: PrismaService) {
    this.initializeCache();
  }

  /**
   * Initialize the blacklist cache from database
   */
  private async initializeCache(): Promise<void> {
    try {
      const blacklistedTokens = await this.prisma.accessTokenBlacklist.findMany(
        {
          where: {
            expiresAt: { gte: new Date() }, // Only load non-expired blacklisted tokens
          },
          select: { token: true },
        }
      );

      this.blacklistCache = new Set(blacklistedTokens.map((t) => t.token));
      this.cacheLastRefreshed = new Date();

      this.logger.log(
        `Initialized token blacklist cache with ${this.blacklistCache.size} entries`
      );
    } catch (error) {
      this.logger.error("Failed to initialize blacklist cache", error);
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    // Check in-memory cache first (fast path)
    if (this.blacklistCache.has(token)) {
      return true;
    }

    // Fallback to database check (for tokens blacklisted since cache refresh)
    try {
      const result = await this.prisma.accessTokenBlacklist.findUnique({
        where: { token },
      });

      if (result) {
        // Add to cache for future lookups
        this.blacklistCache.add(token);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error("Error checking token blacklist", error);
      // Fail open (allow the request) rather than fail closed
      // The JWT verification will still catch invalid tokens
      return false;
    }
  }

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(
    token: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      // Decode JWT to get expiration time
      let expiresAt: Date;
      try {
        const decoded = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        );
        expiresAt = new Date(decoded.exp * 1000); // JWT exp is in seconds
      } catch {
        // If can't decode, set a default expiration (1 hour from now)
        expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      }

      await this.prisma.accessTokenBlacklist.create({
        data: {
          token,
          userId,
          reason,
          expiresAt,
        },
      });

      this.blacklistCache.add(token);

      this.logger.log(`Token blacklisted for user ${userId}: ${reason}`);
    } catch (error) {
      this.logger.error("Failed to blacklist token", error);
      throw error;
    }
  }

  /**
   * Blacklist all tokens for a user (e.g., on password change, account compromise)
   * NOTE: This method is currently not used because access tokens are stateless.
   * In a real-world scenario, you would need to track all active access tokens per user,
   * which defeats the purpose of stateless JWTs. Instead, we rely on:
   * 1. Session binding - revoking refresh tokens invalidates all access tokens for that session
   * 2. Short access token expiration (1 hour)
   * 3. User account deactivation check in JWT validation
   */
  async blacklistAllUserTokens(userId: string, reason: string): Promise<void> {
    this.logger.warn(
      `blacklistAllUserTokens called for user ${userId}. This only works if you track all access tokens. Use session revocation instead.`
    );
    // Note: We can't blacklist all access tokens because we don't store them.
    // The session binding feature handles this by revoking refresh tokens,
    // which invalidates the associated sessionIds in access tokens.
  }

  /**
   * Clean up expired blacklisted tokens (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.accessTokenBlacklist.deleteMany({
        where: {
          expiresAt: { lt: new Date() }, // Delete tokens that have expired
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired blacklisted tokens`);

      // Refresh cache after cleanup
      await this.initializeCache();
    } catch (error) {
      this.logger.error("Failed to cleanup expired tokens", error);
    }
  }

  /**
   * Refresh the blacklist cache (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async refreshCache(): Promise<void> {
    await this.initializeCache();
  }

  /**
   * Get blacklist statistics
   */
  async getStatistics(): Promise<{
    cachedEntries: number;
    cacheLastRefreshed: Date;
    totalBlacklisted: number;
  }> {
    const totalBlacklisted = await this.prisma.accessTokenBlacklist.count();

    return {
      cachedEntries: this.blacklistCache.size,
      cacheLastRefreshed: this.cacheLastRefreshed,
      totalBlacklisted,
    };
  }
}
