// apps/frontend/lib/api/endpoints/teacher-transfers.ts
import { ApiClient } from "../api-client";

export enum TransferRequestStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TeacherTransferRequest {
  id: string;
  registrationId: string;
  requesterId: string;
  receiverId?: string;
  currentSchool: string;
  currentSchoolType?: string; // 1AB, 1C, Type 2, Type 3
  currentDistrict: string;
  currentZone: string;
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: string;
  level: string;
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
  attachments?: string[];
  status: TransferRequestStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeacherTransferRequestDetail extends Omit<
  TeacherTransferRequest,
  "currentDistrict"
> {
  // Extended detail with full relations
  currentDistrict?:
    | {
        id: string;
        name: string;
        code: string;
      }
    | string;
  desiredZones?: Array<{
    id: string;
    zone: {
      id: string;
      name: string;
      code: string;
    };
    priority: number;
  }>;
  messages?: Array<{
    id: string;
    senderId: string;
    content: string;
    read: boolean;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  verifier?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTeacherTransferDto {
  registrationId: string;
  currentSchool: string;
  currentSchoolType?: string; // 1AB, 1C, Type 2, Type 3
  currentDistrict: string;
  currentZone: string;
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: "Sinhala" | "Tamil" | "English";
  level: "A/L" | "O/L";
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
  attachments?: string[];
}

export interface UpdateTeacherTransferDto {
  registrationId?: string;
  currentSchool?: string;
  currentSchoolType?: string;
  currentDistrict?: string;
  currentZone?: string;
  fromZone?: string;
  toZones?: string[];
  subject?: string;
  medium?: string;
  level?: string;
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
  attachments?: string[];
}

export interface TeacherTransferMatch {
  id: string;
  registrationId: string;
  teacherId: string;
  teacherName: string;
  currentSchool: string;
  currentSchoolType?: string;
  currentZone: string;
  desiredZones: string[];
  subject: string;
  medium: string;
  level: string;
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  matchScore: number;
}

export interface TransferStats {
  total: number;
  pending: number;
  verified: number;
  accepted: number;
  rejected: number;
  completed: number;
  cancelled: number;
  bySubject: Record<string, number>;
  byMedium: Record<string, number>;
  byLevel: Record<string, number>;
}

export const teacherTransferApi = {
  // Create new transfer request
  create: (data: CreateTeacherTransferDto) =>
    ApiClient.post<TeacherTransferRequest>("/transfer", data),

  // Get all transfer requests with filters
  getAll: (params?: {
    status?: TransferRequestStatus;
    fromZone?: string;
    toZone?: string;
    subject?: string;
    medium?: string;
    level?: string;
    verified?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.fromZone) queryParams.append("fromZone", params.fromZone);
    if (params?.toZone) queryParams.append("toZone", params.toZone);
    if (params?.subject) queryParams.append("subject", params.subject);
    if (params?.medium) queryParams.append("medium", params.medium);
    if (params?.level) queryParams.append("level", params.level);
    if (params?.verified !== undefined)
      queryParams.append("verified", String(params.verified));
    const queryString = queryParams.toString();
    return ApiClient.get<TeacherTransferRequest[]>(
      `/transfer${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get my transfer requests
  getMyRequests: () =>
    ApiClient.get<TeacherTransferRequest[]>("/transfer/my-requests"),

  // Get received transfer requests
  getReceivedRequests: () =>
    ApiClient.get<TeacherTransferRequest[]>("/transfer/received"),

  // Find matching transfer requests
  findMatches: () => ApiClient.get<TeacherTransferMatch[]>("/transfer/matches"),

  // Get transfer statistics (Admin only)
  getStats: () => ApiClient.get<TransferStats>("/transfer/stats"),

  // Get transfer request by ID
  getById: (id: string) =>
    ApiClient.get<TeacherTransferRequest>(`/transfer/${id}`),

  // Update transfer request
  update: (id: string, data: UpdateTeacherTransferDto) =>
    ApiClient.put<TeacherTransferRequest>(`/transfer/${id}`, data),

  // Cancel transfer request
  cancel: (id: string) => ApiClient.delete<void>(`/transfer/${id}`),

  // Accept transfer match
  acceptTransfer: (id: string, data?: { notes?: string }) =>
    ApiClient.post<TeacherTransferRequest>(
      `/transfer/${id}/accept`,
      data || {}
    ),

  // Reject transfer match (Note: Backend doesn't have reject endpoint, handled via admin status change)

  // Verify transfer request (Admin only)
  verify: (data: { requestId: string; approved: boolean; notes?: string }) =>
    ApiClient.post<TeacherTransferRequest>("/transfer/verify", data),

  // Mark transfer as completed (Admin only)
  complete: (id: string) =>
    ApiClient.post<TeacherTransferRequest>(`/transfer/${id}/complete`, {}),

  // Get messages for a transfer request
  getMessages: (id: string) => ApiClient.get<any[]>(`/transfer/${id}/messages`),

  // Send message in transfer request
  sendMessage: (data: { transferRequestId: string; content: string }) =>
    ApiClient.post<any>("/transfer/messages", data),

  // Mark message as read
  markMessageRead: (messageId: string) =>
    ApiClient.patch<void>(`/transfer/messages/${messageId}/read`, {}),

  // Get unread message count
  getUnreadMessageCount: () =>
    ApiClient.get<{ count: number }>("/transfer/messages/unread-count"),

  // ADMIN ENDPOINTS

  // Get all transfer requests with filters (Admin only)
  getAllAdmin: (params?: {
    page?: number;
    limit?: number;
    status?: TransferRequestStatus;
    fromZoneId?: string;
    subjectId?: string;
    mediumId?: string;
    level?: string;
    searchTerm?: string;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status) queryParams.status = params.status;
    if (params?.fromZoneId) queryParams.fromZoneId = params.fromZoneId;
    if (params?.subjectId) queryParams.subjectId = params.subjectId;
    if (params?.mediumId) queryParams.mediumId = params.mediumId;
    if (params?.level) queryParams.level = params.level;
    if (params?.searchTerm) queryParams.search = params.searchTerm;

    return ApiClient.get<{
      data: TeacherTransferRequest[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>("/transfer/admin/all", { params: queryParams });
  },

  /**
   * Get detailed transfer request information (Admin only)
   */
  getDetailAdmin: (id: string) =>
    ApiClient.get<TeacherTransferRequestDetail>(`/transfer/admin/${id}/detail`),

  /**
   * Verify a transfer request (Admin only)
   */
  verifyAdmin: (id: string, data?: { notes?: string }) =>
    ApiClient.patch<{ message: string; request: TeacherTransferRequest }>(
      `/transfer/admin/${id}/verify`,
      data || {}
    ),

  /**
   * Update transfer request status (Admin only)
   */
  updateStatusAdmin: (
    id: string,
    data: { status: TransferRequestStatus; notes?: string }
  ) =>
    ApiClient.patch<{ message: string; request: TeacherTransferRequest }>(
      `/transfer/admin/${id}/status`,
      data
    ),
};
