// Wallet API
import { MobileApiClient } from "../api-client";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  frozen: boolean;
  frozenReason?: string;
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

export const walletApi = {
  /**
   * Get my wallet
   */
  getMyWallet: () => MobileApiClient.get<Wallet>("/api/v1/wallet"),

  /**
   * Get wallet balance
   */
  getBalance: () =>
    MobileApiClient.get<{ balance: number }>("/api/v1/wallet/balance"),

  /**
   * Get wallet statistics
   */
  getStats: () => MobileApiClient.get<WalletStats>("/api/v1/wallet/stats"),

  /**
   * Get transaction history
   */
  getTransactions: (params?: { page?: number; limit?: number }) =>
    MobileApiClient.get<{
      data: WalletTransaction[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(
      `/api/v1/wallet/transactions?${new URLSearchParams(
        params as any
      ).toString()}`
    ),

  /**
   * Credit wallet (Admin only)
   */
  credit: (data: {
    amount: number;
    description: string;
    reference?: string;
    referenceType?: string;
  }) =>
    MobileApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>("/api/v1/wallet/credit", data),

  /**
   * Get user wallet (Admin)
   */
  getUserWallet: (userId: string) =>
    MobileApiClient.get<Wallet>(`/api/v1/wallet/admin/${userId}`),

  /**
   * Credit user wallet (Admin)
   */
  creditUserWallet: (
    userId: string,
    data: {
      amount: number;
      description: string;
      reference?: string;
      referenceType?: string;
    }
  ) =>
    MobileApiClient.post<{
      wallet: Wallet;
      transaction: WalletTransaction;
    }>(`/api/v1/wallet/admin/credit/${userId}`, data),

  /**
   * Freeze wallet (Admin)
   */
  freezeWallet: (userId: string, reason: string) =>
    MobileApiClient.post<Wallet>(`/api/v1/wallet/admin/freeze/${userId}`, {
      reason,
    }),

  /**
   * Unfreeze wallet (Admin)
   */
  unfreezeWallet: (userId: string) =>
    MobileApiClient.post<Wallet>(`/api/v1/wallet/admin/unfreeze/${userId}`),

  /**
   * Get user transaction history (Admin)
   */
  getUserTransactions: (
    userId: string,
    params?: { page?: number; limit?: number }
  ) =>
    MobileApiClient.get<{
      data: WalletTransaction[];
      pagination: any;
    }>(
      `/api/v1/wallet/admin/${userId}/transactions?${new URLSearchParams(
        params as any
      ).toString()}`
    ),
};
