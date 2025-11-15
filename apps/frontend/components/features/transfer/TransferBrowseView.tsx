"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { ApiClient } from "@/lib/api/api-client";
import TransferBrowseCard from "./TransferBrowseCard";
import TransferDetailsModal from "./TransferDetailsModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, AlertCircle } from "lucide-react";

interface TransferBrowseViewProps {
  showMatches?: boolean; // If true, show match scores
}

export default function TransferBrowseView({
  showMatches = false,
}: TransferBrowseViewProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    district: "",
    zone: "",
    teachingSubject: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [page, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(filters.district && { district: filters.district }),
        ...(filters.zone && { zone: filters.zone }),
        ...(filters.teachingSubject && {
          teachingSubject: filters.teachingSubject,
        }),
        ...(filters.status &&
          filters.status !== "ALL" && { status: filters.status }),
      });

      const endpoint = showMatches ? "/transfer/matches" : "/transfer/browse";
      const response: any = await ApiClient.get(
        `${endpoint}?${params.toString()}`
      );

      // ApiClient.get already returns parsed data
      // Backend returns { requests: [...], pagination: {...} }
      setRequests(response.requests || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(
        asApiError(err).response?.data?.message ||
          "Failed to fetch transfer requests"
      );
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDetailsModalOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleReset = () => {
    setFilters({
      district: "",
      zone: "",
      teachingSubject: "",
      status: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>District</Label>
            <Input
              placeholder="Filter by district"
              value={filters.district}
              onChange={(e) => handleFilterChange("district", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Zone</Label>
            <Input
              placeholder="Filter by zone"
              value={filters.zone}
              onChange={(e) => handleFilterChange("zone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Filter by subject"
              value={filters.teachingSubject}
              onChange={(e) =>
                handleFilterChange("teachingSubject", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={fetchRequests} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-muted-foreground">
            Loading transfer requests...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <TransferBrowseCard
              key={request.id}
              request={request}
              matchScore={showMatches ? request.matchScore : undefined}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No transfer requests found matching your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="py-2 px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequestId && (
        <TransferDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedRequestId(null);
          }}
          requestId={selectedRequestId}
        />
      )}
    </div>
  );
}
