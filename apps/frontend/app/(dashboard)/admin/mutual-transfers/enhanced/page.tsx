"use client";

import { useState, useEffect } from "react";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import type {
  TeacherTransferRequest,
  TransferStats,
  TransferRequestStatus,
} from "@/lib/api/endpoints/teacher-transfers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  BookOpen,
  User,
  Calendar,
  Send,
  MessageCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCheck,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-handling/api-error-handler";

export default function EnhancedAdminTransferManagement() {
  // State
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<TeacherTransferRequest[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<
    TeacherTransferRequest[]
  >([]);
  const [stats, setStats] = useState<TransferStats | null>(null);
  const [selectedTransfer, setSelectedTransfer] =
    useState<TeacherTransferRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBatchActionDialog, setShowBatchActionDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<
    "verify" | "reject" | "complete" | null
  >(null);

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | TransferRequestStatus>(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    fromZone: "all",
    toZone: "all",
    subject: "all",
    medium: "all",
    level: "all",
    verified: "all",
    dateRange: "all", // today, week, month, all
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [transfers, searchTerm, filters, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transfersData, statsData] = await Promise.all([
        teacherTransferApi.getAll(),
        teacherTransferApi.getStats(),
      ]);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setStats(statsData);
    } catch (error) {
      handleApiError(error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transfers];

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((t) => t.status === activeTab);
    }

    // Search term (name, email, unique ID, school)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.uniqueId?.toLowerCase().includes(term) ||
          t.requester?.firstName?.toLowerCase().includes(term) ||
          t.requester?.lastName?.toLowerCase().includes(term) ||
          t.requester?.email?.toLowerCase().includes(term) ||
          t.currentSchool?.toLowerCase().includes(term) ||
          t.registrationId?.toLowerCase().includes(term)
      );
    }

    // Zone filters
    if (filters.fromZone !== "all") {
      filtered = filtered.filter((t) => t.fromZone === filters.fromZone);
    }
    if (filters.toZone !== "all") {
      filtered = filtered.filter((t) => t.toZones?.includes(filters.toZone));
    }

    // Subject/Medium/Level filters
    if (filters.subject !== "all") {
      filtered = filtered.filter((t) => t.subject === filters.subject);
    }
    if (filters.medium !== "all") {
      filtered = filtered.filter((t) => t.medium === filters.medium);
    }
    if (filters.level !== "all") {
      filtered = filtered.filter((t) => t.level === filters.level);
    }

    // Verification filter
    if (filters.verified !== "all") {
      const isVerified = filters.verified === "verified";
      filtered = filtered.filter((t) => t.verified === isVerified);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const ranges = {
        today: 1,
        week: 7,
        month: 30,
      };
      const days = ranges[filters.dateRange as keyof typeof ranges];
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t) => new Date(t.createdAt) >= cutoff);
      }
    }

    setFilteredTransfers(filtered);
  };

  // Actions
  const handleVerify = async (id: string, approved: boolean) => {
    try {
      await teacherTransferApi.verifyAdmin(id, {
        notes: approved ? "Verified by admin" : "Rejected by admin",
      });
      toast.success(approved ? "Request verified" : "Request rejected");
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await teacherTransferApi.complete(id);
      toast.success("Transfer marked as completed");
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBatchAction = async () => {
    if (!batchAction || selectedIds.size === 0) return;

    try {
      const promises = Array.from(selectedIds).map((id) => {
        switch (batchAction) {
          case "verify":
            return handleVerify(id, true);
          case "reject":
            return handleVerify(id, false);
          case "complete":
            return handleComplete(id);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`Batch action completed for ${selectedIds.size} requests`);
      setSelectedIds(new Set());
      setShowBatchActionDialog(false);
      await fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const exportData = () => {
    // CSV export logic
    const csv = [
      [
        "Unique ID",
        "Teacher Name",
        "Email",
        "Current School",
        "From Zone",
        "To Zones",
        "Subject",
        "Medium",
        "Level",
        "Status",
        "Verified",
        "Created Date",
      ],
      ...filteredTransfers.map((t) => [
        t.uniqueId,
        `${t.requester?.firstName} ${t.requester?.lastName}`,
        t.requester?.email,
        t.currentSchool,
        t.fromZone,
        t.toZones?.join("; "),
        t.subject,
        t.medium,
        t.level,
        t.status,
        t.verified ? "Yes" : "No",
        new Date(t.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transfer-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Export completed");
  };

  const getStatusBadge = (status: TransferRequestStatus) => {
    const config = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      VERIFIED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      MATCHED: { color: "bg-purple-100 text-purple-800", icon: Users },
      ACCEPTED: { color: "bg-green-100 text-green-800", icon: CheckCheck },
      COMPLETED: { color: "bg-emerald-100 text-emerald-800", icon: TrendingUp },
      CANCELLED: { color: "bg-gray-100 text-gray-800", icon: Ban },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    const { color, icon: Icon } =
      config[status as keyof typeof config] || config.PENDING;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mutual Transfer Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage teacher mutual transfer requests across zones and districts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Matched</p>
                <p className="text-2xl font-bold">{stats.matched || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, unique ID, school, or registration ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  fromZone: "all",
                  toZone: "all",
                  subject: "all",
                  medium: "all",
                  level: "all",
                  verified: "all",
                  dateRange: "all",
                })
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Select
              value={filters.fromZone}
              onValueChange={(value) =>
                setFilters({ ...filters, fromZone: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="From Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="North Zone">North Zone</SelectItem>
                <SelectItem value="South Zone">South Zone</SelectItem>
                <SelectItem value="East Zone">East Zone</SelectItem>
                <SelectItem value="West Zone">West Zone</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.toZone}
              onValueChange={(value) =>
                setFilters({ ...filters, toZone: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="To Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="North Zone">North Zone</SelectItem>
                <SelectItem value="South Zone">South Zone</SelectItem>
                <SelectItem value="East Zone">East Zone</SelectItem>
                <SelectItem value="West Zone">West Zone</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.subject}
              onValueChange={(value) =>
                setFilters({ ...filters, subject: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.medium}
              onValueChange={(value) =>
                setFilters({ ...filters, medium: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mediums</SelectItem>
                <SelectItem value="Sinhala">Sinhala</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.level}
              onValueChange={(value) =>
                setFilters({ ...filters, level: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A/L">A/L</SelectItem>
                <SelectItem value="O/L">O/L</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.verified}
              onValueChange={(value) =>
                setFilters({ ...filters, verified: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                setFilters({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTransfers.length} of {transfers.length} requests
            </span>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedIds.size} selected</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Batch Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setBatchAction("verify");
                        setShowBatchActionDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBatchAction("reject");
                        setShowBatchActionDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBatchAction("complete");
                        setShowBatchActionDialog(true);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="VERIFIED">Verified</TabsTrigger>
          <TabsTrigger value="MATCHED">Matched</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredTransfers.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transfer requests found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your filters or search term
                  </p>
                </div>
              </Card>
            ) : (
              filteredTransfers.map((transfer) => (
                <Card
                  key={transfer.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(transfer.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedIds);
                        if (e.target.checked) {
                          newSelected.add(transfer.id);
                        } else {
                          newSelected.delete(transfer.id);
                        }
                        setSelectedIds(newSelected);
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {transfer.requester
                                ? `${transfer.requester.firstName} ${transfer.requester.lastName}`
                                : "Unknown"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {transfer.requester?.email} • {transfer.uniqueId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(transfer.status)}
                          {transfer.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">From Zone</p>
                            <p className="font-medium">{transfer.fromZone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Send className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">To Zones</p>
                            <p className="font-medium">
                              {transfer.toZones?.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Subject</p>
                            <p className="font-medium">{transfer.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="font-medium">
                              {new Date(
                                transfer.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {transfer.acceptances &&
                            transfer.acceptances.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {transfer.acceptances.length} acceptance(s)
                              </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {transfer.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleVerify(transfer.id, true)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerify(transfer.id, false)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {transfer.status === "ACCEPTED" && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleComplete(transfer.id)}
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this transfer request
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              {/* Teacher Info */}
              <div>
                <h3 className="font-semibold mb-3">Teacher Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">
                      {selectedTransfer.requester?.firstName}{" "}
                      {selectedTransfer.requester?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">
                      {selectedTransfer.requester?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">
                      {selectedTransfer.requester?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Registration ID</p>
                    <p className="font-medium">
                      {selectedTransfer.registrationId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h3 className="font-semibold mb-3">Transfer Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current School</p>
                    <p className="font-medium">
                      {selectedTransfer.currentSchool}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current District</p>
                    <p className="font-medium">
                      {selectedTransfer.currentDistrict}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">From Zone</p>
                    <p className="font-medium">{selectedTransfer.fromZone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Desired Zones</p>
                    <p className="font-medium">
                      {selectedTransfer.toZones?.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Subject</p>
                    <p className="font-medium">{selectedTransfer.subject}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Medium</p>
                    <p className="font-medium">{selectedTransfer.medium}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Level</p>
                    <p className="font-medium">{selectedTransfer.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    {getStatusBadge(selectedTransfer.status)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedTransfer.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}

              {/* Acceptances */}
              {selectedTransfer.acceptances &&
                selectedTransfer.acceptances.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Acceptances</h3>
                    <div className="space-y-2">
                      {selectedTransfer.acceptances.map((acc: any) => (
                        <Card key={acc.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {acc.acceptor?.firstName}{" "}
                                {acc.acceptor?.lastName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {acc.acceptor?.email}
                              </p>
                            </div>
                            <Badge>{acc.status}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(selectedTransfer.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedTransfer.verifiedAt && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">Verified:</span>
                      <span className="font-medium">
                        {new Date(selectedTransfer.verifiedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedTransfer.completedAt && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedTransfer.completedAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Action Confirmation Dialog */}
      <Dialog
        open={showBatchActionDialog}
        onOpenChange={setShowBatchActionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Action</DialogTitle>
            <DialogDescription>
              You are about to {batchAction} {selectedIds.size} transfer
              request(s). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBatchActionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBatchAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
