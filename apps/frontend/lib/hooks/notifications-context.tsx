"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { ApiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/stores/auth-store";

export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  status: "READ" | "UNREAD";
  title: string;
  message: string;
  data?: string;
  sentAt: string | null;
  deliveredAt?: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getDeliveryStatus(
  notification: Notification
): NotificationDeliveryStatus {
  if (notification.readAt) return "read";
  if (notification.deliveredAt) return "delivered";
  if (notification.sentAt) return "sent";
  return "pending";
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAsDelivered: (notificationId: string) => void;
  markAllAsRead: () => void;
  fetchNotifications: (limit?: number, offset?: number) => void;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);
  const connectionAttemptRef = useRef(0);

  // Only subscribe to user ID to prevent re-renders when other user fields change
  const userId = useAuthStore((state) => state.user?.id);

  // Connect to notifications WebSocket - SINGLETON pattern
  useEffect(() => {
    // Prevent multiple connections
    if (isConnectingRef.current) {
      return;
    }

    if (!userId) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      isConnectingRef.current = false;
      connectionAttemptRef.current = 0;
      return;
    }

    // Already connected with a valid socket for this user
    if (socketRef.current?.connected) {
      return;
    }

    // Skip WebSocket connection for now (not configured on backend)
    // TODO: Enable when Socket.io is configured on backend
    setIsConnected(false);
    isConnectingRef.current = false;

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [userId]); // Only depend on userId to prevent unnecessary reconnections

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("markAsRead", notificationId);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
                ...notif,
                status: "READ" as const,
                readAt: new Date().toISOString(),
                deliveredAt: notif.deliveredAt || new Date().toISOString(),
              }
            : notif
        )
      );
    }
  }, []);

  // Mark notification as delivered
  const markAsDelivered = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("notification:delivered", { notificationId });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, deliveredAt: new Date().toISOString() }
            : notif
        )
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("markAllAsRead");

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          status: "READ" as const,
          readAt: notif.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback((limit = 50, offset = 0) => {
    if (socketRef.current?.connected) {
      setIsLoading(true);
      socketRef.current.emit("fetchNotifications", { limit, offset });
    }
  }, []);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAsDelivered,
    markAllAsRead,
    fetchNotifications,
    isLoading,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    // Return a safe default when used outside provider (e.g., during SSR or before provider mounts)
    return {
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      markAsRead: () => {},
      markAsDelivered: () => {},
      markAllAsRead: () => {},
      fetchNotifications: () => {},
      isLoading: false,
    };
  }
  return context;
}
