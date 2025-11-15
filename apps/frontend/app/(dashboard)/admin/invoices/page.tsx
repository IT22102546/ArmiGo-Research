"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { format } from "date-fns";
import {
  invoiceApi,
  InvoiceType,
  InvoiceStatus,
  type Invoice,
  type InvoiceItem,
  type InvoiceFilterDto,
  type InvoiceStatistics,
} from "@/lib/api/invoice";
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Eye,
  Edit,
  Calendar,
} from "lucide-react";

export default function InvoiceGenerationPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InvoiceFilterDto>({
    status: undefined,
    type: undefined,
    page: 1,
    limit: 20,
  });
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Generate form states
  const [generateType, setGenerateType] = useState<
    "monthly" | "enrollment" | "custom"
  >("monthly");
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [enrollmentId, setEnrollmentId] = useState("");
  const [customItems, setCustomItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [customType, setCustomType] = useState<InvoiceType>(InvoiceType.OTHER);
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  // Queries
  const { data: statisticsData } = useQuery({
    queryKey: ["invoice-statistics"],
    queryFn: async () => {
      const response = await invoiceApi.getStatistics();
      return (
        response || {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          cancelled: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
        }
      );
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      const response = await invoiceApi.getInvoiceList(filters);
      return (
        response || {
          data: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        }
      );
    },
  });

  // Mutations
  const generateMonthlyMutation = useMutation({
    mutationFn: invoiceApi.generateMonthlyInvoice,
    onSuccess: () => {
      toast.success("Monthly invoice generated successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
      setGenerateDialogOpen(false);
      resetGenerateForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to generate monthly invoice"
      );
    },
  });

  const generateEnrollmentMutation = useMutation({
    mutationFn: invoiceApi.generateEnrollmentInvoice,
    onSuccess: () => {
      toast.success("Enrollment invoice generated successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
      setGenerateDialogOpen(false);
      resetGenerateForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to generate enrollment invoice"
      );
    },
  });

  const createCustomMutation = useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: () => {
      toast.success("Custom invoice created successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
      setGenerateDialogOpen(false);
      resetGenerateForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create invoice");
    },
  });

  const sendMutation = useMutation({
    mutationFn: invoiceApi.sendInvoice,
    onSuccess: () => {
      toast.success("Invoice sent successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to send invoice");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId?: string }) =>
      invoiceApi.markAsPaid(id, paymentId),
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to mark invoice as paid"
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoiceApi.cancelInvoice(id, reason),
    onSuccess: () => {
      toast.success("Invoice cancelled");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel invoice");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-statistics"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete invoice");
    },
  });

  const resetGenerateForm = () => {
    setStudentId("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setEnrollmentId("");
    setCustomItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
    setCustomType(InvoiceType.OTHER);
    setDueDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
  };

  const handleGenerate = () => {
    if (generateType === "monthly") {
      if (!studentId) {
        toast.error("Please enter student ID");
        return;
      }
      generateMonthlyMutation.mutate({ studentId, month, year });
    } else if (generateType === "enrollment") {
      if (!enrollmentId) {
        toast.error("Please enter enrollment ID");
        return;
      }
      generateEnrollmentMutation.mutate({ enrollmentId });
    } else {
      if (!studentId) {
        toast.error("Please enter student ID");
        return;
      }
      if (customItems.some((item) => !item.description || item.amount <= 0)) {
        toast.error("Please fill in all invoice items");
        return;
      }
      createCustomMutation.mutate({
        studentId,
        type: customType,
        items: customItems,
        dueDate,
        notes: notes || undefined,
      });
    }
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
    value: any
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
      case InvoiceStatus.PAID:
        return <CheckCircle className="h-4 w-4" />;
      case InvoiceStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      case InvoiceStatus.OVERDUE:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return "bg-green-100 text-green-800 border-green-200";
      case InvoiceStatus.CANCELLED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case InvoiceStatus.OVERDUE:
        return "bg-red-100 text-red-800 border-red-200";
      case InvoiceStatus.SENT:
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
    if (confirm("Send this invoice to the student?")) {
      sendMutation.mutate(id);
    }
  };

  const handleMarkPaid = (id: string) => {
    const paymentId = prompt("Enter payment ID (optional):");
    if (paymentId !== null) {
      markPaidMutation.mutate({ id, paymentId: paymentId || undefined });
    }
  };

  const handleCancel = (id: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason !== null) {
      cancelMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-red-600">
            Error loading invoices. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const statistics = {
    totalInvoices: statisticsData?.totalInvoices || 0,
    totalAmount: statisticsData?.totalAmount || 0,
    paidAmount: statisticsData?.paidAmount || 0,
    pendingAmount: statisticsData?.pendingAmount || 0,
    overdueAmount: statisticsData?.overdueAmount || 0,
    statusBreakdown:
      statisticsData?.statusBreakdown || ({} as Record<string, number>),
    typeBreakdown:
      statisticsData?.typeBreakdown || ({} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Generate and manage student invoices
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
              {statistics.statusBreakdown?.[InvoiceStatus.PAID] || 0}
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
              {(statistics.statusBreakdown?.[InvoiceStatus.PENDING] || 0) +
                (statistics.statusBreakdown?.[InvoiceStatus.SENT] || 0)}
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
              {statistics.statusBreakdown?.[InvoiceStatus.OVERDUE] || 0}
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
                  <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={InvoiceStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                  <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                  <SelectItem value={InvoiceStatus.CANCELLED}>
                    Cancelled
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
                  <SelectItem value={InvoiceType.MONTHLY_FEE}>
                    Monthly Fee
                  </SelectItem>
                  <SelectItem value={InvoiceType.ENROLLMENT_FEE}>
                    Enrollment Fee
                  </SelectItem>
                  <SelectItem value={InvoiceType.EXAM_FEE}>Exam Fee</SelectItem>
                  <SelectItem value={InvoiceType.MATERIAL_FEE}>
                    Material Fee
                  </SelectItem>
                  <SelectItem value={InvoiceType.OTHER}>Other</SelectItem>
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
            {data?.pagination?.total || 0} total invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {invoice.student?.firstName} {invoice.student?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.student?.email}
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
                      {invoice.status !== InvoiceStatus.PAID &&
                        invoice.status !== InvoiceStatus.CANCELLED && (
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
                      {invoice.status !== InvoiceStatus.PAID && (
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
              {data?.data.length === 0 && (
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

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(data.pagination.page - 1) * data.pagination.limit + 1}{" "}
                to{" "}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} invoices
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! - 1 })
                  }
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! + 1 })
                  }
                  disabled={filters.page === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Invoice Type</Label>
              <Select
                value={generateType}
                onValueChange={(value: any) => setGenerateType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Fee</SelectItem>
                  <SelectItem value="enrollment">Enrollment Fee</SelectItem>
                  <SelectItem value="custom">Custom Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {generateType === "monthly" && (
              <>
                <div>
                  <Label>Student ID</Label>
                  <Input
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month</Label>
                    <Select
                      value={month.toString()}
                      onValueChange={(value) => setMonth(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {format(new Date(2024, i), "MMMM")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            {generateType === "enrollment" && (
              <div>
                <Label>Enrollment ID</Label>
                <Input
                  placeholder="Enter enrollment ID"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                />
              </div>
            )}

            {generateType === "custom" && (
              <>
                <div>
                  <Label>Student ID</Label>
                  <Input
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={customType}
                    onValueChange={(value: any) => setCustomType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={InvoiceType.EXAM_FEE}>
                        Exam Fee
                      </SelectItem>
                      <SelectItem value={InvoiceType.MATERIAL_FEE}>
                        Material Fee
                      </SelectItem>
                      <SelectItem value={InvoiceType.OTHER}>Other</SelectItem>
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
                            updateCustomItem(
                              index,
                              "description",
                              e.target.value
                            )
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
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                generateMonthlyMutation.isPending ||
                generateEnrollmentMutation.isPending ||
                createCustomMutation.isPending
              }
            >
              Generate Invoice
            </Button>
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
                  <Label className="text-muted-foreground">Student</Label>
                  <div className="font-medium">
                    {selectedInvoice.student?.firstName}{" "}
                    {selectedInvoice.student?.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedInvoice.student?.email}
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
                  <Label className="text-muted-foreground">Issued Date</Label>
                  <div>
                    {format(
                      new Date(selectedInvoice.issuedDate),
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
                    {(selectedInvoice.items as InvoiceItem[]).map(
                      (item, index) => (
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
                      )
                    )}
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
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-LKR {selectedInvoice.discount.toLocaleString()}</span>
                </div>
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
