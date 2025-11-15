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
  getAll: async (
    params?: PublicationQueryParams
  ): Promise<PublicationsResponse> => {
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

    try {
      const response = await ApiClient.get<any>(
        `/publications${queryString ? `?${queryString}` : ""}`
      );

      console.log("Raw API Response:", response); // Debug log

      // Handle different response structures
      if (response && response.publications !== undefined) {
        // Case 1: Direct structure { publications: [], pagination: {} }
        return response;
      } else if (response && Array.isArray(response)) {
        // Case 2: Direct array response (unlikely but handle it)
        return {
          publications: response,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.length,
            totalPages: 1,
          },
        };
      } else if (
        response &&
        response.data &&
        response.data.publications !== undefined
      ) {
        // Case 3: Wrapped in data object { data: { publications: [], pagination: {} } }
        return response.data;
      } else {
        // Case 4: Fallback - empty array
        console.warn(
          "Unexpected response structure, returning empty:",
          response
        );
        return {
          publications: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: 0,
            totalPages: 0,
          },
        };
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
      // Return empty structure on error
      return {
        publications: [],
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: 0,
          totalPages: 0,
        },
      };
    }
  },

  // Get publication by ID
  getById: (id: string) => ApiClient.get<Publication>(`/publications/${id}`),

  // Create new publication
  create: (data: CreatePublicationData) =>
    ApiClient.post<Publication>("/publications", data),

  // Update publication
  update: (id: string, data: UpdatePublicationData) =>
    ApiClient.put<Publication>(`/publications/${id}`, data),

  // Delete publication
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/publications/${id}`),

  // Upload file
  uploadFile: (formData: FormData) =>
    ApiClient.uploadFile<{
      url: string;
      key: string;
      bucket: string;
      filename: string;
      size: number;
      mimetype: string;
    }>("/publications/upload", formData, {
      method: "POST",
    }),

  // Purchase publication
  purchase: (id: string) =>
    ApiClient.post<{
      message: string;
      purchase: {
        id: string;
        publicationId: string;
        userId: string;
        purchasePrice: number;
        purchaseDate: Date;
      };
    }>(`/publications/${id}/purchase`, {}),

  // Get download URL for purchased publication
  getDownloadUrl: (id: string) =>
    ApiClient.get<{ downloadUrl: string; expiresAt: string }>(
      `/publications/${id}/download`
    ),

  // Get user's purchases
  getUserPurchases: (page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());

    const queryString = queryParams.toString();
    return ApiClient.get<{
      purchases: Array<{
        id: string;
        publication: Publication;
        purchasePrice: number;
        purchaseDate: Date;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/publications/user/purchases${queryString ? `?${queryString}` : ""}`);
  },

  // Get publication purchasers (Admin only)
  getPublicationPurchasers: (id: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());

    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/publications/${id}/purchasers${queryString ? `?${queryString}` : ""}`
    );
  },
};
