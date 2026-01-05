"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  DollarSign,
  User,
  Loader2,
  FileText,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  bankSlipUrl?: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function PaymentSlipApprovalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [suspiciousDialogOpen, setSuspiciousDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspiciousReason, setSuspiciousReason] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  // Query
  const { data: paymentsData, isLoading } = useQuery<{
    data: Payment[];
    meta: { total: number; pages: number };
  }>({
    queryKey: ["pending-payments", page, search],
    queryFn: () =>
      ApiClient.get("/payments/admin/all", {
        params: {
          status: "PENDING",
          method: "BANK_SLIP",
          page,
          limit: 20,
        },
      }),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (paymentId: string) =>
      ApiClient.patch(`/payments/admin/${paymentId}/approve-bank-slip`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment approved successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setApproveDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        status: "error",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason: string;
    }) =>
      ApiClient.patch(`/payments/admin/${paymentId}/reject-bank-slip`, {
        reason,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment rejected",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedPayment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject payment",
        status: "error",
      });
    },
  });

  const markSuspiciousMutation = useMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason: string;
    }) =>
      ApiClient.patch(`/payments/admin/${paymentId}/mark-suspicious`, {
        reason,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment marked as suspicious",
        status: "warning",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setSuspiciousDialogOpen(false);
      setSuspiciousReason("");
      setSelectedPayment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark payment as suspicious",
        status: "error",
      });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (paymentIds: string[]) =>
      ApiClient.post("/payments/admin/bulk-approve", { paymentIds }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedPayments.length} payments approved`,
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setSelectedPayments([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve payments",
        status: "error",
      });
    },
  });

  const payments = paymentsData?.data || [];
  const meta = paymentsData?.meta || { total: 0, pages: 1 };

  const handleApprove = () => {
    if (!selectedPayment) return;
    approveMutation.mutate(selectedPayment.id);
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Rejection reason is required",
        status: "error",
      });
      return;
    }
    rejectMutation.mutate({
      paymentId: selectedPayment.id,
      reason: rejectionReason,
    });
  };

  const handleMarkSuspicious = () => {
    if (!selectedPayment || !suspiciousReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Reason is required",
        status: "error",
      });
      return;
    }
    markSuspiciousMutation.mutate({
      paymentId: selectedPayment.id,
      reason: suspiciousReason,
    });
  };

  const handleBulkApprove = () => {
    if (selectedPayments.length === 0) return;
    bulkApproveMutation.mutate(selectedPayments);
  };

  const togglePaymentSelection = (paymentId: string) => {
    if (selectedPayments.includes(paymentId)) {
      setSelectedPayments(selectedPayments.filter((id) => id !== paymentId));
    } else {
      setSelectedPayments([...selectedPayments, paymentId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map((p: Payment) => p.id));
    }
  };

  const viewSlip = (payment: Payment) => {
    setSelectedPayment(payment);
    setImageViewerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Slip Approval</h1>
          <p className="text-muted-foreground">
            Review and approve bank slip uploads
          </p>
        </div>
        {selectedPayments.length > 0 && (
          <Button
            onClick={handleBulkApprove}
            disabled={bulkApproveMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Selected ({selectedPayments.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">{meta.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Selected</CardDescription>
            <CardTitle className="text-2xl">
              {selectedPayments.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-2xl">
              LKR{" "}
              {payments
                .reduce((sum: number, p: Payment) => sum + p.amount, 0)
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg. Amount</CardDescription>
            <CardTitle className="text-2xl">
              LKR{" "}
              {payments.length > 0
                ? (
                    payments.reduce(
                      (sum: number, p: Payment) => sum + p.amount,
                      0
                    ) / payments.length
                  ).toFixed(2)
                : "0.00"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            {selectedPayments.length > 0 && (
              <Button variant="outline" onClick={() => setSelectedPayments([])}>
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No pending payment slips to review
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                checked={
                  payments.length > 0 &&
                  selectedPayments.length === payments.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
            {payments.map((payment: Payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedPayments.includes(payment.id)}
                      onCheckedChange={() => togglePaymentSelection(payment.id)}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {payment.user.name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.user.email}
                          </p>
                          {payment.user.phone && (
                            <p className="text-sm text-muted-foreground">
                              {payment.user.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1 justify-end">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-2xl font-bold">
                              {payment.currency} {payment.amount.toFixed(2)}
                            </span>
                          </div>
                          <Badge variant="secondary">{payment.method}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(payment.createdAt), "PPp")}
                          </span>
                        </div>
                        {payment.description && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{payment.description}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewSlip(payment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Slip
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setSuspiciousDialogOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark Suspicious
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {meta.pages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page === meta.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bank Slip Preview</DialogTitle>
            <DialogDescription>
              {selectedPayment?.user.name} - {selectedPayment?.currency}{" "}
              {selectedPayment?.amount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom((z) => Math.max(50, z - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {imageZoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageViewerOpen(false);
                  setImageZoom(100);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="border rounded-lg overflow-auto max-h-[500px] bg-gray-50 flex items-center justify-center p-4">
              {selectedPayment?.bankSlipUrl ? (
                <div className="flex justify-center">
                  <img
                    src={selectedPayment.bankSlipUrl}
                    alt="Bank Slip"
                    className={`rounded ${imageZoom === 50 ? "w-1/2" : imageZoom === 75 ? "w-3/4" : imageZoom === 100 ? "w-full" : imageZoom === 125 ? "w-[125%]" : imageZoom === 150 ? "w-[150%]" : imageZoom === 175 ? "w-[175%]" : "w-[200%]"}`}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">No bank slip uploaded</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this payment of{" "}
              {selectedPayment?.currency} {selectedPayment?.amount.toFixed(2)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this payment is being rejected..."
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
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspicious Dialog */}
      <Dialog
        open={suspiciousDialogOpen}
        onOpenChange={setSuspiciousDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Suspicious</DialogTitle>
            <DialogDescription>
              Flag this payment for further investigation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Describe why this payment appears suspicious..."
                value={suspiciousReason}
                onChange={(e) => setSuspiciousReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspiciousDialogOpen(false);
                setSuspiciousReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkSuspicious}
              disabled={markSuspiciousMutation.isPending}
            >
              {markSuspiciousMutation.isPending
                ? "Marking..."
                : "Mark Suspicious"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
