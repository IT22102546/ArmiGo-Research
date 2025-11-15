/** Class and batch query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/endpoints/classes";
import { batchesApi } from "@/lib/api/endpoints/batches";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";
import {
  optimisticUpdate,
  optimisticRemove,
} from "@/lib/query/optimistic-updates";

interface ClassFilters {
  gradeId?: string;
  teacherId?: string;
  search?: string;
  status?: string;
}

interface BatchFilters {
  gradeId?: string;
  search?: string;
}

/**
 * Get all classes
 */
export function useClasses(filters?: ClassFilters) {
  return useQuery({
    queryKey: queryKeys.classes.list(filters),
    queryFn: async () => {
      return await classesApi.getAll(filters);
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get class by ID
 */
export function useClass(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.classes.detail(id),
    queryFn: async () => {
      return await classesApi.getById(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get class students
 */
export function useClassStudents(classId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.classes.students(classId),
    queryFn: async () => {
      const response = await classesApi.getEnrolledStudents(classId);
      return response.students;
    },
    enabled: enabled && !!classId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create class mutation
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await classesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.lists() });
      toast.success("Class created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create class");
    },
  });
}

/**
 * Update class mutation
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await classesApi.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.classes.detail(id),
      });

      const previousClass = queryClient.getQueryData(
        queryKeys.classes.detail(id)
      );

      queryClient.setQueryData(queryKeys.classes.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousClass };
    },
    onSuccess: (updatedClass, { id }) => {
      queryClient.setQueryData(queryKeys.classes.detail(id), updatedClass);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.lists() });
      toast.success("Class updated successfully");
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousClass) {
        queryClient.setQueryData(
          queryKeys.classes.detail(id),
          context.previousClass
        );
      }
      toast.error(error.message || "Failed to update class");
    },
  });
}

/**
 * Delete class mutation
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await classesApi.delete(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.classes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.lists() });
      toast.success("Class deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete class");
    },
  });
}

/**
 * Get all batches with optional filters
 */
export function useBatches(filters?: BatchFilters) {
  return useQuery({
    queryKey: queryKeys.batches.list(filters),
    queryFn: async () => {
      return await batchesApi.getAll(filters);
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get batch by ID
 */
export function useBatch(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.batches.detail(id),
    queryFn: async () => {
      return await batchesApi.getOne(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get batches by grade ID
 */
export function useBatchesByGrade(gradeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.batches.byGrade(gradeId),
    queryFn: async () => {
      return await batchesApi.getByGrade(gradeId);
    },
    enabled: enabled && !!gradeId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create batch mutation
 */
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code?: string;
      gradeId: string;
    }) => {
      return await batchesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      toast.success("Batch created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create batch");
    },
  });
}

/**
 * Update batch mutation
 */
export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        code?: string;
        gradeId?: string;
        isActive?: boolean;
      };
    }) => {
      return await batchesApi.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      toast.success("Batch updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update batch");
    },
  });
}

/**
 * Delete batch mutation
 */
export function useDeleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await batchesApi.delete(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.batches.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      toast.success("Batch deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete batch");
    },
  });
}

/**
 * Enroll student in class mutation
 */
export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      studentId,
      isPaid,
    }: {
      classId: string;
      studentId: string;
      isPaid?: boolean;
    }) => {
      return await classesApi.enrollStudent(classId, { studentId, isPaid });
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.detail(classId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.students(classId),
      });
      toast.success("Student enrolled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to enroll student");
    },
  });
}

/**
 * Unenroll student from class mutation
 */
export function useUnenrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      studentId,
    }: {
      classId: string;
      studentId: string;
    }) => {
      await classesApi.unenrollStudent(classId, studentId);
      return { classId, studentId };
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.detail(classId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.students(classId),
      });
      toast.success("Student removed from class");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove student");
    },
  });
}
