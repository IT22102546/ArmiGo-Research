"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Loader2,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { auditLogsApi, type AuditLog, AuditAction } from "@/lib/api/endpoints/audit-logs";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { format } from "date-fns";

function ActivityHistoryPage() {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  useEffect(() => {
    fetchActivities();
    if (isAdmin) {
      fetchStats();
    }
  }, [currentPage, actionFilter, resourceFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (actionFilter !== "all") {
        params.action = actionFilter;
      }

      if (resourceFilter !== "all") {
        params.resourceType = resourceFilter;
      }

      let response;
      if (isAdmin) {
        // Admins can see all activities
        response = await auditLogsApi.findAll(params);
      } else {
        // Regular users see only their activities
        response = await auditLogsApi.getMyActivity(params);
      }

      const logsData = response?.logs || [];
      setActivities(Array.isArray(logsData) ? logsData : []);
      
      // Calculate total pages
      const total = response?.total || logsData.length;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error: any) {
      toast.error("Failed to load activity history");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditLogsApi.getStats();
      setStats(response);
    } catch (error) {
      // Silently handle stats fetch errors
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      searchQuery === "" ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      LOGIN: "bg-purple-100 text-purple-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      VIEW: "bg-cyan-100 text-cyan-800",
      DOWNLOAD: "bg-yellow-100 text-yellow-800",
      UPLOAD: "bg-orange-100 text-orange-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const formatAction = (action: string) => {
    return action.charAt(0) + action.slice(1).toLowerCase();
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
    } catch {
      return dateString;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading activity history...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Activity History
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "View all system activities and audit logs"
            : "View your activity history"}
        </p>
      </div>

      {/* Stats Cards (Admin only) */}
      {isAdmin && stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalActions || 0}</div>
              <p className="text-xs text-muted-foreground">Total Actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.todayActions || 0}</div>
              <p className="text-xs text-muted-foreground">Today's Actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.uniqueUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {stats.criticalActions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Critical Actions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Activity Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                {filteredActivities.length} activities found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Class">Class</SelectItem>
                <SelectItem value="Subject">Subject</SelectItem>
                <SelectItem value="Exam">Exam</SelectItem>
                <SelectItem value="Attendance">Attendance</SelectItem>
                <SelectItem value="Grade">Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Description</TableHead>
                  {isAdmin && <TableHead>User</TableHead>}
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 6 : 5}
                      className="text-center py-8"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 6 : 5}
                      className="text-center py-8"
                    >
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge className={getActionBadgeColor(activity.action)}>
                          {formatAction(activity.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {activity.resource}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-d">
                        <span className="text-sm text-muted-foreground">
                          {activity.resourceId || "N/A"}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {activity.user?.firstName} {activity.user?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.user?.email}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {activity.ipAddress || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(activity.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityHistoryPage;
