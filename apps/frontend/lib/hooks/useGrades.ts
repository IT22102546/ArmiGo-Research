import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradesApi, type Grade } from "@/lib/api/endpoints/grades";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useGrades");

export const useGrades = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["grades", params],
    queryFn: async () => {
      const response = await gradesApi.getAll(params);
      return response.grades || [];
    },
  });
};

export const useGrade = (id: string) => {
  return useQuery({
    queryKey: ["grade", id],
    queryFn: () => gradesApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; code?: string }) =>
      gradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      handleApiSuccess("Grade created successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to create grade:", error);
      handleApiError(error, "useGrades.createGrade", "Failed to create grade");
    },
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Grade> }) =>
      gradesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      handleApiSuccess("Grade updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update grade:", error);
      handleApiError(error, "useGrades.updateGrade", "Failed to update grade");
    },
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      handleApiSuccess("Grade deleted successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to delete grade:", error);
      handleApiError(error, "useGrades.deleteGrade", "Failed to delete grade");
    },
  });
};
