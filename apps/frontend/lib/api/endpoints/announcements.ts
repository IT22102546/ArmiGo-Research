import { ApiClient } from "../api-client";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "EXAM" | "CLASS" | "PAYMENT" | "SYSTEM" | "EMERGENCY";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetRoles: string[];
  isActive: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  attachments: string[];
  metadata: Record<string, any> | null;
  _count?: {
    reads: number;
    grades: number;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grades?: Array<{
    id: string;
    grade: {
      id: string;
      name: string;
      level: number;
    };
  }>;
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface AnnouncementFilters {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
  priorityMin?: string;
  targetRole?: string;
}

export interface AnnouncementCreateDto {
  title: string;
  content: string;
  type: string;
  priority: string;
  targetRoles: string[];
  targetGrades?: string[];
  publishedAt?: Date;
  expiresAt?: Date;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface AnnouncementUpdateDto {
  title?: string;
  content?: string;
  type?: string;
  priority?: string;
  targetRoles?: string[];
  targetGrades?: string[];
  isActive?: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface AnnouncementStatistics {
  announcementId: string;
  totalReads: number;
  totalTargeted: number;
  readRate: number;
  byRole: Record<string, number>;
  byGrade: Record<string, number>;
  recentReads: AnnouncementRead[];
}

export const announcementsApi = {
  /**
   * Get all announcements with filters and pagination
   */
  getAll: (filters: AnnouncementFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.type) params.append("type", filters.type);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.priorityMin) params.append("priorityMin", filters.priorityMin);
    if (filters.targetRole) params.append("targetRole", filters.targetRole);

    return ApiClient.get<{
      data: Announcement[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/announcements?${params.toString()}`);
  },

  /**
   * Get announcement detail by ID
   */
  getDetail: (id: string) => {
    return ApiClient.get<{ data: Announcement }>(`/announcements/${id}`);
  },

  /**
   * Create new announcement
   */
  create: (data: AnnouncementCreateDto) => {
    return ApiClient.post<{ data: Announcement }>("/announcements", data);
  },

  /**
   * Update announcement
   */
  update: (id: string, data: AnnouncementUpdateDto) => {
    return ApiClient.patch<{ data: Announcement }>(
      `/announcements/${id}`,
      data
    );
  },

  /**
   * Delete announcement
   */
  delete: (id: string) => {
    return ApiClient.delete<{ message: string }>(`/announcements/${id}`);
  },

  /**
   * Deactivate announcement
   */
  deactivate: (id: string) => {
    return ApiClient.patch<{ data: Announcement }>(
      `/announcements/${id}/deactivate`
    );
  },

  /**
   * Extend announcement expiry
   */
  extendExpiry: (id: string, newExpiresAt: Date) => {
    return ApiClient.patch<{ data: Announcement }>(
      `/announcements/${id}/extend-expiry`,
      {
        expiresAt: newExpiresAt,
      }
    );
  },

  /**
   * Get read statistics for an announcement
   */
  getReadStats: (id: string) => {
    return ApiClient.get<{ data: AnnouncementStatistics }>(
      `/announcements/${id}/statistics`
    );
  },

  /**
   * Mark announcement as read
   */
  markAsRead: (id: string) => {
    return ApiClient.post<{ message: string }>(`/announcements/${id}/read`);
  },

  /**
   * Get user's unread announcements count
   */
  getUnreadCount: () => {
    return ApiClient.get<{ data: { count: number } }>(
      "/announcements/unread/count"
    );
  },

  /**
   * Get user's announcements
   */
  getUserAnnouncements: (filters: AnnouncementFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.type) params.append("type", filters.type);

    return ApiClient.get<{
      data: Announcement[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/announcements/me?${params.toString()}`);
  },
};
