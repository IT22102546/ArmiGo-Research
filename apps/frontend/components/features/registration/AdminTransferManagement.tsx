"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Download,
  Clock,
  Check,
  X,
  Filter,
  Loader2,
  MapPin,
  BookOpen,
  School,
  User,
  Calendar,
} from "lucide-react";
import { getDisplayName } from "@/lib/utils/display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { teacherTransferApi } from "@/lib/api/endpoints";
import type {
  TeacherTransferRequest,
  TransferStats,
} from "@/lib/api/endpoints/teacher-transfers";

// Define TransferRequestStatus locally since it's exported as type
enum TransferRequestStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export default function AdminTransferManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "verified" | "completed" | "all"
  >("pending");
  const [transfers, setTransfers] = useState<TeacherTransferRequest[]>([]);
  const [stats, setStats] = useState<TransferStats | null>(null);
  const [filters, setFilters] = useState({
    subject: "ALL",
    medium: "ALL",
    level: "ALL",
    fromZone: "ALL",
    toZone: "ALL",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch transfer requests based on active tab
      const status =
        activeTab === "all"
          ? undefined
          : (activeTab.toUpperCase() as TransferRequestStatus);
      const transfersData = await teacherTransferApi.getAll({ status });
      setTransfers(transfersData || []);

      // Fetch stats
      const statsData = await teacherTransferApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch transfer data:", error);
      toast.error("Failed to load transfer requests");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (requestId: string, approved: boolean) => {
    try {
      await teacherTransferApi.verify({
        requestId,
        approved,
        notes: approved ? "Approved by admin" : "Rejected by admin",
      });
      toast.success(
        approved ? "Transfer request verified" : "Transfer request rejected"
      );
      fetchData();
    } catch (error) {
      toast.error("Failed to verify transfer request");
    }
  };

  const handleComplete = async (requestId: string) => {
    try {
      await teacherTransferApi.complete(requestId);
      toast.success("Transfer marked as completed");
      fetchData();
    } catch (error) {
      toast.error("Failed to complete transfer");
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await teacherTransferApi.cancel(requestId);
      toast.success("Transfer request cancelled");
      fetchData();
    } catch (error) {
      toast.error("Failed to cancel transfer");
    }
  };

  // Filter transfers based on selected filters
  const filteredTransfers = transfers.filter((transfer) => {
    if (filters.subject !== "ALL" && transfer.subject !== filters.subject)
      return false;
    if (filters.medium !== "ALL" && transfer.medium !== filters.medium)
      return false;
    if (filters.level !== "ALL" && transfer.level !== filters.level)
      return false;
    if (filters.fromZone !== "ALL" && transfer.fromZone !== filters.fromZone)
      return false;
    if (filters.toZone !== "ALL" && !transfer.toZones.includes(filters.toZone))
      return false;
    return true;
  });

  const getStatusBadge = (status: TransferRequestStatus) => {
    switch (status) {
      case TransferRequestStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case TransferRequestStatus.VERIFIED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case TransferRequestStatus.ACCEPTED:
        return "bg-green-100 text-green-800 border-green-200";
      case TransferRequestStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-200";
      case TransferRequestStatus.COMPLETED:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case TransferRequestStatus.CANCELLED:
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading transfer requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Mutual Transfer Management
            </h2>
            <p className="text-gray-600">
              Manage teacher transfer requests across zones and districts
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.verified}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.accepted}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="flex-1"
          >
            Pending
          </Button>
          <Button
            variant={activeTab === "verified" ? "default" : "outline"}
            onClick={() => setActiveTab("verified")}
            className="flex-1"
          >
            Verified
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className="flex-1"
          >
            Completed
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="flex-1"
          >
            All
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="subject-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subject
              </label>
              <select
                id="subject-filter"
                value={filters.subject}
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by subject"
              >
                <option value="ALL">All Subjects</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="medium-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Medium
              </label>
              <select
                id="medium-filter"
                value={filters.medium}
                onChange={(e) =>
                  setFilters({ ...filters, medium: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by medium"
              >
                <option value="ALL">All Mediums</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="level-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Level
              </label>
              <select
                id="level-filter"
                value={filters.level}
                onChange={(e) =>
                  setFilters({ ...filters, level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by level"
              >
                <option value="ALL">All Levels</option>
                <option value="A/L">A/L</option>
                <option value="O/L">O/L</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="from-zone-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                From Zone
              </label>
              <select
                id="from-zone-filter"
                value={filters.fromZone}
                onChange={(e) =>
                  setFilters({ ...filters, fromZone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by from zone"
              >
                <option value="ALL">All Zones</option>
                <option value="North Zone">North Zone</option>
                <option value="South Zone">South Zone</option>
                <option value="East Zone">East Zone</option>
                <option value="West Zone">West Zone</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="to-zone-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                To Zone
              </label>
              <select
                id="to-zone-filter"
                value={filters.toZone}
                onChange={(e) =>
                  setFilters({ ...filters, toZone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by to zone"
              >
                <option value="ALL">All Zones</option>
                <option value="North Zone">North Zone</option>
                <option value="South Zone">South Zone</option>
                <option value="East Zone">East Zone</option>
                <option value="West Zone">West Zone</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transfer Requests List */}
        <div className="space-y-4">
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transfer requests found</p>
            </div>
          ) : (
            filteredTransfers.map((transfer) => (
              <Card key={transfer.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {transfer.requester
                            ? `${transfer.requester.firstName} ${transfer.requester.lastName}`
                            : "Unknown Teacher"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {transfer.requester?.email || transfer.registrationId}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                          transfer.status
                        )}`}
                      >
                        {transfer.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <School className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Current School
                          </p>
                          <p className="font-medium text-gray-900">
                            {transfer.currentSchool}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-gray-500">District/Zone</p>
                          <p className="font-medium text-gray-900">
                            {transfer.currentDistrict} / {transfer.fromZone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-gray-500">Subject</p>
                          <p className="font-medium text-gray-900">
                            {getDisplayName(transfer.subject)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Medium / Level
                          </p>
                          <p className="font-medium text-gray-900">
                            {getDisplayName(transfer.medium)} / {transfer.level}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Desired Zones:</span>{" "}
                        {transfer.toZones.join(", ")}
                      </p>
                      {transfer.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Notes:</span>{" "}
                          {transfer.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Created:{" "}
                      {new Date(transfer.createdAt).toLocaleDateString()}
                      {transfer.verifiedAt &&
                        ` | Verified: ${new Date(transfer.verifiedAt).toLocaleDateString()}`}
                      {transfer.completedAt &&
                        ` | Completed: ${new Date(transfer.completedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {transfer.status === TransferRequestStatus.PENDING && (
                      <>
                        <Button
                          onClick={() => handleVerify(transfer.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          onClick={() => handleVerify(transfer.id, false)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {transfer.status === TransferRequestStatus.ACCEPTED && (
                      <Button
                        onClick={() => handleComplete(transfer.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    )}

                    {(transfer.status === TransferRequestStatus.PENDING ||
                      transfer.status === TransferRequestStatus.VERIFIED) && (
                      <Button
                        onClick={() => handleCancel(transfer.id)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
