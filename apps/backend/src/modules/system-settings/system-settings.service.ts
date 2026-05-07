// src/modules/system-settings/system-settings.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Helper to extract error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  /**
   * Get a system setting by key
   */
  async get(key: string, defaultValue?: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      if (setting) {
        // Update cache
        this.cache.set(key, { value: setting.value, timestamp: Date.now() });
        return setting.value;
      }

      return defaultValue || null;
    } catch (error) {
      this.logger.error(`Failed to get setting ${key}: ${this.getErrorMessage(error)}`);
      return defaultValue || null;
    }
  }

  /**
   * Get a boolean setting
   */
  async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    return value.toLowerCase() === "true" || value === "1";
  }

  /**
   * Get a number setting
   */
  async getNumber(key: string, defaultValue?: number): Promise<number | null> {
    const value = await this.get(key);
    if (value === null) return defaultValue ?? null;
    const num = Number(value);
    return isNaN(num) ? (defaultValue ?? null) : num;
  }

  /**
   * Set a system setting
   */
  async set(key: string, value: string, description?: string): Promise<void> {
    try {
      await this.prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value, description },
      });

      // Update cache
      this.cache.set(key, { value, timestamp: Date.now() });
      
      this.logger.log(`Setting updated: ${key} = ${value}`);
    } catch (error) {
      this.logger.error(`Failed to set setting ${key}: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Get all settings
   */
  async getAll(): Promise<Record<string, string>> {
    try {
      const settings = await this.prisma.systemSettings.findMany();
      const result: Record<string, string> = {};
      
      for (const setting of settings) {
        result[setting.key] = setting.value;
        this.cache.set(setting.key, { value: setting.value, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to get all settings: ${this.getErrorMessage(error)}`);
      return {};
    }
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<void> {
    try {
      await this.prisma.systemSettings.delete({
        where: { key },
      });
      this.cache.delete(key);
      this.logger.log(`Setting deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete setting ${key}: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log("System settings cache cleared");
  }

  /**
   * Get multiple settings at once
   */
  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    const uncachedKeys: string[] = [];

    // Check cache first
    for (const key of keys) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        result[key] = cached.value;
      } else {
        uncachedKeys.push(key);
      }
    }

    if (uncachedKeys.length === 0) {
      return result;
    }

    // Fetch uncached keys from database
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { key: { in: uncachedKeys } },
      });

      const settingsMap = new Map(settings.map(s => [s.key, s]));

      for (const key of uncachedKeys) {
        const setting = settingsMap.get(key);
        if (setting) {
          result[key] = setting.value;
          this.cache.set(key, { value: setting.value, timestamp: Date.now() });
        } else {
          result[key] = null;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get multiple settings: ${this.getErrorMessage(error)}`);
      // For uncached keys that failed, set to null
      for (const key of uncachedKeys) {
        result[key] = null;
      }
    }

    return result;
  }

  /**
   * Check if a setting exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Reset a setting to default (delete it)
   */
  async reset(key: string): Promise<void> {
    await this.delete(key);
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults(defaults: Record<string, { value: string; description?: string }>): Promise<void> {
    for (const [key, { value, description }] of Object.entries(defaults)) {
      try {
        await this.prisma.systemSettings.upsert({
          where: { key },
          update: {}, // Don't update if exists
          create: { key, value, description },
        });
      } catch (error) {
        this.logger.error(`Failed to initialize setting ${key}: ${this.getErrorMessage(error)}`);
      }
    }
    this.clearCache();
    this.logger.log("Default settings initialized");
  }
}