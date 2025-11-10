"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface ErrorLog {
  id: string;
  level: "ERROR" | "WARNING" | "INFO";
  message: string;
  stackTrace?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  errorCode?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  resolver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ErrorStats {
  total: number;
  today: number;
  warnings: number;
  unresolved: number;
}

interface ErrorLogsResponse {
  logs: ErrorLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ErrorLogsPage() {
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<string>("all");
  const [resolved, setResolved] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [resolveNotes, setResolveNotes] = useState("");

  const limit = 20;

  // Fetch error logs
  const { data: logsData, isLoading } = useQuery<ErrorLogsResponse>({
    queryKey: ["error-logs", level, resolved, search, page],
    queryFn: () =>
      ApiClient.get("/system/error-logs", {
        params: {
          level: level === "all" ? undefined : level,
          resolved: resolved === "all" ? undefined : resolved === "true",
          search: search || undefined,
          page,
          limit,
        },
      }),
  });

  // Fetch error stats
  const { data: stats } = useQuery<ErrorStats>({
    queryKey: ["error-stats"],
    queryFn: () => ApiClient.get("/system/error-logs/stats"),
  });

  // Mark as resolved mutation
  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      ApiClient.patch(`/system/error-logs/${id}/resolve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["error-stats"] });
      setDetailsOpen(false);
      setSelectedError(null);
      setResolveNotes("");
    },
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const viewDetails = async (errorId: string) => {
    const error = await ApiClient.get<ErrorLog>(
      `/system/error-logs/${errorId}`
    );
    setSelectedError(error);
    setDetailsOpen(true);
  };

  const handleResolve = () => {
    if (selectedError) {
      resolveMutation.mutate({
        id: selectedError.id,
        notes: resolveNotes || undefined,
      });
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      case "WARNING":
        return (
          <Badge className="gap-1 bg-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case "INFO":
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" />
            Info
          </Badge>
        );
    }
  };

  const exportLogs = () => {
    if (!logsData?.logs) return;

    const csv = [
      [
        "Timestamp",
        "Level",
        "Message",
        "Route",
        "Method",
        "Occurrences",
        "Status",
      ],
      ...logsData.logs.map((log: ErrorLog) => [
        format(new Date(log.lastSeen), "yyyy-MM-dd HH:mm:ss"),
        log.level,
        log.message,
        log.route || "",
        log.method || "",
        log.occurrences,
        log.resolved ? "Resolved" : "Unresolved",
      ]),
    ]
      .map((row) => row.map((cell: string | number) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Error Logs Viewer
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage system errors for debugging and performance
            tracking
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Errors
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Errors Today
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.today || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Warnings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.warnings || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unresolved
            </CardTitle>
            <X className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.unresolved || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by message, route, or error code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resolved} onValueChange={setResolved}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="false">Unresolved</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : logsData?.logs && logsData.logs.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-center">Count</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((log: ErrorLog) => (
                      <>
                        <TableRow key={log.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(log.id)}
                            >
                              {expandedRows.has(log.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(log.lastSeen), "MMM dd, HH:mm:ss")}
                          </TableCell>
                          <TableCell>{getLevelBadge(log.level)}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {log.message}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {log.method && (
                              <Badge variant="outline" className="text-xs mr-1">
                                {log.method}
                              </Badge>
                            )}
                            {log.route || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {log.occurrences}x
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {log.resolved ? (
                              <Badge
                                variant="default"
                                className="gap-1 bg-green-600"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Unresolved</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewDetails(log.id)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(log.id) && log.stackTrace && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50">
                              <div className="p-4">
                                <p className="text-sm font-medium mb-2">
                                  Stack Trace:
                                </p>
                                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                                  {log.stackTrace}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, logsData.total)} of {logsData.total}{" "}
                  errors
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= logsData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No error logs found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Complete information about this error log
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Level</p>
                  <div className="mt-1">
                    {getLevelBadge(selectedError.level)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-1">
                    {selectedError.resolved ? (
                      <Badge variant="default" className="bg-green-600">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unresolved</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    First Seen
                  </p>
                  <p className="mt-1 text-sm">
                    {format(new Date(selectedError.firstSeen), "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Seen</p>
                  <p className="mt-1 text-sm">
                    {format(new Date(selectedError.lastSeen), "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Occurrences
                  </p>
                  <p className="mt-1 text-sm">{selectedError.occurrences}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Status Code
                  </p>
                  <p className="mt-1 text-sm">
                    {selectedError.statusCode || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Message</p>
                <p className="mt-1 text-sm bg-gray-100 p-3 rounded">
                  {selectedError.message}
                </p>
              </div>

              {selectedError.route && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Route</p>
                  <p className="mt-1 text-sm">
                    {selectedError.method} {selectedError.route}
                  </p>
                </div>
              )}

              {selectedError.user && (
                <div>
                  <p className="text-sm font-medium text-gray-600">User</p>
                  <p className="mt-1 text-sm">
                    {selectedError.user.firstName} {selectedError.user.lastName}{" "}
                    ({selectedError.user.email})
                  </p>
                </div>
              )}

              {selectedError.stackTrace && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Stack Trace
                  </p>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-60">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {selectedError.resolved && selectedError.resolver && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600">
                    Resolution
                  </p>
                  <p className="mt-1 text-sm">
                    Resolved by {selectedError.resolver.firstName}{" "}
                    {selectedError.resolver.lastName} on{" "}
                    {format(new Date(selectedError.resolvedAt!), "PPpp")}
                  </p>
                  {selectedError.notes && (
                    <p className="mt-2 text-sm bg-green-50 p-3 rounded">
                      {selectedError.notes}
                    </p>
                  )}
                </div>
              )}

              {!selectedError.resolved && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Mark as Resolved
                  </p>
                  <Textarea
                    placeholder="Add resolution notes (optional)..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleResolve}
                    className="mt-2 w-full"
                    disabled={resolveMutation.isPending}
                  >
                    {resolveMutation.isPending
                      ? "Resolving..."
                      : "Mark as Resolved"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
