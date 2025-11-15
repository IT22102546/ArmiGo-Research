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
import { Input } from "@/components/ui/input";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Eye, Calendar, Filter } from "lucide-react";
import { notificationsApi } from "@/lib/api/endpoints";
import type { Notification } from "@/lib/api/endpoints/notifications";
import { handleApiError } from "@/lib/error-handling";

export default function NotificationsOverviewPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [
    pagination.page,
    typeFilter,
    statusFilter,
    roleFilter,
    dateFrom,
    dateTo,
    searchTerm,
  ]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAllAdmin({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm || undefined,
      });

      const respAny: any = response;
      const notificationsArr = Array.isArray(respAny)
        ? respAny
        : (respAny.data ?? []);
      setNotifications(notificationsArr);
      setPagination((prev) => ({
        ...prev,
        total: respAny?.total ?? respAny?.pagination?.total ?? 0,
        pages:
          respAny?.pagination?.pages ??
          Math.ceil((respAny?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setViewDialogOpen(true);
  };

  const getTypeColor = (type: string): BadgeVariant => {
    switch (type) {
      case "SYSTEM":
        return "destructive";
      case "CLASS_UPDATE":
        return "default";
      case "EXAM_REMINDER":
        return "secondary";
      case "PAYMENT_UPDATE":
        return "success";
      case "GRADE_RELEASED":
        return "warning";
      case "ANNOUNCEMENT":
        return "outline";
      case "CHAT_MESSAGE":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string): BadgeVariant => {
    switch (status) {
      case "UNREAD":
        return "default";
      case "READ":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Notifications Overview</CardTitle>
            <CardDescription>
              View and monitor all sent notifications for debugging and support
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, message, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="CLASS_UPDATE">Class Update</SelectItem>
                <SelectItem value="EXAM_REMINDER">Exam Reminder</SelectItem>
                <SelectItem value="PAYMENT_UPDATE">Payment Update</SelectItem>
                <SelectItem value="GRADE_RELEASED">Grade Released</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                <SelectItem value="CHAT_MESSAGE">Chat Message</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="UNREAD">Unread</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="INTERNAL_STUDENT">
                  Internal Student
                </SelectItem>
                <SelectItem value="EXTERNAL_STUDENT">
                  External Student
                </SelectItem>
                <SelectItem value="INTERNAL_TEACHER">
                  Internal Teacher
                </SelectItem>
                <SelectItem value="EXTERNAL_TEACHER">
                  External Teacher
                </SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="dateFrom" className="text-sm">
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo" className="text-sm">
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                setRoleFilter("ALL");
                setSearchTerm("");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Read At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetail(notification)}
                >
                  <TableCell>
                    {notification.sentAt
                      ? new Date(notification.sentAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {notification.user ? (
                      <>
                        <div className="font-medium">
                          {notification.user.firstName}{" "}
                          {notification.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.user.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notification.user?.role || "SYSTEM"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(notification.type)}>
                      {notification.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusColor(
                        notification.status || notification.isRead
                          ? "READ"
                          : "UNREAD"
                      )}
                    >
                      {notification.status ||
                        (notification.isRead ? "READ" : "UNREAD")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {notification.readAt
                      ? new Date(notification.readAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(notification);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {notifications.length} of {pagination.total} notifications
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant={getTypeColor(selectedNotification?.type || "")}>
                  {selectedNotification?.type.replace("_", " ")}
                </Badge>
                <Badge
                  variant={getStatusColor(selectedNotification?.status || "")}
                >
                  {selectedNotification?.status}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">User</h4>
              {selectedNotification?.user ? (
                <div>
                  <p className="font-medium">
                    {selectedNotification.user.firstName}{" "}
                    {selectedNotification.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNotification.user.email}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {selectedNotification.user.role}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  System notification
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Message</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedNotification?.message}
              </p>
            </div>
            {selectedNotification?.data && (
              <div>
                <h4 className="font-semibold mb-2">Additional Data</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1">Sent At</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification?.sentAt
                    ? new Date(selectedNotification.sentAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Read At</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification?.readAt
                    ? new Date(selectedNotification.readAt).toLocaleString()
                    : "Not read yet"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
