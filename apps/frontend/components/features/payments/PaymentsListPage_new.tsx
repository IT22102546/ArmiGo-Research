"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle,
  DollarSign,
  Eye,
  Filter,
  Gamepad2,
  Package,
  RefreshCw,
  Search,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "BANK_SLIP"
  | "DIGITAL_WALLET"
  | "ONLINE_PAYMENT";

type ReferenceType =
  | "DEVICE_PURCHASE"
  | "GAME_LICENSE"
  | "WARRANTY_EXTENSION"
  | "ACCESSORY_PURCHASE"
  | "SUBSCRIPTION";

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  gatewayTransactionId: string | null;
  bankSlipUrl: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  deviceModel?: string;
  quantity?: number;
}

// Dummy payment data for gaming device sales
const initialPayments: Payment[] = [
  {
    id: "PAY-2024-001",
    userId: "user-1",
    amount: 200,
    currency: "LKR",
    status: "COMPLETED",
    method: "CREDIT_CARD",
    referenceType: "DEVICE_PURCHASE",
    referenceId: "DEV-001",
    gatewayTransactionId: "TXN-CC-789456123",
    bankSlipUrl: null,
    createdAt: "2024-11-20T10:30:00Z",
    user: {
      firstName: "Kamal",
      lastName: "Silva",
      email: "kamal.silva@email.com",
      phone: "+94 77 123 4567",
    },
    deviceModel: "ArmiGo 4 in 1",
    quantity: 1,
  },
  {
    id: "PAY-2024-002",
    userId: "user-2",
    amount: 599.98,
    currency: "LKR",
    status: "COMPLETED",
    method: "ONLINE_PAYMENT",
    referenceType: "DEVICE_PURCHASE",
    referenceId: "DEV-002",
    gatewayTransactionId: "TXN-OP-456789321",
    bankSlipUrl: null,
    createdAt: "2024-11-21T14:15:00Z",
    user: {
      firstName: "Nimal",
      lastName: "Fernando",
      email: "nimal.f@email.com",
      phone: "+94 76 987 6543",
    },
    deviceModel: "ArmiGo 4 in 1 Pro",
    quantity: 2,
  },
  {
    id: "PAY-2024-003",
    userId: "user-3",
    amount: 00,
    currency: "LKR",
    status: "PENDING",
    method: "BANK_SLIP",
    referenceType: "GAME_LICENSE",
    referenceId: "GAME-001",
    gatewayTransactionId: null,
    bankSlipUrl: "https://picsum.photos/800/600?random=1",
    createdAt: "2024-11-22T09:45:00Z",
    user: {
      firstName: "Saman",
      lastName: "Perera",
      email: "saman.p@email.com",
      phone: "+94 71 234 5678",
    },
    deviceModel: null,
    quantity: 1,
  },
  {
    id: "PAY-2024-004",
    userId: "user-4",
    amount: 00,
    currency: "LKR",
    status: "COMPLETED",
    method: "DEBIT_CARD",
    referenceType: "WARRANTY_EXTENSION",
    referenceId: "WAR-001",
    gatewayTransactionId: "TXN-DC-147258369",
    bankSlipUrl: null,
    createdAt: "2024-11-23T11:20:00Z",
    user: {
      firstName: "Amila",
      lastName: "Rathnayake",
      email: "amila.r@email.com",
      phone: "+94 75 345 6789",
    },
    deviceModel: "ArmiGo 4 in 1",
    quantity: 1,
  },
  {
    id: "PAY-2024-005",
    userId: "user-5",
    amount: 100,
    currency: "LKR",
    status: "PROCESSING",
    method: "BANK_TRANSFER",
    referenceType: "ACCESSORY_PURCHASE",
    referenceId: "ACC-001",
    gatewayTransactionId: "TXN-BT-963852741",
    bankSlipUrl: null,
    createdAt: "2024-11-24T16:30:00Z",
    user: {
      firstName: "Ruwan",
      lastName: "Jayawardena",
      email: "ruwan.j@email.com",
      phone: "+94 72 456 7890",
    },
    deviceModel: null,
    quantity: 3,
  },
  {
    id: "PAY-2024-006",
    userId: "user-6",
    amount: 200,
    currency: "LKR",
    status: "PENDING",
    method: "BANK_SLIP",
    referenceType: "DEVICE_PURCHASE",
    referenceId: "DEV-006",
    gatewayTransactionId: null,
    bankSlipUrl: "https://picsum.photos/800/600?random=2",
    createdAt: "2024-11-25T08:00:00Z",
    user: {
      firstName: "Dilini",
      lastName: "Wijesekara",
      email: "dilini.w@email.com",
      phone: "+94 77 567 8901",
    },
    deviceModel: "ArmiGo 4 in 1",
    quantity: 1,
  },
  {
    id: "PAY-2024-007",
    userId: "user-7",
    amount: 00,
    currency: "LKR",
    status: "COMPLETED",
    method: "DIGITAL_WALLET",
    referenceType: "SUBSCRIPTION",
    referenceId: "SUB-001",
    gatewayTransactionId: "TXN-DW-852963741",
    bankSlipUrl: null,
    createdAt: "2024-11-26T12:45:00Z",
    user: {
      firstName: "Chamara",
      lastName: "Dissanayake",
      email: "chamara.d@email.com",
      phone: "+94 76 678 9012",
    },
    deviceModel: null,
    quantity: 1,
  },
  {
    id: "PAY-2024-008",
    userId: "user-8",
    amount: 200,
    currency: "LKR",
    status: "FAILED",
    method: "CREDIT_CARD",
    referenceType: "DEVICE_PURCHASE",
    referenceId: "DEV-008",
    gatewayTransactionId: "TXN-CC-741852963",
    bankSlipUrl: null,
    createdAt: "2024-11-25T15:30:00Z",
    user: {
      firstName: "Tharaka",
      lastName: "Gunasekara",
      email: "tharaka.g@email.com",
      phone: "+94 71 789 0123",
    },
    deviceModel: "ArmiGo 4 in 1",
    quantity: 1,
  },
  {
    id: "PAY-2024-009",
    userId: "user-9",
    amount: 00,
    currency: "LKR",
    status: "COMPLETED",
    method: "ONLINE_PAYMENT",
    referenceType: "GAME_LICENSE",
    referenceId: "GAME-002",
    gatewayTransactionId: "TXN-OP-369258147",
    bankSlipUrl: null,
    createdAt: "2024-11-26T10:15:00Z",
    user: {
      firstName: "Madhavi",
      lastName: "Senanayake",
      email: "madhavi.s@email.com",
      phone: "+94 75 890 1234",
    },
    deviceModel: null,
    quantity: 2,
  },
  {
    id: "PAY-2024-010",
    userId: "user-10",
    amount: 400,
    currency: "LKR",
    status: "REFUNDED",
    method: "CREDIT_CARD",
    referenceType: "DEVICE_PURCHASE",
    referenceId: "DEV-010",
    gatewayTransactionId: "TXN-CC-159753486",
    bankSlipUrl: null,
    createdAt: "2024-11-20T13:00:00Z",
    user: {
      firstName: "Priyanka",
      lastName: "Wickramasinghe",
      email: "priyanka.w@email.com",
      phone: "+94 72 901 2345",
    },
    deviceModel: "ArmiGo 4 in 1 Pro",
    quantity: 1,
  },
];

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
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewSlipDialogOpen, setViewSlipDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    applyFilters();
  }, [
    payments,
    searchTerm,
    statusFilter,
    methodFilter,
    referenceTypeFilter,
    dateFrom,
    dateTo,
  ]);

  const refreshPayments = () => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      setPayments([...initialPayments]);
      setLoading(false);
    }, 500);
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
        const deviceModel = payment.deviceModel?.toLowerCase() || "";
        return (
          userName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deviceModel.includes(searchTerm.toLowerCase())
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

  const handleApprove = () => {
    if (!selectedPayment) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === selectedPayment.id
          ? { ...p, status: "COMPLETED" as PaymentStatus }
          : p
      )
    );

    setApproveDialogOpen(false);
    setSelectedPayment(null);
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setPayments((prev) =>
      prev.map((p) =>
        p.id === selectedPayment.id
          ? { ...p, status: "FAILED" as PaymentStatus }
          : p
      )
    );

    setRejectDialogOpen(false);
    setSelectedPayment(null);
    setRejectReason("");
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const config = {
      PENDING: {
        variant: "outline" as const,
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      PROCESSING: {
        variant: "outline" as const,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      COMPLETED: {
        variant: "outline" as const,
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      FAILED: { variant: "destructive" as const, className: "" },
      REFUNDED: {
        variant: "outline" as const,
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      CANCELLED: {
        variant: "outline" as const,
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      BANK_TRANSFER: "Bank Transfer",
      BANK_SLIP: "Bank Slip",
      DIGITAL_WALLET: "Digital Wallet",
      ONLINE_PAYMENT: "Online Payment",
    };
    return labels[method] || method;
  };

  const getReferenceTypeLabel = (refType: ReferenceType | null) => {
    if (!refType) return "-";
    const labels: Record<ReferenceType, string> = {
      DEVICE_PURCHASE: "Device Purchase",
      GAME_LICENSE: "Game License",
      WARRANTY_EXTENSION: "Warranty Extension",
      ACCESSORY_PURCHASE: "Accessory Purchase",
      SUBSCRIPTION: "Subscription",
    };
    return labels[refType] || refType;
  };

  const getReferenceIcon = (refType: ReferenceType | null) => {
    if (!refType) return null;
    const icons: Record<ReferenceType, React.ReactNode> = {
      DEVICE_PURCHASE: <Package className="h-4 w-4" />,
      GAME_LICENSE: <Gamepad2 className="h-4 w-4" />,
      WARRANTY_EXTENSION: <Shield className="h-4 w-4" />,
      ACCESSORY_PURCHASE: <CreditCard className="h-4 w-4" />,
      SUBSCRIPTION: <RefreshCw className="h-4 w-4" />,
    };
    return icons[refType];
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Calculate stats
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    completed: payments.filter((p) => p.status === "COMPLETED").length,
    totalRevenue: payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Payment Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage gaming device & accessory payments
          </p>
        </div>
        <Button onClick={refreshPayments} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Payments
                </p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, email, device..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Method */}
            <div>
              <Label>Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="BANK_SLIP">Bank Slip</SelectItem>
                  <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                  <SelectItem value="ONLINE_PAYMENT">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Type */}
            <div>
              <Label>Purchase Type</Label>
              <Select
                value={referenceTypeFilter}
                onValueChange={setReferenceTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEVICE_PURCHASE">
                    Device Purchase
                  </SelectItem>
                  <SelectItem value="GAME_LICENSE">Game License</SelectItem>
                  <SelectItem value="WARRANTY_EXTENSION">
                    Warranty Extension
                  </SelectItem>
                  <SelectItem value="ACCESSORY_PURCHASE">
                    Accessory Purchase
                  </SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setMethodFilter("all");
                  setReferenceTypeFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
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
            <Package className="h-5 w-5" />
            Payments ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredPayments.length)} of{" "}
            {filteredPayments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device/Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        No payments found matching your criteria
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {safeFormatDate(payment.createdAt, "PP")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {safeFormatDate(payment.createdAt, "p")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.user
                              ? `${payment.user.firstName} ${payment.user.lastName}`
                              : "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.user?.email}
                          </div>
                          {payment.user?.phone && (
                            <div className="text-xs text-muted-foreground">
                              {payment.user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.deviceModel ? (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">
                                {payment.deviceModel}
                              </div>
                              {payment.quantity && payment.quantity > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  Qty: {payment.quantity}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-lg">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getMethodLabel(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.referenceType && (
                          <div className="flex items-center gap-2">
                            {getReferenceIcon(payment.referenceType)}
                            <span className="text-sm">
                              {getReferenceTypeLabel(payment.referenceType)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setApproveDialogOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setRejectDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          {payment.status === "COMPLETED" && (
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              Verified
                            </Badge>
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
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
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
            <DialogTitle>Bank Slip Preview</DialogTitle>
            <DialogDescription>
              Review the uploaded bank slip before approval
            </DialogDescription>
          </DialogHeader>
          {selectedPayment?.bankSlipUrl ? (
            <div className="space-y-4">
              <img
                src={selectedPayment.bankSlipUrl}
                alt="Bank Slip"
                className="w-full rounded-lg border"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold text-lg">
                    {selectedPayment.currency}{" "}
                    {selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Purchase Type</Label>
                  <p>{getReferenceTypeLabel(selectedPayment.referenceType)}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p>
                    {selectedPayment.user
                      ? `${selectedPayment.user.firstName} ${selectedPayment.user.lastName}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <Label>Device Model</Label>
                  <p>{selectedPayment.deviceModel || "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No bank slip uploaded</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewSlipDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Confirm approval of this bank slip payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Payment will be marked as completed
              </span>
            </div>
            {selectedPayment && (
              <div className="text-sm space-y-2 bg-muted p-4 rounded-lg">
                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedPayment.user
                    ? `${selectedPayment.user.firstName} ${selectedPayment.user.lastName}`
                    : "Unknown"}
                </p>
                <p>
                  <strong>Amount:</strong> {selectedPayment.currency}{" "}
                  {selectedPayment.amount.toFixed(2)}
                </p>
                <p>
                  <strong>Device:</strong> {selectedPayment.deviceModel || "-"}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {getReferenceTypeLabel(selectedPayment.referenceType)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                Payment will be marked as failed
              </span>
            </div>
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this payment is being rejected..."
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
