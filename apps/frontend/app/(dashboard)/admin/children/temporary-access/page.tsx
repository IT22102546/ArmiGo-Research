"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  temporaryAccessApi,
  TemporaryAccessResource,
  TemporaryAccess,
  CreateTemporaryAccessDto,
} from "@/lib/api/temporary-access";
import { usersApi } from "@/lib/api/endpoints/users";
import { examsApi } from "@/lib/api/endpoints/exams";
import { classesApi } from "@/lib/api/endpoints/classes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function TemporaryAccessPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    resourceType: "" as TemporaryAccessResource | "",
    active: "" as boolean | "",
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<TemporaryAccess | null>(
    null
  );

  // Form states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [newAccess, setNewAccess] = useState<CreateTemporaryAccessDto>({
    userId: "",
    resourceType: TemporaryAccessResource.EXAM,
    resourceId: "",
    startDate: "",
    expiresAt: "",
    reason: "",
  });
  const [revocationNote, setRevocationNote] = useState("");

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["temporary-access-statistics"],
    queryFn: async () => {
      const response = await temporaryAccessApi.getStatistics();
      return response || { total: 0, active: 0, expired: 0, byType: {} };
    },
  });

  // Fetch temporary accesses with filters
  const { data: accessesResponse, isLoading } = useQuery({
    queryKey: ["temporary-accesses", filters, currentPage],
    queryFn: async () => {
      const response = await temporaryAccessApi.getAll({
        resourceType: filters.resourceType || undefined,
        active: filters.active !== "" ? filters.active : undefined,
        page: currentPage,
        limit: 10,
      });
      return (
        response || {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }
      );
    },
  });

  // Search students
  const { data: studentsData } = useQuery({
    queryKey: ["students-search", studentSearchQuery],
    queryFn: async () => {
      const response = await usersApi.searchUsers({
        query: studentSearchQuery,
        limit: 10,
      });
      return response || [];
    },
    enabled: studentSearchQuery.length >= 2,
  });
  const students = studentsData || [];

  // Fetch resources based on type
  const { data: examsData } = useQuery({
    queryKey: ["exams-list"],
    queryFn: async () => {
      const response = await examsApi.getAll({});
      return response || [];
    },
    enabled: newAccess.resourceType === TemporaryAccessResource.EXAM,
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const response = await classesApi.getAll({});
      return response || { data: [] };
    },
    enabled: newAccess.resourceType === TemporaryAccessResource.CLASS,
  });

  // Create access mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTemporaryAccessDto) =>
      temporaryAccessApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-accesses"] });
      queryClient.invalidateQueries({
        queryKey: ["temporary-access-statistics"],
      });
      toast.success("Temporary access granted successfully");
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to grant access");
    },
  });

  // Revoke access mutation
  const revokeMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      temporaryAccessApi.revoke(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-accesses"] });
      queryClient.invalidateQueries({
        queryKey: ["temporary-access-statistics"],
      });
      toast.success("Access revoked successfully");
      setIsRevokeDialogOpen(false);
      setSelectedAccess(null);
      setRevocationNote("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke access");
    },
  });

  // Cleanup expired mutation
  const cleanupMutation = useMutation({
    mutationFn: () => temporaryAccessApi.cleanup(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["temporary-accesses"] });
      queryClient.invalidateQueries({
        queryKey: ["temporary-access-statistics"],
      });
      toast.success(`Cleaned up ${data.deactivated} expired access records`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cleanup");
    },
  });

  const resetCreateForm = () => {
    setNewAccess({
      userId: "",
      resourceType: TemporaryAccessResource.EXAM,
      resourceId: "",
      startDate: "",
      expiresAt: "",
      reason: "",
    });
    setStudentSearchQuery("");
  };

  const handleCreateAccess = () => {
    if (!newAccess.userId) {
      toast.error("Please select a student");
      return;
    }
    if (!newAccess.resourceId) {
      toast.error("Please select a resource");
      return;
    }
    if (!newAccess.startDate || !newAccess.expiresAt) {
      toast.error("Please provide start and expiry dates");
      return;
    }

    createMutation.mutate(newAccess);
  };

  const handleRevokeAccess = () => {
    if (!selectedAccess) return;
    revokeMutation.mutate({ id: selectedAccess.id, note: revocationNote });
  };

  const handleClearFilters = () => {
    setFilters({
      resourceType: "",
      active: "",
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (access: TemporaryAccess) => {
    const now = new Date();
    const expiresAt = new Date(access.expiresAt);
    const startDate = new Date(access.startDate);

    if (!access.active) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Revoked
        </Badge>
      );
    }

    if (expiresAt < now) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expired
        </Badge>
      );
    }

    if (startDate > now) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Scheduled
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </Badge>
    );
  };

  const getExpiryDisplay = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();

    if (date < now) {
      return `Expired ${formatDistanceToNow(date, { addSuffix: true })}`;
    }

    return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Temporary Access Management</h1>
          <p className="text-muted-foreground mt-1">
            Grant and manage temporary access to resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            Cleanup Expired
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Grant Temporary Access</DialogTitle>
                <DialogDescription>
                  Provide temporary access to a resource for a student
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <Input
                    placeholder="Search student..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                  {students && students.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      {students.map((student: any) => (
                        <div
                          key={student.id}
                          className="p-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setNewAccess({ ...newAccess, userId: student.id });
                            setStudentSearchQuery(
                              `${student.firstName} ${student.lastName}`
                            );
                          }}
                        >
                          {student.firstName} {student.lastName}
                          {student.studentProfile?.studentId && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({student.studentProfile.studentId})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Resource Type</Label>
                  <Select
                    value={newAccess.resourceType}
                    onValueChange={(value: TemporaryAccessResource) =>
                      setNewAccess({
                        ...newAccess,
                        resourceType: value,
                        resourceId: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TemporaryAccessResource).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Resource</Label>
                  <Select
                    value={newAccess.resourceId}
                    onValueChange={(value) =>
                      setNewAccess({ ...newAccess, resourceId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {newAccess.resourceType ===
                        TemporaryAccessResource.EXAM &&
                        examsData?.map((exam: any) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.title}
                          </SelectItem>
                        ))}
                      {newAccess.resourceType ===
                        TemporaryAccessResource.CLASS &&
                        classesData?.data.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newAccess.startDate}
                      onChange={(e) =>
                        setNewAccess({
                          ...newAccess,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Expiry Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newAccess.expiresAt}
                      onChange={(e) =>
                        setNewAccess({
                          ...newAccess,
                          expiresAt: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Enter reason for granting access..."
                    value={newAccess.reason}
                    onChange={(e) =>
                      setNewAccess({ ...newAccess, reason: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetCreateForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAccess}
                    disabled={createMutation.isPending}
                  >
                    Grant Access
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Access</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.expired || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.byResourceType?.EXAM || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Label>Resource Type</Label>
              <Select
                value={filters.resourceType || "all"}
                onValueChange={(value: TemporaryAccessResource | "all") => {
                  setFilters({
                    ...filters,
                    resourceType: value === "all" ? "" : value,
                  });
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(TemporaryAccessResource).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label>Status</Label>
              <Select
                value={
                  filters.active === "" ? "all" : filters.active.toString()
                }
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    active: value === "all" ? "" : value === "true",
                  });
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Access Records</CardTitle>
          <CardDescription>
            Manage temporary access grants for students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Resource Type</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessesResponse?.data.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell>
                        <div className="font-medium">
                          {access.user?.firstName || ""}{" "}
                          {access.user?.lastName || "Unknown"}
                        </div>
                        {access.user?.studentProfile && (
                          <div className="text-sm text-muted-foreground">
                            {access.user.studentProfile.studentId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {access.resourceType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {access.resourceId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(access.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getExpiryDisplay(access.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(access)}</TableCell>
                      <TableCell className="text-sm">
                        {access.grantor?.firstName || ""}{" "}
                        {access.grantor?.lastName || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {access.active &&
                          new Date(access.expiresAt) > new Date() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAccess(access);
                                setIsRevokeDialogOpen(true);
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {accessesResponse && accessesResponse.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {accessesResponse.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, accessesResponse.meta.totalPages)
                      )
                    }
                    disabled={currentPage === accessesResponse.meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this temporary access?
            </DialogDescription>
          </DialogHeader>
          {selectedAccess && (
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted">
                <div className="font-medium">
                  {selectedAccess.user?.firstName || ""}{" "}
                  {selectedAccess.user?.lastName || "Unknown"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedAccess.resourceType.replace(/_/g, " ")} - Expires{" "}
                  {new Date(selectedAccess.expiresAt).toLocaleString()}
                </div>
              </div>

              <div>
                <Label>Revocation Note (Optional)</Label>
                <Textarea
                  placeholder="Enter reason for revoking access..."
                  value={revocationNote}
                  onChange={(e) => setRevocationNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRevokeDialogOpen(false);
                    setSelectedAccess(null);
                    setRevocationNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevokeAccess}
                  disabled={revokeMutation.isPending}
                >
                  Revoke Access
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
