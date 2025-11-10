/** Exam query hooks (TanStack Query). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi } from "@/lib/api/endpoints/exams";
import { queryKeys } from "@/lib/query";
import { toast } from "sonner";

interface ExamFilters {
  classId?: string;
  subjectId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get all exams
 */
export function useExams(filters?: ExamFilters) {
  return useQuery({
    queryKey: queryKeys.exams.list(filters),
    queryFn: async () => {
      return await examsApi.getAll(filters);
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get exam by ID
 */
export function useExam(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: async () => {
      return await examsApi.getById(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get exam results
 */
export function useExamResults(examId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.exams.results(examId),
    queryFn: async () => {
      return await examsApi.getResults(examId);
    },
    enabled: enabled && !!examId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create exam mutation
 */
export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await examsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() });
      toast.success("Exam created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create exam");
    },
  });
}

/**
 * Update exam mutation
 */
export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await examsApi.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.exams.detail(id) });

      const previousExam = queryClient.getQueryData(queryKeys.exams.detail(id));

      queryClient.setQueryData(queryKeys.exams.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousExam };
    },
    onSuccess: (updatedExam, { id }) => {
      queryClient.setQueryData(queryKeys.exams.detail(id), updatedExam);
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() });
      toast.success("Exam updated successfully");
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousExam) {
        queryClient.setQueryData(
          queryKeys.exams.detail(id),
          context.previousExam
        );
      }
      toast.error(error.message || "Failed to update exam");
    },
  });
}

/**
 * Delete exam mutation
 */
export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await examsApi.delete(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.exams.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() });
      toast.success("Exam deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete exam");
    },
  });
}

/**
 * Publish exam results mutation
 */
export function usePublishExamResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: string) => {
      return await examsApi.publishExamResults(examId);
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exams.detail(examId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() });
      toast.success("Exam results published successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to publish exam results");
    },
  });
}
