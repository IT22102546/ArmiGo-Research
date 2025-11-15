"use client";

import { useState } from "react";
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
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface LoginActivity {
  id: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  deviceInfo?: {
    type: "desktop" | "mobile" | "tablet";
    browser: string;
    os: string;
  };
  success: boolean;
  timestamp: string;
  isSuspicious: boolean;
  reason?: string;
}

export default function LoginActivityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["login-activity", page, filterType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterType !== "all") {
        params.append("action", filterType);
      }

      const response = await ApiClient.get<{
        activities: LoginActivity[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/auth/login-activity?${params}`);
      return response;
    },
  });

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string, success: boolean) => {
    if (!success) {
      return <Badge variant="destructive">Failed</Badge>;
    }

    switch (action) {
      case "LOGIN_SUCCESS":
        return <Badge variant="default">Login</Badge>;
      case "LOGOUT":
        return <Badge variant="outline">Logout</Badge>;
      case "TWO_FACTOR_VERIFIED":
        return <Badge variant="secondary">2FA Verified</Badge>;
      case "PASSWORD_CHANGED":
        return <Badge className="bg-orange-500">Password Changed</Badge>;
      case "TWO_FACTOR_ENABLED":
        return <Badge className="bg-green-600">2FA Enabled</Badge>;
      case "TWO_FACTOR_DISABLED":
        return <Badge className="bg-red-600">2FA Disabled</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const exportLogs = () => {
    if (!data) return;

    const csvContent = [
      [
        "Timestamp",
        "Action",
        "IP Address",
        "Device",
        "Location",
        "Status",
      ].join(","),
      ...data.activities.map((activity) =>
        [
          format(new Date(activity.timestamp), "yyyy-MM-dd HH:mm:ss"),
          activity.action,
          activity.ipAddress,
          `${activity.deviceInfo?.browser || "Unknown"} on ${activity.deviceInfo?.os || "Unknown"}`,
          activity.location || "Unknown",
          activity.success ? "Success" : "Failed",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `login-activity-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredActivities = data?.activities.filter((activity) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.ipAddress.toLowerCase().includes(query) ||
      activity.userAgent.toLowerCase().includes(query) ||
      activity.location?.toLowerCase().includes(query) ||
      activity.action.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Login Activity</h1>
        <p className="text-muted-foreground">
          Review your account's login history and security events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.activities.filter((a) => a.success).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">This page</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Attempts
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.activities.filter((a) => !a.success).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">This page</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data?.activities.filter((a) => a.isSuspicious).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Flagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Your login history and security-related activities
              </CardDescription>
            </div>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP, location, or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                <SelectItem value="TWO_FACTOR_VERIFIED">
                  2FA Verified
                </SelectItem>
                <SelectItem value="PASSWORD_CHANGED">
                  Password Changed
                </SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredActivities && filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <TableRow
                      key={activity.id}
                      className={
                        activity.isSuspicious
                          ? "bg-orange-50 dark:bg-orange-950/20"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(
                                new Date(activity.timestamp),
                                "MMM dd, yyyy"
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(
                                new Date(activity.timestamp),
                                "hh:mm:ss a"
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(activity.action, activity.success)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(activity.deviceInfo?.type)}
                          <div>
                            <div className="text-sm font-medium">
                              {activity.deviceInfo?.browser ||
                                "Unknown Browser"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.deviceInfo?.os || "Unknown OS"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{activity.location}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {activity.ipAddress}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {activity.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {activity.isSuspicious && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No login activity found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alert */}
      {filteredActivities && filteredActivities.some((a) => a.isSuspicious) && (
        <Card className="mt-6 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Activity Detected
            </CardTitle>
            <CardDescription>
              We've detected potentially suspicious login attempts on your
              account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you don't recognize any of these activities, we recommend:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Change your password immediately</li>
              <li>Enable two-factor authentication if not already enabled</li>
              <li>
                Review your trusted devices and remove any you don't recognize
              </li>
              <li>
                Contact support if you believe your account has been compromised
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
