// apps/frontend/lib/api/endpoints/auth.ts
import { ApiClient } from "../api-client";
import {
  AuthResponse,
  ForgotPasswordData,
  LoginData,
  RegisterData,
  ResetPasswordData,
  User,
} from "../types/auth.types";

export const authApi = {
  login: (data: LoginData) =>
    ApiClient.post<{ user: User }>("/api/v1/auth/login", data),
  register: (data: RegisterData) =>
    ApiClient.post<{ user: User }>("/api/v1/auth/register", data),
  logout: () => ApiClient.post<{ message: string }>("/api/v1/auth/logout"),
  getProfile: () => ApiClient.get<{ user: User }>("/api/v1/auth/profile"),
  refreshToken: () => ApiClient.post<AuthResponse>("/api/v1/auth/refresh"),
  forgotPassword: (data: ForgotPasswordData) =>
    ApiClient.post<{ message: string }>("/api/v1/auth/forgot-password", data),
  resetPassword: (data: ResetPasswordData) =>
    ApiClient.post<{ message: string }>("/api/v1/auth/reset-password", data),
  health: () =>
    ApiClient.get<{ status: string; timestamp: string }>("/api/v1/auth/health"),
};
