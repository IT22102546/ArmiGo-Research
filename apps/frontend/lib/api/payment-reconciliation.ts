import { ApiClient } from "./api-client";

// Enums
export enum ReconciliationStatus {
  PENDING = "PENDING",
  MATCHED = "MATCHED",
  UNMATCHED = "UNMATCHED",
  DISPUTED = "DISPUTED",
  RESOLVED = "RESOLVED",
}

export enum ReconciliationType {
  AUTO_MATCHED = "AUTO_MATCHED",
  MANUALLY_MATCHED = "MANUALLY_MATCHED",
  UNMATCHED = "UNMATCHED",
  SUSPICIOUS = "SUSPICIOUS",
}

// Interfaces
export interface PaymentReconciliation {
  id: string;
  paymentId: string | null;
  trackerPlusRefId: string;
  trackerPlusAmount: number;
  trackerPlusDate: string;
  trackerPlusStudentId: string | null;
  trackerPlusStudentName: string | null;
  trackerPlusDescription: string | null;
  trackerPlusMetadata: string | null;
  internalAmount: number | null;
  internalDate: string | null;
  status: ReconciliationStatus;
  type: ReconciliationType;
  discrepancyAmount: number | null;
  discrepancyReason: string | null;
  matchedBy: string | null;
  matchedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  matcher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface TrackerPlusRecord {
  referenceId: string;
  amount: number;
  date: string;
  studentId?: string;
  studentName?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ImportTrackerPlusDto {
  records: TrackerPlusRecord[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  autoMatched: number;
  errors: string[];
}

export interface ReconciliationFilterDto {
  status?: ReconciliationStatus;
  type?: ReconciliationType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface ReconciliationListResponse {
  data: PaymentReconciliation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ManualMatchDto {
  paymentId: string;
  notes?: string;
}

export interface BulkMatchDto {
  reconciliationIds: string[];
}

export interface BulkMatchResult {
  matched: number;
  failed: number;
  errors: string[];
}

export interface ReconciliationStatistics {
  total: number;
  pending: number;
  matched: number;
  unmatched: number;
  disputed: number;
  resolved: number;
  totalTrackerPlusAmount: number;
  totalInternalAmount: number;
  totalDiscrepancy: number;
  byType: {
    autoMatched: number;
    manuallyMatched: number;
    unmatched: number;
    suspicious: number;
  };
}

export interface SuggestedPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  matchScore: number;
}

// API Methods
export const paymentReconciliationApi = {
  async importTrackerPlusData(
    data: ImportTrackerPlusDto
  ): Promise<ImportResult> {
    return ApiClient.post<ImportResult>("/payment-reconciliation/import", data);
  },

  async getReconciliationList(
    filters?: ReconciliationFilterDto
  ): Promise<ReconciliationListResponse> {
    return ApiClient.get<ReconciliationListResponse>(
      "/payment-reconciliation",
      { params: filters }
    );
  },

  async getStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<ReconciliationStatistics> {
    return ApiClient.get<ReconciliationStatistics>(
      "/payment-reconciliation/statistics",
      {
        params: { startDate, endDate },
      }
    );
  },

  async getReconciliationById(id: string): Promise<PaymentReconciliation> {
    return ApiClient.get<PaymentReconciliation>(
      `/payment-reconciliation/${id}`
    );
  },

  async getSuggestedMatches(id: string): Promise<SuggestedPayment[]> {
    return ApiClient.get<SuggestedPayment[]>(
      `/payment-reconciliation/${id}/suggestions`
    );
  },

  async manualMatch(
    id: string,
    data: ManualMatchDto
  ): Promise<PaymentReconciliation> {
    return ApiClient.patch<PaymentReconciliation>(
      `/payment-reconciliation/${id}/match`,
      data
    );
  },

  async unmatch(id: string): Promise<PaymentReconciliation> {
    return ApiClient.patch<PaymentReconciliation>(
      `/payment-reconciliation/${id}/unmatch`,
      {}
    );
  },

  async markSuspicious(
    id: string,
    reason: string
  ): Promise<PaymentReconciliation> {
    return ApiClient.patch<PaymentReconciliation>(
      `/payment-reconciliation/${id}/mark-suspicious`,
      { reason }
    );
  },

  async resolve(id: string, notes: string): Promise<PaymentReconciliation> {
    return ApiClient.patch<PaymentReconciliation>(
      `/payment-reconciliation/${id}/resolve`,
      { notes }
    );
  },

  async bulkMatch(data: BulkMatchDto): Promise<BulkMatchResult> {
    return ApiClient.post<BulkMatchResult>(
      "/payment-reconciliation/bulk-match",
      data
    );
  },
};

export default paymentReconciliationApi;
