// apps/frontend/lib/api/endpoints/transfer.ts
import { ApiClient } from "../api-client";

export interface Transfer {
  id: string;
  fromTeacherId: string;
  toTeacherId?: string;
  studentId: string;
  fromClassId: string;
  toClassId: string;
  reason: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferData {
  studentId: string;
  fromClassId: string;
  toClassId: string;
  reason: string;
  toTeacherId?: string;
}

export interface UpdateTransferData {
  toClassId?: string;
  reason?: string;
  notes?: string;
}

export interface TransferResponse {
  notes?: string;
}

export interface TransferMatch {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  matchScore: number;
}

export const transferApi = {
  // Create a new transfer request
  create: (data: CreateTransferData) =>
    ApiClient.post<{ transfer: Transfer }>("/api/v1/transfer", data),

  // Get all transfer requests
  getAll: (params?: {
    status?: string;
    fromTeacherId?: string;
    toTeacherId?: string;
    studentId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.fromTeacherId)
      queryParams.append("fromTeacherId", params.fromTeacherId);
    if (params?.toTeacherId)
      queryParams.append("toTeacherId", params.toTeacherId);
    if (params?.studentId) queryParams.append("studentId", params.studentId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ transfers: Transfer[] }>(
      `/api/v1/transfer${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get transfer by ID
  getById: (id: string) =>
    ApiClient.get<{ transfer: Transfer }>(`/api/v1/transfer/${id}`),

  // Update transfer request
  update: (id: string, data: UpdateTransferData) =>
    ApiClient.patch<{ transfer: Transfer }>(`/api/v1/transfer/${id}`, data),

  // Delete transfer request
  delete: (id: string) =>
    ApiClient.delete<{ message: string }>(`/api/v1/transfer/${id}`),

  // Accept transfer request
  accept: (id: string, data?: TransferResponse) =>
    ApiClient.post<{ transfer: Transfer }>(
      `/api/v1/transfer/${id}/accept`,
      data
    ),

  // Reject transfer request
  reject: (id: string, data?: TransferResponse) =>
    ApiClient.post<{ transfer: Transfer }>(
      `/api/v1/transfer/${id}/reject`,
      data
    ),

  // Verify transfer eligibility
  verify: (studentId: string, toClassId: string) =>
    ApiClient.post<{ eligible: boolean; message?: string }>(
      "/api/v1/transfer/verify",
      {
        studentId,
        toClassId,
      }
    ),

  // Get pending transfers for current teacher
  getPending: () =>
    ApiClient.get<{ transfers: Transfer[] }>("/api/v1/transfer/pending"),

  // Get transfer matches (teachers willing to accept transfers)
  getMatches: (studentId: string, fromClassId: string) =>
    ApiClient.get<{ matches: TransferMatch[] }>(
      `/api/v1/transfer/matches?studentId=${studentId}&fromClassId=${fromClassId}`
    ),

  // Get transfers by student
  getByStudent: (studentId: string) =>
    ApiClient.get<{ transfers: Transfer[] }>(
      `/api/v1/transfer/student/${studentId}`
    ),

  // Get transfers by teacher (sent or received)
  getByTeacher: (teacherId: string, type?: "sent" | "received") => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append("type", type);
    const queryString = queryParams.toString();
    return ApiClient.get<{ transfers: Transfer[] }>(
      `/api/v1/transfer/teacher/${teacherId}${queryString ? `?${queryString}` : ""}`
    );
  },
};
