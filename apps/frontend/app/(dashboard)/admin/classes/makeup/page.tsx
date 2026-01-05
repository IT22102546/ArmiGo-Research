"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  classReschedulingApi,
  ClassRescheduling,
  RescheduleStatus,
  RescheduleReason,
  CreateReschedulingDto,
  ApproveReschedulingDto,
  RejectReschedulingDto,
  ReschedulingFilterDto,
} from "@/lib/api/class-rescheduling";
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
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function MakeUpClassPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReschedulingFilterDto>({
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRescheduling, setSelectedRescheduling] =
    useState<ClassRescheduling | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateReschedulingDto>({
    originalClassId: "",
    originalDate: "",
    originalStartTime: "",
    originalEndTime: "",
    newDate: "",
    newStartTime: "",
    newEndTime: "",
    reason: RescheduleReason.MAKEUP,
  });
  const [approveForm, setApproveForm] = useState<ApproveReschedulingDto>({
    notifyStudents: true,
  });
  const [rejectForm, setRejectForm] = useState<RejectReschedulingDto>({
    rejectionReason: "",
  });

  // Queries
  const { data: reschedulingData, isLoading: isLoadingRescheduling } = useQuery(
    {
      queryKey: ["class-rescheduling", filters],
      queryFn: () => classReschedulingApi.getReschedulingList(filters),
    }
  );

  const { data: statistics } = useQuery({
    queryKey: ["class-rescheduling-statistics"],
    queryFn: () => classReschedulingApi.getStatistics(),
  });

  const { data: history } = useQuery({
    queryKey: [
      "class-rescheduling-history",
      selectedRescheduling?.originalClassId,
    ],
    queryFn: () =>
      selectedRescheduling?.originalClassId
        ? classReschedulingApi.getClassHistory(
            selectedRescheduling.originalClassId
          )
        : Promise.resolve([]),
    enabled: !!selectedRescheduling?.originalClassId && historyDialogOpen,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: classReschedulingApi.createRescheduling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({
        queryKey: ["class-rescheduling-statistics"],
      });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveReschedulingDto }) =>
      classReschedulingApi.approveRescheduling(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({
        queryKey: ["class-rescheduling-statistics"],
      });
      setApproveDialogOpen(false);
      setSelectedRescheduling(null);
      setApproveForm({ notifyStudents: true });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectReschedulingDto }) =>
      classReschedulingApi.rejectRescheduling(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({
        queryKey: ["class-rescheduling-statistics"],
      });
      setRejectDialogOpen(false);
      setSelectedRescheduling(null);
      setRejectForm({ rejectionReason: "" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => classReschedulingApi.cancelRescheduling(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({
        queryKey: ["class-rescheduling-statistics"],
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => classReschedulingApi.completeRescheduling(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-rescheduling"] });
      queryClient.invalidateQueries({
        queryKey: ["class-rescheduling-statistics"],
      });
    },
  });

  // Handlers
  const resetCreateForm = () => {
    setCreateForm({
      originalClassId: "",
      originalDate: "",
      originalStartTime: "",
      originalEndTime: "",
      newDate: "",
      newStartTime: "",
      newEndTime: "",
      reason: RescheduleReason.MAKEUP,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRescheduling) {
      approveMutation.mutate({
        id: selectedRescheduling.id,
        data: approveForm,
      });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRescheduling) {
      rejectMutation.mutate({ id: selectedRescheduling.id, data: rejectForm });
    }
  };

  const handleCancel = (rescheduling: ClassRescheduling) => {
    if (confirm("Are you sure you want to cancel this rescheduling request?")) {
      cancelMutation.mutate(rescheduling.id);
    }
  };

  const handleComplete = (rescheduling: ClassRescheduling) => {
    if (confirm("Mark this rescheduling as completed?")) {
      completeMutation.mutate(rescheduling.id);
    }
  };

  const openApproveDialog = (rescheduling: ClassRescheduling) => {
    setSelectedRescheduling(rescheduling);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (rescheduling: ClassRescheduling) => {
    setSelectedRescheduling(rescheduling);
    setRejectDialogOpen(true);
  };

  const openHistoryDialog = (rescheduling: ClassRescheduling) => {
    setSelectedRescheduling(rescheduling);
    setHistoryDialogOpen(true);
  };

  const getStatusBadge = (status: RescheduleStatus) => {
    const variants: Record<
      RescheduleStatus,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      [RescheduleStatus.PENDING]: "secondary",
      [RescheduleStatus.APPROVED]: "default",
      [RescheduleStatus.REJECTED]: "destructive",
      [RescheduleStatus.COMPLETED]: "outline",
      [RescheduleStatus.CANCELLED]: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getReasonLabel = (reason: RescheduleReason) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const reschedulings = reschedulingData?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Make-Up Class Scheduling</h1>
          <p className="text-muted-foreground">
            Reschedule classes and manage make-up sessions
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Rescheduling
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Class Rescheduling</DialogTitle>
              <DialogDescription>
                Reschedule a class to a new date and time
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalClassId">Original Class ID *</Label>
                <Input
                  id="originalClassId"
                  value={createForm.originalClassId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      originalClassId: e.target.value,
                    }))
                  }
                  placeholder="Enter class ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Original Schedule</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="originalDate" className="text-xs">
                      Date *
                    </Label>
                    <Input
                      id="originalDate"
                      type="date"
                      value={createForm.originalDate}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          originalDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalStartTime" className="text-xs">
                      Start Time *
                    </Label>
                    <Input
                      id="originalStartTime"
                      type="datetime-local"
                      value={createForm.originalStartTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          originalStartTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalEndTime" className="text-xs">
                      End Time *
                    </Label>
                    <Input
                      id="originalEndTime"
                      type="datetime-local"
                      value={createForm.originalEndTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          originalEndTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Schedule</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="newDate" className="text-xs">
                      Date *
                    </Label>
                    <Input
                      id="newDate"
                      type="date"
                      value={createForm.newDate}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          newDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newStartTime" className="text-xs">
                      Start Time *
                    </Label>
                    <Input
                      id="newStartTime"
                      type="datetime-local"
                      value={createForm.newStartTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          newStartTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newEndTime" className="text-xs">
                      End Time *
                    </Label>
                    <Input
                      id="newEndTime"
                      type="datetime-local"
                      value={createForm.newEndTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          newEndTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select
                  value={createForm.reason}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      reason: value as RescheduleReason,
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RescheduleReason).map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {getReasonLabel(reason)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonDetails">Additional Details</Label>
                <Textarea
                  id="reasonDetails"
                  value={createForm.reasonDetails || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      reasonDetails: e.target.value,
                    }))
                  }
                  placeholder="Provide additional details about the rescheduling"
                  rows={3}
                />
              </div>

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
                    : "Create Rescheduling"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
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
                {statistics.byStatus[RescheduleStatus.PENDING] || 0}
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
                {statistics.byStatus[RescheduleStatus.APPROVED] || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus[RescheduleStatus.COMPLETED] || 0}
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
                {statistics.byStatus[RescheduleStatus.REJECTED] || 0}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status:
                      value === "all" ? undefined : (value as RescheduleStatus),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.values(RescheduleStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    page: 1,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({ page: 1, limit: 10 })}
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
        </CardHeader>
        <CardContent>
          {isLoadingRescheduling ? (
            <div className="text-center py-8">Loading...</div>
          ) : reschedulings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rescheduling requests found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Original Date</TableHead>
                    <TableHead>New Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conflicts</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reschedulings.map((rescheduling) => (
                    <TableRow key={rescheduling.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rescheduling.originalClass?.name || "Unknown"}
                          </div>
                          {rescheduling.originalClass?.subject && (
                            <div className="text-sm text-muted-foreground">
                              {rescheduling.originalClass.subject.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(
                            new Date(rescheduling.originalDate),
                            "MMM dd, yyyy"
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(rescheduling.originalStartTime),
                              "HH:mm"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(rescheduling.originalEndTime),
                              "HH:mm"
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(
                            new Date(rescheduling.newDate),
                            "MMM dd, yyyy"
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(rescheduling.newStartTime),
                              "HH:mm"
                            )}{" "}
                            -{" "}
                            {format(new Date(rescheduling.newEndTime), "HH:mm")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getReasonLabel(rescheduling.reason)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(rescheduling.status)}
                      </TableCell>
                      <TableCell>
                        {rescheduling.hasConflicts ? (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {rescheduling.affectedStudentIds.length} students
                          </div>
                          {rescheduling.studentsNotified && (
                            <Badge variant="default" className="text-xs mt-1">
                              Notified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {rescheduling.status === RescheduleStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openApproveDialog(rescheduling)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(rescheduling)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {rescheduling.status ===
                            RescheduleStatus.APPROVED && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleComplete(rescheduling)}
                            >
                              Complete
                            </Button>
                          )}
                          {(rescheduling.status === RescheduleStatus.PENDING ||
                            rescheduling.status ===
                              RescheduleStatus.APPROVED) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(rescheduling)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openHistoryDialog(rescheduling)}
                          >
                            History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {reschedulingData && reschedulingData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(reschedulingData.page - 1) * reschedulingData.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                      reschedulingData.page * reschedulingData.limit,
                      reschedulingData.total
                    )}{" "}
                    of {reschedulingData.total} results
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
                      disabled={reschedulingData.page === 1}
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
                        reschedulingData.page >= reschedulingData.totalPages
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
            <DialogTitle>Approve Rescheduling Request</DialogTitle>
            <DialogDescription>
              Approve this rescheduling request and optionally notify students.
            </DialogDescription>
          </DialogHeader>
          {selectedRescheduling && (
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Class:</strong>{" "}
                  {selectedRescheduling.originalClass?.name}
                </div>
                <div className="text-sm">
                  <strong>Reason:</strong>{" "}
                  {getReasonLabel(selectedRescheduling.reason)}
                </div>
                <div className="text-sm">
                  <strong>New Date:</strong>{" "}
                  {format(
                    new Date(selectedRescheduling.newDate),
                    "MMM dd, yyyy"
                  )}
                </div>
                <div className="text-sm">
                  <strong>New Time:</strong>{" "}
                  {format(new Date(selectedRescheduling.newStartTime), "HH:mm")}{" "}
                  - {format(new Date(selectedRescheduling.newEndTime), "HH:mm")}
                </div>
                {selectedRescheduling.hasConflicts && (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <strong>Warning:</strong> This rescheduling has conflicts
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyStudents"
                  checked={approveForm.notifyStudents}
                  onChange={(e) =>
                    setApproveForm({ notifyStudents: e.target.checked })
                  }
                  className="rounded"
                  aria-label="Send notification to all affected students"
                  title="Send notification to all affected students"
                />
                <Label htmlFor="notifyStudents" className="cursor-pointer">
                  Send notification to all affected students
                </Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setApproveDialogOpen(false);
                    setSelectedRescheduling(null);
                    setApproveForm({ notifyStudents: true });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={approveMutation.isPending}>
                  {approveMutation.isPending
                    ? "Approving..."
                    : "Approve Rescheduling"}
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
            <DialogTitle>Reject Rescheduling Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this rescheduling request.
            </DialogDescription>
          </DialogHeader>
          {selectedRescheduling && (
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Class:</strong>{" "}
                  {selectedRescheduling.originalClass?.name}
                </div>
                <div className="text-sm">
                  <strong>Reason:</strong>{" "}
                  {getReasonLabel(selectedRescheduling.reason)}
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
                    setSelectedRescheduling(null);
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
                  {rejectMutation.isPending
                    ? "Rejecting..."
                    : "Reject Rescheduling"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rescheduling History</DialogTitle>
            <DialogDescription>
              View all rescheduling history for this class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history && history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {getReasonLabel(item.reason)}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      <strong>Original:</strong>{" "}
                      {format(new Date(item.originalDate), "MMM dd, yyyy")}{" "}
                      {format(new Date(item.originalStartTime), "HH:mm")} -{" "}
                      {format(new Date(item.originalEndTime), "HH:mm")}
                    </div>
                    <div>
                      <strong>Rescheduled to:</strong>{" "}
                      {format(new Date(item.newDate), "MMM dd, yyyy")}{" "}
                      {format(new Date(item.newStartTime), "HH:mm")} -{" "}
                      {format(new Date(item.newEndTime), "HH:mm")}
                    </div>
                    <div>
                      <strong>Requested by:</strong> {item.requester?.firstName}{" "}
                      {item.requester?.lastName}
                    </div>
                    {item.approver && (
                      <div>
                        <strong>Approved by:</strong> {item.approver.firstName}{" "}
                        {item.approver.lastName}
                      </div>
                    )}
                    {item.rejectionReason && (
                      <div className="text-destructive">
                        <strong>Rejection reason:</strong>{" "}
                        {item.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No history available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
