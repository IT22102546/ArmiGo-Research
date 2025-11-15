// apps/frontend/lib/hooks/useSubjects.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subjectsApi,
  type Subject,
  type CreateSubjectDto,
  type UpdateSubjectDto,
} from "@/lib/api/endpoints/subjects";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
const logger = createLogger("useSubjects");

// Query keys
export const subjectKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
  list: (includeInactive?: boolean) =>
    [...subjectKeys.lists(), { includeInactive }] as const,
  details: () => [...subjectKeys.all, "detail"] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
  categories: () => [...subjectKeys.all, "categories"] as const,
  category: (category: string) =>
    [...subjectKeys.all, "category", category] as const,
  search: (query: string) => [...subjectKeys.all, "search", query] as const,
};

// Get all subjects
export const useSubjects = (includeInactive?: boolean) => {
  return useQuery({
    queryKey: subjectKeys.list(includeInactive),
    queryFn: () => subjectsApi.findAll(includeInactive),
  });
};

// Get subject by ID
export const useSubject = (id: string) => {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectsApi.findOne(id),
    enabled: !!id,
  });
};

// Get all categories
export const useSubjectCategories = () => {
  return useQuery({
    queryKey: subjectKeys.categories(),
    queryFn: () => subjectsApi.getCategories(),
  });
};

// Get subjects by category
export const useSubjectsByCategory = (category: string) => {
  return useQuery({
    queryKey: subjectKeys.category(category),
    queryFn: () => subjectsApi.getByCategory(category),
    enabled: !!category,
  });
};

// Search subjects
export const useSearchSubjects = (query: string) => {
  return useQuery({
    queryKey: subjectKeys.search(query),
    queryFn: () => subjectsApi.search(query),
    enabled: query.length >= 2,
  });
};

// Create subject
export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubjectDto) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.categories() });
      handleApiSuccess("Subject created successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to create subject:", error);
      handleApiError(
        error,
        "useSubjects.createSubject",
        "Failed to create subject"
      );
    },
  });
};

// Update subject
export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectDto }) =>
      subjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) });
      handleApiSuccess("Subject updated successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to update subject:", error);
      handleApiError(
        error,
        "useSubjects.updateSubject",
        "Failed to update subject"
      );
    },
  });
};

// Delete subject
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, soft = true }: { id: string; soft?: boolean }) =>
      subjectsApi.remove(id, soft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      handleApiSuccess("Subject deleted successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to delete subject:", error);
      handleApiError(
        error,
        "useSubjects.deleteSubject",
        "Failed to delete subject"
      );
    },
  });
};

// Restore subject
export const useRestoreSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectsApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) });
      handleApiSuccess("Subject restored successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to restore subject:", error);
      handleApiError(
        error,
        "useSubjects.restoreSubject",
        "Failed to restore subject"
      );
    },
  });
};

// Upload subject image
export const useUploadSubjectImage = () => {
  return useMutation({
    mutationFn: (file: File) => subjectsApi.uploadImage(file),
    onSuccess: () => {
      handleApiSuccess("Image uploaded successfully");
    },
    onError: (error: any) => {
      logger.error("Failed to upload image:", error);
      handleApiError(
        error,
        "useSubjects.uploadSubjectImage",
        "Failed to upload image"
      );
    },
  });
};
