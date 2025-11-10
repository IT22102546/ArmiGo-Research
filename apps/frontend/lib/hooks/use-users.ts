/** User hooks: data fetching and mutation utilities for user management. */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { buildApiUrl } from "@/lib/api/api-client";

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface PaginatedUsersResponse {
  data: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    avatar?: string;
    phone: string;
    dateOfBirth?: string;
    bio?: string;
    emailVerified: boolean;
    lastLoginAt?: string;
    lastLogoutAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateUserPayload {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  dateOfBirth?: string;
  bio?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  bio?: string;
  dateOfBirth?: string;
}

/**
 * Hook to fetch paginated list of users with filters
 * Automatically handles RBAC - admins won't see super admins
 */
export function useUsersList(filters: UserFilters = {}) {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const queryString = params.toString();
      const endpoint = `/users${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(buildApiUrl(endpoint), {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    filters.page,
    filters.limit,
    filters.role,
    filters.status,
    filters.search,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, isLoading, error, refetch: fetchUsers };
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createUser = useCallback(async (payload: CreateUserPayload) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(buildApiUrl("/users"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create user");
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createUser, isLoading, error };
}

/**
 * Hook to update an existing user
 */
export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateUser = useCallback(
    async (userId: string, data: UpdateUserPayload) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(buildApiUrl(`/users/${userId}`), {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update user");
        }

        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateUser, isLoading, error };
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(buildApiUrl(`/users/${userId}`), {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete user");
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteUser, isLoading, error };
}

/**
 * Hook to export users to CSV
 */
export function useExportUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportUsers = useCallback(async (filters: UserFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const queryString = params.toString();
      const endpoint = `/users/export${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(buildApiUrl(endpoint), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { exportUsers, isLoading, error };
}
