import { ApiClient } from "../api-client";

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
  targetRoles: string[];
  targetUsers: string[];
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface FeatureFlagCreate {
  name: string;
  key: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  targetRoles?: string[];
  targetUsers?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagUpdate {
  name?: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  targetRoles?: string[];
  targetUsers?: string[];
  metadata?: Record<string, any>;
}

export const featureFlagsApi = {
  /**
   * Get all feature flags
   */
  getAll: () => {
    return ApiClient.get<FeatureFlag[]>("/system-settings/feature-flags");
  },

  /**
   * Get feature flag by ID
   */
  getById: (id: string) => {
    return ApiClient.get<{ data: FeatureFlag }>(
      `/system-settings/feature-flags/${id}`
    );
  },

  /**
   * Get feature flag by key
   */
  getByKey: (key: string) => {
    return ApiClient.get<{ data: FeatureFlag }>(
      `/system-settings/feature-flags/${key}`
    );
  },

  /**
   * Check if feature is enabled for current user
   */
  isEnabled: (key: string) => {
    return ApiClient.get<{ data: { enabled: boolean } }>(
      `/system-settings/feature-flags/${key}/enabled`
    );
  },

  /**
   * Create new feature flag
   */
  create: (data: FeatureFlagCreate) => {
    return ApiClient.post<{ data: FeatureFlag }>(
      "/system-settings/feature-flags",
      data
    );
  },

  /**
   * Update feature flag
   */
  update: (id: string, data: FeatureFlagUpdate) => {
    return ApiClient.patch<{ data: FeatureFlag }>(
      `/system-settings/feature-flags/${id}`,
      data
    );
  },

  /**
   * Delete feature flag
   */
  delete: (id: string) => {
    return ApiClient.delete<{ message: string }>(
      `/system-settings/feature-flags/${id}`
    );
  },

  /**
   * Toggle feature flag enabled status
   */
  toggleEnabled: (id: string) => {
    return ApiClient.patch<{ data: FeatureFlag }>(
      `/system-settings/feature-flags/${id}/toggle`
    );
  },
};
