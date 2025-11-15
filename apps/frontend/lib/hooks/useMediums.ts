import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mediumsApi, type Medium } from "@/lib/api/endpoints/mediums";
import { toast } from "sonner";

export const useMediums = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["mediums", params],
    queryFn: async () => {
      const response = await mediumsApi.getAll(params);
      return response.mediums || [];
    },
  });
};

export const useMedium = (id: string) => {
  return useQuery({
    queryKey: ["medium", id],
    queryFn: () => mediumsApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateMedium = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; code?: string }) =>
      mediumsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      toast.success("Medium created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create medium");
    },
  });
};

export const useUpdateMedium = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medium> }) =>
      mediumsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      toast.success("Medium updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update medium");
    },
  });
};

export const useDeleteMedium = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediumsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediums"] });
      toast.success("Medium deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete medium");
    },
  });
};
