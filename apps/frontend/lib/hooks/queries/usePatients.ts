import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientApi, Patient, PatientStats } from "@/lib/api/endpoints/patients";
import { useToast } from "@/lib/hooks/use-toast";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("PatientQueries");

export const PATIENT_QUERY_KEYS = {
  all: () => ["patients"],
  list: (filters?: any) => [...PATIENT_QUERY_KEYS.all(), "list", filters],
  detail: (id: string) => [...PATIENT_QUERY_KEYS.all(), "detail", id],
  stats: () => [...PATIENT_QUERY_KEYS.all(), "stats"],
};

/**
 * Get all patients with filtering and pagination
 */
export function useGetPatients(filters?: {
  hospitalId?: string;
  isActive?: boolean;
  gender?: string;
  diagnosis?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.list(filters),
    queryFn: () => patientApi.getAllPatients(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get single patient by ID
 */
export function useGetPatientById(id: string) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.detail(id),
    queryFn: () => patientApi.getPatientById(id),
    enabled: !!id,
  });
}

/**
 * Get patient statistics
 */
export function useGetPatientStats(hospitalId?: string) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.stats(),
    queryFn: () => patientApi.getPatientStats(hospitalId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Create patient mutation
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Patient>) => patientApi.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.all() });
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      logger.log("Patient created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.message || "Failed to create patient";
      toast({
        title: "Error",
        description: message,
      });
      logger.error("Failed to create patient:", error);
    },
  });
}

/**
 * Update patient mutation
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Patient>;
    }) => patientApi.updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.all() });
      queryClient.invalidateQueries({
        queryKey: PATIENT_QUERY_KEYS.detail(variables.id),
      });
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      logger.log("Patient updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.message || "Failed to update patient";
      toast({
        title: "Error",
        description: message,
      });
      logger.error("Failed to update patient:", error);
    },
  });
}

/**
 * Delete patient mutation
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => patientApi.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.all() });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      logger.log("Patient deleted successfully");
    },
    onError: (error: any) => {
      const message =
        error?.message || "Failed to delete patient";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      logger.error("Failed to delete patient:", error);
    },
  });
}
