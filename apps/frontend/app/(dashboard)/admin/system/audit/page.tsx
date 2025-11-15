"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { format } from "date-fns";
import {
  Activity,
  User,
  FileEdit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  XCircle,
  CheckCircle,
  Send,
  FileText,
  DollarSign,
  Calendar,
} from "lucide-react";

// Enums matching backend
enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  FAILED_LOGIN = "FAILED_LOGIN",
  PASSWORD_RESET = "PASSWORD_RESET",
  EXAM_START = "EXAM_START",
  EXAM_SUBMIT = "EXAM_SUBMIT",
  PAYMENT_PROCESS = "PAYMENT_PROCESS",
  MESSAGE_SEND = "MESSAGE_SEND",
  MESSAGE_APPROVE = "MESSAGE_APPROVE",
  MESSAGE_REJECT = "MESSAGE_REJECT",
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  endpoint: string | null;
  httpMethod: string | null;
  oldValues: string | null;
  newValues: string | null;
  metadata: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ActivityStats {
  totalLogs: number;
  uniqueUsers: number;
  actionCounts: Record<string, number>;
  resourceCounts: Record<string, number>;
}

export default function AdminActionsHistoryPage() {
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.resource) params.append("resource", filters.resource);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());

      const response = await ApiClient.get<AuditLogResponse>(
        `/audit-logs?${params.toString()}`
      );
      return (
        response || {
          logs: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          },
        }
      );
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["audit-logs-stats", filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await ApiClient.get<ActivityStats>(
        `/audit-logs/stats?${params.toString()}`
      );
      return (
        response || {
          totalLogs: 0,
          uniqueUsers: 0,
          actionCounts: {},
          resourceCounts: {},
        }
      );
    },
  });

  const handleClearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      resource: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50,
    });
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return <FileEdit className="h-4 w-4" />;
      case AuditAction.UPDATE:
        return <FileEdit className="h-4 w-4" />;
      case AuditAction.DELETE:
        return <Trash2 className="h-4 w-4" />;
      case AuditAction.READ:
        return <Eye className="h-4 w-4" />;
      case AuditAction.LOGIN:
        return <LogIn className="h-4 w-4" />;
      case AuditAction.LOGOUT:
        return <LogOut className="h-4 w-4" />;
      case AuditAction.FAILED_LOGIN:
        return <XCircle className="h-4 w-4" />;
      case AuditAction.PASSWORD_RESET:
        return <CheckCircle className="h-4 w-4" />;
      case AuditAction.EXAM_START:
      case AuditAction.EXAM_SUBMIT:
        return <FileText className="h-4 w-4" />;
      case AuditAction.PAYMENT_PROCESS:
        return <DollarSign className="h-4 w-4" />;
      case AuditAction.MESSAGE_SEND:
      case AuditAction.MESSAGE_APPROVE:
      case AuditAction.MESSAGE_REJECT:
        return <Send className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return "bg-green-100 text-green-800 border-green-200";
      case AuditAction.UPDATE:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case AuditAction.DELETE:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditAction.READ:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case AuditAction.LOGIN:
        return "bg-green-100 text-green-800 border-green-200";
      case AuditAction.LOGOUT:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case AuditAction.FAILED_LOGIN:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditAction.PASSWORD_RESET:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case AuditAction.PAYMENT_PROCESS:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-red-600">
            Error loading audit logs. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Actions History</h1>
        <p className="text-muted-foreground">
          View all system activities and admin actions
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Actions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalLogs.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.uniqueUsers.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Common Action
              </CardTitle>
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.actionCounts).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Active Resource
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.resourceCounts).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter audit logs by user, action, resource, or date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="Enter user ID"
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value, page: 1 })
                }
              />
            </div>
            <div>
              <Label>Action</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    action: value === "all" ? "" : value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {Object.values(AuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resource</Label>
              <Input
                placeholder="e.g., User, Class, Exam"
                value={filters.resource}
                onChange={(e) =>
                  setFilters({ ...filters, resource: e.target.value, page: 1 })
                }
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value, page: 1 })
                }
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value, page: 1 })
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Showing{" "}
            {data?.logs?.length ? (filters.page - 1) * filters.limit + 1 : 0} -{" "}
            {Math.min(
              filters.page * filters.limit,
              data?.pagination?.total ?? 0
            )}{" "}
            of {data?.pagination?.total ?? 0} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(log.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <div className="font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        <span className="flex items-center gap-1">
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.resourceId.substring(0, 12)}...
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.endpoint && (
                        <div className="text-xs">
                          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {log.httpMethod}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {log.endpoint}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.ipAddress || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
                disabled={filters.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                disabled={filters.page >= data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Audit Log Details</CardTitle>
                <CardDescription>ID: {selectedLog.id}</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Action</Label>
                <div>{selectedLog.action}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Resource</Label>
                <div>{selectedLog.resource}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Resource ID</Label>
                <div className="font-mono text-xs">
                  {selectedLog.resourceId || "—"}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">IP Address</Label>
                <div className="font-mono text-xs">
                  {selectedLog.ipAddress || "—"}
                </div>
              </div>
            </div>
            {selectedLog.userAgent && (
              <div>
                <Label className="text-muted-foreground">User Agent</Label>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded mt-1">
                  {selectedLog.userAgent}
                </div>
              </div>
            )}
            {selectedLog.oldValues && (
              <div>
                <Label className="text-muted-foreground">Old Values</Label>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.newValues && (
              <div>
                <Label className="text-muted-foreground">New Values</Label>
                <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.metadata && (
              <div>
                <Label className="text-muted-foreground">Metadata</Label>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
