import { ApiClient } from "../api-client";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodType?: string;
  ward?: string;
  diagnosis?: string;
  assignedDoctor?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  districtId?: string;
  zoneId?: string;
  hospitalId?: string;
  isActive: boolean;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsThisMonth: number;
  newPatientsThisWeek: number;
  averageAge: number;
  byGender: Record<string, number>;
  byDiagnosis: Record<string, number>;
  byWard: Record<string, number>;
}

export const patientApi = {
  // Create patient
  createPatient: (data: Partial<Patient>) =>
    ApiClient.post<{ user: Patient }>("/patients", data),

  // Get all patients
  getAllPatients: (filters?: {
    hospitalId?: string;
    isActive?: boolean;
    gender?: string;
    diagnosis?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    ApiClient.get<{ data: Patient[]; pagination: any }>("/patients", {
      params: filters,
    }),

  // Get patient by ID
  getPatientById: (id: string) =>
    ApiClient.get<{ data: Patient }>(`/patients/${id}`),

  // Get patient statistics
  getPatientStats: (hospitalId?: string) =>
    ApiClient.get<{ data: PatientStats }>("/patients/stats/overview", {
      params: { hospitalId },
    }),

  // Update patient
  updatePatient: (id: string, data: Partial<Patient>) =>
    ApiClient.put<{ data: Patient }>(`/patients/${id}`, data),

  // Delete patient
  deletePatient: (id: string) =>
    ApiClient.delete<{ message: string }>(`/patients/${id}`),
};
