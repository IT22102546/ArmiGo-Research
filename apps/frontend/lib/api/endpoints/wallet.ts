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

export interface WalletAnalytics {
  summary: {
    totalWallets: number;
    activeWallets: number;
    frozenWallets: number;
    totalBalance: number;
  };
  transactions: {
    totalCredits: number;
    totalDebits: number;
    totalRefunds: number;
    netFlow: number;
    counts: {
      credits: number;
      debits: number;
      refunds: number;
      total: number;
    };
  };
  topWallets: Array<{
    id: string;
    userId: string;
    userName: string;
    email: string;
    balance: number;
    totalCredits: number;
    totalDebits: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    userName: string;
    createdAt: string;
  }>;
  dailyVolume: Array<{
    date: string;
    credits: number;
    debits: number;
    count: number;
  }>;
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
  getMyWallet: () => ApiClient.get<Wallet>("/wallet"),

  // Get wallet balance
  getBalance: () => ApiClient.get<{ balance: number }>("/wallet/balance"),

  // Get wallet statistics
  getStats: () => ApiClient.get<WalletStats>("/wallet/stats"),

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
    }>(`/wallet/transactions${queryString ? `?${queryString}` : ""}`);
  },

  // Credit wallet (Admin only - for manual top-ups)
  credit: (data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>("/wallet/credit", data),

  // Admin: Get user wallet
  getUserWallet: (userId: string) =>
    ApiClient.get<Wallet>(`/wallet/admin/${userId}`),

  // Admin: Credit user wallet
  creditUserWallet: (userId: string, data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/wallet/admin/credit/${userId}`, data),

  // Admin: Refund to user wallet
  refundUserWallet: (userId: string, data: CreditWalletData) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/wallet/admin/refund/${userId}`, data),

  // Admin: Freeze wallet
  freezeWallet: (userId: string, data: FreezeWalletData) =>
    ApiClient.post<Wallet>(`/wallet/admin/freeze/${userId}`, data),

  // Admin: Unfreeze wallet
  unfreezeWallet: (userId: string) =>
    ApiClient.post<Wallet>(`/wallet/admin/unfreeze/${userId}`),

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
      `/wallet/admin/${userId}/transactions${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  // Admin: Get user wallet stats
  getUserStats: (userId: string) =>
    ApiClient.get<WalletStats>(`/wallet/admin/${userId}/stats`),

  // Admin: Search wallets by name or phone
  searchWallets: (searchTerm: string) =>
    ApiClient.get<Wallet[]>(
      `/wallet/admin/search?searchTerm=${encodeURIComponent(searchTerm)}`
    ),

  // Admin: Adjust wallet balance (credit or debit)
  adjustBalance: (
    userId: string,
    data: {
      amount: number;
      type: "CREDIT" | "DEBIT";
      reason: string;
      metadata?: any;
    }
  ) =>
    ApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/wallet/admin/${userId}/adjust`, data),

  // Admin: Get wallet analytics
  getWalletAnalytics: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return ApiClient.get<WalletAnalytics>(
      `/wallet/admin/analytics${queryString ? `?${queryString}` : ""}`
    );
  },
};
