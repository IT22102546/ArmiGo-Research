import { ApiClient } from "../api-client";

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "DATE";
  category: string;
  description: string | null;
  isPublic: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface SettingUpdate {
  key: string;
  value: string;
}

export const systemSettingsApi = {
  /**
   * Get all system settings
   */
  getAll: (filters?: { category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);

    return ApiClient.get<SystemSetting[]>(
      `/system-settings/settings${params.toString() ? `?${params.toString()}` : ""}`
    );
  },

  /**
   * Get settings by category
   */
  getByCategory: (category: string) => {
    const params = new URLSearchParams();
    params.append("category", category);
    return ApiClient.get<{ data: SystemSetting[] }>(
      `/system-settings/settings?${params.toString()}`
    );
  },

  /**
   * Get single setting by key
   */
  getByKey: (key: string) => {
    return ApiClient.get<{ data: SystemSetting }>(
      `/system-settings/settings/${key}`
    );
  },

  /**
   * Update multiple settings at once
   */
  updateMultiple: (settings: SettingUpdate[]) => {
    return ApiClient.patch<{ message: string }>(
      "/system-settings/settings/bulk",
      {
        settings,
      }
    );
  },

  /**
   * Update single setting
   */
  updateSingle: (key: string, value: string) => {
    return ApiClient.patch<{ data: SystemSetting }>(
      `/system-settings/settings/${key}`,
      {
        value,
      }
    );
  },

  /**
   * Get public settings (no auth required)
   */
  getPublic: () => {
    return ApiClient.get<{ data: SystemSetting[] }>("/system-settings/public");
  },
};
