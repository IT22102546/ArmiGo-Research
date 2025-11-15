// apps/frontend/lib/hooks/useAcademicYears.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  academicYearsApi,
  type AcademicYear,
  type AcademicYearQueryParams,
} from "@/lib/api/endpoints/academic-years";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useAcademicYears");

// Query keys
export const academicYearKeys = {
  all: ["academic-years"] as const,
  lists: () => [...academicYearKeys.all, "list"] as const,
  list: (params?: AcademicYearQueryParams) =>
    [...academicYearKeys.lists(), params] as const,
  current: () => [...academicYearKeys.all, "current"] as const,
  details: () => [...academicYearKeys.all, "detail"] as const,
  detail: (id: string) => [...academicYearKeys.details(), id] as const,
};

// Get all academic years with pagination
export const useAcademicYears = (params?: AcademicYearQueryParams) => {
  return useQuery({
    queryKey: academicYearKeys.list(params),
    queryFn: () => academicYearsApi.getAll(params),
  });
};

// Get current academic year
export const useCurrentAcademicYear = () => {
  return useQuery({
    queryKey: academicYearKeys.current(),
    queryFn: () => academicYearsApi.getCurrent(),
  });
};

// Get academic year by ID
export const useAcademicYear = (id: string) => {
  return useQuery({
    queryKey: academicYearKeys.detail(id),
    queryFn: () => academicYearsApi.getOne(id),
    enabled: !!id,
  });
};

// Create academic year
export const useCreateAcademicYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AcademicYear>) => academicYearsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.current() });
      handleApiSuccess("Academic year created successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to create academic year", error);
      handleApiError(
        error,
        "useAcademicYears.createAcademicYear",
        "Failed to create academic year"
      );
    },
  });
};

// Update academic year
export const useUpdateAcademicYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicYear> }) =>
      academicYearsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.current() });
      handleApiSuccess("Academic year updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update academic year", error);
      handleApiError(
        error,
        "useAcademicYears.updateAcademicYear",
        "Failed to update academic year"
      );
    },
  });
};

// Delete academic year (soft delete)
export const useDeleteAcademicYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => academicYearsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.current() });
      handleApiSuccess("Academic year deleted successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to delete academic year", error);
      handleApiError(
        error,
        "useAcademicYears.deleteAcademicYear",
        "Failed to delete academic year"
      );
    },
  });
};

// Hard delete academic year
export const useHardDeleteAcademicYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => academicYearsApi.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academicYearKeys.current() });
      handleApiSuccess("Academic year permanently deleted");
    },
    onError: (error: any) => {
      logger.error("Failed to permanently delete academic year", error);
      handleApiError(
        error,
        "useAcademicYears.hardDeleteAcademicYear",
        "Failed to permanently delete academic year"
      );
    },
  });
};
