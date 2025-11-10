import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/endpoints/users";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useUsers");

export const useUsers = (params?: {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await usersApi.getAll(params);
      return response.users || [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await usersApi.getById(id);
      return response.user;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleApiSuccess("User created successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to create user:", error);
      handleApiError(error, "useUsers.createUser", "Failed to create user");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      handleApiSuccess("User updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update user:", error);
      handleApiError(error, "useUsers.updateUser", "Failed to update user");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleApiSuccess("User deleted successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to delete user:", error);
      handleApiError(error, "useUsers.deleteUser", "Failed to delete user");
    },
  });
};
