import { ApiClient } from "../api-client";

export interface Batch {
  id: string;
  name: string;
  code?: string;
  gradeId: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grade?: {
    id: string;
    name: string;
    code?: string;
  };
  _count?: {
    students: number;
  };
}

export interface BatchFilters {
  gradeId?: string;
  isActive?: boolean;
}

export interface CreateBatchData {
  name: string;
  code?: string;
  gradeId: string;
}

export interface UpdateBatchData {
  name?: string;
  code?: string;
  gradeId?: string;
  isActive?: boolean;
}

const buildQueryString = (params?: BatchFilters): string => {
  if (!params) return "";
  const queryParams = new URLSearchParams();
  if (params.gradeId) {
    queryParams.append("gradeId", params.gradeId);
  }
  if (params.isActive !== undefined) {
    queryParams.append("isActive", String(params.isActive));
  }
  const query = queryParams.toString();
  return query ? `?${query}` : "";
};

export const batchesApi = {
  /**
   * Get all batches with optional filters
   */
  getAll: (filters?: BatchFilters) =>
    ApiClient.get<Batch[]>(`/batches${buildQueryString(filters)}`),

  /**
   * Get batches by grade ID
   */
  getByGrade: (gradeId: string) =>
    ApiClient.get<Batch[]>(`/batches/by-grade/${gradeId}`),

  /**
   * Get a single batch by ID
   */
  getOne: (id: string) => ApiClient.get<Batch>(`/batches/${id}`),

  /**
   * Create a new batch
   */
  create: (data: CreateBatchData) => ApiClient.post<Batch>("/batches", data),

  /**
   * Update an existing batch
   */
  update: (id: string, data: UpdateBatchData) =>
    ApiClient.put<Batch>(`/batches/${id}`, data),

  /**
   * Delete a batch
   */
  delete: (id: string) => ApiClient.delete(`/batches/${id}`),
};
