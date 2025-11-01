// apps/frontend/lib/api/endpoints/storage.ts
import { ApiClient } from "../api-client";

export interface StorageFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  userId: string;
  folder?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileData {
  file: File;
  folder?: string;
  isPublic?: boolean;
}

export const storageApi = {
  // Upload a file
  upload: async (data: UploadFileData) => {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.folder) formData.append("folder", data.folder);
    if (data.isPublic !== undefined)
      formData.append("isPublic", data.isPublic.toString());

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${API_URL}/api/v1/storage/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json() as Promise<{ file: StorageFile }>;
  },

  // Get all files
  getAll: (params?: { folder?: string; isPublic?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.folder) queryParams.append("folder", params.folder);
    if (params?.isPublic !== undefined)
      queryParams.append("isPublic", params.isPublic.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{ files: StorageFile[] }>(
      `/api/v1/storage${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get file by ID
  getById: (id: string) =>
    ApiClient.get<{ file: StorageFile }>(`/api/v1/storage/${id}`),

  // Download file
  download: (id: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    window.open(`${API_URL}/api/v1/storage/${id}/download`, "_blank");
  },

  // Delete file
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/storage/${id}`),
};
