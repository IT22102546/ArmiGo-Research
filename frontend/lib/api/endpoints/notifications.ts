// apps/frontend/lib/api/endpoints/notifications.ts
import { ApiClient } from "../api-client";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  userId?: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: string[];
}

export const notificationsApi = {
  // Get all notifications for current user
  getAll: (params?: { isRead?: boolean; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.isRead !== undefined)
      queryParams.append("isRead", params.isRead.toString());
    if (params?.type) queryParams.append("type", params.type);
    const queryString = queryParams.toString();
    return ApiClient.get<{ notifications: Notification[] }>(
      `/api/v1/notifications${queryString ? `?${queryString}` : ""}`
    );
  },

  // Mark notification as read
  markAsRead: (id: string) =>
    ApiClient.patch<{ notification: Notification }>(
      `/api/v1/notifications/${id}/read`
    ),

  // Mark all notifications as read
  markAllAsRead: () =>
    ApiClient.post<{ message: string }>("/api/v1/notifications/read-all"),

  // Delete notification
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/notifications/${id}`),

  // Get notification preferences
  getPreferences: () =>
    ApiClient.get<{ preferences: NotificationPreferences }>(
      "/api/v1/notifications/preferences"
    ),

  // Update notification preferences
  updatePreferences: (data: Partial<NotificationPreferences>) =>
    ApiClient.patch<{ preferences: NotificationPreferences }>(
      "/api/v1/notifications/preferences",
      data
    ),
};
