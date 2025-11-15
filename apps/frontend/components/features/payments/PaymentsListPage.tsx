"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  DollarSign,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import {
  paymentsApi,
  Payment,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/api/endpoints/payments";

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

export function PaymentsListPage() {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewSlipDialogOpen, setViewSlipDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    payments,
    searchTerm,
    statusFilter,
    methodFilter,
    referenceTypeFilter,
    userTypeFilter,
    dateFrom,
    dateTo,
  ]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getAllAdmin({
        status: statusFilter !== "all" ? statusFilter : undefined,
        method: methodFilter !== "all" ? methodFilter : undefined,
        referenceType:
          referenceTypeFilter !== "all" ? referenceTypeFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayments(response.payments || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const userName = payment.user
          ? `${payment.user.firstName} ${payment.user.lastName}`.toLowerCase()
          : "";
        const email = payment.user?.email?.toLowerCase() || "";
        return (
          userName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    // Reference type filter
    if (referenceTypeFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.referenceType === referenceTypeFilter
      );
    }

    // User type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.user?.userType === userTypeFilter
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (payment) => new Date(payment.createdAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (payment) => new Date(payment.createdAt) <= new Date(dateTo)
      );
    }

    setFilteredPayments(filtered);
    setCurrentPage(1);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    try {
      await paymentsApi.approveBankSlip(selectedPayment.id);

      handleApiSuccess(t("paymentApprovedSuccess"));
      setApproveDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      handleApiError(error, "Failed to approve payment");
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      handleApiError(null, t("provideRejectionReason"));
      return;
    }

    try {
      await paymentsApi.rejectBankSlip(selectedPayment.id, rejectReason);

      handleApiSuccess(t("paymentRejected"));
      setRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectReason("");
      fetchPayments();
    } catch (error) {
      handleApiError(error, "Failed to reject payment");
    }
  };

  const handleSyncTrackerPlus = async (paymentId: string) => {
    try {
      setSyncing(true);
      await paymentsApi.syncTrackerPlus(paymentId);

      handleApiSuccess(t("paymentStatusSynced"));
      fetchPayments();
    } catch (error) {
      handleApiError(error, "Failed to sync payment status");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const config = {
      PENDING: {
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
      },
      PROCESSING: {
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800",
      },
      COMPLETED: {
        variant: "outline" as const,
        className: "bg-green-100 text-green-800",
      },
      FAILED: { variant: "destructive" as const, className: "" },
      REFUNDED: {
        variant: "outline" as const,
        className: "bg-purple-100 text-purple-800",
      },
      CANCELLED: {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800",
      },
    };

    const { variant, className } = config[status];
    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    );
  };

  const getMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      CREDIT_CARD: t("methods.creditCard"),
      DEBIT_CARD: t("methods.debitCard"),
      BANK_TRANSFER: t("methods.bankTransfer"),
      BANK_SLIP: t("methods.bankSlip"),
      DIGITAL_WALLET: t("methods.digitalWallet"),
      TRACKER_PLUS: t("methods.trackerPlus"),
      WALLET_CREDITS: t("methods.walletCredits"),
    };
    return labels[method] || method;
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold">{t("paymentsManagement")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("monitorAndManageTransactions")}
          </p>
        </div>
        <Button onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {tc("refresh")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <Label>{tc("search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchByUser")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>{tc("status")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                  <SelectItem value="PENDING">
                    {t("statuses.pending")}
                  </SelectItem>
                  <SelectItem value="PROCESSING">
                    {t("statuses.processing")}
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    {t("statuses.completed")}
                  </SelectItem>
                  <SelectItem value="FAILED">{t("statuses.failed")}</SelectItem>
                  <SelectItem value="REFUNDED">
                    {t("statuses.refunded")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("statuses.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Method */}
            <div>
              <Label>{t("paymentMethod")}</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allMethods")}</SelectItem>
                  <SelectItem value="TRACKER_PLUS">
                    {t("methods.trackerPlus")}
                  </SelectItem>
                  <SelectItem value="BANK_SLIP">
                    {t("methods.bankSlip")}
                  </SelectItem>
                  <SelectItem value="WALLET_CREDITS">
                    {t("methods.walletCredits")}
                  </SelectItem>
                  <SelectItem value="CREDIT_CARD">
                    {t("methods.creditCard")}
                  </SelectItem>
                  <SelectItem value="DEBIT_CARD">
                    {t("methods.debitCard")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Type */}
            <div>
              <Label>{t("referenceType")}</Label>
              <Select
                value={referenceTypeFilter}
                onValueChange={setReferenceTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="CLASS_FEE">
                    {t("referenceTypes.classFee")}
                  </SelectItem>
                  <SelectItem value="EXAM_FEE">
                    {t("referenceTypes.examFee")}
                  </SelectItem>
                  <SelectItem value="PUBLICATION">
                    {t("referenceTypes.publication")}
                  </SelectItem>
                  <SelectItem value="WALLET_TOPUP">
                    {t("referenceTypes.walletTopup")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type */}
            <div>
              <Label>{t("userType")}</Label>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allUsers")}</SelectItem>
                  <SelectItem value="INTERNAL">
                    {t("userTypes.internal")}
                  </SelectItem>
                  <SelectItem value="EXTERNAL">
                    {t("userTypes.external")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("filters.fromDate")}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("filters.toDate")}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("payments")} ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            {t("showingPayments", {
              start: startIndex + 1,
              end: Math.min(endIndex, filteredPayments.length),
              total: filteredPayments.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{t("reference")}</TableHead>
                  <TableHead>{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {t("noPaymentsFound")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {safeFormatDate(payment.createdAt, "PP")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.user
                              ? `${payment.user.firstName} ${payment.user.lastName}`
                              : t("unknown")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{getMethodLabel(payment.method)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.referenceType && (
                          <Badge variant="outline">
                            {payment.referenceType}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.method === "BANK_SLIP" &&
                            payment.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setViewSlipDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {tc("view")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setApproveDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  {t("approve")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                  {t("reject")}
                                </Button>
                              </>
                            )}
                          {payment.method === "TRACKER_PLUS" &&
                            payment.gatewayTransactionId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleSyncTrackerPlus(payment.id)
                                }
                                disabled={syncing}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`}
                                />
                                {t("sync")}
                              </Button>
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
                {t("pagination.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {tc("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Bank Slip Dialog */}
      <Dialog open={viewSlipDialogOpen} onOpenChange={setViewSlipDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("bankSlipPreview")}</DialogTitle>
            <DialogDescription>
              {t("reviewBankSlipBeforeApproval")}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment?.bankSlipUrl ? (
            <div className="space-y-4">
              <img
                src={selectedPayment.bankSlipUrl}
                alt={t("bankSlip")}
                className="w-full rounded-lg border"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>{t("amount")}</Label>
                  <p className="font-semibold">
                    {selectedPayment.currency}{" "}
                    {selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>{t("referenceType")}</Label>
                  <p>{selectedPayment.referenceType || "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">{t("noBankSlipUploaded")}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewSlipDialogOpen(false)}
            >
              {tc("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approvePayment")}</DialogTitle>
            <DialogDescription>
              {t("confirmApprovalBankSlip")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t("willMarkAsCompleted")}</span>
            </div>
            {selectedPayment && (
              <div className="text-sm space-y-2">
                <p>
                  <strong>{t("amount")}:</strong> {selectedPayment.currency}{" "}
                  {selectedPayment.amount.toFixed(2)}
                </p>
                <p>
                  <strong>{t("user")}:</strong>{" "}
                  {selectedPayment.user
                    ? `${selectedPayment.user.firstName} ${selectedPayment.user.lastName}`
                    : t("unknown")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("approvePayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectPayment")}</DialogTitle>
            <DialogDescription>
              {t("provideReasonForRejection")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{t("willMarkAsFailed")}</span>
            </div>
            <div>
              <Label>{t("rejectionReason")} *</Label>
              <Textarea
                placeholder={t("explainRejection")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t("rejectPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
