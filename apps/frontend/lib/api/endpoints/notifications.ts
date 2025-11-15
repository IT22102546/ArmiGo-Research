// apps/frontend/lib/api/endpoints/notifications.ts
import { ApiClient } from "../api-client";

/** Notification delivery status types. */
export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "SYSTEM"
    | "CLASS_UPDATE"
    | "EXAM_REMINDER"
    | "PAYMENT_UPDATE"
    | "GRADE_RELEASED"
    | "ANNOUNCEMENT"
    | "CHAT_MESSAGE"
    | "GENERAL"
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR";
  status?: "UNREAD" | "READ" | "ARCHIVED";
  isRead?: boolean; // Legacy support
  data?: Record<string, any> | null;
  sentAt?: string | null; // Single tick ✓ - sent to server
  deliveredAt?: string | null; // Double tick ✓✓ - delivered to device
  readAt?: string | null; // Double blue tick ✓✓ - read by user
  deliveryStatus?: NotificationDeliveryStatus; // Computed delivery status
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

/**
 * Get the delivery status of a notification based on timestamps
 */
export function getNotificationDeliveryStatus(
  notification: Notification
): NotificationDeliveryStatus {
  if (notification.readAt) return "read"; // Double blue tick ✓✓
  if (notification.deliveredAt) return "delivered"; // Double tick ✓✓
  if (notification.sentAt) return "sent"; // Single tick ✓
  return "pending"; // Clock/pending icon
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
      `/notifications${queryString ? `?${queryString}` : ""}`
    );
  },

  // Mark notification as read
  markAsRead: (id: string) =>
    ApiClient.patch<{ notification: Notification }>(
      `/notifications/${id}/read`
    ),

  // Mark all notifications as read
  markAllAsRead: () =>
    ApiClient.patch<{ message: string }>("/notifications/mark-all-read"),

  // Get unread notification count
  getUnreadCount: () =>
    ApiClient.get<{ count: number }>("/notifications/unread-count"),

  // Delete notification
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/notifications/${id}`),

  // Get notification preferences
  getPreferences: () =>
    ApiClient.get<{ preferences: NotificationPreferences }>(
      "/notifications/preferences"
    ),

  // Update notification preferences
  updatePreferences: (data: Partial<NotificationPreferences>) =>
    ApiClient.patch<{ preferences: NotificationPreferences }>(
      "/notifications/preferences",
      data
    ),

  // Admin endpoints
  /**
   * Get all notifications (admin only)
   */
  getAllAdmin: (
    filters: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      role?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    } = {}
  ) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.role) params.append("role", filters.role);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);

    return ApiClient.get<{ data: Notification[]; total: number }>(
      `/notifications/admin/all?${params.toString()}`
    );
  },

  /**
   * Get notification detail (admin only)
   */
  getAdminDetail: (id: string) => {
    return ApiClient.get<{ data: Notification }>(`/notifications/admin/${id}`);
  },

  /**
   * Get notification statistics (admin only)
   */
  getAdminStats: () => {
    return ApiClient.get<{ data: any }>("/notifications/admin/stats");
  },
};
