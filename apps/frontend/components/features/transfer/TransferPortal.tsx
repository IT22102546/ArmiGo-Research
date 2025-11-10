"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getDisplayName } from "@/lib/utils/display";
import { ApiClient } from "@/lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MapPin,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Building,
} from "lucide-react";
import { format } from "date-fns";

interface TransferRequest {
  id: string;
  type: "MUTUAL" | "GENERAL";
  status: "PENDING" | "MATCHED" | "APPROVED" | "REJECTED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  fromSchoolId: string;
  toSchoolId: string;
  preferredLocation?: string;
  reason: string;
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;

  fromSchool: {
    id: string;
    name: string;
    address: string;
    district: string;
    province: string;
  };

  toSchool?: {
    id: string;
    name: string;
    address: string;
    district: string;
    province: string;
  };

  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    employeeId: string;
    position: string;
    subject: string;
    yearsOfService: number;
  };

  matchedRequest?: {
    id: string;
    requester: {
      firstName: string;
      lastName: string;
      position: string;
      subject: string;
    };
  };

  messages: TransferMessage[];
}

interface TransferMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  isRead: boolean;
}

interface School {
  id: string;
  name: string;
  address: string;
  district: string;
  province: string;
  type: string;
  principalName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

const statusConfig = {
  PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  MATCHED: { color: "bg-blue-100 text-blue-800", label: "Matched" },
  APPROVED: { color: "bg-green-100 text-green-800", label: "Approved" },
  REJECTED: { color: "bg-red-100 text-red-800", label: "Rejected" },
  COMPLETED: { color: "bg-purple-100 text-purple-800", label: "Completed" },
};

const priorityConfig = {
  LOW: { color: "bg-muted text-foreground", label: "Low" },
  MEDIUM: { color: "bg-blue-100 text-blue-800", label: "Medium" },
  HIGH: { color: "bg-orange-100 text-orange-800", label: "High" },
  URGENT: { color: "bg-red-100 text-red-800", label: "Urgent" },
};

const districts = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
];
const provinces = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

export default function TransferPortal() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [createRequestDialog, setCreateRequestDialog] = useState(false);
  const [viewRequestDialog, setViewRequestDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<TransferRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const [requestForm, setRequestForm] = useState<{
    type: "MUTUAL" | "GENERAL";
    toSchoolId: string;
    preferredLocation: string;
    reason: string;
    additionalInfo: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }>({
    type: "MUTUAL",
    toSchoolId: "",
    preferredLocation: "",
    reason: "",
    additionalInfo: "",
    priority: "MEDIUM",
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    district: "",
    province: "",
    type: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = filters;

      const [requestsData, schoolsData] = await Promise.all([
        ApiClient.get<any>("/transfer-requests", { params }),
        ApiClient.get<any>("/transfer-requests/schools"),
      ]);

      setRequests(requestsData.data || requestsData || []);
      setSchools(schoolsData.data || schoolsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.toSchoolId || !requestForm.reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        status: "warning",
      });
      return;
    }

    try {
      await ApiClient.post("/transfer-requests", requestForm);

      toast({
        title: "Success",
        description: "Transfer request created successfully",
        status: "success",
      });
      setCreateRequestDialog(false);
      setRequestForm({
        type: "MUTUAL",
        toSchoolId: "",
        preferredLocation: "",
        reason: "",
        additionalInfo: "",
        priority: "MEDIUM",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: asApiError(error).message || "Failed to create request",
        status: "error",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      await ApiClient.post(
        `/transfer-requests/${selectedRequest.id}/messages`,
        { content: newMessage }
      );

      toast({
        title: "Success",
        description: "Message sent successfully",
        status: "success",
      });
      setNewMessage("");
      // Refresh the selected request
      const updatedData = await ApiClient.get<any>(
        `/transfer-requests/${selectedRequest.id}`
      );
      setSelectedRequest(updatedData.data || updatedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        status: "error",
      });
    }
  };

  const handleRequestAction = async (requestId: string, action: string) => {
    try {
      const response = await fetch(
        `/api/transfer-requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Request ${action}d successfully`,
          status: "success",
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} request`,
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        status: "error",
      });
    }
  };

  const RequestCard = ({ request }: { request: TransferRequest }) => {
    const statusInfo = statusConfig[request.status];
    const priorityInfo = priorityConfig[request.priority];

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {request.fromSchool.name} →{" "}
                {request.toSchool?.name || "Any School"}
              </CardTitle>
              <CardDescription className="mt-1">
                {request.reason.substring(0, 100)}...
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRequest(request);
                    setViewRequestDialog(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRequest(request);
                    setMessageDialog(true);
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages ({request.messages.filter((m) => !m.isRead).length})
                </DropdownMenuItem>
                {request.status === "PENDING" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleRequestAction(request.id, "approve")}
                      className="text-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRequestAction(request.id, "reject")}
                      className="text-red-600"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Status and Priority */}
            <div className="flex gap-2">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
              <Badge variant="outline">{request.type}</Badge>
            </div>

            {/* Requester Info */}
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Requester:</strong> {request.requester.firstName}{" "}
                {request.requester.lastName}
              </p>
              <p>
                <strong>Position:</strong> {request.requester.position} -{" "}
                {getDisplayName(request.requester.subject)}
              </p>
              <p>
                <strong>Experience:</strong> {request.requester.yearsOfService}{" "}
                years
              </p>
            </div>

            {/* Location Info */}
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>From:</strong> {request.fromSchool.district},{" "}
                {request.fromSchool.province}
              </p>
              {request.toSchool && (
                <p>
                  <strong>To:</strong> {request.toSchool.district},{" "}
                  {request.toSchool.province}
                </p>
              )}
              {request.preferredLocation && (
                <p>
                  <strong>Preferred:</strong> {request.preferredLocation}
                </p>
              )}
            </div>

            {/* Match Info */}
            {request.matchedRequest && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Matched with: {request.matchedRequest.requester.firstName}{" "}
                  {request.matchedRequest.requester.lastName}
                </p>
                <p className="text-sm text-blue-600">
                  {request.matchedRequest.requester.position} -{" "}
                  {getDisplayName(request.matchedRequest.requester.subject)}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground">
              Created: {format(new Date(request.createdAt), "MMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfer Portal</h1>
          <p className="text-muted-foreground mt-2">
            Manage teacher transfer requests and find mutual transfers
          </p>
        </div>

        <Dialog
          open={createRequestDialog}
          onOpenChange={setCreateRequestDialog}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools, teachers..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>District</Label>
              <Select
                value={filters.district}
                onValueChange={(value) =>
                  setFilters({ ...filters, district: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MUTUAL">Mutual</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Transfer Requests</TabsTrigger>
          <TabsTrigger value="schools">School Directory</TabsTrigger>
          <TabsTrigger value="matching">Auto Matching</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Loading transfer requests...
                </p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <ArrowRight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No transfer requests found
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  No requests match your current filters or you haven't created
                  any requests yet.
                </p>
                <Button onClick={() => setCreateRequestDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle>School Directory</CardTitle>
              <CardDescription>
                Browse available schools for transfer requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">
                        {school.name}
                      </TableCell>
                      <TableCell>{school.district}</TableCell>
                      <TableCell>{school.province}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{school.type}</Badge>
                      </TableCell>
                      <TableCell>{school.principalName || "-"}</TableCell>
                      <TableCell>{school.contactPhone || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matching Tab */}
        <TabsContent value="matching">
          <Card>
            <CardHeader>
              <CardTitle>Auto Matching</CardTitle>
              <CardDescription>
                Automatically find potential mutual transfer partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Smart Matching System
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our AI-powered system automatically identifies potential
                  mutual transfer partners based on location preferences,
                  subjects, and other criteria.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-4 border rounded-lg">
                    <MapPin className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium mb-2">Location Matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Finds teachers wanting to transfer between complementary
                      locations
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium mb-2">Subject Compatibility</h4>
                    <p className="text-sm text-muted-foreground">
                      Matches teachers with similar qualifications and subjects
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Building className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium mb-2">School Type Matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Considers school type, grade levels, and institutional
                      requirements
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={createRequestDialog} onOpenChange={setCreateRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Transfer Request</DialogTitle>
            <DialogDescription>
              Submit a new transfer request to find opportunities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <Select
                value={requestForm.type}
                onValueChange={(value: "MUTUAL" | "GENERAL") =>
                  setRequestForm({ ...requestForm, type: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MUTUAL">Mutual Transfer</SelectItem>
                  <SelectItem value="GENERAL">General Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred School</Label>
              <Select
                value={requestForm.toSchoolId}
                onValueChange={(value) =>
                  setRequestForm({ ...requestForm, toSchoolId: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter((school) => school.id)
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} - {school.district}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred Location (Optional)</Label>
              <Input
                value={requestForm.preferredLocation}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    preferredLocation: e.target.value,
                  })
                }
                placeholder="e.g., Near Colombo, Coastal area"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={requestForm.priority}
                onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                  setRequestForm({ ...requestForm, priority: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason for Transfer *</Label>
              <Textarea
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, reason: e.target.value })
                }
                placeholder="Explain your reason for requesting a transfer"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Additional Information</Label>
              <Textarea
                value={requestForm.additionalInfo}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    additionalInfo: e.target.value,
                  })
                }
                placeholder="Any additional details that might be helpful"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateRequestDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      {selectedRequest && (
        <Dialog open={viewRequestDialog} onOpenChange={setViewRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transfer Request Details</DialogTitle>
              <DialogDescription>
                Review complete information for this transfer request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusConfig[selectedRequest.status].color}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge
                    className={priorityConfig[selectedRequest.priority].color}
                  >
                    {priorityConfig[selectedRequest.priority].label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Transfer Details</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg space-y-1">
                  <p>
                    <strong>From:</strong> {selectedRequest.fromSchool.name}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {selectedRequest.toSchool?.name || "Any suitable school"}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedRequest.type}
                  </p>
                  {selectedRequest.preferredLocation && (
                    <p>
                      <strong>Preferred Location:</strong>{" "}
                      {selectedRequest.preferredLocation}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.additionalInfo && (
                <div>
                  <Label className="text-sm font-medium">
                    Additional Information
                  </Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">
                    {selectedRequest.additionalInfo}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">
                  Requester Information
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-lg space-y-1">
                  <p>
                    <strong>Name:</strong> {selectedRequest.requester.firstName}{" "}
                    {selectedRequest.requester.lastName}
                  </p>
                  <p>
                    <strong>Employee ID:</strong>{" "}
                    {selectedRequest.requester.employeeId}
                  </p>
                  <p>
                    <strong>Position:</strong>{" "}
                    {selectedRequest.requester.position}
                  </p>
                  <p>
                    <strong>Subject:</strong>{" "}
                    {getDisplayName(selectedRequest.requester.subject)}
                  </p>
                  <p>
                    <strong>Experience:</strong>{" "}
                    {selectedRequest.requester.yearsOfService} years
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedRequest.requester.email}
                  </p>
                  {selectedRequest.requester.phone && (
                    <p>
                      <strong>Phone:</strong> {selectedRequest.requester.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewRequestDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setMessageDialog(true);
                  setViewRequestDialog(false);
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Dialog */}
      {selectedRequest && (
        <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Messages</DialogTitle>
              <DialogDescription>
                Communicate regarding transfer request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {selectedRequest.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.senderId === "current-user"
                        ? "bg-blue-100 ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
