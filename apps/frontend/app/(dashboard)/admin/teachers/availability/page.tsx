"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teacherAvailabilityApi,
  TeacherAvailability,
  LeaveType,
  LeaveStatus,
  CreateLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  AvailabilityFilterDto,
} from "@/lib/api/teacher-availability";
import { usersApi } from "@/lib/api/endpoints/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

export default function TeacherAvailabilityPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AvailabilityFilterDto>({
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] =
    useState<TeacherAvailability | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateLeaveDto>({
    teacherId: "",
    leaveType: LeaveType.SICK_LEAVE,
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [approveForm, setApproveForm] = useState<ApproveLeaveDto>({});
  const [rejectForm, setRejectForm] = useState<RejectLeaveDto>({
    rejectionReason: "",
  });

  // Queries
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery(
    {
      queryKey: ["teacher-availability", filters],
      queryFn: () => teacherAvailabilityApi.getAvailabilityList(filters),
    }
  );

  const { data: statistics } = useQuery({
    queryKey: ["teacher-availability-statistics"],
    queryFn: () => teacherAvailabilityApi.getStatistics(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["users", { role: "INTERNAL_TEACHER" }],
    queryFn: () => usersApi.getAll({ role: "INTERNAL_TEACHER", limit: 1000 }),
  });

  const { data: replacementSuggestions } = useQuery({
    queryKey: [
      "replacement-suggestions",
      createForm.teacherId,
      createForm.startDate,
      createForm.endDate,
    ],
    queryFn: () =>
      teacherAvailabilityApi.getReplacementSuggestions(
        createForm.teacherId,
        createForm.startDate,
        createForm.endDate
      ),
    enabled:
      !!createForm.teacherId && !!createForm.startDate && !!createForm.endDate,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: teacherAvailabilityApi.createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-availability-statistics"],
      });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveLeaveDto }) =>
      teacherAvailabilityApi.approveLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-availability-statistics"],
      });
      setApproveDialogOpen(false);
      setSelectedLeave(null);
      setApproveForm({});
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectLeaveDto }) =>
      teacherAvailabilityApi.rejectLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-availability-statistics"],
      });
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectForm({ rejectionReason: "" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => teacherAvailabilityApi.cancelLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-availability"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-availability-statistics"],
      });
    },
  });

  // Handlers
  const resetCreateForm = () => {
    setCreateForm({
      teacherId: "",
      leaveType: LeaveType.SICK_LEAVE,
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeave) {
      approveMutation.mutate({ id: selectedLeave.id, data: approveForm });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeave) {
      rejectMutation.mutate({ id: selectedLeave.id, data: rejectForm });
    }
  };

  const handleCancel = (leave: TeacherAvailability) => {
    if (confirm("Are you sure you want to cancel this leave request?")) {
      cancelMutation.mutate(leave.id);
    }
  };

  const openApproveDialog = (leave: TeacherAvailability) => {
    setSelectedLeave(leave);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (leave: TeacherAvailability) => {
    setSelectedLeave(leave);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const variants: Record<
      LeaveStatus,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      [LeaveStatus.PENDING]: "secondary",
      [LeaveStatus.APPROVED]: "default",
      [LeaveStatus.REJECTED]: "destructive",
      [LeaveStatus.CANCELLED]: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const teachers = teachersData?.users || [];
  const leaves = availabilityData?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Teacher Availability Management
          </h1>
          <p className="text-muted-foreground">
            Manage teacher leaves, replacements, and scheduling
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Leave Request</DialogTitle>
              <DialogDescription>
                Submit a new leave request for a teacher
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacherId">Teacher *</Label>
                <Select
                  value={createForm.teacherId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, teacherId: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select
                  value={createForm.leaveType}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      leaveType: value as LeaveType,
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeaveType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getLeaveTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Please provide a reason for the leave"
                  required
                  rows={3}
                />
              </div>

              {replacementSuggestions && replacementSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label>Replacement Teacher Suggestions</Label>
                  <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {replacementSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() =>
                          setCreateForm((prev) => ({
                            ...prev,
                            replacementTeacherId: suggestion.id,
                          }))
                        }
                      >
                        <div>
                          <div className="font-medium">
                            {suggestion.firstName} {suggestion.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.email} • {suggestion.commonSubjects}{" "}
                            common subjects
                          </div>
                          {suggestion.subjects &&
                            suggestion.subjects.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {suggestion.subjects.join(", ")}
                              </div>
                            )}
                        </div>
                        {createForm.replacementTeacherId === suggestion.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create Leave Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Leaves
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus[LeaveStatus.PENDING] || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus[LeaveStatus.APPROVED] || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus[LeaveStatus.REJECTED] || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select
                value={filters.teacherId || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    teacherId: value === "all" ? undefined : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status:
                      value === "all" ? undefined : (value as LeaveStatus),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.values(LeaveStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select
                value={filters.leaveType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    leaveType:
                      value === "all" ? undefined : (value as LeaveType),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.values(LeaveType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {getLeaveTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ page: 1, limit: 10 })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAvailability ? (
            <div className="text-center py-8">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leave requests found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Replacement</TableHead>
                    <TableHead>Affected Classes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {leave.teacher
                              ? `${leave.teacher.firstName} ${leave.teacher.lastName}`
                              : "Unknown"}
                          </div>
                          {leave.teacher?.email && (
                            <div className="text-sm text-muted-foreground">
                              {leave.teacher.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getLeaveTypeLabel(leave.leaveType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {format(new Date(leave.startDate), "MMM dd, yyyy")}
                          </div>
                          <div className="text-muted-foreground">
                            to {format(new Date(leave.endDate), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell>
                        {leave.replacementTeacher ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {leave.replacementTeacher.firstName}{" "}
                              {leave.replacementTeacher.lastName}
                            </div>
                            {leave.replacementApproved ? (
                              <Badge variant="default" className="text-xs">
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {leave.affectedClassIds.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {leave.status === LeaveStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openApproveDialog(leave)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(leave)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {(leave.status === LeaveStatus.PENDING ||
                            leave.status === LeaveStatus.APPROVED) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(leave)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {availabilityData && availabilityData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(availabilityData.page - 1) * availabilityData.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                      availabilityData.page * availabilityData.limit,
                      availabilityData.total
                    )}{" "}
                    of {availabilityData.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: (prev.page || 1) - 1,
                        }))
                      }
                      disabled={availabilityData.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: (prev.page || 1) + 1,
                        }))
                      }
                      disabled={
                        availabilityData.page >= availabilityData.totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Approve this leave request. Optionally assign a replacement
              teacher.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Teacher:</strong>{" "}
                  {selectedLeave.teacher
                    ? `${selectedLeave.teacher.firstName} ${selectedLeave.teacher.lastName}`
                    : "Unknown"}
                </div>
                <div className="text-sm">
                  <strong>Leave Type:</strong>{" "}
                  {getLeaveTypeLabel(selectedLeave.leaveType)}
                </div>
                <div className="text-sm">
                  <strong>Period:</strong>{" "}
                  {format(new Date(selectedLeave.startDate), "MMM dd, yyyy")} -{" "}
                  {format(new Date(selectedLeave.endDate), "MMM dd, yyyy")}
                </div>
                <div className="text-sm">
                  <strong>Reason:</strong> {selectedLeave.reason}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replacementTeacherId">
                  Replacement Teacher (Optional)
                </Label>
                <Select
                  value={approveForm.replacementTeacherId || "none"}
                  onValueChange={(value) =>
                    setApproveForm({
                      replacementTeacherId:
                        value === "none" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teachers
                      .filter((t) => t.id !== selectedLeave.teacherId)
                      .map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setApproveDialogOpen(false);
                    setSelectedLeave(null);
                    setApproveForm({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? "Approving..." : "Approve Leave"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Teacher:</strong>{" "}
                  {selectedLeave.teacher
                    ? `${selectedLeave.teacher.firstName} ${selectedLeave.teacher.lastName}`
                    : "Unknown"}
                </div>
                <div className="text-sm">
                  <strong>Leave Type:</strong>{" "}
                  {getLeaveTypeLabel(selectedLeave.leaveType)}
                </div>
                <div className="text-sm">
                  <strong>Period:</strong>{" "}
                  {format(new Date(selectedLeave.startDate), "MMM dd, yyyy")} -{" "}
                  {format(new Date(selectedLeave.endDate), "MMM dd, yyyy")}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectForm.rejectionReason}
                  onChange={(e) =>
                    setRejectForm({ rejectionReason: e.target.value })
                  }
                  placeholder="Please provide a reason for rejection"
                  required
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(false);
                    setSelectedLeave(null);
                    setRejectForm({ rejectionReason: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject Leave"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
