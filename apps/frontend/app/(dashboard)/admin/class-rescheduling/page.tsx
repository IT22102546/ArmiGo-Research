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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  ArrowRight,
  Activity,
} from "lucide-react";

type RescheduleStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

interface TherapySessionRescheduling {
  id: string;
  therapySessionId: string;
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
  therapySession?: {
    therapyType?: {
      name: string;
    };
    therapist?: {
      name: string;
      specialty: string;
    };
    patient?: {
      name: string;
      age: number;
      diagnosis: string;
    };
    clinic?: {
      name: string;
      location: string;
    };
  };
  requestedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const DUMMY_RESCHEDULING_DATA: TherapySessionRescheduling[] = [
  {
    id: "res-001",
    therapySessionId: "ts-001",
    originalStartTime: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString(),
    originalEndTime: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    newStartTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    newEndTime: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    reason: "Patient requested afternoon slot instead of morning",
    status: "PENDING",
    requestedById: "user-001",
    notificationSent: false,
    therapySession: {
      therapyType: { name: "Speech Therapy" },
      therapist: { name: "Dr. Sarah Johnson", specialty: "Speech & Language" },
      patient: {
        name: "Emma Davis",
        age: 8,
        diagnosis: "Articulation Disorder",
      },
      clinic: { name: "City Therapy Center", location: "Downtown" },
    },
    requestedBy: { firstName: "Sarah", lastName: "Johnson" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "res-002",
    therapySessionId: "ts-002",
    originalStartTime: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000
    ).toISOString(),
    originalEndTime: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    newStartTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    newEndTime: new Date(
      Date.now() + 6 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    reason: "Therapist needs to reschedule due to emergency",
    status: "APPROVED",
    requestedById: "user-002",
    approvedById: "admin-001",
    approvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notificationSent: true,
    therapySession: {
      therapyType: { name: "Occupational Therapy" },
      therapist: {
        name: "Dr. Michael Chen",
        specialty: "Motor Skills Development",
      },
      patient: {
        name: "Lucas Martinez",
        age: 6,
        diagnosis: "Developmental Delay",
      },
      clinic: { name: "Riverside Therapy", location: "Westside" },
    },
    requestedBy: { firstName: "Michael", lastName: "Chen" },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "res-003",
    therapySessionId: "ts-003",
    originalStartTime: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    originalEndTime: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000
    ).toISOString(),
    newStartTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    newEndTime: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000
    ).toISOString(),
    reason: "Conflicting appointment",
    status: "REJECTED",
    requestedById: "user-003",
    rejectedReason: "Cannot accommodate - therapist on annual leave",
    notificationSent: true,
    therapySession: {
      therapyType: { name: "Physical Therapy" },
      therapist: { name: "Dr. Jessica Brown", specialty: "Pediatric PT" },
      patient: { name: "Oliver Wilson", age: 10, diagnosis: "Cerebral Palsy" },
      clinic: { name: "Central Medical Complex", location: "Midtown" },
    },
    requestedBy: { firstName: "Jessica", lastName: "Brown" },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "res-004",
    therapySessionId: "ts-004",
    originalStartTime: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ).toISOString(),
    originalEndTime: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    newStartTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    newEndTime: new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    reason: "Session completed as rescheduled",
    status: "COMPLETED",
    requestedById: "user-004",
    approvedById: "admin-001",
    notificationSent: true,
    therapySession: {
      therapyType: { name: "Behavioral Therapy" },
      therapist: { name: "Dr. Amanda Lee", specialty: "Behavioral Health" },
      patient: { name: "Sophia Garcia", age: 9, diagnosis: "ADHD" },
      clinic: { name: "Wellness Therapy Hub", location: "Eastside" },
    },
    requestedBy: { firstName: "Amanda", lastName: "Lee" },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "res-005",
    therapySessionId: "ts-005",
    originalStartTime: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000
    ).toISOString(),
    originalEndTime: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    newStartTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    newEndTime: new Date(
      Date.now() + 11 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    ).toISOString(),
    reason: "Patient family vacation conflict",
    status: "PENDING",
    requestedById: "user-005",
    notificationSent: false,
    therapySession: {
      therapyType: { name: "Speech Therapy" },
      therapist: { name: "Dr. Robert Taylor", specialty: "Voice & Fluency" },
      patient: { name: "Noah Anderson", age: 7, diagnosis: "Stuttering" },
      clinic: { name: "Premier Therapy Services", location: "Northside" },
    },
    requestedBy: { firstName: "Robert", lastName: "Taylor" },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export default function TherapySessionReschedulingPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRescheduling, setSelectedRescheduling] =
    useState<TherapySessionRescheduling | null>(null);

  const { data: reschedulingData = DUMMY_RESCHEDULING_DATA, isLoading } =
    useQuery({
      queryKey: ["therapy-session-rescheduling", filters],
      queryFn: async () => {
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;

        const response = await ApiClient.get<
          | {
              data?: TherapySessionRescheduling[];
            }
          | TherapySessionRescheduling[]
        >("/therapy-session-rescheduling", {
          params,
        });
        if (Array.isArray(response)) return response;
        return response?.data || DUMMY_RESCHEDULING_DATA;
      },
    });

  const { data: statistics } = useQuery({
    queryKey: ["therapy-session-rescheduling-stats"],
    queryFn: async () => {
      const response = await ApiClient.get<{
        total?: number;
        pending?: number;
        approved?: number;
        completed?: number;
      }>("/therapy-session-rescheduling/statistics");
      if (response && typeof response === "object" && "data" in response) {
        return response.data || {};
      }
      // Fallback to calculated stats from dummy data
      return (
        response || {
          total: DUMMY_RESCHEDULING_DATA.length,
          pending: DUMMY_RESCHEDULING_DATA.filter((r) => r.status === "PENDING")
            .length,
          approved: DUMMY_RESCHEDULING_DATA.filter(
            (r) => r.status === "APPROVED"
          ).length,
          completed: DUMMY_RESCHEDULING_DATA.filter(
            (r) => r.status === "COMPLETED"
          ).length,
        }
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.patch(
        `/therapy-session-rescheduling/${id}/approve`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["therapy-session-rescheduling"],
      });
      queryClient.invalidateQueries({
        queryKey: ["therapy-session-rescheduling-stats"],
      });
      toast.success("Session rescheduling approved");
    },
    onError: () => {
      toast.error("Failed to approve session rescheduling");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await ApiClient.patch(
        `/therapy-session-rescheduling/${id}/reject`,
        {
          reason,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["therapy-session-rescheduling"],
      });
      queryClient.invalidateQueries({
        queryKey: ["therapy-session-rescheduling-stats"],
      });
      toast.success("Session rescheduling rejected");
    },
    onError: () => {
      toast.error("Failed to reject session rescheduling");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ApiClient.patch(
        `/therapy-session-rescheduling/${id}/complete`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["therapy-session-rescheduling"],
      });
      toast.success("Session rescheduling marked as completed");
    },
    onError: () => {
      toast.error("Failed to complete session rescheduling");
    },
  });

  const reschedulings = reschedulingData || [];

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

  const handleView = (rescheduling: TherapySessionRescheduling) => {
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
    total: (statistics as { total?: number })?.total || reschedulings.length,
    pending:
      (statistics as { pending?: number })?.pending ||
      reschedulings.filter(
        (r: TherapySessionRescheduling) => r.status === "PENDING"
      ).length,
    approved:
      (statistics as { approved?: number })?.approved ||
      reschedulings.filter(
        (r: TherapySessionRescheduling) => r.status === "APPROVED"
      ).length,
    completed:
      (statistics as { completed?: number })?.completed ||
      reschedulings.filter(
        (r: TherapySessionRescheduling) => r.status === "COMPLETED"
      ).length,
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Therapy Session Rescheduling
          </h1>
          <p className="text-muted-foreground">
            Manage therapy session schedule changes and rescheduling requests
          </p>
        </div>
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
                placeholder="Search by patient or therapist..."
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
                <TableHead>Patient/Therapy Type</TableHead>
                <TableHead>Therapist</TableHead>
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
                reschedulings.map((item: TherapySessionRescheduling) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.therapySession?.therapyType?.name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.therapySession?.patient?.name} (
                          {item.therapySession?.patient?.age}y)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.therapySession?.therapist?.name}
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
            <DialogTitle>Session Rescheduling Request Details</DialogTitle>
          </DialogHeader>
          {selectedRescheduling && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Therapy Type</Label>
                  <p className="font-medium">
                    {selectedRescheduling.therapySession?.therapyType?.name}
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
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">
                    {selectedRescheduling.therapySession?.patient?.name} (
                    {selectedRescheduling.therapySession?.patient?.age}y)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRescheduling.therapySession?.patient?.diagnosis}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Therapist</Label>
                  <p className="font-medium">
                    {selectedRescheduling.therapySession?.therapist?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRescheduling.therapySession?.therapist?.specialty}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Clinic</Label>
                <p className="font-medium">
                  {selectedRescheduling.therapySession?.clinic?.name} -{" "}
                  {selectedRescheduling.therapySession?.clinic?.location}
                </p>
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
