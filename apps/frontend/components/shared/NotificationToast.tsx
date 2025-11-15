"use client";

import React, { useEffect, useState } from "react";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";

export function NotificationToast() {
  const { notifications, markAsRead } = useNotifications();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Show toast for new unread notifications
    notifications.forEach((notification) => {
      if (
        notification.status === "UNREAD" &&
        !shownNotifications.has(notification.id)
      ) {
        // Mark as shown
        setShownNotifications((prev) => new Set(prev).add(notification.id));

        // Show toast with sonner - using info style for notifications
        toast.info(notification.title, {
          description: notification.message,
          icon: (
            <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          ),
          duration: 6000,
          action: {
            label: "Mark as Read",
            onClick: () => markAsRead(notification.id),
          },
          classNames: {
            toast:
              "group-[.toaster]:border-blue-200 dark:group-[.toaster]:border-blue-800",
          },
        });
      }
    });
  }, [notifications, shownNotifications, markAsRead]);

  return null; // This component doesn't render anything
}
