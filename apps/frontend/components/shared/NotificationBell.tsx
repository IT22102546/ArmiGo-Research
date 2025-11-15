"use client";

import React from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

export function NotificationBell() {
  const { unreadCount, isConnected } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-yellow-500" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <NotificationPanel />
      </SheetContent>
    </Sheet>
  );
}

function NotificationPanel() {
  const t = useTranslations("shared.notifications");
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    isLoading,
  } = useNotifications();

  React.useEffect(() => {
    // Fetch notifications when panel opens
    fetchNotifications(50, 0);
  }, [fetchNotifications]);

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle>{t("title")}</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <SheetDescription>
          {unreadCount === 0
            ? t("noUnread")
            : t("unreadCount", { count: unreadCount })}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {t("noNotifications")}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const t = useTranslations("shared.notifications");
  const isUnread = notification.status === "UNREAD";

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "EXAM_UPDATE":
        return "📝";
      case "CLASS_UPDATE":
        return "📚";
      case "SYSTEM":
        return "⚙️";
      case "ANNOUNCEMENT":
        return "📢";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "EXAM_UPDATE":
        return "bg-blue-50 dark:bg-blue-950";
      case "CLASS_UPDATE":
        return "bg-green-50 dark:bg-green-950";
      case "SYSTEM":
        return "bg-gray-50 dark:bg-gray-950";
      case "ANNOUNCEMENT":
        return "bg-purple-50 dark:bg-purple-950";
      default:
        return "bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border transition-colors",
        isUnread
          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
          : "bg-background hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl",
            getNotificationColor(notification.type)
          )}
        >
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium line-clamp-2",
                isUnread && "font-semibold"
              )}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onMarkAsRead(notification.id)}
                title={t("markAsRead")}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {notification.createdAt &&
                formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
            </span>
            {isUnread && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {t("new")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
