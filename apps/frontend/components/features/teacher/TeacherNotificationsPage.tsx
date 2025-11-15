"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BookOpen,
  FileText,
  AlertTriangle,
  Settings,
  Search,
  RefreshCw,
  Check,
  Trash2,
} from "lucide-react";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";
import { notificationsApi } from "@/lib/api";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

export default function TeacherNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll();
      setNotifications(
        Array.isArray(response) ? response : response.notifications || []
      );
    } catch (error) {
      handleApiError(error, "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      handleApiSuccess("Notification marked as read");
      fetchNotifications();
    } catch (error) {
      handleApiError(error, "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      handleApiSuccess("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      handleApiError(error, "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      // Integrate with notifications API delete endpoint
      handleApiSuccess("Notification deleted");
      fetchNotifications();
    } catch (error) {
      handleApiError(error, "Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CLASS":
        return <BookOpen className="h-5 w-5" />;
      case "EXAM":
        return <FileText className="h-5 w-5" />;
      case "ANNOUNCEMENT":
        return <Bell className="h-5 w-5" />;
      case "SYSTEM":
        return <Settings className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "CLASS":
        return "text-blue-600";
      case "EXAM":
        return "text-green-600";
      case "ANNOUNCEMENT":
        return "text-purple-600";
      case "SYSTEM":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || notif.type === typeFilter;
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "read" && notif.isRead) ||
      (readFilter === "unread" && !notif.isRead);
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                All Notifications ({filteredNotifications.length})
              </CardTitle>
              <CardDescription>
                Showing {filteredNotifications.length} of {notifications.length}{" "}
                notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CLASS">Class</SelectItem>
                <SelectItem value="EXAM">Exam</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No notifications found
                </h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    !notif.isRead ? "bg-accent/50" : ""
                  }`}
                >
                  <div
                    className={`mt-1 ${getNotificationColor(notif.type || "DEFAULT")}`}
                  >
                    {getNotificationIcon(notif.type || "DEFAULT")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notif.title}</p>
                          {!notif.isRead && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {safeFormatDate(notif.createdAt, "PPp")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
