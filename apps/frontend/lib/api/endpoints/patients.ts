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

export interface Physiotherapist {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  phone: string;
  email?: string;
  isActive: boolean;
  hospitalId: string;
  availabilityStatus?: string;
  availabilityNote?: string;
  availabilityUpdatedAt?: string;
  hospital?: {
    id: string;
    name: string;
    zoneId?: string;
    zone?: { id: string; name: string };
  };
  unavailableDates?: Array<{ id: string; date: string; reason?: string }>;
}

export interface AdmissionTracking {
  id: string;
  childId: string;
  physiotherapistId?: string;
  hospitalId?: string;
  deviceId?: string;
  admissionType: string;
  status: string;
  admissionDate: string;
  startTime?: string;
  endTime?: string;
  dischargeDate?: string;
  clinic?: string;
  room?: string;
  notes?: string;
  createdAt: string;
  child?: { id: string; firstName: string; lastName: string; age: number; diagnosis?: string };
  physiotherapist?: { id: string; name: string };
  hospital?: { id: string; name: string };
  device?: { id: string; serialNumber: string; deviceType: string };
}

export interface Hospital {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: string;
  districtId?: string;
  zoneId?: string;
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

  // Get admission trackings (sessions)
  getAdmissionTrackings: (filters?: {
    hospitalId?: string;
    childId?: string;
    physiotherapistId?: string;
    admissionType?: string;
    status?: string;
    search?: string;
  }) =>
    ApiClient.get<{ success: boolean; data: AdmissionTracking[] }>("/patients/management/admissions", {
      params: filters,
    }),

  // Get physiotherapists
  getPhysiotherapists: (hospitalId?: string, includeInactive?: boolean) =>
    ApiClient.get<{ data: Physiotherapist[] }>("/patients/locations/physiotherapists", {
      params: { hospitalId, includeInactive },
    }),

  // Create physiotherapist
  createPhysiotherapist: (data: {
    name: string;
    phone: string;
    email?: string;
    hospitalId: string;
    specialization?: string;
  }) => ApiClient.post<Physiotherapist>("/patients/locations/physiotherapists", data),

  // Update physiotherapist
  updatePhysiotherapist: (id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    hospitalId?: string;
    specialization?: string;
  }) => ApiClient.put<Physiotherapist>(`/patients/locations/physiotherapists/${id}`, data),

  // Set physiotherapist active/inactive
  setPhysiotherapistStatus: (id: string, isActive: boolean) =>
    ApiClient.put<Physiotherapist>(`/patients/locations/physiotherapists/${id}/status`, { isActive }),

  // Set physiotherapist availability
  setPhysioAvailability: (id: string, status: "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE", note?: string) =>
    ApiClient.put(`/patients/locations/physiotherapists/${id}/availability`, { status, note }),

  // Delete physiotherapist
  deletePhysiotherapist: (id: string, mode: "inactive" | "permanent" = "permanent") =>
    ApiClient.delete<{ message: string }>(`/patients/locations/physiotherapists/${id}?mode=${mode}`),

  // Get hospitals list
  getHospitals: () =>
    ApiClient.get<{ success: boolean; data: Hospital[] }>("/patients/locations/hospitals"),

  // Get admission tracking options (select lists)
  getAdmissionTrackingOptions: (hospitalId?: string) =>
    ApiClient.get<any>("/patients/management/admissions/options", {
      params: { hospitalId },
    }),

  // Create admission tracking
  createAdmissionTracking: (data: Partial<AdmissionTracking> & {
    childId: string;
    admissionDate: string;
    startTime: string;
    endTime: string;
  }) => ApiClient.post<AdmissionTracking>("/patients/management/admissions", data),

  // Update admission tracking
  updateAdmissionTracking: (id: string, data: Partial<AdmissionTracking>) =>
    ApiClient.put<AdmissionTracking>(`/patients/management/admissions/${id}`, data),

  // Update admission tracking outcome
  updateAdmissionTrackingStatus: (id: string, status: "ATTENDED_COMPLETE" | "ABSENT_INCOMPLETE") =>
    ApiClient.put(`/patients/management/admissions/${id}/status`, { status }),

  // Delete admission tracking
  deleteAdmissionTracking: (id: string) =>
    ApiClient.delete<{ message: string }>(`/patients/management/admissions/${id}`),
};
