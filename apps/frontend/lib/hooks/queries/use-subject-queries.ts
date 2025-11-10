/** Subject query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "@/lib/api/endpoints/subjects";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";

interface SubjectFilters {
  gradeId?: string;
  search?: string;
  includeInactive?: boolean;
}

/**
 * Get all subjects
 */
export function useSubjects(filters?: SubjectFilters) {
  return useQuery({
    queryKey: queryKeys.subjects.list(filters),
    queryFn: async () => {
      return await subjectsApi.findAll(filters?.includeInactive);
    },
    staleTime: 5 * 60 * 1000, // Subjects don't change often
  });
}

/**
 * Get subject by ID
 */
export function useSubject(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.subjects.detail(id),
    queryFn: async () => {
      return await subjectsApi.findOne(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Note: Teacher-subject relationships are managed via TeacherSubjectAssignment.
// Use teacher-assignments API for teacher-subject operations.

/**
 * Create subject mutation
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await subjectsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.lists() });
      toast.success("Subject created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create subject");
    },
  });
}

/**
 * Update subject mutation
 */
export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await subjectsApi.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.subjects.detail(id),
      });

      const previousSubject = queryClient.getQueryData(
        queryKeys.subjects.detail(id)
      );

      queryClient.setQueryData(queryKeys.subjects.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousSubject };
    },
    onSuccess: (updatedSubject, { id }) => {
      queryClient.setQueryData(queryKeys.subjects.detail(id), updatedSubject);
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.lists() });
      toast.success("Subject updated successfully");
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousSubject) {
        queryClient.setQueryData(
          queryKeys.subjects.detail(id),
          context.previousSubject
        );
      }
      toast.error(error.message || "Failed to update subject");
    },
  });
}

/**
 * Delete subject mutation
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await subjectsApi.remove(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.subjects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.lists() });
      toast.success("Subject deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete subject");
    },
  });
}
