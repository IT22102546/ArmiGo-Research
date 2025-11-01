// apps/frontend/lib/api/endpoints/payments.ts
import { ApiClient } from "../api-client";

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  paymentProvider: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  amount: number;
  currency?: string;
  paymentMethod: string;
  description: string;
  metadata?: Record<string, any>;
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
    ApiClient.post<{ payment: Payment }>("/api/v1/payments", data),

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
      `/api/v1/payments${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get payment by ID
  getById: (id: string) =>
    ApiClient.get<{ payment: Payment }>(`/api/v1/payments/${id}`),

  // Process payment
  process: (data: ProcessPaymentData) =>
    ApiClient.post<{ payment: Payment }>("/api/v1/payments/process", data),

  // Refund payment
  refund: (id: string, data: RefundData) =>
    ApiClient.post<{ payment: Payment }>(`/api/v1/payments/${id}/refund`, data),

  // Get payment history for current user
  getHistory: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<{ payments: Payment[] }>(
      `/api/v1/payments/history${queryString ? `?${queryString}` : ""}`
    );
  },
};
