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

export interface GenerateUploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  category:
    | "profile"
    | "exam-submission"
    | "publication"
    | "document"
    | "exam-question"
    | "class-materials";
  expiresIn?: number;
}

export interface FileUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  key: string;
  bucket: string;
  expiresAt: string;
}

export const storageApi = {
  // Upload a file
  upload: async (data: UploadFileData) => {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.folder) formData.append("folder", data.folder);
    if (data.isPublic !== undefined)
      formData.append("isPublic", data.isPublic.toString());

    // Use ApiClient so cookies and error handling are consistent
    return ApiClient.post<{ file: StorageFile }>("/storage/upload", formData, {
      // No headers so browser can set multipart boundaries
    });
  },

  // Generate presigned upload URL
  generateUploadUrl: (data: GenerateUploadUrlRequest) =>
    ApiClient.post<FileUploadResult>("/storage/upload-url", data),

  // Upload file directly (alternative method)
  uploadDirect: (file: File, category: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    return ApiClient.post<{ url: string; key: string; bucket: string }>(
      "/storage/upload-direct",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // Upload file using presigned URL (works with both S3 and local storage)
  uploadToPresignedUrl: async (
    presignedUrl: string,
    file: File
  ): Promise<void> => {
    // Check if this is a local upload URL (contains our API path)
    const isLocalUpload =
      presignedUrl.includes("/storage/local-upload") ||
      presignedUrl.includes("localhost");

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
      // Include credentials for local uploads to handle CORS
      ...(isLocalUpload && { credentials: "include" as RequestCredentials }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Upload failed: ${errorText || response.statusText}`);
    }
  },

  // Get all files
  getAll: (params?: { folder?: string; isPublic?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.folder) queryParams.append("folder", params.folder);
    if (params?.isPublic !== undefined)
      queryParams.append("isPublic", params.isPublic.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{ files: StorageFile[] }>(
      `/storage${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get file by ID
  getById: (id: string) =>
    ApiClient.get<{ file: StorageFile }>(`/storage/${id}`),

  // Download file
  download: async (id: string) => {
    // Use ApiClient to fetch the file as a blob and download
    const blob = await ApiClient.request<Blob>(`/storage/${id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `file_${id}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete file
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/storage/${id}`),
};
