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
  LOGIN = "LOGIN",
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
  findAll: (query?: AuditLogQuery) => {
    const params = new URLSearchParams();
    if (query?.userId) params.append("userId", query.userId);
    if (query?.action) params.append("action", query.action);
    if (query?.resource) params.append("resource", query.resource);
    if (query?.startDate) params.append("startDate", query.startDate);
    if (query?.endDate) params.append("endDate", query.endDate);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    return ApiClient.get<{
      logs: AuditLog[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/v1/audit-logs?${params.toString()}`);
  },

  // Get my audit logs (current user)
  getMyActivity: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    return ApiClient.get<{
      logs: AuditLog[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/v1/audit-logs/my-activity?${params.toString()}`);
  },

  // Get recent activity (Admin only)
  getRecent: (limit?: number) =>
    ApiClient.get<AuditLog[]>(
      `/api/v1/audit-logs/recent${limit ? `?limit=${limit}` : ""}`
    ),

  // Get activity statistics (Admin only)
  getStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return ApiClient.get<ActivityStats>(
      `/api/v1/audit-logs/stats?${params.toString()}`
    );
  },

  // Get a single audit log by ID (Admin only)
  findOne: (id: string) =>
    ApiClient.get<AuditLog>(`/api/v1/audit-logs/${id}`),

  // Get audit logs for a specific resource (Admin only)
  findByResource: (resource: string, resourceId: string) =>
    ApiClient.get<AuditLog[]>(
      `/api/v1/audit-logs/resource/${resource}/${resourceId}`
    ),
};
