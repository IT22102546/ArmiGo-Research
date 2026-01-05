import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";

export interface RegisterDeviceTokenDto {
  userId: string;
  token: string;
  platform: "web" | "android" | "ios";
  deviceId?: string;
}

@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register or update a device token
   */
  async registerToken(dto: RegisterDeviceTokenDto) {
    try {
      // Check if token already exists
      const existing = await this.prisma.deviceToken.findUnique({
        where: { token: dto.token },
      });

      if (existing) {
        // Update existing token
        const updated = await this.prisma.deviceToken.update({
          where: { token: dto.token },
          data: {
            userId: dto.userId, // Update user in case token was transferred
            platform: dto.platform,
            deviceId: dto.deviceId,
            isActive: true,
            lastUsed: new Date(),
          },
        });
        this.logger.log(`✅ Updated device token for user ${dto.userId}`);
        return updated;
      }

      // Create new token
      const deviceToken = await this.prisma.deviceToken.create({
        data: {
          userId: dto.userId,
          token: dto.token,
          platform: dto.platform,
          deviceId: dto.deviceId,
          isActive: true,
          lastUsed: new Date(),
        },
      });

      this.logger.log(
        `✅ Registered new device token for user ${dto.userId} (${dto.platform})`
      );
      return deviceToken;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to register device token: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all active tokens for a user
   */
  async getUserTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastUsed: "desc",
      },
    });
  }

  /**
   * Get all active tokens (for broadcast notifications)
   */
  async getAllActiveTokens() {
    return this.prisma.deviceToken.findMany({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Mark a token as inactive (when device unregisters or token becomes invalid)
   */
  async deactivateToken(token: string) {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { isActive: false },
      });
      this.logger.log(`✅ Deactivated device token: ${token}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to deactivate token: ${errorMessage}`);
    }
  }

  /**
   * Mark multiple tokens as inactive
   */
  async deactivateTokens(tokens: string[]) {
    if (tokens.length === 0) {return;}

    try {
      const result = await this.prisma.deviceToken.updateMany({
        where: {
          token: { in: tokens },
        },
        data: { isActive: false },
      });
      this.logger.log(`✅ Deactivated ${result.count} device tokens`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to deactivate tokens: ${errorMessage}`);
    }
  }

  /**
   * Deactivate multiple tokens at once
   */
  async deactivateMultipleTokens(tokens: string[]): Promise<number> {
    try {
      const result = await this.prisma.deviceToken.updateMany({
        where: { token: { in: tokens } },
        data: { isActive: false },
      });
      this.logger.log(`✅ Deactivated ${result.count} invalid device tokens`);
      return result.count;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `❌ Failed to deactivate multiple tokens: ${errorMessage}`
      );
      return 0;
    }
  }

  /**
   * Delete a specific device token
   */
  async deleteToken(token: string) {
    try {
      await this.prisma.deviceToken.delete({
        where: { token },
      });
      this.logger.log(`✅ Deleted device token: ${token}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to delete token: ${errorMessage}`);
    }
  }

  /**
   * Delete all tokens for a user
   */
  async deleteUserTokens(userId: string) {
    try {
      const result = await this.prisma.deviceToken.deleteMany({
        where: { userId },
      });
      this.logger.log(`✅ Deleted ${result.count} tokens for user ${userId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to delete user tokens: ${errorMessage}`);
    }
  }

  /**
   * Clean up old inactive tokens (tokens inactive for > 90 days)
   */
  async cleanupOldTokens() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const result = await this.prisma.deviceToken.deleteMany({
        where: {
          isActive: false,
          lastUsed: {
            lt: ninetyDaysAgo,
          },
        },
      });
      this.logger.log(`🧹 Cleaned up ${result.count} old device tokens`);
      return result.count;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to cleanup old tokens: ${errorMessage}`);
      return 0;
    }
  }

  /**
   * Update lastUsed timestamp for a token
   */
  async updateTokenLastUsed(token: string) {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { lastUsed: new Date() },
      });
    } catch (error) {
      // Silently fail - token might not exist
    }
  }

  /**
   * Get tokens by platform
   */
  async getTokensByPlatform(platform: "web" | "android" | "ios") {
    return this.prisma.deviceToken.findMany({
      where: {
        platform,
        isActive: true,
      },
    });
  }

  /**
   * Get token count statistics
   */
  async getTokenStatistics(): Promise<{
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  }> {
    const [total, active, webCount, androidCount, iosCount] = await Promise.all(
      [
        this.prisma.deviceToken.count(),
        this.prisma.deviceToken.count({ where: { isActive: true } }),
        this.prisma.deviceToken.count({
          where: { platform: "web", isActive: true },
        }),
        this.prisma.deviceToken.count({
          where: { platform: "android", isActive: true },
        }),
        this.prisma.deviceToken.count({
          where: { platform: "ios", isActive: true },
        }),
      ]
    );

    return {
      total,
      active,
      byPlatform: {
        web: webCount,
        android: androidCount,
        ios: iosCount,
      },
    };
  }
}