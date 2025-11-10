import { ApiClient } from "../api-client";

export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface AcademicYearsResponse {
  academicYears: AcademicYear[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildQueryString = (params?: AcademicYearQueryParams): string => {
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

export const academicYearsApi = {
  getAll: (params?: AcademicYearQueryParams) =>
    ApiClient.get<AcademicYearsResponse>(
      `/admin/academic-years${buildQueryString(params)}`
    ),

  getCurrent: () =>
    ApiClient.get<AcademicYear | null>("/admin/academic-years/current"),

  getOne: (id: string) =>
    ApiClient.get<AcademicYear>(`/admin/academic-years/${id}`),

  create: (data: Partial<AcademicYear>) =>
    ApiClient.post<AcademicYear>("/admin/academic-years", data),

  update: (id: string, data: Partial<AcademicYear>) =>
    ApiClient.put<AcademicYear>(`/admin/academic-years/${id}`, data),

  delete: (id: string) => ApiClient.delete(`/admin/academic-years/${id}`),

  hardDelete: (id: string) =>
    ApiClient.delete(`/admin/academic-years/${id}/hard`),
};
