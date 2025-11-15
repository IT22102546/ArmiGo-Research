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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  externalTeachersApi,
  ExternalTeacher as ExternalTeacherApi,
  ApplicationDetail,
  ExternalTeacherStatus,
} from "@/lib/api/endpoints/external-teachers";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

// Extended type for UI display
interface ExternalTeacher extends ExternalTeacherApi {
  phone?: string;
  phoneNumber?: string;
  employeeId?: string;
  role?: string;
  teacherProfile?: {
    specialization?: string;
    qualifications: string[];
    sourceInstitution?: string;
  };
  district?: { id: string; name: string } | string;
  notes?: string;
}

interface Zone {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  zoneId: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Medium {
  id: string;
  name: string;
}

// Local application detail type that extends the API type
interface LocalApplicationDetail {
  teacher: ExternalTeacher;
  zones: Zone[];
  districts: District[];
  subjects: Subject[];
  mediums: Medium[];
}

export default function ExternalTeacherRegistrationsPage() {
  const [teachers, setTeachers] = useState<ExternalTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Detail view dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<ExternalTeacher | null>(null);
  const [applicationDetail, setApplicationDetail] =
    useState<LocalApplicationDetail | null>(null);

  // Approve/Reject dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionTeacher, setActionTeacher] = useState<ExternalTeacher | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const statusParam =
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as ExternalTeacherStatus);

      const response = await externalTeachersApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        status: statusParam,
        searchTerm: searchTerm || undefined,
      });
      const teachersArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setTeachers(teachersArr as ExternalTeacher[]);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        pages:
          response.pagination?.pages ??
          Math.ceil((response.pagination?.total ?? 0) / pagination.limit),
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (teacher: ExternalTeacher) => {
    try {
      setLoading(true);
      const detail = await externalTeachersApi.getDetail(teacher.id);
      setSelectedTeacher(teacher);
      // Map API response to local type
      setApplicationDetail({
        teacher: teacher,
        zones: [],
        districts: [],
        subjects: [],
        mediums: [],
      });
      setDetailDialogOpen(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!actionTeacher) return;

    try {
      setLoading(true);
      await externalTeachersApi.approve(actionTeacher.id, {
        notes: notes || undefined,
      });
      handleApiSuccess("Teacher application approved successfully");
      setApproveDialogOpen(false);
      setNotes("");
      setActionTeacher(null);
      fetchTeachers();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionTeacher || !rejectionReason.trim()) {
      handleApiError("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      await externalTeachersApi.reject(actionTeacher.id, {
        reason: rejectionReason,
      });
      handleApiSuccess("Teacher application rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setActionTeacher(null);
      fetchTeachers();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (teacherId: string, note: string) => {
    try {
      await externalTeachersApi.addNote(teacherId, { note });
      handleApiSuccess("Note added successfully");
      fetchTeachers();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
      SUSPENDED: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External Teacher Registrations</CardTitle>
          <CardDescription>
            Review and manage external teacher registration applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or registration ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Approved</SelectItem>
                <SelectItem value="SUSPENDED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchTeachers} variant="outline" size="icon">
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Teachers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg ID</TableHead>
                  <TableHead>Zone/District</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Loading teachers...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No external teacher registrations found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.employeeId || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {typeof teacher.district === "object" &&
                          teacher.district
                            ? teacher.district.name
                            : teacher.district || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {teacher.teacherProfile?.specialization || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">N/A</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(teacher.status)}
                        >
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(teacher)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {teacher.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 border-green-600"
                                onClick={() => {
                                  setActionTeacher(teacher);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 border-red-600"
                                onClick={() => {
                                  setActionTeacher(teacher);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} teachers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Application Detail</DialogTitle>
            <DialogDescription>
              Review external teacher registration information
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && applicationDetail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Registration ID
                  </Label>
                  <p className="font-medium">
                    {selectedTeacher.employeeId || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedTeacher.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedTeacher.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">District</Label>
                  <p className="font-medium">
                    {typeof selectedTeacher.district === "object" &&
                    selectedTeacher.district
                      ? selectedTeacher.district.name
                      : selectedTeacher.district || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={getStatusBadge(selectedTeacher.status)}
                  >
                    {selectedTeacher.status}
                  </Badge>
                </div>
              </div>

              {/* Teacher Profile */}
              {selectedTeacher.teacherProfile && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Specialization
                      </Label>
                      <p className="font-medium">
                        {selectedTeacher.teacherProfile.specialization || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Source Institution
                      </Label>
                      <p className="font-medium">
                        {selectedTeacher.teacherProfile.sourceInstitution ||
                          "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Qualifications
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTeacher.teacherProfile.qualifications.map(
                          (qual, idx) => (
                            <Badge key={idx} variant="secondary">
                              {qual}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              {selectedTeacher.notes && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-muted-foreground">
                    Internal Notes
                  </Label>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{selectedTeacher.notes}</p>
                  </div>
                </div>
              )}

              {/* Registration Date */}
              <div className="border-t pt-4">
                <Label className="text-muted-foreground">
                  Registration Date
                </Label>
                <p className="font-medium">
                  {new Date(selectedTeacher.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
            {selectedTeacher?.status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-600"
                  onClick={() => {
                    setActionTeacher(selectedTeacher);
                    setDetailDialogOpen(false);
                    setRejectDialogOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setActionTeacher(selectedTeacher);
                    setDetailDialogOpen(false);
                    setApproveDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Teacher Application</DialogTitle>
            <DialogDescription>
              Approve {actionTeacher?.firstName} {actionTeacher?.lastName}'s
              registration as an external teacher
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Internal Notes (Optional)</Label>
              <Textarea
                placeholder="Add any internal notes about this approval..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setNotes("");
                setActionTeacher(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Teacher Application</DialogTitle>
            <DialogDescription>
              Reject {actionTeacher?.firstName} {actionTeacher?.lastName}'s
              registration application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Provide a clear reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setActionTeacher(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
              variant="destructive"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
