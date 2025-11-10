import { ApiClient } from "./api-client";

// Enums
export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
}

export enum InvoiceType {
  MONTHLY_FEE = "MONTHLY_FEE",
  ENROLLMENT_FEE = "ENROLLMENT_FEE",
  EXAM_FEE = "EXAM_FEE",
  MATERIAL_FEE = "MATERIAL_FEE",
  OTHER = "OTHER",
}

// Interfaces
export interface InvoiceItem {
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
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  paymentId?: string;
  sentAt?: string;
  notes?: string;
  metadata?: any;
  createdById: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    city?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MonthlyInvoiceDto {
  studentId: string;
  month: number;
  year: number;
  classIds?: string[];
}

export interface EnrollmentInvoiceDto {
  enrollmentId: string;
}

export interface CreateInvoiceDto {
  studentId: string;
  type: InvoiceType;
  items: InvoiceItem[];
  tax?: number;
  discount?: number;
  dueDate: string;
  notes?: string;
  metadata?: any;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus;
  items?: InvoiceItem[];
  tax?: number;
  discount?: number;
  dueDate?: string;
  notes?: string;
}

export interface InvoiceFilterDto {
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

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  statusBreakdown: {
    [key: string]: number;
  };
  typeBreakdown: {
    [key: string]: number;
  };
}

// API Methods
export const invoiceApi = {
  generateMonthlyInvoice: async (data: MonthlyInvoiceDto): Promise<Invoice> => {
    const response: any = await ApiClient.post(
      "/invoices/generate/monthly",
      data
    );
    return response.data;
  },

  generateEnrollmentInvoice: async (
    data: EnrollmentInvoiceDto
  ): Promise<Invoice> => {
    const response: any = await ApiClient.post(
      "/invoices/generate/enrollment",
      data
    );
    return response.data;
  },

  createInvoice: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response: any = await ApiClient.post("/invoices", data);
    return response.data;
  },

  getInvoiceList: async (
    filters: InvoiceFilterDto = {}
  ): Promise<InvoiceListResponse> => {
    const params = new URLSearchParams();

    if (filters.studentId) params.append("studentId", filters.studentId);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.minAmount !== undefined)
      params.append("minAmount", filters.minAmount.toString());
    if (filters.maxAmount !== undefined)
      params.append("maxAmount", filters.maxAmount.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response: any = await ApiClient.get(`/invoices?${params.toString()}`);
    return response.data;
  },

  getStatistics: async (filters?: {
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }): Promise<InvoiceStatistics> => {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.studentId) params.append("studentId", filters.studentId);

    const response: any = await ApiClient.get(
      `/invoices/statistics?${params.toString()}`
    );
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response: any = await ApiClient.get(`/invoices/${id}`);
    return response.data;
  },

  updateInvoice: async (
    id: string,
    data: UpdateInvoiceDto
  ): Promise<Invoice> => {
    const response: any = await ApiClient.patch(`/invoices/${id}`, data);
    return response.data;
  },

  markAsPaid: async (id: string, paymentId?: string): Promise<Invoice> => {
    const response: any = await ApiClient.patch(`/invoices/${id}/mark-paid`, {
      paymentId,
    });
    return response.data;
  },

  cancelInvoice: async (id: string, reason?: string): Promise<Invoice> => {
    const response: any = await ApiClient.patch(`/invoices/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  sendInvoice: async (id: string): Promise<{ message: string }> => {
    const response: any = await ApiClient.post(`/invoices/${id}/send`, {});
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<Invoice> => {
    const response: any = await ApiClient.delete(`/invoices/${id}`);
    return response.data;
  },
};
