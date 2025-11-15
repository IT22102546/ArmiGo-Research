import { ApiClient } from "../api-client";

export interface Grade {
  id: string;
  name: string;
  code?: string;
  level?: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GradeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface GradesResponse {
  grades: Grade[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildQueryString = (params?: GradeQueryParams): string => {
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

export const gradesApi = {
  getAll: (params?: GradeQueryParams) =>
    ApiClient.get<GradesResponse>(`/admin/grades${buildQueryString(params)}`),

  getOne: (id: string) => ApiClient.get<Grade>(`/admin/grades/${id}`),

  create: (data: Partial<Grade>) =>
    ApiClient.post<Grade>("/admin/grades", data),

  update: (id: string, data: Partial<Grade>) =>
    ApiClient.put<Grade>(`/admin/grades/${id}`, data),

  delete: (id: string) => ApiClient.delete(`/admin/grades/${id}`),

  hardDelete: (id: string) => ApiClient.delete(`/admin/grades/${id}/hard`),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post("/admin/grades/reorder", { items }),
};
