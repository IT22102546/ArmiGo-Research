// apps/frontend/lib/api/endpoints/audit-logs.ts
import { ApiClient } from "../api-client";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN_SUCCESS",
  LOGOUT = "LOGOUT",
  UPLOAD = "UPLOAD",
  DOWNLOAD = "DOWNLOAD",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  PUBLISH = "PUBLISH",
  ARCHIVE = "ARCHIVE",
}

export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ActivityStats {
  totalLogs: number;
  actionBreakdown: Record<string, number>;
  resourceBreakdown: Record<string, number>;
  recentActivities: AuditLog[];
}

export const auditLogsApi = {
  // Get all audit logs with filtering (Admin only)
  findAll: async (query?: AuditLogQuery) => {
    const params = new URLSearchParams();
    if (query?.userId) params.append("userId", query.userId);
    if (query?.action) params.append("action", query.action);
    if (query?.resource) params.append("resource", query.resource);
    if (query?.startDate) params.append("startDate", query.startDate);
    if (query?.endDate) params.append("endDate", query.endDate);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const response = await ApiClient.get<{
      logs: AuditLog[];
      total: number;
      page: number;
      limit: number;
    }>(`/audit-logs?${params.toString()}`);
    return response || { logs: [], total: 0, page: 1, limit: 50 };
  },

  // Get my audit logs (current user)
  getMyActivity: async (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await ApiClient.get<{
      logs: AuditLog[];
      total: number;
      page: number;
      limit: number;
    }>(`/audit-logs/my-activity?${params.toString()}`);
    return response || { logs: [], total: 0, page: 1, limit: 50 };
  },

  // Get recent activity (Admin only)
  getRecent: async (limit?: number) => {
    const response = await ApiClient.get<AuditLog[]>(
      `/audit-logs/recent${limit ? `?limit=${limit}` : ""}`
    );
    return response || [];
  },

  // Get activity statistics (Admin only)
  getStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await ApiClient.get<ActivityStats>(
      `/audit-logs/stats?${params.toString()}`
    );
    return (
      response || {
        totalLogs: 0,
        actionBreakdown: {},
        resourceBreakdown: {},
        recentActivities: [],
      }
    );
  },

  // Get a single audit log by ID (Admin only)
  findOne: (id: string) => ApiClient.get<AuditLog>(`/audit-logs/${id}`),

  // Get audit logs for a specific resource (Admin only)
  findByResource: (resource: string, resourceId: string) =>
    ApiClient.get<AuditLog[]>(`/audit-logs/resource/${resource}/${resourceId}`),
};
