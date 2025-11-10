// apps/frontend/lib/api/endpoints/chat.ts

import { ApiClient } from "../api-client";

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  messageType: "DIRECT" | "GROUP" | "ANNOUNCEMENT";
  content: string;
  attachments: string[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  readAt?: string | null;
  deleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  from: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  to: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface ConversationsResponse {
  data: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConversationResponse {
  data: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const chatApi = {
  /**
   * Get list of conversations
   */
  getConversations: (page: number = 1, limit: number = 20) =>
    ApiClient.get<ConversationsResponse>("/chat/conversations", {
      params: {
        page: page.toString(),
        limit: limit.toString(),
      },
    }),

  /**
   * Get conversation with specific user
   */
  getConversation: (userId: string, page: number = 1, limit: number = 50) =>
    ApiClient.get<ConversationResponse>(`/chat/conversation/${userId}`, {
      params: {
        page: page.toString(),
        limit: limit.toString(),
      },
    }),

  /**
   * Get unread message count
   */
  getUnreadCount: () =>
    ApiClient.get<UnreadCountResponse>("/chat/unread-count"),

  /**
   * Search messages
   */
  searchMessages: (query: string, page: number = 1, limit: number = 20) =>
    ApiClient.get<ConversationResponse>("/chat/search", {
      params: {
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      },
    }),

  /**
   * Mark message as read
   */
  markAsRead: (messageId: string) =>
    ApiClient.patch<ChatMessage>(`/chat/${messageId}/read`),

  /**
   * Delete message
   */
  deleteMessage: (messageId: string) =>
    ApiClient.patch<ChatMessage>(`/chat/${messageId}/delete`),
};
