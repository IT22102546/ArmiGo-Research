// Authentication API
import { MobileApiClient } from "../api-client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export const authApi = {
  /**
   * Login user
   */
  login: (credentials: LoginCredentials) =>
    MobileApiClient.post<AuthResponse>("/api/v1/auth/login", credentials),

  /**
   * Register new user
   */
  register: (data: RegisterData) =>
    MobileApiClient.post<AuthResponse>("/api/v1/auth/register", data),

  /**
   * Get current user profile
   */
  getProfile: () => MobileApiClient.get<{ user: User }>("/api/v1/auth/profile"),

  /**
   * Logout user
   */
  logout: () =>
    MobileApiClient.post<{ message: string }>("/api/v1/auth/logout"),

  /**
   * Refresh access token
   */
  refreshToken: () =>
    MobileApiClient.post<{ message: string }>("/api/v1/auth/refresh"),

  /**
   * Change password
   */
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    MobileApiClient.post<{ message: string }>(
      "/api/v1/auth/change-password",
      data
    ),

  /**
   * Request password reset
   */
  forgotPassword: (email: string) =>
    MobileApiClient.post<{ message: string }>("/api/v1/auth/forgot-password", {
      email,
    }),

  /**
   * Reset password with token
   */
  resetPassword: (data: { token: string; newPassword: string }) =>
    MobileApiClient.post<{ message: string }>(
      "/api/v1/auth/reset-password",
      data
    ),
};
