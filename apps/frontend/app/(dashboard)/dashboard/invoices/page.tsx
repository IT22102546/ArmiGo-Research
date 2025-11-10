"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  invoiceApi,
  InvoiceStatus,
  type Invoice,
  type InvoiceItem,
  type InvoiceFilterDto,
  type InvoiceStatistics,
} from "@/lib/api/invoice";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Calendar,
} from "lucide-react";

export default function StudentInvoicesPage() {
  const [filters, setFilters] = useState<InvoiceFilterDto>({
    status: undefined,
    page: 1,
    limit: 20,
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Queries
  const { data: statisticsData } = useQuery({
    queryKey: ["student-invoice-statistics"],
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
    queryKey: ["student-invoices", filters],
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

  const handleDownloadPDF = (invoice: Invoice) => {
    // PDF download functionality would be implemented here
    alert("PDF download feature coming soon!");
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

  const statistics = statisticsData || {
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    statusBreakdown: {},
    typeBreakdown: {},
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <p className="text-muted-foreground">
          View and manage your payment invoices
        </p>
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
              {statistics.statusBreakdown[InvoiceStatus.PAID] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {statistics.paidAmount.toLocaleString()}
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
              {(statistics.statusBreakdown[InvoiceStatus.PENDING] || 0) +
                (statistics.statusBreakdown[InvoiceStatus.SENT] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {statistics.pendingAmount.toLocaleString()}
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
              {statistics.statusBreakdown[InvoiceStatus.OVERDUE] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              LKR {statistics.overdueAmount.toLocaleString()}
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
                  <SelectItem value={InvoiceStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                  <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ status: undefined, page: 1, limit: 20 })
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
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} total invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issued Date</TableHead>
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
                      {format(new Date(invoice.issuedDate), "MMM dd, yyyy")}
                    </div>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadPDF(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
                  <Label className="text-muted-foreground">Type</Label>
                  <div>
                    <Badge variant="outline">
                      {selectedInvoice.type.replace(/_/g, " ")}
                    </Badge>
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
                  <div
                    className={
                      selectedInvoice.status === InvoiceStatus.OVERDUE
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {format(new Date(selectedInvoice.dueDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>

              {selectedInvoice.paidAt && (
                <div>
                  <Label className="text-muted-foreground">Paid On</Label>
                  <div className="text-green-600 font-semibold">
                    {format(new Date(selectedInvoice.paidAt), "MMM dd, yyyy")}
                  </div>
                </div>
              )}

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
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>LKR {selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-green-600">
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
                  <div className="text-sm p-3 bg-muted rounded-md">
                    {selectedInvoice.notes}
                  </div>
                </div>
              )}

              {selectedInvoice.status !== InvoiceStatus.PAID &&
                selectedInvoice.status !== InvoiceStatus.CANCELLED && (
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="font-semibold mb-2">
                        Payment Instructions:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Make payment via your preferred method</li>
                        <li>
                          Use invoice number {selectedInvoice.invoiceNumber} as
                          reference
                        </li>
                        <li>Upload payment slip through the payments page</li>
                        <li>
                          Your invoice will be marked as paid once verified
                        </li>
                      </ol>
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedInvoice && (
              <Button onClick={() => handleDownloadPDF(selectedInvoice)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
