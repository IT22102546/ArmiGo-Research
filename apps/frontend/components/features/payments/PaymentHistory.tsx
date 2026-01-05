"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2,
  Download,
  Eye,
  RefreshCw,
  DollarSign,
  Filter,
  TrendingUp,
  Calendar as CalendarIcon,
  FileDown,
  CreditCard,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ApiClient } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  description?: string;
  gatewayTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentHistoryProps {
  userId?: string;
  limit?: number;
}

export function PaymentHistory({ userId, limit = 10 }: PaymentHistoryProps) {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    subDays(new Date(), 30)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Analytics calculations
  const analytics = useMemo(() => {
    const completed = payments.filter((p) => p.status === "COMPLETED");
    const totalSpent = completed.reduce((sum, p) => sum + p.amount, 0);
    const avgTransaction =
      completed.length > 0 ? totalSpent / completed.length : 0;
    const successRate =
      payments.length > 0 ? (completed.length / payments.length) * 100 : 0;
    const failedCount = payments.filter((p) => p.status === "FAILED").length;

    return {
      totalSpent,
      avgTransaction,
      successRate,
      completedCount: completed.length,
      failedCount,
      totalCount: payments.length,
    };
  }, [payments]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 1000 }; // Fetch all for client-side filtering

      if (userId) {
        params.userId = userId;
      }

      const response = (await ApiClient.get("/payments", { params })) as {
        data?: Payment[];
      };
      let fetchedPayments = response.data || [];

      // Apply client-side filters
      fetchedPayments = fetchedPayments.filter((payment) => {
        // Status filter
        if (statusFilter !== "all" && payment.status !== statusFilter)
          return false;

        // Method filter
        if (methodFilter !== "all" && payment.method !== methodFilter)
          return false;

        // Date range filter
        const paymentDate = new Date(payment.createdAt);
        if (dateFrom && paymentDate < dateFrom) return false;
        if (dateTo && paymentDate > dateTo) return false;

        // Amount range filter
        if (minAmount && payment.amount < parseFloat(minAmount)) return false;
        if (maxAmount && payment.amount > parseFloat(maxAmount)) return false;

        return true;
      });

      // Sort by date descending
      fetchedPayments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply limit
      setPayments(fetchedPayments.slice(0, limit));
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    userId,
    statusFilter,
    methodFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    limit,
  ]);

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: any; label: string }> = {
      PENDING: { variant: "secondary", label: t("statuses.pending") },
      PROCESSING: { variant: "default", label: t("statuses.processing") },
      COMPLETED: { variant: "default", label: t("statuses.completed") },
      FAILED: { variant: "destructive", label: t("statuses.failed") },
      REFUNDED: { variant: "outline", label: t("statuses.refunded") },
      CANCELLED: { variant: "outline", label: t("statuses.cancelled") },
    };

    const config = variants[status] || variants.PENDING;

    return (
      <Badge
        variant={config.variant}
        className={status === "COMPLETED" ? "bg-green-500" : ""}
      >
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Description",
      "Method",
      "Amount",
      "Currency",
      "Status",
      "Transaction ID",
    ];
    const rows = payments.map((p) => [
      format(new Date(p.createdAt), "yyyy-MM-dd HH:mm:ss"),
      p.description || "Payment",
      p.method,
      p.amount.toString(),
      p.currency,
      p.status,
      p.gatewayTransactionId || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `payment_history_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setMethodFilter("all");
    setDateFrom(subDays(new Date(), 30));
    setDateTo(new Date());
    setMinAmount("");
    setMaxAmount("");
  };

  return (
    <div className="space-y-4">
      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalSpent")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                analytics.totalSpent,
                payments[0]?.currency || "USD"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("completedTransactions", { count: analytics.completedCount })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("averageTransaction")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                analytics.avgTransaction,
                payments[0]?.currency || "USD"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("perCompletedPayment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("successRate")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t("paymentsRatio", {
                completed: analytics.completedCount,
                total: analytics.totalCount,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("failedPayments")}
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.failedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("requiresAttention")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Payment History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("paymentHistory")}</CardTitle>
              <CardDescription>
                {t("viewAndFilterTransactions")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? t("hideFilters") : t("showFilters")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={payments.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                {t("exportCSV")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchPayments}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>{tc("status")}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("filters.allStatus")}
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      {t("statuses.completed")}
                    </SelectItem>
                    <SelectItem value="PENDING">
                      {t("statuses.pending")}
                    </SelectItem>
                    <SelectItem value="PROCESSING">
                      {t("statuses.processing")}
                    </SelectItem>
                    <SelectItem value="FAILED">
                      {t("statuses.failed")}
                    </SelectItem>
                    <SelectItem value="REFUNDED">
                      {t("statuses.refunded")}
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      {t("statuses.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("paymentMethod")}</Label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("filters.allMethods")}
                    </SelectItem>
                    <SelectItem value="CARD">{t("methods.card")}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      {t("methods.bankTransfer")}
                    </SelectItem>
                    <SelectItem value="MOBILE_MONEY">
                      {t("methods.mobileMoney")}
                    </SelectItem>
                    <SelectItem value="CASH">{t("methods.cash")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("filters.dateFrom")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? (
                        format(dateFrom, "PPP")
                      ) : (
                        <span>{t("filters.pickDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t("filters.dateTo")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? (
                        format(dateTo, "PPP")
                      ) : (
                        <span>{t("filters.pickDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t("filters.minAmount")}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("filters.maxAmount")}</Label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              <div className="flex items-end col-span-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {t("filters.clearAll")}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {t("noPaymentsFound")}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{tc("description")}</TableHead>
                    <TableHead>{t("method")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{tc("status")}</TableHead>
                    <TableHead className="text-right">
                      {tc("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), "h:mm a")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate">
                            {payment.description || t("payment")}
                          </p>
                          {payment.gatewayTransactionId && (
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {payment.gatewayTransactionId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {payment.method.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.status === "COMPLETED" && (
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
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
    </div>
  );
}
