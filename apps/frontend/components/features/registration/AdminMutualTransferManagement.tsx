"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Download,
  Eye,
  Filter,
  RefreshCw,
  MapPin,
  Building2,
  BookOpen,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("AdminMutualTransferManagement");

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  currentInstitution?: string;
  currentDistrict?: string;
  currentZone?: string;
  subject?: string;
  medium?: string;
  avatar?: string;
}

interface TransferRequest {
  id: string;
  uniqueId: string;
  teacherId: string;
  teacher: Teacher;
  requestType: "MUTUAL" | "NORMAL";
  fromInstitution: string;
  toInstitution: string;
  fromDistrict: string;
  toDistrict: string;
  fromZone: string;
  toZone: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

interface TransferStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}

const AdminMutualTransferManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TransferRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<TransferRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState<TransferStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
  });

  // Mock data - Replace with actual API calls
  useEffect(() => {
    loadTransferRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [
    requests,
    searchTerm,
    statusFilter,
    districtFilter,
    typeFilter,
    activeTab,
  ]);

  const loadTransferRequests = async () => {
    setLoading(true);
    try {
      // Mock data - Replace with actual API call
      const mockData: TransferRequest[] = [
        {
          id: "1",
          uniqueId: "MTR-2024-001",
          teacherId: "T001",
          teacher: {
            id: "T001",
            firstName: "Sarah",
            lastName: "Johnson",
            email: "sarah.j@example.com",
            employeeId: "EMP-123",
            currentInstitution: "Central College",
            currentDistrict: "Colombo",
            currentZone: "North Zone",
            subject: "Mathematics",
            medium: "English",
          },
          requestType: "MUTUAL",
          fromInstitution: "Central College",
          toInstitution: "Royal Institute",
          fromDistrict: "Colombo",
          toDistrict: "Kalutara",
          fromZone: "North Zone",
          toZone: "West Zone",
          reason: "Family relocation",
          status: "PENDING",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          uniqueId: "MTR-2024-002",
          teacherId: "T002",
          teacher: {
            id: "T002",
            firstName: "Michael",
            lastName: "Chen",
            email: "michael.c@example.com",
            employeeId: "EMP-456",
            currentInstitution: "Science Academy",
            currentDistrict: "Gampaha",
            currentZone: "East Zone",
            subject: "Physics",
            medium: "English",
          },
          requestType: "MUTUAL",
          fromInstitution: "Science Academy",
          toInstitution: "Tech High School",
          fromDistrict: "Gampaha",
          toDistrict: "Colombo",
          fromZone: "East Zone",
          toZone: "South Zone",
          reason: "Career advancement",
          status: "UNDER_REVIEW",
          createdAt: "2024-01-14T09:15:00Z",
          updatedAt: "2024-01-16T14:20:00Z",
        },
      ];

      setRequests(mockData);
      calculateStats(mockData);
    } catch (error) {
      logger.error("Error loading transfer requests:", error);
      toast.error("Failed to load transfer requests");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TransferRequest[]) => {
    setStats({
      total: data.length,
      pending: data.filter((r) => r.status === "PENDING").length,
      approved: data.filter((r) => r.status === "APPROVED").length,
      rejected: data.filter((r) => r.status === "REJECTED").length,
      underReview: data.filter((r) => r.status === "UNDER_REVIEW").length,
    });
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((r) => r.status === activeTab.toUpperCase());
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.uniqueId.toLowerCase().includes(search) ||
          `${r.teacher.firstName} ${r.teacher.lastName}`
            .toLowerCase()
            .includes(search) ||
          r.teacher.email.toLowerCase().includes(search) ||
          r.teacher.employeeId?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // District filter
    if (districtFilter !== "all") {
      filtered = filtered.filter(
        (r) =>
          r.fromDistrict === districtFilter || r.toDistrict === districtFilter
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.requestType === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleViewRequest = (request: TransferRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleApproveClick = (request: TransferRequest) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setIsApproveModalOpen(true);
  };

  const handleRejectClick = (request: TransferRequest) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setIsRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      // API call to approve transfer request
      toast.success("Transfer request approved successfully");
      loadTransferRequests();
      setIsApproveModalOpen(false);
    } catch (error) {
      logger.error("Error approving request:", error);
      toast.error("Failed to approve transfer request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setSubmitting(true);
    try {
      // API call to reject transfer request
      toast.success("Transfer request rejected");
      loadTransferRequests();
      setIsRejectModalOpen(false);
    } catch (error) {
      logger.error("Error rejecting request:", error);
      toast.error("Failed to reject transfer request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: "secondary", icon: Clock },
      UNDER_REVIEW: { variant: "default", icon: AlertCircle },
      APPROVED: { variant: "success", icon: CheckCircle2 },
      REJECTED: { variant: "destructive", icon: XCircle },
    };
    const { variant, icon: Icon } = variants[status] || variants.PENDING;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            Mutual Transfer Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage teacher mutual transfer requests
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadTransferRequests}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Requests
                </p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Pending
                </p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Under Review
                </p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {stats.underReview}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Approved
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.approved}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Rejected
                </p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px] max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, name, email, employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={districtFilter}
                  onValueChange={setDistrictFilter}
                >
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    <SelectItem value="Colombo">Colombo</SelectItem>
                    <SelectItem value="Gampaha">Gampaha</SelectItem>
                    <SelectItem value="Kalutara">Kalutara</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="MUTUAL">Mutual</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs text-muted-foreground ml-auto">
                  Showing {filteredRequests.length} of {requests.length}{" "}
                  requests
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transfer requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">
                          Request ID
                        </TableHead>
                        <TableHead className="min-w-[200px]">Teacher</TableHead>
                        <TableHead className="min-w-[150px]">Type</TableHead>
                        <TableHead className="min-w-[200px]">From</TableHead>
                        <TableHead className="min-w-[200px]">To</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[150px]">
                          Submitted
                        </TableHead>
                        <TableHead className="text-right min-w-[150px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.uniqueId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={request.teacher.avatar} />
                                <AvatarFallback>
                                  {getInitials(
                                    request.teacher.firstName,
                                    request.teacher.lastName
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {request.teacher.firstName}{" "}
                                  {request.teacher.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {request.teacher.employeeId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.requestType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Building2 className="h-3 w-3" />
                                {request.fromInstitution}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {request.fromDistrict} - {request.fromZone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Building2 className="h-3 w-3" />
                                {request.toInstitution}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {request.toDistrict} - {request.toZone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewRequest(request)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {request.status === "PENDING" ||
                              request.status === "UNDER_REVIEW" ? (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleApproveClick(request)
                                          }
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Approve</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRejectClick(request)
                                          }
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Reject</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Request Modal */}
      {selectedRequest && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transfer Request Details</DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest.uniqueId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Teacher Name
                  </Label>
                  <p className="font-medium">
                    {selectedRequest.teacher.firstName}{" "}
                    {selectedRequest.teacher.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Employee ID
                  </Label>
                  <p className="font-medium">
                    {selectedRequest.teacher.employeeId}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.teacher.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Subject
                  </Label>
                  <p className="font-medium">
                    {selectedRequest.teacher.subject}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Transfer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      From Institution
                    </Label>
                    <p className="font-medium">
                      {selectedRequest.fromInstitution}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.fromDistrict} -{" "}
                      {selectedRequest.fromZone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      To Institution
                    </Label>
                    <p className="font-medium">
                      {selectedRequest.toInstitution}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.toDistrict} - {selectedRequest.toZone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <p className="mt-1">{selectedRequest.reason}</p>
              </div>

              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Modal */}
      {selectedRequest && (
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Transfer Request</DialogTitle>
              <DialogDescription>
                Approve transfer request for {selectedRequest.teacher.firstName}{" "}
                {selectedRequest.teacher.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Add any notes or comments..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Approve Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Modal */}
      {selectedRequest && (
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Transfer Request</DialogTitle>
              <DialogDescription>
                Reject transfer request for {selectedRequest.teacher.firstName}{" "}
                {selectedRequest.teacher.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Provide a reason for rejection..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={submitting || !reviewNotes.trim()}
                variant="destructive"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminMutualTransferManagement;
