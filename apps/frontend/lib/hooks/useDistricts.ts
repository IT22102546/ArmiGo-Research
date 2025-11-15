// apps/frontend/lib/hooks/useDistricts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type District,
  type CreateDistrictDto,
  type UpdateDistrictDto,
} from "@/lib/api/endpoints/admin";
import { toast } from "sonner";

// Query keys
export const districtKeys = {
  all: ["districts"] as const,
  lists: () => [...districtKeys.all, "list"] as const,
  list: (zoneId?: string) => [...districtKeys.lists(), { zoneId }] as const,
  details: () => [...districtKeys.all, "detail"] as const,
  detail: (id: string) => [...districtKeys.details(), id] as const,
};

// Get all districts (optionally filtered by zone)
export const useDistricts = (zoneId?: string) => {
  return useQuery({
    queryKey: districtKeys.list(zoneId),
    queryFn: async () => {
      const response = await adminApi.getDistricts(zoneId);
      return response.districts;
    },
  });
};

// Create district
export const useCreateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDistrictDto) => adminApi.createDistrict(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: districtKeys.lists() });
      toast.success("District created successfully");
    },
    onError: () => {
      toast.error("Failed to create district");
    },
  });
};

// Update district
export const useUpdateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDistrictDto }) =>
      adminApi.updateDistrict(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: districtKeys.lists() });
      toast.success("District updated successfully");
    },
    onError: () => {
      toast.error("Failed to update district");
    },
  });
};

// Delete district
export const useDeleteDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteDistrict(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: districtKeys.lists() });
      toast.success("District deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete district");
    },
  });
};
