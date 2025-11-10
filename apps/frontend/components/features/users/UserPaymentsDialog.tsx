"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserPaymentsDialogProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  referenceType: string;
  referenceId?: string;
  bankSlipUrl?: string;
  createdAt: string;
  processedAt?: string;
}

const UserPaymentsDialog: React.FC<UserPaymentsDialogProps> = ({
  open,
  userId,
  userName,
  onClose,
}) => {
  const t = useTranslations("users");
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
  });

  useEffect(() => {
    if (open && userId) {
      fetchPayments();
    }
  }, [open, userId]);

  const fetchPayments = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = (await ApiClient.get(
        `/users/${userId}/payments`
      )) as any;
      setPayments(response.payments || []);
      setStats(
        response.stats || { total: 0, completed: 0, pending: 0, failed: 0 }
      );
    } catch (error) {
      handleApiError(error, "UserPaymentsDialog", "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      PROCESSING: { color: "bg-blue-100 text-blue-800", icon: Clock },
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      FAILED: { color: "bg-red-100 text-red-800", icon: XCircle },
      CANCELLED: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };

    const { color, icon: Icon } = config[status] || config.PENDING;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      WALLET_CREDITS: "bg-purple-100 text-purple-800",
      BANK_SLIP: "bg-blue-100 text-blue-800",
      ONLINE: "bg-green-100 text-green-800",
      CASH: "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={colors[method] || "bg-gray-100 text-gray-800"}>
        {method.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("modals.payments.title", { name: userName })}
          </DialogTitle>
          <DialogDescription>
            {t("modals.payments.description")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.payments.totalPayments")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.payments.completedPayments")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.payments.pendingPayments")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.payments.failed")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.failed}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("modals.payments.paymentTransactions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("modals.payments.date")}</TableHead>
                        <TableHead>
                          {t("modals.payments.paymentDescription")}
                        </TableHead>
                        <TableHead>{t("modals.payments.method")}</TableHead>
                        <TableHead>{t("modals.payments.reference")}</TableHead>
                        <TableHead>{t("modals.payments.status")}</TableHead>
                        <TableHead className="text-right">
                          {t("modals.payments.amount")}
                        </TableHead>
                        <TableHead>{t("modals.payments.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(payment.createdAt), "PP")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.createdAt), "p")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {payment.description}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {payment.referenceType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getMethodBadge(payment.method)}
                          </TableCell>
                          <TableCell>
                            {payment.referenceId ? (
                              <span className="text-sm font-mono text-muted-foreground">
                                {payment.referenceId}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">
                              {payment.currency}{" "}
                              {payment.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payment.bankSlipUrl && (
                              <a
                                href={payment.bankSlipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">
                                  {t("modals.payments.viewSlip")}
                                </span>
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t("modals.payments.noPaymentsFound")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserPaymentsDialog;
