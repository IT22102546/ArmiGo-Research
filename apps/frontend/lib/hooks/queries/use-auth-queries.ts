/**
 * Auth Query Hooks
 *
 * TanStack Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints/auth";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { notifyError } from "@/lib/error-handling";
import {
  LoginData,
  RegisterData,
  TeacherRegisterData,
  User,
  ForgotPasswordData,
  ResetPasswordData,
} from "@/lib/api/types";

/**
 * Get current user profile
 */
export function useProfile() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = user !== null;

  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await authApi.login(data);
      return response.user;
    },
    onSuccess: (user) => {
      // Update auth store
      setUser(user);

      // Set user in cache
      queryClient.setQueryData(queryKeys.auth.profile(), user);

      toast.success("Logged in successfully");
    },
    onError: (error: unknown) => {
      notifyError(error, "Login failed");
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: RegisterData | TeacherRegisterData) => {
      const response = await authApi.register(data);
      return response.user;
    },
    onSuccess: (user) => {
      // Update auth store
      setUser(user);

      // Set user in cache
      queryClient.setQueryData(queryKeys.auth.profile(), user);

      toast.success("Registration successful");
    },
    onError: (error: unknown) => {
      notifyError(error, "Registration failed");
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      // Clear auth store
      clearAuth();

      // Clear all queries
      queryClient.clear();

      toast.success("Logged out successfully");
    },
    onError: (error: any) => {
      // Still clear auth even if API call fails
      clearAuth();
      queryClient.clear();
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await authApi.updateProfile(data);
      return response.user;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile() });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(
        queryKeys.auth.profile()
      );

      // Optimistically update
      if (previousUser) {
        queryClient.setQueryData(queryKeys.auth.profile(), {
          ...previousUser,
          ...newData,
        });
      }

      return { previousUser };
    },
    onSuccess: (user) => {
      // Update auth store
      updateUser(user);

      // Update cache
      queryClient.setQueryData(queryKeys.auth.profile(), user);

      toast.success("Profile updated successfully");
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.auth.profile(),
          context.previousUser
        );
      }

      notifyError(error, "Failed to update profile");
    },
  });
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await authApi.uploadAvatar(file);
      return response.avatar;
    },
    onSuccess: (avatarUrl) => {
      // Update user with new avatar
      const currentUser = queryClient.getQueryData<User>(
        queryKeys.auth.profile()
      );

      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: avatarUrl };
        queryClient.setQueryData(queryKeys.auth.profile(), updatedUser);
        updateUser(updatedUser);
      }

      toast.success("Avatar updated successfully");
    },
    onError: (error: unknown) => {
      notifyError(error, "Failed to upload avatar");
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      await authApi.changePassword(currentPassword, newPassword);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: unknown) => {
      notifyError(error, "Failed to change password");
    },
  });
}

/**
 * Forgot password mutation
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      await authApi.forgotPassword(data);
    },
    onSuccess: () => {
      toast.success("Password reset email sent. Please check your inbox.");
    },
    onError: (error: unknown) => {
      notifyError(error, "Failed to send reset email");
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      await authApi.resetPassword(data);
    },
    onSuccess: () => {
      toast.success("Password reset successfully. You can now log in.");
    },
    onError: (error: unknown) => {
      notifyError(error, "Failed to reset password");
    },
  });
}

/**
 * Get registration options
 */
export function useRegistrationOptions() {
  return useQuery({
    queryKey: queryKeys.auth.registrationOptions(),
    queryFn: async () => {
      return await authApi.getRegistrationOptions();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (rarely changes)
  });
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      await authApi.refreshToken();
    },
    onError: (error: any) => {
      // Silent error - handled by ApiClient
    },
  });
}
