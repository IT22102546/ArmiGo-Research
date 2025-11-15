// apps/frontend/lib/api/endpoints/users.ts
import { ApiClient } from "../api-client";
import { User } from "../types";
import { CreateUserData, UpdateUserData } from "../types/user.types";

export const usersApi = {
  // Get all users
  getAll: (params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<{
      data: User[];
      total: number;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/users${queryString ? `?${queryString}` : ""}`).then((response) => ({
      users: response.data,
      ...response,
    }));
  },

  // Search users
  searchUsers: (params: { query: string; role?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    queryParams.append("search", params.query);
    if (params.role) queryParams.append("role", params.role);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    return ApiClient.get<{ data: User[] }>(
      `/users?${queryParams.toString()}`
    ).then((response: any) => response.data || []);
  },

  // Export users to CSV
  exportUsers: async (params?: {
    role?: string;
    status?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    const queryString = queryParams.toString();
    // Use ApiClient to fetch the export as a blob and download it
    const blob = await ApiClient.request<Blob>(
      `/users/export${queryString ? `?${queryString}` : ""}`,
      { responseType: "blob" }
    );
    // Create a link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get user by ID
  getById: (id: string) =>
    ApiClient.get<{ user: User }>(`/users/${encodeURIComponent(id)}`),

  // Create new user (admin only)
  create: (data: CreateUserData) =>
    ApiClient.post<{ user: User }>("/users", data),

  // Update user
  update: (id: string, data: UpdateUserData) =>
    ApiClient.patch<{ user: User }>(`/users/${encodeURIComponent(id)}`, data),

  // Update user status
  updateStatus: (id: string, status: string) =>
    ApiClient.patch<{ message: string }>(
      `/users/${encodeURIComponent(id)}/status`,
      { status }
    ),

  // Delete user
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/users/${encodeURIComponent(id)}`),

  // Get current user profile
  getProfile: () => ApiClient.get<{ user: User }>("/auth/profile"),

  // Update current user profile
  updateProfile: (data: UpdateUserData) =>
    ApiClient.put<{ user: User }>("/auth/profile", data),

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return ApiClient.put<{ avatar: string; message: string }>(
      "/auth/profile/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // Change password
  changePassword: (currentPassword: string, newPassword: string) =>
    ApiClient.put<{ message: string }>("/auth/profile/password", {
      currentPassword,
      newPassword,
    }),

  // Admin reset password for a user
  resetPassword: (id: string, newPassword: string) =>
    ApiClient.post<{ message: string }>(
      `/users/${encodeURIComponent(id)}/reset-password`,
      { newPassword }
    ),
};
