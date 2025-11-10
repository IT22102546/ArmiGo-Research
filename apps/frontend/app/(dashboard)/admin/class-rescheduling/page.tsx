"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Eye,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

type RescheduleStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

interface ClassRescheduling {
  id: string;
  classSessionId: string;
  originalStartTime: string;
  originalEndTime: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
  status: RescheduleStatus;
  requestedById: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedReason?: string;
  notificationSent: boolean;
  classSession?: {
    subject?: {
      name: string;
    };
    teacher?: {
      firstName: string;
      lastName: string;
    };
    class?: {
      name: string;
      grade?: {
        name: string;
      };
    };
  };
  requestedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function ClassReschedulingPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRescheduling, setSelectedRescheduling] =
    useState<ClassRescheduling | null>(null);

  const { data: reschedulingData, isLoading } = useQuery({
    queryKey: ["class-rescheduling", filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await ApiClient.get<any>("/class-rescheduling", {
        params,
      });
      return response?.data || response || [];
    },
  });

  const { data: statistics } = useQuery({
    queryKey: ["class-rescheduling-stats"],
    queryFn: async () => {
      const response = await ApiClient.get<any>(
        "/class-rescheduling/statistics"
      );
      return response?.data || response || {};
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.patch(`/class-rescheduling/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling-stats"] });
      toast.success("Rescheduling approved");
    },
    onError: () => {
      toast.error("Failed to approve rescheduling");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await ApiClient.patch(`/class-rescheduling/${id}/reject`, {
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling-stats"] });
      toast.success("Rescheduling rejected");
    },
    onError: () => {
      toast.error("Failed to reject rescheduling");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.patch(`/class-rescheduling/${id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      toast.success("Rescheduling marked as completed");
    },
    onError: () => {
      toast.error("Failed to complete rescheduling");
    },
  });

  const reschedulings = Array.isArray(reschedulingData)
    ? reschedulingData
    : reschedulingData?.reschedulings || [];

  const getStatusBadge = (status: RescheduleStatus) => {
    const styles: Record<RescheduleStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const handleView = (rescheduling: ClassRescheduling) => {
    setSelectedRescheduling(rescheduling);
    setViewDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    if (confirm("Approve this class rescheduling?")) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handleComplete = (id: string) => {
    if (confirm("Mark this rescheduling as completed?")) {
      completeMutation.mutate(id);
    }
  };

  const stats = {
    total: statistics?.total || reschedulings.length,
    pending:
      statistics?.pending ||
      reschedulings.filter((r: ClassRescheduling) => r.status === "PENDING")
        .length,
    approved:
      statistics?.approved ||
      reschedulings.filter((r: ClassRescheduling) => r.status === "APPROVED")
        .length,
    completed:
      statistics?.completed ||
      reschedulings.filter((r: ClassRescheduling) => r.status === "COMPLETED")
        .length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Class Rescheduling</h1>
          <p className="text-muted-foreground">
            Manage class schedule changes and teacher requests
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class or teacher..."
                className="pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
            />

            <Button
              variant="outline"
              onClick={() =>
                setFilters({ status: "", dateFrom: "", dateTo: "", search: "" })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rescheduling Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rescheduling Requests</CardTitle>
          <CardDescription>
            {reschedulings.length} request(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class/Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Original Time</TableHead>
                <TableHead>New Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reschedulings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No rescheduling requests found
                  </TableCell>
                </TableRow>
              ) : (
                reschedulings.map((item: ClassRescheduling) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.classSession?.subject?.name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.classSession?.class?.name} -{" "}
                          {item.classSession?.class?.grade?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.classSession?.teacher?.firstName}{" "}
                      {item.classSession?.teacher?.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {format(new Date(item.originalStartTime), "PPp")}
                        </div>
                        <div className="text-muted-foreground">
                          to {format(new Date(item.originalEndTime), "p")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>
                            {format(new Date(item.newStartTime), "PPp")}
                          </div>
                          <div className="text-muted-foreground">
                            to {format(new Date(item.newEndTime), "p")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 max-w-[200px]">
                        {item.reason}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(item.status)}
                        {item.notificationSent && (
                          <Badge variant="outline" className="text-xs">
                            Notified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(item.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(item.id)}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {item.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(item.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Rescheduling Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rescheduling Request Details</DialogTitle>
          </DialogHeader>
          {selectedRescheduling && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">
                    {selectedRescheduling.classSession?.subject?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRescheduling.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-medium">
                    {selectedRescheduling.classSession?.class?.name} -{" "}
                    {selectedRescheduling.classSession?.class?.grade?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teacher</Label>
                  <p className="font-medium">
                    {selectedRescheduling.classSession?.teacher?.firstName}{" "}
                    {selectedRescheduling.classSession?.teacher?.lastName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">
                    Original Schedule
                  </Label>
                  <p className="font-medium">
                    {format(
                      new Date(selectedRescheduling.originalStartTime),
                      "PPp"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    to{" "}
                    {format(
                      new Date(selectedRescheduling.originalEndTime),
                      "p"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">New Schedule</Label>
                  <p className="font-medium text-primary">
                    {format(new Date(selectedRescheduling.newStartTime), "PPp")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    to {format(new Date(selectedRescheduling.newEndTime), "p")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">
                  Reason for Rescheduling
                </Label>
                <p className="mt-1">{selectedRescheduling.reason}</p>
              </div>

              {selectedRescheduling.rejectedReason && (
                <div>
                  <Label className="text-muted-foreground text-red-600">
                    Rejection Reason
                  </Label>
                  <p className="mt-1 text-red-600">
                    {selectedRescheduling.rejectedReason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p>
                    {selectedRescheduling.requestedBy?.firstName}{" "}
                    {selectedRescheduling.requestedBy?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested At</Label>
                  <p>
                    {format(new Date(selectedRescheduling.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">
                  Notification Status:
                </Label>
                <Badge
                  variant={
                    selectedRescheduling.notificationSent
                      ? "default"
                      : "secondary"
                  }
                >
                  {selectedRescheduling.notificationSent ? "Sent" : "Not Sent"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
