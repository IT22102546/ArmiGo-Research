// apps/frontend/lib/api/endpoints/payments.ts
import { ApiClient } from "../api-client";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "BANK_SLIP"
  | "DIGITAL_WALLET"
  | "TRACKER_PLUS"
  | "WALLET_CREDITS";

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  bankSlipUrl?: string;
  bankSlipVerifiedBy?: string;
  bankSlipVerifiedAt?: string;
  bankSlipRejectionReason?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType?: string;
  };
}

export interface CreatePaymentData {
  amount: number;
  currency?: string;
  method: PaymentMethod;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessPaymentData {
  paymentId: string;
  paymentDetails: Record<string, any>;
}

export interface RefundData {
  amount?: number;
  reason: string;
}

export const paymentsApi = {
  // Create a new payment
  create: (data: CreatePaymentData) =>
    ApiClient.post<{ payment: Payment }>("/payments", data),

  // Get all payments
  getAll: (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ payments: Payment[] }>(
      `/payments${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get payment by ID
  getById: (id: string) =>
    ApiClient.get<{ payment: Payment }>(`/payments/${id}`),

  // Process payment
  process: (data: ProcessPaymentData) =>
    ApiClient.post<{ payment: Payment }>("/payments/process", data),

  // Refund payment
  refund: (id: string, data: RefundData) =>
    ApiClient.post<{ payment: Payment }>(`/payments/${id}/refund`, data),

  // Get payment history for current user
  getHistory: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ payments: Payment[] }>(
      `/payments/my-payments${queryString ? `?${queryString}` : ""}`
    );
  },

  // Admin: Get all payments with filters
  getAllAdmin: (filters?: {
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    userType?: string;
    referenceType?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.method) queryParams.append("method", filters.method);
    if (filters?.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) queryParams.append("dateTo", filters.dateTo);
    if (filters?.userType) queryParams.append("userType", filters.userType);
    if (filters?.referenceType)
      queryParams.append("referenceType", filters.referenceType);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{
      payments: Payment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/payments/admin/all${queryString ? `?${queryString}` : ""}`);
  },

  // Admin: Approve bank slip
  approveBankSlip: (id: string, note?: string) =>
    ApiClient.patch<{ payment: Payment }>(
      `/payments/admin/${id}/approve-bank-slip`,
      { note }
    ),

  // Admin: Reject bank slip
  rejectBankSlip: (id: string, reason: string) =>
    ApiClient.patch<{ payment: Payment }>(
      `/payments/admin/${id}/reject-bank-slip`,
      { reason }
    ),

  // Admin: Sync Tracker Plus payment
  syncTrackerPlus: (id: string) =>
    ApiClient.post<{ payment: Payment }>(
      `/payments/admin/${id}/sync-tracker-plus`,
      {}
    ),
};
