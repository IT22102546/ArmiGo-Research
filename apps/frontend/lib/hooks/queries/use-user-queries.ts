/** User query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/endpoints/users";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";
import {
  optimisticUpdate,
  optimisticRemove,
} from "@/lib/query/optimistic-updates";

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * Get all users with filters
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      return await usersApi.getAll(filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      return await usersApi.getById(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Note: User statistics are available via analytics API (getDashboard) and
// teacher-specific stats via users/:id/teacher-stats endpoint.

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await usersApi.create(data);
    },
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      // Optimistically update - add to list with temporary ID
      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old: any) => {
          if (!old) return old;
          const tempUser = { ...newUser, id: "temp-" + Date.now() };
          return Array.isArray(old) ? [...old, tempUser] : old;
        }
      );

      return { previousUsers };
    },
    onSuccess: (newUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

      toast.success("User created successfully");
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.users.lists() },
          context.previousUsers
        );
      }

      toast.error(error.message || "Failed to create user");
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await usersApi.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });

      // Snapshot previous values
      const previousUser = queryClient.getQueryData(queryKeys.users.detail(id));
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      // Optimistically update detail
      queryClient.setQueryData(queryKeys.users.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Optimistically update in lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old: any) => {
          if (!old) return old;
          return optimisticUpdate(old, id, data);
        }
      );

      return { previousUser, previousUsers };
    },
    onSuccess: (updatedUser, { id }) => {
      // Update cache with real data
      queryClient.setQueryData(queryKeys.users.detail(id), updatedUser);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

      toast.success("User updated successfully");
    },
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(id),
          context.previousUser
        );
      }
      if (context?.previousUsers) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.users.lists() },
          context.previousUsers
        );
      }

      toast.error(error.message || "Failed to update user");
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await usersApi.delete(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old: any) => {
          if (!old) return old;
          return optimisticRemove(old, id);
        }
      );

      return { previousUsers };
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

      toast.success("User deleted successfully");
    },
    onError: (error: any, id, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.users.lists() },
          context.previousUsers
        );
      }

      toast.error(error.message || "Failed to delete user");
    },
  });
}

/**
 * Update user status mutation
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await usersApi.updateStatus(id, status);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user status");
    },
  });
}
