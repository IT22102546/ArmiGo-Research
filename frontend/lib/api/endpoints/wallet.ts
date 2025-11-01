// apps/frontend/lib/api/endpoints/wallet.ts - UPDATED TO MATCH BACKEND
import { ApiClient } from "../api-client";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  maxBalance?: number;
  minBalance: number;
  frozen: boolean;
  frozenReason?: string;
  frozenAt?: string;
  lastTopUp?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "CREDIT" | "DEBIT" | "REFUND";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  referenceType?: string;
  metadata?: any;
  createdAt: string;
}

export interface WalletStats {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
  lastTransaction?: WalletTransaction;
}

export interface CreditWalletData {
  amount: number;
  description: string;
  reference?: string;
  referenceType?: string;
}

export interface FreezeWalletData {
  reason: string;
}

export const walletApi = {
  // Get user's wallet
  getMyWallet: () => ApiClient.get<Wallet>("/api/v1/wallet"),

  // Get wallet balance
  getBalance: () =>
    ApiClient.get<{ balance: number }>("/api/v1/wallet/balance"),

  // Get wallet statistics
  getStats: () => ApiClient.get<WalletStats>("/api/v1/wallet/stats"),

  // Get transaction history
  getTransactions: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{
      data: WalletTransaction[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/v1/wallet/transactions${queryString ? `?${queryString}` : ""}`);
  },

  // Credit wallet (Admin only - for manual top-ups)
  credit: (data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>("/api/v1/wallet/credit", data),

  // Admin: Get user wallet
  getUserWallet: (userId: string) =>
    ApiClient.get<Wallet>(`/api/v1/wallet/admin/${userId}`),

  // Admin: Credit user wallet
  creditUserWallet: (userId: string, data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/api/v1/wallet/admin/credit/${userId}`, data),

  // Admin: Refund to user wallet
  refundUserWallet: (userId: string, data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/api/v1/wallet/admin/refund/${userId}`, data),

  // Admin: Freeze wallet
  freezeWallet: (userId: string, data: FreezeWalletData) =>
    ApiClient.post<Wallet>(`/api/v1/wallet/admin/freeze/${userId}`, data),

  // Admin: Unfreeze wallet
  unfreezeWallet: (userId: string) =>
    ApiClient.post<Wallet>(`/api/v1/wallet/admin/unfreeze/${userId}`),

  // Admin: Get user transaction history
  getUserTransactions: (
    userId: string,
    params?: { page?: number; limit?: number }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{
      data: WalletTransaction[];
      pagination: any;
    }>(
      `/api/v1/wallet/admin/${userId}/transactions${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  // Admin: Get user wallet stats
  getUserStats: (userId: string) =>
    ApiClient.get<WalletStats>(`/api/v1/wallet/admin/${userId}/stats`),
};
