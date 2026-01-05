"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  XCircle,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { temporaryAccessApi } from "@/lib/api/endpoints/temporary-access";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

const getTimeRemaining = (expiresAt: string): string => {
  try {
    const date = new Date(expiresAt);
    if (isPast(date)) return "Expired";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "-";
  }
};

interface TemporaryAccess {
  id: string;
  userId: string;
  grantedBy: string;
  expiresAt: string;
  reason?: string;
  active: boolean;
  accessType?: string;
  createdAt: string;
  revokedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grantor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function TemporaryAccessPage() {
  const [loading, setLoading] = useState(true);
  const [accesses, setAccesses] = useState<TemporaryAccess[]>([]);
  const [filteredAccesses, setFilteredAccesses] = useState<TemporaryAccess[]>(
    []
  );
  const [selectedAccess, setSelectedAccess] = useState<TemporaryAccess | null>(
    null
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Revoke
  const [revoking, setRevoking] = useState(false);

  // Extend
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [extending, setExtending] = useState(false);

  // Create
  const [createUserId, setCreateUserId] = useState("");
  const [createExpiryDate, setCreateExpiryDate] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [createAccessType, setCreateAccessType] = useState("");
  const [creating, setCreating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchAccesses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accesses, searchTerm, statusFilter]);

  const fetchAccesses = async () => {
    try {
      setLoading(true);
      const response = await temporaryAccessApi.getAll();
      setAccesses(response.accesses || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch temporary accesses");
      setAccesses([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accesses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((access) => {
        const userName = access.user
          ? `${access.user.firstName} ${access.user.lastName}`.toLowerCase()
          : "";
        const email = access.user?.email?.toLowerCase() || "";
        return (
          userName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(
        (access) => access.active && isFuture(new Date(access.expiresAt))
      );
    } else if (statusFilter === "expired") {
      filtered = filtered.filter((access) =>
        isPast(new Date(access.expiresAt))
      );
    } else if (statusFilter === "revoked") {
      filtered = filtered.filter(
        (access) => !access.active && access.revokedAt
      );
    }

    setFilteredAccesses(filtered);
    setCurrentPage(1);
  };

  const handleRevoke = async () => {
    if (!selectedAccess) return;

    try {
      setRevoking(true);
      await temporaryAccessApi.revoke(selectedAccess.id);

      handleApiSuccess("Access revoked successfully");
      setRevokeDialogOpen(false);
      setSelectedAccess(null);
      fetchAccesses();
    } catch (error) {
      handleApiError(error, "Failed to revoke access");
    } finally {
      setRevoking(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedAccess || !newExpiryDate || !extendReason.trim()) {
      handleApiError(null, "Please provide both expiry date and reason");
      return;
    }

    try {
      setExtending(true);
      await temporaryAccessApi.extend(selectedAccess.id, {
        expiresAt: new Date(newExpiryDate).toISOString(),
        reason: extendReason,
      });

      handleApiSuccess("Access extended successfully");
      setExtendDialogOpen(false);
      setSelectedAccess(null);
      setNewExpiryDate("");
      setExtendReason("");
      fetchAccesses();
    } catch (error) {
      handleApiError(error, "Failed to extend access");
    } finally {
      setExtending(false);
    }
  };

  const handleCreate = async () => {
    if (!createUserId || !createExpiryDate || !createReason.trim()) {
      handleApiError(null, "Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      await temporaryAccessApi.create({
        userId: createUserId,
        expiresAt: new Date(createExpiryDate).toISOString(),
        reason: createReason,
        accessType: createAccessType || undefined,
      });

      handleApiSuccess("Temporary access created successfully");
      setCreateDialogOpen(false);
      setCreateUserId("");
      setCreateExpiryDate("");
      setCreateReason("");
      setCreateAccessType("");
      fetchAccesses();
    } catch (error) {
      handleApiError(error, "Failed to create temporary access");
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (access: TemporaryAccess) => {
    if (!access.active && access.revokedAt) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Revoked
        </Badge>
      );
    }

    if (isPast(new Date(access.expiresAt))) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredAccesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccesses = filteredAccesses.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Temporary Access Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage temporary access grants for students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccesses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporary Accesses ({filteredAccesses.length})
          </CardTitle>
          <CardDescription>
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredAccesses.length)} of{" "}
            {filteredAccesses.length} accesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Granted By</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAccesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        No temporary accesses found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAccesses.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {access.user
                              ? `${access.user.firstName} ${access.user.lastName}`
                              : "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {access.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {access.grantor
                          ? `${access.grantor.firstName} ${access.grantor.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {safeFormatDate(access.expiresAt, "PPp")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isPast(new Date(access.expiresAt))
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {getTimeRemaining(access.expiresAt)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(access)}</TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate"
                          title={access.reason}
                        >
                          {access.reason || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {access.active &&
                            isFuture(new Date(access.expiresAt)) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAccess(access);
                                    setExtendDialogOpen(true);
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  Extend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAccess(access);
                                    setRevokeDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                  Revoke
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Temporary Access</DialogTitle>
            <DialogDescription>
              This will immediately revoke the temporary access for this student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                This action will set the access as inactive
              </span>
            </div>
            {selectedAccess && (
              <div className="text-sm space-y-2">
                <p>
                  <strong>Student:</strong>{" "}
                  {selectedAccess.user
                    ? `${selectedAccess.user.firstName} ${selectedAccess.user.lastName}`
                    : "Unknown"}
                </p>
                <p>
                  <strong>Expires At:</strong>{" "}
                  {safeFormatDate(selectedAccess.expiresAt, "PPp")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Temporary Access</DialogTitle>
            <DialogDescription>
              Update the expiration date for this temporary access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAccess && (
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Current Expiry:</strong>{" "}
                  {safeFormatDate(selectedAccess.expiresAt, "PPp")}
                </p>
                <p>
                  <strong>Student:</strong>{" "}
                  {selectedAccess.user
                    ? `${selectedAccess.user.firstName} ${selectedAccess.user.lastName}`
                    : "Unknown"}
                </p>
              </div>
            )}

            <div>
              <Label>New Expiry Date *</Label>
              <Input
                type="datetime-local"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Reason for Extension *</Label>
              <Textarea
                placeholder="Explain why this access is being extended..."
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtendDialogOpen(false);
                setNewExpiryDate("");
                setExtendReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtend}
              disabled={extending || !newExpiryDate || !extendReason.trim()}
            >
              {extending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CalendarIcon className="h-4 w-4 mr-2" />
              )}
              Extend Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Temporary Access</DialogTitle>
            <DialogDescription>
              Create a new temporary access grant for a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>User ID *</Label>
              <Input
                placeholder="Enter student user ID..."
                value={createUserId}
                onChange={(e) => setCreateUserId(e.target.value)}
              />
            </div>

            <div>
              <Label>Expires At *</Label>
              <Input
                type="datetime-local"
                value={createExpiryDate}
                onChange={(e) => setCreateExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Access Type (Optional)</Label>
              <Input
                placeholder="e.g., EXAM_ACCESS, CLASS_ACCESS"
                value={createAccessType}
                onChange={(e) => setCreateAccessType(e.target.value)}
              />
            </div>

            <div>
              <Label>Reason *</Label>
              <Textarea
                placeholder="Explain the reason for granting this access..."
                value={createReason}
                onChange={(e) => setCreateReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setCreateUserId("");
                setCreateExpiryDate("");
                setCreateReason("");
                setCreateAccessType("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating ||
                !createUserId ||
                !createExpiryDate ||
                !createReason.trim()
              }
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
