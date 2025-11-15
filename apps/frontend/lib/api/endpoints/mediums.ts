import { ApiClient } from "../api-client";

export interface Medium {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;
}

export interface MediumQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface MediumsResponse {
  mediums: Medium[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildQueryString = (params?: MediumQueryParams): string => {
  if (!params) return "";
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const query = queryParams.toString();
  return query ? `?${query}` : "";
};

export const mediumsApi = {
  getAll: (params?: MediumQueryParams) =>
    ApiClient.get<MediumsResponse>(`/admin/mediums${buildQueryString(params)}`),

  getOne: (id: string) => ApiClient.get<Medium>(`/admin/mediums/${id}`),

  create: (data: Partial<Medium>) =>
    ApiClient.post<Medium>("/admin/mediums", data),

  update: (id: string, data: Partial<Medium>) =>
    ApiClient.put<Medium>(`/admin/mediums/${id}`, data),

  delete: (id: string) => ApiClient.delete(`/admin/mediums/${id}`),

  hardDelete: (id: string) => ApiClient.delete(`/admin/mediums/${id}/hard`),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post("/admin/mediums/reorder", { items }),
};
