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
  RefreshCw,
  FileText,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import {
  teacherTransferApi,
  TransferRequestStatus,
  TeacherTransferRequest,
  TeacherTransferRequestDetail,
} from "@/lib/api/endpoints";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

// Zone type for desiredZones
interface DesiredZone {
  id: string;
  zone: { id: string; name: string };
  priority: number;
}

// Message type for transfer messages
interface TransferMessage {
  id: string;
  sender: { firstName: string; lastName: string };
  content: string;
  createdAt: string;
}

/**
 * Helper to extract name from a field that can be a string or an object with name property.
 */
function getFieldName(
  field: string | { id: string; name: string } | undefined
): string {
  if (!field) return "Unknown";
  if (typeof field === "string") return field;
  return field.name;
}

// Re-use API types instead of duplicating
type TransferRequest = TeacherTransferRequest & {
  uniqueId?: string;
  desiredZones?: DesiredZone[];
  fromZone?: { id: string; name: string } | string;
  subject?: { id: string; name: string } | string;
  medium?: { id: string; name: string } | string;
};

type TransferDetail = TeacherTransferRequestDetail & {
  uniqueId?: string;
  messages?: TransferMessage[];
};

export default function TransferRequestsPage() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [mediumFilter, setMediumFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferDetail | null>(
    null
  );

  // Verify/Status change dialogs
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<
    TransferRequest | TransferDetail | null
  >(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [
    pagination.page,
    statusFilter,
    zoneFilter,
    subjectFilter,
    mediumFilter,
    levelFilter,
    searchTerm,
  ]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusParam =
        statusFilter === "ALL"
          ? undefined
          : TransferRequestStatus[
              statusFilter as keyof typeof TransferRequestStatus
            ];
      const levelParam = levelFilter === "ALL" ? undefined : levelFilter;

      const response = await teacherTransferApi.getAllAdmin({
        page: pagination.page,
        limit: pagination.limit,
        status: statusParam,
        fromZoneId: zoneFilter === "ALL" ? undefined : zoneFilter,
        subjectId: subjectFilter === "ALL" ? undefined : subjectFilter,
        mediumId: mediumFilter === "ALL" ? undefined : mediumFilter,
        level: levelParam,
        searchTerm: searchTerm || undefined,
      });
      const requestsArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setRequests(requestsArr as TransferRequest[]);
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

  const handleViewDetail = async (request: TransferRequest) => {
    try {
      setLoading(true);
      const detail = await teacherTransferApi.getDetailAdmin(request.id);
      setSelectedRequest(detail as TransferDetail);
      setDetailDialogOpen(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!actionRequest) return;

    try {
      setLoading(true);
      await teacherTransferApi.verifyAdmin(actionRequest.id, {
        notes: verificationNotes || undefined,
      });
      handleApiSuccess("Transfer request verified successfully");
      setVerifyDialogOpen(false);
      setVerificationNotes("");
      setActionRequest(null);
      fetchRequests();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!actionRequest || !newStatus) return;

    try {
      setLoading(true);
      const statusEnum =
        TransferRequestStatus[newStatus as keyof typeof TransferRequestStatus];
      await teacherTransferApi.updateStatusAdmin(actionRequest.id, {
        status: statusEnum,
        notes: statusNotes || undefined,
      });
      handleApiSuccess("Transfer request status updated");
      setStatusDialogOpen(false);
      setNewStatus("");
      setStatusNotes("");
      setActionRequest(null);
      fetchRequests();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      VERIFIED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      MATCHED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
      CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transfer Requests</CardTitle>
          <CardDescription>
            Manage and verify teacher mutual transfer requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by unique ID or requester name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger>
                <SelectValue placeholder="From Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Zones</SelectItem>
                {/* Zone options would be loaded dynamically */}
              </SelectContent>
            </Select>

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subjects</SelectItem>
                {/* Subject options would be loaded dynamically */}
              </SelectContent>
            </Select>

            <Select value={mediumFilter} onValueChange={setMediumFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Mediums</SelectItem>
                {/* Medium options would be loaded dynamically */}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="GRADE_6_9">Grade 6-9</SelectItem>
                <SelectItem value="GRADE_10_11">Grade 10-11</SelectItem>
                <SelectItem value="GRADE_12_13">Grade 12-13</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchRequests} variant="outline" size="icon">
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Requests Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unique ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>From Zone</TableHead>
                  <TableHead>Preferred Zones</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Loading requests...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No transfer requests found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetail(request)}
                    >
                      <TableCell className="font-medium">
                        {request.uniqueId}
                      </TableCell>
                      <TableCell>
                        {request.requester?.firstName || ""}{" "}
                        {request.requester?.lastName || "Unknown"}
                      </TableCell>
                      <TableCell>{getFieldName(request.fromZone)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(request.desiredZones ?? [])
                            .slice(0, 3)
                            .map((dz: DesiredZone) => (
                              <Badge
                                key={dz.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {dz.zone?.name || "Unknown"}
                              </Badge>
                            ))}
                          {(request.desiredZones?.length ?? 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(request.desiredZones?.length ?? 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getFieldName(request.subject)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(request.status)}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.verified ? (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 text-gray-500 border-gray-500/20"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(request);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
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
                of {pagination.total} requests
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Request Detail</DialogTitle>
            <DialogDescription>
              Complete information about this transfer request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedRequest.uniqueId}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created:{" "}
                    {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={getStatusBadge(selectedRequest.status)}
                  >
                    {selectedRequest.status}
                  </Badge>
                  {selectedRequest.verified && (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="space-y-4">
                <h4 className="font-semibold">Requester Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {selectedRequest.requester?.firstName || ""}{" "}
                      {selectedRequest.requester?.lastName || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">
                      {selectedRequest.requester?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Current School
                    </Label>
                    <p className="font-medium">
                      {selectedRequest.currentSchool || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">School Type</Label>
                    <p className="font-medium">
                      {selectedRequest.currentSchoolType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Years of Service
                    </Label>
                    <p className="font-medium">
                      {selectedRequest.yearsOfService || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Teacher Type
                    </Label>
                    <p className="font-medium">
                      {selectedRequest.isInternalTeacher
                        ? "Internal"
                        : "External"}
                    </p>
                  </div>
                </div>

                {(selectedRequest.qualifications?.length ?? 0) > 0 && (
                  <div>
                    <Label className="text-muted-foreground">
                      Qualifications
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(selectedRequest.qualifications ?? []).map(
                        (qual: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {qual}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Request Criteria */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Transfer Criteria</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">From Zone</Label>
                    <p className="font-medium">
                      {getFieldName(selectedRequest.fromZone)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Subject</Label>
                    <p className="font-medium">
                      {getFieldName(selectedRequest.subject)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Medium</Label>
                    <p className="font-medium">
                      {getFieldName(selectedRequest.medium)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Level</Label>
                    <p className="font-medium">{selectedRequest.level}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Preferred School Types
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedRequest.preferredSchoolTypes ?? []).map(
                      (type: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {type}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Desired Zones (by Priority)
                  </Label>
                  <div className="space-y-2 mt-2">
                    {(selectedRequest.desiredZones ?? [])
                      .sort(
                        (a: DesiredZone, b: DesiredZone) =>
                          a.priority - b.priority
                      )
                      .map((dz: DesiredZone) => (
                        <div
                          key={dz.id}
                          className="flex items-center gap-2 bg-muted p-2 rounded"
                        >
                          <Badge variant="outline">#{dz.priority}</Badge>
                          <span className="font-medium">
                            {dz.zone?.name || "Unknown"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {selectedRequest.additionalRequirements && (
                  <div>
                    <Label className="text-muted-foreground">
                      Additional Requirements
                    </Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded">
                      {selectedRequest.additionalRequirements}
                    </p>
                  </div>
                )}
              </div>

              {/* Messages */}
              {selectedRequest.messages &&
                selectedRequest.messages.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Messages Between Teachers
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedRequest.messages.map((msg) => (
                        <div key={msg.id} className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {msg.sender.firstName} {msg.sender.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Attachments */}
              {selectedRequest.attachments &&
                selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {selectedRequest.attachments.map(
                        (attachment: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-muted p-2 rounded"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm flex-1">{attachment}</span>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Verification Notes */}
              {selectedRequest.notes && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-muted-foreground">
                    Verification Notes
                  </Label>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
            {selectedRequest && !selectedRequest.verified && (
              <Button
                onClick={() => {
                  setActionRequest(selectedRequest);
                  setDetailDialogOpen(false);
                  setVerifyDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Request
              </Button>
            )}
            {selectedRequest && selectedRequest.status === "PENDING" && (
              <Button
                onClick={() => {
                  setActionRequest(selectedRequest);
                  setDetailDialogOpen(false);
                  setStatusDialogOpen(true);
                }}
              >
                Change Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Transfer Request</DialogTitle>
            <DialogDescription>
              Mark this transfer request as verified
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Verification Notes (Optional)</Label>
              <Textarea
                placeholder="Add verification notes..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyDialogOpen(false);
                setVerificationNotes("");
                setActionRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Request Status</DialogTitle>
            <DialogDescription>
              Update the status of this transfer request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false);
                setNewStatus("");
                setStatusNotes("");
                setActionRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={loading || !newStatus}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
