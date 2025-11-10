"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Trash, Check, Bell } from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/lib/hooks/queries/use-notification-queries";

export default function NotificationsList() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const { data, isLoading } = useNotifications();
  const notifications = data?.notifications || [];

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.isRead).length,
    [notifications]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {t("unreadCount", { count: unreadCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead.mutate()}>
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">{tc("loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`p-3 border rounded-md flex items-start justify-between gap-3 ${n.isRead ? "bg-background" : "bg-card"}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead.mutate(n.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t("mark")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteNotification.mutate(n.id)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {t("deleteNotification")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
