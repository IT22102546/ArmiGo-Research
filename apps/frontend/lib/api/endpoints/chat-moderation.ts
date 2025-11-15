// apps/frontend/lib/api/endpoints/chat-moderation.ts
import { ApiClient } from "../api-client";

export enum MessageApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ChatMessageType {
  DIRECT = "DIRECT",
  CLASS = "CLASS",
  EXAM = "EXAM",
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  INTERNAL_TEACHER = "INTERNAL_TEACHER",
  EXTERNAL_TEACHER = "EXTERNAL_TEACHER",
  INTERNAL_STUDENT = "INTERNAL_STUDENT",
  EXTERNAL_STUDENT = "EXTERNAL_STUDENT",
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  messageType: ChatMessageType;
  content: string;
  attachments: string[];
  approvalStatus: MessageApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  readAt?: string;
  metadata?: {
    classId?: string;
    className?: string;
    examId?: string;
    examTitle?: string;
  };
  createdAt: string;
  updatedAt: string;

  // Relations for display
  from?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  to?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedMessagesResponse {
  data: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ModerationFilters {
  page?: number;
  limit?: number;
  fromRole?: UserRole;
  contextType?: "ALL" | "CLASS" | "EXAM" | "DIRECT";
}

export const chatModerationApi = {
  /**
   * Get pending messages for moderation (Admin only)
   */
  getPendingMessages: (filters?: ModerationFilters) => {
    const params: Record<string, any> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.fromRole) params.fromRole = filters.fromRole;
    if (filters?.contextType && filters.contextType !== "ALL") {
      params.messageType = filters.contextType;
    }

    return ApiClient.get<PaginatedMessagesResponse>(
      "/chat/moderation/pending",
      { params }
    );
  },

  /**
   * Approve a pending message (Admin only)
   */
  approve: (messageId: string) =>
    ApiClient.patch<{ message: string; chatMessage: ChatMessage }>(
      `/chat/moderation/${messageId}/approve`,
      {}
    ),

  /**
   * Reject a pending message (Admin only)
   */
  reject: (messageId: string, data: { reason: string }) =>
    ApiClient.patch<{ message: string; chatMessage: ChatMessage }>(
      `/chat/moderation/${messageId}/reject`,
      data
    ),

  /**
   * Bulk approve multiple messages (Admin only)
   */
  bulkApprove: (data: { messageIds: string[] }) =>
    ApiClient.post<{ message: string; approved: number; failed: number }>(
      "/chat/moderation/bulk-approve",
      data
    ),

  /**
   * Get moderation statistics (Admin only)
   */
  getStats: () =>
    ApiClient.get<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      byMessageType: Record<string, number>;
      byFromRole: Record<string, number>;
    }>("/chat/moderation/stats"),
};

// Backwards compatibility aliases
export const chatModerationApiCompat = {
  ...chatModerationApi,
  approveMessage: chatModerationApi.approve,
  rejectMessage: (messageId: string, reason: string) =>
    chatModerationApi.reject(messageId, { reason }),
  getModerationStats: chatModerationApi.getStats,
};
