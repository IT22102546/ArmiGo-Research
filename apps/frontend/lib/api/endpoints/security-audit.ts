import { ApiClient } from "../api-client";

export interface SecurityAuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  fingerprint: string | null;
  success: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  riskScore: number | null;
  metadata: Record<string, any> | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface SecurityAuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  success?: boolean;
  riskScoreMin?: number;
  riskScoreMax?: number;
  userId?: string;
  ipAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  resource?: string;
  search?: string;
}

export interface SecurityAuditStats {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  byAction: Record<string, number>;
  byRiskLevel: {
    low: number;
    medium: number;
    high: number;
  };
  topActions: Array<{
    action: string;
    count: number;
  }>;
  recentFailures: SecurityAuditLog[];
}

export const securityAuditApi = {
  /**
   * Get all security audit logs (admin only)
   */
  getAll: (filters: SecurityAuditFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.action) params.append("action", filters.action);
    if (filters.success !== undefined)
      params.append("success", filters.success.toString());
    if (filters.riskScoreMin)
      params.append("riskScoreMin", filters.riskScoreMin.toString());
    if (filters.riskScoreMax)
      params.append("riskScoreMax", filters.riskScoreMax.toString());
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.ipAddress) params.append("ipAddress", filters.ipAddress);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.resource) params.append("resource", filters.resource);
    if (filters.search) params.append("search", filters.search);

    return ApiClient.get<{
      data: SecurityAuditLog[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/security-audit?${params.toString()}`);
  },

  /**
   * Get security audit log detail by ID
   */
  getDetail: (id: string) => {
    return ApiClient.get<{ data: SecurityAuditLog }>(`/security-audit/${id}`);
  },

  /**
   * Get security audit statistics
   */
  getStats: (filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);

    return ApiClient.get<{ data: SecurityAuditStats }>(
      `/security-audit/stats${params.toString() ? `?${params.toString()}` : ""}`
    );
  },

  /**
   * Get logs for specific user
   */
  getUserLogs: (userId: string, filters: SecurityAuditFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.action) params.append("action", filters.action);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);

    return ApiClient.get<{
      data: SecurityAuditLog[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/security-audit/user/${userId}?${params.toString()}`);
  },

  /**
   * Get high-risk activities
   */
  getHighRisk: (filters?: {
    page?: number;
    limit?: number;
    riskScoreMin?: number;
  }) => {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.riskScoreMin)
      params.append("riskScoreMin", filters.riskScoreMin.toString());

    return ApiClient.get<{
      data: SecurityAuditLog[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(
      `/security-audit/high-risk${params.toString() ? `?${params.toString()}` : ""}`
    );
  },
};
