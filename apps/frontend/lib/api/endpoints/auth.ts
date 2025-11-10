// apps/frontend/lib/api/endpoints/auth.ts
import { ApiClient } from "../api-client";
import {
  AuthResponse,
  ForgotPasswordData,
  LoginData,
  RegisterData,
  ResetPasswordData,
  TeacherRegisterData,
  User,
} from "../types/auth.types";

export const authApi = {
  login: (data: LoginData) =>
    ApiClient.post<{ user: User }>("/auth/login", data),
  register: (data: RegisterData | TeacherRegisterData) =>
    ApiClient.post<{ user: User }>("/auth/register", data),
  logout: () => ApiClient.post<{ message: string }>("/auth/logout"),
  getProfile: () => ApiClient.get<{ user: User }>("/auth/profile"),
  updateProfile: (data: Partial<User>) =>
    ApiClient.put<{ user: User }>("/auth/profile", data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return ApiClient.uploadFile<{ avatar: string; message: string }>(
      "/auth/profile/avatar",
      formData,
      { method: "PUT" }
    );
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    ApiClient.put<{ message: string }>("/auth/profile/password", {
      currentPassword,
      newPassword,
    }),
  refreshToken: () => ApiClient.post<{ message: string }>("/auth/refresh"),
  forgotPassword: (data: ForgotPasswordData) =>
    ApiClient.post<{ message: string }>("/auth/forgot-password", data),
  resetPassword: (data: ResetPasswordData) =>
    ApiClient.post<{ message: string }>("/auth/reset-password", data),
  health: () =>
    ApiClient.get<{ status: string; timestamp: string }>("/auth/health"),
  getRegistrationOptions: () =>
    ApiClient.get<{
      zones: string[];
      districts: string[];
      subjects: string[];
      mediums: string[];
      levels: string[];
    }>("/auth/registration-options"),
};
