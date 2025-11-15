// apps/frontend/lib/api/endpoints/invoice.ts
import { ApiClient } from "../api-client";

export type InvoiceType = "MONTHLY" | "ENROLLMENT" | "EXAM" | "OTHER";
export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  type: InvoiceType;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: InvoiceItem[];
  notes?: string;
  paymentId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InvoiceQuery {
  studentId?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface InvoiceStatistics {
  total: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: {
    status: InvoiceStatus;
    count: number;
    amount: number;
  }[];
  byType: {
    type: InvoiceType;
    count: number;
    amount: number;
  }[];
}

export interface CreateInvoiceData {
  studentId: string;
  type: InvoiceType;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface GenerateMonthlyInvoiceData {
  month: number;
  year: number;
  classIds?: string[];
}

export interface GenerateEnrollmentInvoiceData {
  enrollmentId: string;
}

export interface UpdateInvoiceData {
  dueDate?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export const invoiceApi = {
  // Get list of invoices
  getAll: (query?: InvoiceQuery) =>
    ApiClient.get<{ data: Invoice[]; total: number }>("/invoices", {
      params: query,
    }),

  // Get invoice statistics
  getStatistics: (filters?: {
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    ApiClient.get<InvoiceStatistics>("/invoices/statistics", {
      params: filters,
    }),

  // Get invoice by ID
  getById: (id: string) => ApiClient.get<Invoice>(`/invoices/${id}`),

  // Create new invoice
  create: (data: CreateInvoiceData) =>
    ApiClient.post<Invoice>("/invoices", data),

  // Generate monthly invoices
  generateMonthly: (data: GenerateMonthlyInvoiceData) =>
    ApiClient.post<{ generated: number; invoices: Invoice[] }>(
      "/invoices/generate/monthly",
      data
    ),

  // Generate enrollment invoice
  generateEnrollment: (data: GenerateEnrollmentInvoiceData) =>
    ApiClient.post<Invoice>("/invoices/generate/enrollment", data),

  // Update invoice
  update: (id: string, data: UpdateInvoiceData) =>
    ApiClient.patch<Invoice>(`/invoices/${id}`, data),

  // Mark invoice as paid
  markAsPaid: (id: string, paymentId?: string) =>
    ApiClient.patch<Invoice>(`/invoices/${id}/mark-paid`, { paymentId }),

  // Cancel invoice
  cancel: (id: string, reason?: string) =>
    ApiClient.patch<Invoice>(`/invoices/${id}/cancel`, { reason }),

  // Send invoice (email notification)
  send: (id: string) =>
    ApiClient.post<{ sent: boolean }>(`/invoices/${id}/send`),

  // Delete invoice
  delete: (id: string) => ApiClient.delete<void>(`/invoices/${id}`),
};
