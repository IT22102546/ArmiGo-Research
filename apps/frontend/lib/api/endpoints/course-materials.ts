import { ApiClient } from "../api-client";

export type MaterialType =
  | "NOTES"
  | "SLIDES"
  | "VIDEO"
  | "ASSIGNMENT"
  | "REFERENCE"
  | "OTHER";

export interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  grade: string[];
  subject?: string;
  type: MaterialType;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  classId?: string;
  uploadedById: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

export interface CourseMaterialQuery {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  subject?: string;
  type?: MaterialType;
  classId?: string;
  isPublic?: boolean;
}

export interface CreateCourseMaterialDto {
  title: string;
  description?: string;
  grade: string[];
  subject?: string;
  type: MaterialType;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  classId?: string;
  isPublic?: boolean;
}

export interface UpdateCourseMaterialDto {
  title?: string;
  description?: string;
  grade?: string[];
  subject?: string;
  type?: MaterialType;
  isPublic?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const courseMaterialsApi = {
  /**
   * Get all course materials with pagination and filtering
   */
  getAll: (query?: CourseMaterialQuery) =>
    ApiClient.get<PaginatedResponse<CourseMaterial>>("/course-materials", {
      params: query,
    }),

  /**
   * Get materials uploaded by the current user
   */
  getMyMaterials: (query?: CourseMaterialQuery) =>
    ApiClient.get<PaginatedResponse<CourseMaterial>>(
      "/course-materials/my-materials",
      { params: query }
    ),

  /**
   * Get materials for a specific class
   */
  getByClass: (classId: string) =>
    ApiClient.get<CourseMaterial[]>(`/course-materials/class/${classId}`),

  /**
   * Get a specific material by ID
   */
  getOne: (id: string) =>
    ApiClient.get<CourseMaterial>(`/course-materials/${id}`),

  /**
   * Create a new course material
   */
  create: (data: CreateCourseMaterialDto) =>
    ApiClient.post<CourseMaterial>("/course-materials", data),

  /**
   * Upload a file and create course material
   */
  upload: (formData: FormData) =>
    ApiClient.post<CourseMaterial>("/course-materials/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  /**
   * Update a course material
   */
  update: (id: string, data: UpdateCourseMaterialDto) =>
    ApiClient.patch<CourseMaterial>(`/course-materials/${id}`, data),

  /**
   * Delete a course material
   */
  delete: (id: string) => ApiClient.delete(`/course-materials/${id}`),

  /**
   * Track download of a material
   */
  trackDownload: (id: string) =>
    ApiClient.post<{ message: string }>(`/course-materials/${id}/download`),
};
