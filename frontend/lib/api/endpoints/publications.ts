// lib/api/endpoints/publications.ts
import { ApiClient } from "../api-client";
import {
  CreatePublicationData,
  Publication,
  PublicationQueryParams,
  PublicationsResponse,
  UpdatePublicationData,
} from "../types/publications.types";

export const publicationsApi = {
  // Get all publications
  getAll: (params?: PublicationQueryParams) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.grade) queryParams.append("grade", params.grade);
    if (params?.subject) queryParams.append("subject", params.subject);
    if (params?.medium) queryParams.append("medium", params.medium);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.minPrice)
      queryParams.append("minPrice", params.minPrice.toString());
    if (params?.maxPrice)
      queryParams.append("maxPrice", params.maxPrice.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);

    const queryString = queryParams.toString();
    return ApiClient.get<PublicationsResponse>(
      `/api/v1/publications${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get publication by ID
  getById: (id: string) =>
    ApiClient.get<Publication>(`/api/v1/publications/${id}`),

  // Create new publication
  create: (data: CreatePublicationData) =>
    ApiClient.post<Publication>("/api/v1/publications", data),

  // Update publication
  update: (id: string, data: UpdatePublicationData) =>
    ApiClient.put<Publication>(`/api/v1/publications/${id}`, data),

  // Delete publication
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/publications/${id}`),

  // Upload file
  uploadFile: (formData: FormData) =>
    ApiClient.uploadFile<{
      url: string;
      key: string;
      bucket: string;
      filename: string;
      size: number;
      mimetype: string;
    }>("/api/v1/publications/upload", formData),

  // Get publication purchasers (Admin only)
  getPublicationPurchasers: (id: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());

    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/api/v1/publications/${id}/purchasers${queryString ? `?${queryString}` : ""}`
    );
  },
};
