import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import {
  CreateSettingDto,
  UpdateSettingDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from "./dto/system-settings.dto";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== SYSTEM SETTINGS ====================

  /**
   * Create a new system setting
   */
  async createSetting(dto: CreateSettingDto, userId: string) {
    // Check if key already exists
    const existing = await this.prisma.systemSettings.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw AppException.conflict(
        ErrorCode.DUPLICATE_ENTRY,
        `Setting with key '${dto.key}' already exists`
      );
    }

    return this.prisma.systemSettings.create({
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  /**
   * Get all settings or by category
   */
  async getSettings(category?: string, includePrivate: boolean = false) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (!includePrivate) {
      where.isPublic = true;
    }

    return this.prisma.systemSettings.findMany({
      where,
      orderBy: { key: "asc" },
    });
  }

  /**
   * Get a setting by key
   */
  async getSettingByKey(key: string) {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw AppException.notFound(
        ErrorCode.SETTING_NOT_FOUND,
        `Setting with key '${key}' not found`
      );
    }

    return setting;
  }

  /**
   * Get setting value (typed)
   */
  async getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.getSettingByKey(key);

      switch (setting.type) {
        case "BOOLEAN":
          return (setting.value === "true") as any;
        case "NUMBER":
          return parseFloat(setting.value) as any;
        case "JSON":
          return JSON.parse(setting.value);
        case "DATE":
          return new Date(setting.value) as any;
        default:
          return setting.value as any;
      }
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Update a setting
   */
  async updateSetting(key: string, dto: UpdateSettingDto, userId: string) {
    const existing = await this.getSettingByKey(key);

    if (!existing.isEditable) {
      throw AppException.badRequest(
        ErrorCode.SETTING_NOT_EDITABLE,
        `Setting '${key}' is not editable`
      );
    }

    return this.prisma.systemSettings.update({
      where: { key },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string) {
    await this.getSettingByKey(key);

    return this.prisma.systemSettings.delete({
      where: { key },
    });
  }

  /**
   * Bulk update settings
   */
  async updateMultiple(
    updates: { key: string; value: string }[],
    userId: string
  ) {
    const updated: any[] = [];
    for (const u of updates) {
      try {
        const existing = await this.prisma.systemSettings.findUnique({
          where: { key: u.key },
        });
        if (!existing) {
          throw AppException.notFound(
            ErrorCode.SETTING_NOT_FOUND,
            `Setting with key '${u.key}' not found`
          );
        }

        if (!existing.isEditable) {
          throw AppException.badRequest(
            ErrorCode.SETTING_NOT_EDITABLE,
            `Setting '${u.key}' is not editable`
          );
        }

        const res = await this.prisma.systemSettings.update({
          where: { key: u.key },
          data: { value: u.value, updatedBy: userId, updatedAt: new Date() },
        });
        updated.push(res);
      } catch (error) {
        // Skip invalid updates but continue processing others
        continue;
      }
    }
    return { updatedCount: updated.length, updated };
  }

  // ==================== FEATURE FLAGS ====================

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(dto: CreateFeatureFlagDto, userId: string) {
    // Check if key already exists
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw AppException.conflict(
        ErrorCode.DUPLICATE_ENTRY,
        `Feature flag with key '${dto.key}' already exists`
      );
    }

    return this.prisma.featureFlag.create({
      data: {
        ...dto,
        enabled: dto.enabled ?? false,
        rolloutPercentage: dto.rolloutPercentage ?? 0,
        targetRoles: dto.targetRoles ?? [],
        targetUsers: dto.targetUsers ?? [],
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * Get all feature flags
   */
  async getFeatureFlags(enabledOnly: boolean = false) {
    const where: any = {};

    if (enabledOnly) {
      where.enabled = true;
    }

    return this.prisma.featureFlag.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get a feature flag by key
   */
  async getFeatureFlagByKey(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw AppException.notFound(
        ErrorCode.SETTING_NOT_FOUND,
        `Feature flag with key '${key}' not found`
      );
    }

    return flag;
  }

  /**
   * Check if a feature is enabled for a user
   */
  async isFeatureEnabled(
    key: string,
    userId?: string,
    userRole?: string
  ): Promise<boolean> {
    try {
      const flag = await this.getFeatureFlagByKey(key);

      // If flag is disabled, return false
      if (!flag.enabled) {
        return false;
      }

      // If specific users are targeted, check if user is in the list
      if (userId && flag.targetUsers.length > 0) {
        return flag.targetUsers.includes(userId);
      }

      // If specific roles are targeted, check if user role matches
      if (userRole && flag.targetRoles.length > 0) {
        return flag.targetRoles.includes(userRole);
      }

      // If rollout percentage is set, use random selection
      if (flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100) {
        const random = Math.random() * 100;
        return random < flag.rolloutPercentage;
      }

      // Default: if no targeting and 100% rollout, return true
      return flag.rolloutPercentage === 100;
    } catch (error) {
      // Feature flag doesn't exist, default to false
      return false;
    }
  }

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(
    key: string,
    dto: UpdateFeatureFlagDto,
    userId: string
  ) {
    await this.getFeatureFlagByKey(key);

    return this.prisma.featureFlag.update({
      where: { key },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Toggle a feature flag
   */
  async toggleFeatureFlag(key: string, userId: string) {
    const flag = await this.getFeatureFlagByKey(key);

    return this.prisma.featureFlag.update({
      where: { key },
      data: {
        enabled: !flag.enabled,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(key: string) {
    await this.getFeatureFlagByKey(key);

    return this.prisma.featureFlag.delete({
      where: { key },
    });
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize default system settings
   */
  async initializeDefaultSettings() {
    const defaults = [
      {
        key: "site.name",
        value: "LearnApp Platform",
        type: "STRING" as const,
        category: "general",
        description: "Site name",
        isPublic: true,
        isEditable: true,
      },
      {
        key: "site.maintenance_mode",
        value: "false",
        type: "BOOLEAN" as const,
        category: "general",
        description: "Enable maintenance mode",
        isPublic: false,
        isEditable: true,
      },
      {
        key: "payment.min_amount",
        value: "100",
        type: "NUMBER" as const,
        category: "payment",
        description: "Minimum payment amount",
        isPublic: false,
        isEditable: true,
      },
      {
        key: "exam.default_duration",
        value: "60",
        type: "NUMBER" as const,
        category: "exam",
        description: "Default exam duration in minutes",
        isPublic: false,
        isEditable: true,
      },
      {
        key: "exam.max_attempts",
        value: "3",
        type: "NUMBER" as const,
        category: "exam",
        description: "Maximum exam attempts",
        isPublic: false,
        isEditable: true,
      },
    ];

    const created = [];
    for (const setting of defaults) {
      try {
        const existing = await this.prisma.systemSettings.findUnique({
          where: { key: setting.key },
        });

        if (!existing) {
          const newSetting = await this.prisma.systemSettings.create({
            data: setting,
          });
          created.push(newSetting);
        }
      } catch (error) {
        this.logger.error(`Failed to create setting ${setting.key}:`, error);
      }
    }

    return {
      created: created.length,
      settings: created,
    };
  }
}
