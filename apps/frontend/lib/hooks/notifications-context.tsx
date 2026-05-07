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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only subscribe to user ID to prevent re-renders when other user fields change
  const userId = useAuthStore((state) => state.user?.id);

  // ── REST API fetch helpers ──────────────────────────────────────────
  const fetchViaApi = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const [notifRes, countRes] = await Promise.all([
        ApiClient.get<{ notifications: Notification[] }>("/notifications"),
        ApiClient.get<{ count: number }>("/notifications/unread-count"),
      ]);
      setNotifications(
        Array.isArray(notifRes?.notifications) ? notifRes.notifications : []
      );
      setUnreadCount(
        typeof countRes?.count === "number" ? countRes.count : 0
      );
    } catch {
      // Silently fail – will retry on next poll
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ── WebSocket + REST polling setup ──────────────────────────────────
  useEffect(() => {
    if (isConnectingRef.current) return;

    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      isConnectingRef.current = false;
      connectionAttemptRef.current = 0;
      return;
    }

    if (socketRef.current?.connected) return;

    // WebSocket not configured – fall back to REST polling
    setIsConnected(false);
    isConnectingRef.current = false;

    // Initial fetch
    fetchViaApi();

    // Poll every 60 seconds
    pollingRef.current = setInterval(fetchViaApi, 60_000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [userId, fetchViaApi]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: "READ" as const, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await ApiClient.patch(`/notifications/${notificationId}/read`);
      } catch {
        // Revert on failure – refetch
        fetchViaApi();
      }
    },
    [fetchViaApi]
  );

  // Mark notification as delivered (no-op for REST, kept for interface compat)
  const markAsDelivered = useCallback((_notificationId: string) => {}, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        status: "READ" as const,
        readAt: n.readAt || new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    try {
      await ApiClient.patch("/notifications/mark-all-read");
    } catch {
      fetchViaApi();
    }
  }, [fetchViaApi]);

  // Fetch notifications (trigger a manual refresh)
  const fetchNotifications = useCallback(
    (_limit = 50, _offset = 0) => {
      fetchViaApi();
    },
    [fetchViaApi]
  );

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
