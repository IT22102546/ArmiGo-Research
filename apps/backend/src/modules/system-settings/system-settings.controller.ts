import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SystemSettingsService } from "./system-settings.service";
import {
  CreateSettingDto,
  UpdateSettingDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from "./dto/system-settings.dto";
import { JwtAuthGuard } from "@common/guards";
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { GetUser, Public } from "@common/decorators";
import { UserRole } from "../../shared/enums/user.enum";

@Controller("system-settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  // ==================== SYSTEM SETTINGS ====================

  @Post("settings")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createSetting(
    @Body() dto: CreateSettingDto,
    @GetUser("id") userId: string
  ) {
    return this.settingsService.createSetting(dto, userId);
  }

  @Get("settings")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getSettings(
    @Query("category") category?: string,
    @Query("includePrivate") includePrivate?: string
  ) {
    return this.settingsService.getSettings(
      category,
      includePrivate === "true"
    );
  }

  @Get("settings/:key")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getSettingByKey(@Param("key") key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @Put("settings/:key")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateSetting(
    @Param("key") key: string,
    @Body() dto: UpdateSettingDto,
    @GetUser("id") userId: string
  ) {
    return this.settingsService.updateSetting(key, dto, userId);
  }

  @Delete("settings/:key")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteSetting(@Param("key") key: string) {
    return this.settingsService.deleteSetting(key);
  }

  @Post("settings/initialize")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async initializeDefaultSettings() {
    return this.settingsService.initializeDefaultSettings();
  }

  // Public route for fetching public settings without authentication
  @Get("public")
  @Public()
  async getPublicSettings() {
    return this.settingsService.getSettings(undefined, false);
  }

  // Bulk update settings (admin only)
  @Patch("settings/bulk")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateMultipleSettings(
    @Body() updates: { key: string; value: string }[],
    @GetUser("id") userId: string
  ) {
    return this.settingsService.updateMultiple(updates, userId);
  }

  // ==================== FEATURE FLAGS ====================

  @Post("feature-flags")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createFeatureFlag(
    @Body() dto: CreateFeatureFlagDto,
    @GetUser("id") userId: string
  ) {
    return this.settingsService.createFeatureFlag(dto, userId);
  }

  @Get("feature-flags")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getFeatureFlags(@Query("enabledOnly") enabledOnly?: string) {
    return this.settingsService.getFeatureFlags(enabledOnly === "true");
  }

  @Get("feature-flags/:key")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INTERNAL_TEACHER,
    UserRole.EXTERNAL_TEACHER
  )
  async getFeatureFlagByKey(@Param("key") key: string) {
    return this.settingsService.getFeatureFlagByKey(key);
  }

  @Get("feature-flags/:key/enabled")
  async isFeatureEnabled(
    @Param("key") key: string,
    @GetUser("id") userId?: string,
    @GetUser("role") userRole?: string
  ) {
    return {
      key,
      enabled: await this.settingsService.isFeatureEnabled(
        key,
        userId,
        userRole
      ),
    };
  }

  @Put("feature-flags/:key")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateFeatureFlag(
    @Param("key") key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @GetUser("id") userId: string
  ) {
    return this.settingsService.updateFeatureFlag(key, dto, userId);
  }

  @Post("feature-flags/:key/toggle")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleFeatureFlag(
    @Param("key") key: string,
    @GetUser("id") userId: string
  ) {
    return this.settingsService.toggleFeatureFlag(key, userId);
  }

  @Delete("feature-flags/:key")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteFeatureFlag(@Param("key") key: string) {
    return this.settingsService.deleteFeatureFlag(key);
  }
}
