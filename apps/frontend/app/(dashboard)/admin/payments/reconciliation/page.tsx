"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentReconciliationApi,
  ReconciliationStatus,
  ReconciliationType,
} from "@/lib/api/payment-reconciliation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Upload,
  Link2,
  Unlink,
  Flag,
  Search,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentReconciliationPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: undefined as ReconciliationStatus | undefined,
    type: undefined as ReconciliationType | undefined,
    page: 1,
    limit: 20,
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [suspiciousDialogOpen, setSuspiciousDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<
    string | null
  >(null);
  const [matchPaymentId, setMatchPaymentId] = useState("");
  const [matchNotes, setMatchNotes] = useState("");
  const [suspiciousReason, setSuspiciousReason] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: statisticsData } = useQuery({
    queryKey: ["payment-reconciliation-statistics"],
    queryFn: async () => {
      const response = await paymentReconciliationApi.getStatistics();
      return (
        response || {
          total: 0,
          pending: 0,
          matched: 0,
          unmatched: 0,
          disputed: 0,
          resolved: 0,
          totalTrackerPlusAmount: 0,
          totalInternalAmount: 0,
          totalDiscrepancy: 0,
          byType: {
            autoMatched: 0,
            manuallyMatched: 0,
            unmatched: 0,
            suspicious: 0,
          },
        }
      );
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-reconciliation-list", filters],
    queryFn: async () => {
      const response =
        await paymentReconciliationApi.getReconciliationList(filters);
      return (
        response || {
          data: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        }
      );
    },
  });

  const { data: suggestedMatches } = useQuery({
    queryKey: ["payment-reconciliation-suggestions", selectedReconciliation],
    queryFn: async () => {
      const response = await paymentReconciliationApi.getSuggestedMatches(
        selectedReconciliation!
      );
      return response || [];
    },
    enabled: !!selectedReconciliation && matchDialogOpen,
  });

  const importMutation = useMutation({
    mutationFn: paymentReconciliationApi.importTrackerPlusData,
    onSuccess: (result) => {
      toast.success(
        `Imported ${result.imported} records, ${result.autoMatched} auto-matched`
      );
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
      setImportDialogOpen(false);
      setImportData("");
    },
    onError: () => {
      toast.error("Failed to import TrackerPlus data");
    },
  });

  const matchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      paymentReconciliationApi.manualMatch(id, data),
    onSuccess: () => {
      toast.success("Successfully matched payment");
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
      setMatchDialogOpen(false);
      setMatchPaymentId("");
      setMatchNotes("");
      setSelectedReconciliation(null);
      setSelectedSuggestion(null);
    },
    onError: () => {
      toast.error("Failed to match payment");
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: paymentReconciliationApi.unmatch,
    onSuccess: () => {
      toast.success("Successfully unmatched payment");
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
    },
    onError: () => {
      toast.error("Failed to unmatch payment");
    },
  });

  const markSuspiciousMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      paymentReconciliationApi.markSuspicious(id, reason),
    onSuccess: () => {
      toast.success("Marked as suspicious");
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
      setSuspiciousDialogOpen(false);
      setSuspiciousReason("");
      setSelectedReconciliation(null);
    },
    onError: () => {
      toast.error("Failed to mark as suspicious");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      paymentReconciliationApi.resolve(id, notes),
    onSuccess: () => {
      toast.success("Reconciliation resolved");
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
      setResolveDialogOpen(false);
      setResolveNotes("");
      setSelectedReconciliation(null);
    },
    onError: () => {
      toast.error("Failed to resolve reconciliation");
    },
  });

  const bulkMatchMutation = useMutation({
    mutationFn: paymentReconciliationApi.bulkMatch,
    onSuccess: (result) => {
      toast.success(`Matched ${result.matched} records`);
      if (result.failed > 0) {
        toast.error(`${result.failed} records failed to match`);
      }
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-reconciliation-statistics"],
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast.error("Bulk match failed");
    },
  });

  const handleImport = () => {
    try {
      const records = JSON.parse(importData);
      importMutation.mutate({ records });
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  const handleMatch = () => {
    if (!selectedReconciliation) return;
    const paymentId = selectedSuggestion || matchPaymentId;
    if (!paymentId) {
      toast.error("Please select or enter a payment ID");
      return;
    }
    matchMutation.mutate({
      id: selectedReconciliation,
      data: { paymentId, notes: matchNotes },
    });
  };

  const handleUnmatch = (id: string) => {
    if (confirm("Are you sure you want to unmatch this reconciliation?")) {
      unmatchMutation.mutate(id);
    }
  };

  const handleMarkSuspicious = () => {
    if (!selectedReconciliation || !suspiciousReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    markSuspiciousMutation.mutate({
      id: selectedReconciliation,
      reason: suspiciousReason,
    });
  };

  const handleResolve = () => {
    if (!selectedReconciliation || !resolveNotes.trim()) {
      toast.error("Please provide resolution notes");
      return;
    }
    resolveMutation.mutate({ id: selectedReconciliation, notes: resolveNotes });
  };

  const handleBulkMatch = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select records to match");
      return;
    }
    bulkMatchMutation.mutate({ reconciliationIds: selectedIds });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusIcon = (status: ReconciliationStatus) => {
    switch (status) {
      case ReconciliationStatus.MATCHED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ReconciliationStatus.UNMATCHED:
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case ReconciliationStatus.DISPUTED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case ReconciliationStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ReconciliationStatus) => {
    switch (status) {
      case ReconciliationStatus.MATCHED:
        return "bg-green-100 text-green-800";
      case ReconciliationStatus.UNMATCHED:
        return "bg-gray-100 text-gray-800";
      case ReconciliationStatus.DISPUTED:
        return "bg-red-100 text-red-800";
      case ReconciliationStatus.RESOLVED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getTypeColor = (type: ReconciliationType) => {
    switch (type) {
      case ReconciliationType.AUTO_MATCHED:
        return "bg-green-100 text-green-800";
      case ReconciliationType.MANUALLY_MATCHED:
        return "bg-blue-100 text-blue-800";
      case ReconciliationType.SUSPICIOUS:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
          <p className="text-muted-foreground">
            Match TrackerPlus data with internal payments
          </p>
        </div>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Import TrackerPlus Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import TrackerPlus Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>JSON Data</Label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='{"records": [{"referenceId": "TP001", "amount": 5000, "date": "2025-11-23", "studentId": "STU001", "studentName": "John Doe"}]}'
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? "Importing..." : "Import"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {statisticsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statisticsData.total}</div>
              <p className="text-xs text-muted-foreground">
                Pending: {statisticsData.pending}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matched</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statisticsData.matched}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  (statisticsData.matched / statisticsData.total) *
                  100
                ).toFixed(1)}
                % match rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                TrackerPlus Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                LKR {statisticsData.totalTrackerPlusAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Internal: LKR{" "}
                {statisticsData.totalInternalAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Discrepancy</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                LKR {statisticsData.totalDiscrepancy.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Disputed: {statisticsData.disputed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status:
                      value === "all"
                        ? undefined
                        : (value as ReconciliationStatus),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={ReconciliationStatus.PENDING}>
                    Pending
                  </SelectItem>
                  <SelectItem value={ReconciliationStatus.MATCHED}>
                    Matched
                  </SelectItem>
                  <SelectItem value={ReconciliationStatus.UNMATCHED}>
                    Unmatched
                  </SelectItem>
                  <SelectItem value={ReconciliationStatus.DISPUTED}>
                    Disputed
                  </SelectItem>
                  <SelectItem value={ReconciliationStatus.RESOLVED}>
                    Resolved
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    type:
                      value === "all"
                        ? undefined
                        : (value as ReconciliationType),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ReconciliationType.AUTO_MATCHED}>
                    Auto Matched
                  </SelectItem>
                  <SelectItem value={ReconciliationType.MANUALLY_MATCHED}>
                    Manually Matched
                  </SelectItem>
                  <SelectItem value={ReconciliationType.UNMATCHED}>
                    Unmatched
                  </SelectItem>
                  <SelectItem value={ReconciliationType.SUSPICIOUS}>
                    Suspicious
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setFilters({
                    status: undefined,
                    type: undefined,
                    page: 1,
                    limit: 20,
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} records selected
              </span>
              <Button
                size="sm"
                onClick={handleBulkMatch}
                disabled={bulkMatchMutation.isPending}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Bulk Auto-Match
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === (data?.data?.length || 0) &&
                      (data?.data?.length || 0) > 0
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked
                          ? data?.data.map((r) => r.id) || []
                          : []
                      )
                    }
                    className="rounded"
                  />
                </TableHead>
                <TableHead>TrackerPlus Ref</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Internal Payment</TableHead>
                <TableHead>Discrepancy</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelection(record.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.trackerPlusRefId}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {record.trackerPlusStudentName || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.trackerPlusStudentId || "No ID"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    LKR {record.trackerPlusAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(record.trackerPlusDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getTypeColor(record.type)}
                      variant="outline"
                    >
                      {record.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.payment ? (
                      <div>
                        <div className="text-sm font-medium">
                          LKR {record.payment.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.payment.user.firstName}{" "}
                          {record.payment.user.lastName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not matched
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.discrepancyAmount ? (
                      <span className="text-sm font-medium text-red-600">
                        LKR {record.discrepancyAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {record.status === ReconciliationStatus.PENDING && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReconciliation(record.id);
                              setMatchDialogOpen(true);
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReconciliation(record.id);
                              setSuspiciousDialogOpen(true);
                            }}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {record.status === ReconciliationStatus.MATCHED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnmatch(record.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      )}
                      {record.status === ReconciliationStatus.DISPUTED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReconciliation(record.id);
                            setResolveDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{" "}
            of {data.pagination.total} records
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Suggested Matches</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {suggestedMatches?.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedSuggestion === suggestion.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {suggestion.user.firstName} {suggestion.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.user.email}
                        </div>
                        <div className="text-sm mt-1">
                          LKR {suggestion.amount.toLocaleString()} •{" "}
                          {format(
                            new Date(suggestion.createdAt),
                            "MMM dd, yyyy"
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {suggestion.matchScore}% match
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div>
              <Label>Manual Payment ID</Label>
              <Input
                value={matchPaymentId}
                onChange={(e) => setMatchPaymentId(e.target.value)}
                placeholder="Enter payment ID manually"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={matchNotes}
                onChange={(e) => setMatchNotes(e.target.value)}
                placeholder="Add any notes about this match..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMatchDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleMatch} disabled={matchMutation.isPending}>
                {matchMutation.isPending ? "Matching..." : "Match Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Suspicious Dialog */}
      <Dialog
        open={suspiciousDialogOpen}
        onOpenChange={setSuspiciousDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Suspicious</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Textarea
                value={suspiciousReason}
                onChange={(e) => setSuspiciousReason(e.target.value)}
                placeholder="Describe why this record is suspicious..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSuspiciousDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleMarkSuspicious}
                disabled={markSuspiciousMutation.isPending}
              >
                {markSuspiciousMutation.isPending
                  ? "Marking..."
                  : "Mark Suspicious"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Disputed Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe how this dispute was resolved..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResolveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? "Resolving..." : "Resolve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
