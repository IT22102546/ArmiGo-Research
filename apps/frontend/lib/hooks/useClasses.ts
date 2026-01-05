// apps/frontend/lib/hooks/useClasses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/endpoints/classes";
import { toast } from "sonner";

// Query keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
    grade?: string;
  }) => [...classKeys.lists(), params] as const,
  myClasses: () => [...classKeys.all, "my-classes"] as const,
  teacherClasses: () => [...classKeys.all, "teacher-classes"] as const,
  todaysClasses: () => [...classKeys.all, "todays-classes"] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  enrolledStudents: (id: string) =>
    [...classKeys.all, "enrolled-students", id] as const,
  teachersList: () => [...classKeys.all, "teachers-list"] as const,
  studentsList: (grade?: string) =>
    [...classKeys.all, "students-list", { grade }] as const,
};

// Get all classes with pagination
export const useClasses = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  subject?: string;
  grade?: string;
}) => {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => classesApi.getAll(params),
  });
};

// Get my classes (based on role)
export const useMyClasses = () => {
  return useQuery({
    queryKey: classKeys.myClasses(),
    queryFn: () => classesApi.getMyClasses(),
  });
};

// Get teacher classes
export const useTeacherClasses = () => {
  return useQuery({
    queryKey: classKeys.teacherClasses(),
    queryFn: () => classesApi.getTeacherClasses(),
  });
};

// Get today's classes
export const useTodaysClasses = () => {
  return useQuery({
    queryKey: classKeys.todaysClasses(),
    queryFn: () => classesApi.getTodaysClasses(),
  });
};

// Get class by ID
export const useClass = (id: string) => {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classesApi.getById(id),
    enabled: !!id,
  });
};

// Get enrolled students
export const useEnrolledStudents = (classId: string) => {
  return useQuery({
    queryKey: classKeys.enrolledStudents(classId),
    queryFn: () => classesApi.getEnrolledStudents(classId),
    enabled: !!classId,
  });
};

// Get teachers list
export const useTeachersList = () => {
  return useQuery({
    queryKey: classKeys.teachersList(),
    queryFn: () => classesApi.getTeachersList(),
  });
};

// Get students list
export const useStudentsList = (grade?: string) => {
  return useQuery({
    queryKey: classKeys.studentsList(grade),
    queryFn: () => classesApi.getStudentsList(grade),
  });
};

// Create class
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
      queryClient.invalidateQueries({ queryKey: classKeys.teacherClasses() });
      toast.success("Class created successfully");
    },
    onError: () => {
      toast.error("Failed to create class");
    },
  });
};

// Update class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      classesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
      toast.success("Class updated successfully");
    },
    onError: () => {
      toast.error("Failed to update class");
    },
  });
};

// Delete class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
      toast.success("Class deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete class");
    },
  });
};

// Enroll student
export const useEnrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: { studentId: string; isPaid?: boolean };
    }) => classesApi.enrollStudent(classId, data),
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.enrolledStudents(classId),
      });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      toast.success("Student enrolled successfully");
    },
    onError: () => {
      toast.error("Failed to enroll student");
    },
  });
};

// Unenroll student
export const useUnenrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
    }: {
      classId: string;
      studentId: string;
    }) => classesApi.unenrollStudent(classId, studentId),
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.enrolledStudents(classId),
      });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      toast.success("Student unenrolled successfully");
    },
    onError: () => {
      toast.error("Failed to unenroll student");
    },
  });
};

// Start class
export const useStartClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesApi.startClass(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
      queryClient.invalidateQueries({ queryKey: classKeys.todaysClasses() });
      toast.success("Class started successfully");
    },
    onError: () => {
      toast.error("Failed to start class");
    },
  });
};

// Stop class
export const useStopClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesApi.stopClass(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
      queryClient.invalidateQueries({ queryKey: classKeys.todaysClasses() });
      toast.success("Class stopped successfully");
    },
    onError: () => {
      toast.error("Failed to stop class");
    },
  });
};
