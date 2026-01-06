"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Product Purchase Invoice Types
type InvoiceStatus = "PENDING" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
type InvoiceType =
  | "DEVICE_PURCHASE"
  | "GAME_LICENSE"
  | "ACCESSORY_PURCHASE"
  | "WARRANTY_EXTENSION"
  | "SUBSCRIPTION"
  | "BUNDLE_PACKAGE";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: InvoiceType;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  notes?: string;
}

// Dummy data - Gaming device purchase invoices
const initialInvoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "DEV-2024-001",
    customerId: "CUST-001",
    customerName: "Nimal Perera",
    customerEmail: "nimal.p@email.com",
    type: "DEVICE_PURCHASE",
    status: "PAID",
    items: [
      {
        description: "ArmiGo Gaming Device - Standard Edition",
        quantity: 1,
        unitPrice: 45000,
        amount: 45000,
      },
      { description: "HDMI Cable", quantity: 1, unitPrice: 1500, amount: 1500 },
    ],
    subtotal: 46500,
    tax: 0,
    total: 46500,
    issueDate: "2024-11-20T10:00:00Z",
    dueDate: "2024-12-05T10:00:00Z",
    paidDate: "2024-11-22T14:30:00Z",
    notes: "Free shipping applied",
  },
  {
    id: "INV-002",
    invoiceNumber: "DEV-2024-002",
    customerId: "CUST-002",
    customerName: "Kamala Silva",
    customerEmail: "kamala.s@email.com",
    type: "GAME_LICENSE",
    status: "PENDING",
    items: [
      {
        description: "Brain Training Game Pack - Annual License",
        quantity: 1,
        unitPrice: 4500,
        amount: 4500,
      },
      {
        description: "Memory Challenge Game - Lifetime License",
        quantity: 1,
        unitPrice: 2000,
        amount: 2000,
      },
      {
        description: "Cognitive Skills Bundle",
        quantity: 1,
        unitPrice: 3500,
        amount: 3500,
      },
    ],
    subtotal: 10000,
    tax: 0,
    total: 10000,
    issueDate: "2024-11-25T09:15:00Z",
    dueDate: "2024-12-10T09:15:00Z",
  },
  {
    id: "INV-003",
    invoiceNumber: "DEV-2024-003",
    customerId: "CUST-003",
    customerName: "Sunil Fernando",
    customerEmail: "sunil.f@email.com",
    type: "BUNDLE_PACKAGE",
    status: "SENT",
    items: [
      {
        description: "ArmiGo Device - Premium Edition",
        quantity: 1,
        unitPrice: 65000,
        amount: 65000,
      },
      {
        description: "Premium Game Pack (10 Games)",
        quantity: 1,
        unitPrice: 15000,
        amount: 15000,
      },
      {
        description: "Extended Warranty (3 Years)",
        quantity: 1,
        unitPrice: 8000,
        amount: 8000,
      },
      {
        description: "Premium Controller",
        quantity: 2,
        unitPrice: 4500,
        amount: 9000,
      },
    ],
    subtotal: 97000,
    tax: 0,
    total: 97000,
    issueDate: "2024-11-23T15:00:00Z",
    dueDate: "2024-12-15T15:00:00Z",
    notes: "Bundle discount applied",
  },
  {
    id: "INV-004",
    invoiceNumber: "DEV-2024-004",
    customerId: "CUST-004",
    customerName: "Amara Rathnayake",
    customerEmail: "amara.r@email.com",
    type: "ACCESSORY_PURCHASE",
    status: "PAID",
    items: [
      {
        description: "Wireless Controller - Pro Edition",
        quantity: 2,
        unitPrice: 5500,
        amount: 11000,
      },
      {
        description: "Protective Case",
        quantity: 1,
        unitPrice: 2500,
        amount: 2500,
      },
    ],
    subtotal: 13500,
    tax: 0,
    total: 13500,
    issueDate: "2024-11-21T11:30:00Z",
    dueDate: "2024-12-06T11:30:00Z",
    paidDate: "2024-11-24T16:45:00Z",
  },
  {
    id: "INV-005",
    invoiceNumber: "DEV-2024-005",
    customerId: "CUST-005",
    customerName: "Priyanka Jayawardena",
    customerEmail: "priyanka.j@email.com",
    type: "SUBSCRIPTION",
    status: "OVERDUE",
    items: [
      {
        description: "ArmiGo Cloud Gaming - Monthly Subscription",
        quantity: 1,
        unitPrice: 1500,
        amount: 1500,
      },
      {
        description: "Premium Features Add-on",
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
      {
        description: "Extra Storage Add-on",
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
    ],
    subtotal: 2500,
    tax: 0,
    total: 2500,
    issueDate: "2024-11-10T14:00:00Z",
    dueDate: "2024-11-25T14:00:00Z",
    notes: "Auto-renewal enabled",
  },
  {
    id: "INV-006",
    invoiceNumber: "DEV-2024-006",
    customerId: "CUST-006",
    customerName: "Rohan Wickramasinghe",
    customerEmail: "rohan.w@email.com",
    type: "WARRANTY_EXTENSION",
    status: "PENDING",
    items: [
      {
        description: "Extended Warranty - 2 Years",
        quantity: 1,
        unitPrice: 12000,
        amount: 12000,
      },
      {
        description: "Accidental Damage Coverage",
        quantity: 1,
        unitPrice: 5000,
        amount: 5000,
      },
      {
        description: "Priority Support",
        quantity: 1,
        unitPrice: 3000,
        amount: 3000,
      },
    ],
    subtotal: 20000,
    tax: 0,
    total: 20000,
    issueDate: "2024-11-26T08:00:00Z",
    dueDate: "2024-12-11T08:00:00Z",
  },
  {
    id: "INV-007",
    invoiceNumber: "DEV-2024-007",
    customerId: "CUST-007",
    customerName: "Sanduni Dissanayake",
    customerEmail: "sanduni.d@email.com",
    type: "DEVICE_PURCHASE",
    status: "PAID",
    items: [
      {
        description: "ArmiGo Gaming Device - Standard Edition",
        quantity: 1,
        unitPrice: 45000,
        amount: 45000,
      },
      {
        description: "Starter Game Pack (5 Games)",
        quantity: 1,
        unitPrice: 8000,
        amount: 8000,
      },
    ],
    subtotal: 53000,
    tax: 0,
    total: 53000,
    issueDate: "2024-11-22T13:30:00Z",
    dueDate: "2024-12-07T13:30:00Z",
    paidDate: "2024-11-23T10:00:00Z",
  },
  {
    id: "INV-008",
    invoiceNumber: "DEV-2024-008",
    customerId: "CUST-008",
    customerName: "Chaminda Senanayake",
    customerEmail: "chaminda.s@email.com",
    type: "ACCESSORY_PURCHASE",
    status: "CANCELLED",
    items: [
      {
        description: "Screen Protector",
        quantity: 1,
        unitPrice: 800,
        amount: 800,
      },
    ],
    subtotal: 800,
    tax: 0,
    total: 800,
    issueDate: "2024-11-24T10:00:00Z",
    dueDate: "2024-12-09T10:00:00Z",
    notes: "Customer cancelled order",
  },
];

import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";

export default function InvoiceGenerationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [filters, setFilters] = useState<{
    status?: InvoiceStatus;
    type?: InvoiceType;
    page: number;
    limit: number;
  }>({
    status: undefined,
    type: undefined,
    page: 1,
    limit: 20,
  });
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Generate form states
  const [customItems, setCustomItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [customType, setCustomType] = useState<InvoiceType>("DEVICE_PURCHASE");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    if (filters.status && invoice.status !== filters.status) return false;
    if (filters.type && invoice.type !== filters.type) return false;
    return true;
  });

  // Calculate statistics
  const statistics = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoices
      .filter((inv) => inv.status === "PENDING" || inv.status === "SENT")
      .reduce((sum, inv) => sum + inv.total, 0),
    overdueAmount: invoices
      .filter((inv) => inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.total, 0),
    statusBreakdown: {
      PAID: invoices.filter((inv) => inv.status === "PAID").length,
      PENDING: invoices.filter((inv) => inv.status === "PENDING").length,
      SENT: invoices.filter((inv) => inv.status === "SENT").length,
      OVERDUE: invoices.filter((inv) => inv.status === "OVERDUE").length,
      CANCELLED: invoices.filter((inv) => inv.status === "CANCELLED").length,
    },
  };

  const resetGenerateForm = () => {
    setCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
    setCustomType("DEVICE_PURCHASE");
    setDueDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
  };

  const handleGenerate = () => {
    if (!customerId || !customerName || !customerEmail) {
      alert("Please fill in customer details");
      return;
    }
    if (customItems.some((item) => !item.description || item.amount <= 0)) {
      alert("Please fill in all invoice items");
      return;
    }

    const newInvoice: Invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      invoiceNumber: `DEV-2024-${String(invoices.length + 1).padStart(3, "0")}`,
      customerId,
      customerName,
      customerEmail,
      type: customType,
      status: "PENDING",
      items: customItems,
      subtotal: customItems.reduce((sum, item) => sum + item.amount, 0),
      tax: 0,
      total: customItems.reduce((sum, item) => sum + item.amount, 0),
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
    };

    setInvoices([...invoices, newInvoice]);
    setGenerateDialogOpen(false);
    resetGenerateForm();
  };

  const addCustomItem = () => {
    setCustomItems([
      ...customItems,
      { description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const updateCustomItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...customItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setCustomItems(newItems);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "OVERDUE":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      case "SENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleSend = (id: string) => {
    if (confirm("Send this invoice to the customer?")) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === id ? { ...inv, status: "SENT" as InvoiceStatus } : inv
        )
      );
    }
  };

  const handleMarkPaid = (id: string) => {
    const paymentId = prompt("Enter payment ID (optional):");
    if (paymentId !== null) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                status: "PAID" as InvoiceStatus,
                paidDate: new Date().toISOString(),
              }
            : inv
        )
      );
    }
  };

  const handleCancel = (id: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason !== null) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                status: "CANCELLED" as InvoiceStatus,
                notes: reason || inv.notes,
              }
            : inv
        )
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Invoice Management</h1>
          <p className="text-muted-foreground">
            Generate and manage product purchase invoices
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              LKR {statistics.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.statusBreakdown?.["PAID"] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {(statistics.paidAmount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(statistics.statusBreakdown?.["PENDING"] || 0) +
                (statistics.statusBreakdown?.["SENT"] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {(statistics.pendingAmount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.statusBreakdown?.["OVERDUE"] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {(statistics.overdueAmount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status:
                      value === "all" ? undefined : (value as InvoiceStatus),
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    type: value === "all" ? undefined : (value as InvoiceType),
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEVICE_PURCHASE">
                    Device Purchase
                  </SelectItem>
                  <SelectItem value="GAME_LICENSE">Game License</SelectItem>
                  <SelectItem value="ACCESSORY_PURCHASE">
                    Accessory Purchase
                  </SelectItem>
                  <SelectItem value="WARRANTY_EXTENSION">
                    Warranty Extension
                  </SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="BUNDLE_PACKAGE">Bundle Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
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
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} total invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    LKR {invoice.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status !== "PAID" &&
                        invoice.status !== "CANCELLED" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSend(invoice.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkPaid(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancel(invoice.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      {invoice.status !== "PAID" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create a new product purchase invoice for a customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Customer ID</Label>
              <Input
                placeholder="Enter customer ID"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>

            <div>
              <Label>Customer Name</Label>
              <Input
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <Label>Customer Email</Label>
              <Input
                type="email"
                placeholder="Enter customer email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Invoice Type</Label>
              <Select
                value={customType}
                onValueChange={(value: InvoiceType) => setCustomType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVICE_PURCHASE">
                    Device Purchase
                  </SelectItem>
                  <SelectItem value="GAME_LICENSE">Game License</SelectItem>
                  <SelectItem value="ACCESSORY_PURCHASE">
                    Accessory Purchase
                  </SelectItem>
                  <SelectItem value="WARRANTY_EXTENSION">
                    Warranty Extension
                  </SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="BUNDLE_PACKAGE">Bundle Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Invoice Items</Label>
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-5"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateCustomItem(index, "description", e.target.value)
                      }
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCustomItem(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateCustomItem(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      readOnly
                    />
                    <Button
                      className="col-span-1"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomItem(index)}
                      disabled={customItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomItem}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <div className="mt-4 text-right">
                <div className="text-lg font-semibold">
                  Total: LKR{" "}
                  {customItems
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <div className="font-medium">
                    {selectedInvoice.customerName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedInvoice.customerEmail}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div>{selectedInvoice.type.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issued Date</Label>
                  <div>
                    {format(
                      new Date(selectedInvoice.issueDate),
                      "MMM dd, yyyy"
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <div>
                    {format(new Date(selectedInvoice.dueDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          LKR {item.unitPrice.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          LKR {item.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>LKR {selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>LKR {selectedInvoice.tax.toLocaleString()}</span>
                </div>
                {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>
                      -LKR {selectedInvoice.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>LKR {selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <div className="text-sm">{selectedInvoice.notes}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
