import { ApiClient } from "../api-client";

export interface TemporaryAccess {
  id: string;
  userId: string;
  grantedBy: string;
  expiresAt: string;
  reason?: string;
  active: boolean;
  accessType?: string;
  createdAt: string;
  revokedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grantor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTemporaryAccessData {
  userId: string;
  expiresAt: string;
  reason: string;
  accessType?: string;
}

export interface ExtendTemporaryAccessData {
  expiresAt: string;
  reason: string;
}

export const temporaryAccessApi = {
  // Get all temporary accesses (Admin only)
  getAll: (filters?: {
    active?: boolean;
    expiresAfter?: string;
    expiresBefore?: string;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.active !== undefined)
      queryParams.append("active", filters.active.toString());
    if (filters?.expiresAfter)
      queryParams.append("expiresAfter", filters.expiresAfter);
    if (filters?.expiresBefore)
      queryParams.append("expiresBefore", filters.expiresBefore);
    if (filters?.searchTerm)
      queryParams.append("searchTerm", filters.searchTerm);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{
      accesses: TemporaryAccess[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/temporary-access${queryString ? `?${queryString}` : ""}`);
  },

  // Get temporary access by ID
  getById: (id: string) =>
    ApiClient.get<TemporaryAccess>(`/temporary-access/${id}`),

  // Create temporary access
  create: (data: CreateTemporaryAccessData) =>
    ApiClient.post<TemporaryAccess>("/temporary-access", data),

  // Revoke temporary access
  revoke: (id: string) =>
    ApiClient.patch<TemporaryAccess>(`/temporary-access/${id}/revoke`, {}),

  // Extend temporary access
  extend: (id: string, data: ExtendTemporaryAccessData) =>
    ApiClient.patch<TemporaryAccess>(`/temporary-access/${id}/extend`, data),
};
