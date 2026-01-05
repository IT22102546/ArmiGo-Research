// apps/frontend/lib/hooks/useZones.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type Zone,
  type CreateZoneDto,
  type UpdateZoneDto,
} from "@/lib/api/endpoints/admin";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useZones");

// Query keys
export const zoneKeys = {
  all: ["zones"] as const,
  lists: () => [...zoneKeys.all, "list"] as const,
  list: () => [...zoneKeys.lists()] as const,
  details: () => [...zoneKeys.all, "detail"] as const,
  detail: (id: string) => [...zoneKeys.details(), id] as const,
};

// Get all zones
export const useZones = () => {
  return useQuery({
    queryKey: zoneKeys.list(),
    queryFn: async () => {
      const response = await adminApi.getZones();
      return response.zones;
    },
  });
};

// Create zone
export const useCreateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateZoneDto) => adminApi.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      handleApiSuccess("Zone created successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to create zone:", error);
      handleApiError(error, "useZones.createZone", "Failed to create zone");
    },
  });
};

// Update zone
export const useUpdateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZoneDto }) =>
      adminApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      handleApiSuccess("Zone updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update zone:", error);
      handleApiError(error, "useZones.updateZone", "Failed to update zone");
    },
  });
};

// Delete zone
export const useDeleteZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      handleApiSuccess("Zone deleted successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to delete zone:", error);
      handleApiError(error, "useZones.deleteZone", "Failed to delete zone");
    },
  });
};
