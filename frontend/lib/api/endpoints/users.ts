// apps/frontend/lib/api/endpoints/users.ts
import { ApiClient } from "../api-client";
import { User } from "../types";
import { CreateUserData, UpdateUserData } from "../types/user.types";

export const usersApi = {
  // Get all users
  getAll: (params?: { role?: string; isActive?: boolean; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.search) queryParams.append("search", params.search);
    const queryString = queryParams.toString();
    return ApiClient.get<{ users: User[] }>(
      `/api/v1/users${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get user by ID
  getById: (id: string) => ApiClient.get<{ user: User }>(`/api/v1/users/${id}`),

  // Create new user (admin only)
  create: (data: CreateUserData) =>
    ApiClient.post<{ user: User }>("/api/v1/users", data),

  // Update user
  update: (id: string, data: UpdateUserData) =>
    ApiClient.patch<{ user: User }>(`/api/v1/users/${id}`, data),

  // Delete user
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/users/${id}`),

  // Get current user profile
  getProfile: () => ApiClient.get<{ user: User }>("/api/v1/auth/profile"),

  // Update current user profile
  updateProfile: (data: UpdateUserData) =>
    ApiClient.put<{ user: User }>("/api/v1/auth/profile", data),

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return ApiClient.put<{ avatar: string; message: string }>(
      "/api/v1/auth/profile/avatar",
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
    ApiClient.put<{ message: string }>("/api/v1/auth/profile/password", {
      currentPassword,
      newPassword,
    }),
};
