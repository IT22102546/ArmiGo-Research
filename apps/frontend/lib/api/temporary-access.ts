import { ApiClient } from "./api-client";

export enum TemporaryAccessResource {
  EXAM = "EXAM",
  CLASS = "CLASS",
  COURSE_MATERIAL = "COURSE_MATERIAL",
  VIDEO_RECORDING = "VIDEO_RECORDING",
  ASSIGNMENT = "ASSIGNMENT",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentProfile?: {
    studentId: string;
  };
}

export interface TemporaryAccess {
  id: string;
  userId: string;
  grantedBy: string;
  resourceType: TemporaryAccessResource;
  resourceId: string;
  startDate: string;
  expiresAt: string;
  reason?: string;
  active: boolean;
  revokedBy?: string;
  revokedAt?: string;
  revocationNote?: string;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  grantor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  revoker?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTemporaryAccessDto {
  userId: string;
  resourceType: TemporaryAccessResource;
  resourceId: string;
  startDate: string;
  expiresAt: string;
  reason?: string;
}

export interface TemporaryAccessResponse {
  data: TemporaryAccess[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemporaryAccessStatistics {
  total: number;
  active: number;
  expired: number;
  byResourceType: Record<string, number>;
}

export interface CheckAccessResponse {
  hasAccess: boolean;
}

export interface CleanupResponse {
  deactivated: number;
  timestamp: string;
}

export const temporaryAccessApi = {
  create: async (data: CreateTemporaryAccessDto): Promise<TemporaryAccess> => {
    const response = await ApiClient.post<TemporaryAccess>(
      "/temporary-access",
      data
    );
    return response;
  },

  getAll: async (params?: {
    userId?: string;
    resourceType?: TemporaryAccessResource;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<TemporaryAccessResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.resourceType)
      queryParams.append("resourceType", params.resourceType);
    if (params?.active !== undefined)
      queryParams.append("active", params.active.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await ApiClient.get<TemporaryAccessResponse>(
      `/temporary-access${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    );
    return response;
  },

  getStatistics: async (): Promise<TemporaryAccessStatistics> => {
    const response = await ApiClient.get<TemporaryAccessStatistics>(
      "/temporary-access/statistics"
    );
    return response;
  },

  getByUser: async (userId: string): Promise<TemporaryAccess[]> => {
    const response = await ApiClient.get<TemporaryAccess[]>(
      `/temporary-access/user/${userId}`
    );
    return response;
  },

  checkAccess: async (
    userId: string,
    resourceType: TemporaryAccessResource,
    resourceId: string
  ): Promise<CheckAccessResponse> => {
    const params = new URLSearchParams({
      userId,
      resourceType,
      resourceId,
    });
    const response = await ApiClient.get<CheckAccessResponse>(
      `/temporary-access/check?${params.toString()}`
    );
    return response;
  },

  getById: async (id: string): Promise<TemporaryAccess> => {
    const response = await ApiClient.get<TemporaryAccess>(
      `/temporary-access/${id}`
    );
    return response;
  },

  revoke: async (
    id: string,
    revocationNote?: string
  ): Promise<TemporaryAccess> => {
    const response = await ApiClient.patch<TemporaryAccess>(
      `/temporary-access/${id}/revoke`,
      {
        revocationNote,
      }
    );
    return response;
  },

  cleanup: async (): Promise<CleanupResponse> => {
    const response = await ApiClient.post<CleanupResponse>(
      "/temporary-access/cleanup",
      {}
    );
    return response;
  },
};
