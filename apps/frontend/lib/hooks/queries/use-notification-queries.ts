/** Notification query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/endpoints/notifications";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";
import {
  optimisticUpdate,
  optimisticRemove,
} from "@/lib/query/optimistic-updates";

interface NotificationFilters {
  read?: boolean;
  type?: string;
  limit?: number;
}

/**
 * Get notifications
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      return await notificationsApi.getAll(filters);
    },
    staleTime: 30 * 1000, // 30 seconds - notifications are time-sensitive
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, "unread-count"],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.count;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Mark notification as read mutation
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.lists(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.lists()
      );

      // Optimistically update - mark notification as read
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.lists() },
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((n: any) =>
              n.id === id ? { ...n, isRead: true } : n
            );
          }
          if (old.notifications) {
            return {
              ...old,
              notifications: old.notifications.map((n: any) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
            };
          }
          return old;
        }
      );

      return { previousNotifications };
    },
    onError: (error: any, id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.notifications.lists() },
          context.previousNotifications
        );
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Mark all as read mutation
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("All notifications marked as read");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark notifications as read");
    },
  });
}

/**
 * Delete notification mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.lists(),
      });

      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.lists()
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.lists() },
        (old: any) => {
          if (!old) return old;
          return optimisticRemove(old, id);
        }
      );

      return { previousNotifications };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error: any, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.notifications.lists() },
          context.previousNotifications
        );
      }
      toast.error(error.message || "Failed to delete notification");
    },
  });
}
