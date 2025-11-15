// apps/frontend/lib/api/endpoints/admin.ts
import { ApiClient } from "../api-client";

// DTOs
// Geographic Hierarchy: Province → District → Zone → Institution

export interface Province {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
  _count?: {
    districts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  provinceId: string;
  province?: Province;
  sortOrder?: number;
  _count?: {
    zones: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  districtId: string;
  district?: District;
  sortOrder?: number;
  _count?: {
    institutions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  zoneId?: string;
  zone?: Zone;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  type?: string;
  sortOrder?: number;
  isActive: boolean;
  _count?: {
    teachers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: string;
  code?: string;
  level: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Medium {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectCode {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create/Update DTOs
export interface CreateProvinceDto {
  name: string;
  code?: string;
  sortOrder?: number;
}

export interface UpdateProvinceDto {
  name?: string;
  code?: string;
  sortOrder?: number;
}

export interface CreateDistrictDto {
  name: string;
  code?: string;
  provinceId: string;
  sortOrder?: number;
}

export interface UpdateDistrictDto {
  name?: string;
  code?: string;
  provinceId?: string;
  sortOrder?: number;
}

export interface CreateZoneDto {
  name: string;
  code?: string;
  districtId: string;
  sortOrder?: number;
}

export interface UpdateZoneDto {
  name?: string;
  code?: string;
  districtId?: string;
  sortOrder?: number;
}

export interface CreateInstitutionDto {
  name: string;
  code?: string;
  zoneId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  type?: string;
  sortOrder?: number;
}

export interface UpdateInstitutionDto {
  name?: string;
  code?: string;
  zoneId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  type?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateGradeDto {
  name: string;
  code?: string;
  level?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateGradeDto {
  name?: string;
  code?: string;
  level?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateMediumDto {
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateMediumDto {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface CreateAcademicYearDto {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateAcademicYearDto {
  year?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateSubjectCodeDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectCodeDto {
  name?: string;
  code?: string;
  description?: string;
}

export interface EnrollmentStats {
  overview: {
    totalEnrolled: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageCompletionRate: number;
  };
  byGrade: Array<{
    grade: number;
    count: number;
    completionRate: number;
  }>;
  recentEnrollments: Array<{
    id: string;
    studentId: string;
    subjectId: string;
    createdAt: string;
    student: {
      name: string;
      email: string;
    };
    subject: {
      name: string;
      grade: number;
    };
  }>;
}

export const adminApi = {
  // PROVINCES
  getProvinces: () =>
    ApiClient.get<{ total: number; provinces: Province[] }>("/admin/provinces"),

  createProvince: (data: CreateProvinceDto) =>
    ApiClient.post<{ message: string; province: Province }>(
      "/admin/provinces",
      data
    ),

  updateProvince: (id: string, data: UpdateProvinceDto) =>
    ApiClient.put<{ message: string; province: Province }>(
      `/admin/provinces/${id}`,
      data
    ),

  deleteProvince: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/provinces/${id}`),

  reorderProvinces: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; provinces: Province[] }>(
      "/admin/provinces/reorder",
      { items }
    ),

  // DISTRICTS
  getDistricts: (provinceId?: string) => {
    const queryParams = new URLSearchParams();
    if (provinceId) queryParams.append("provinceId", provinceId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; districts: District[] }>(
      `/admin/districts${queryString ? `?${queryString}` : ""}`
    );
  },

  createDistrict: (data: CreateDistrictDto) =>
    ApiClient.post<{ message: string; district: District }>(
      "/admin/districts",
      data
    ),

  updateDistrict: (id: string, data: UpdateDistrictDto) =>
    ApiClient.put<{ message: string; district: District }>(
      `/admin/districts/${id}`,
      data
    ),

  deleteDistrict: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/districts/${id}`),

  reorderDistricts: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; districts: District[] }>(
      "/admin/districts/reorder",
      { items }
    ),

  // ZONES
  getZones: (districtId?: string) => {
    const queryParams = new URLSearchParams();
    if (districtId) queryParams.append("districtId", districtId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; zones: Zone[] }>(
      `/admin/zones${queryString ? `?${queryString}` : ""}`
    );
  },

  createZone: (data: CreateZoneDto) =>
    ApiClient.post<{ message: string; zone: Zone }>("/admin/zones", data),

  updateZone: (id: string, data: UpdateZoneDto) =>
    ApiClient.put<{ message: string; zone: Zone }>(`/admin/zones/${id}`, data),

  deleteZone: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/zones/${id}`),

  reorderZones: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; zones: Zone[] }>("/admin/zones/reorder", {
      items,
    }),

  // INSTITUTIONS
  getInstitutions: (zoneId?: string) => {
    const queryParams = new URLSearchParams();
    if (zoneId) queryParams.append("zoneId", zoneId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; institutions: Institution[] }>(
      `/admin/institutions${queryString ? `?${queryString}` : ""}`
    );
  },

  getInstitution: (id: string) =>
    ApiClient.get<Institution>(`/admin/institutions/${id}`),

  createInstitution: (data: CreateInstitutionDto) =>
    ApiClient.post<{ message: string; institution: Institution }>(
      "/admin/institutions",
      data
    ),

  updateInstitution: (id: string, data: UpdateInstitutionDto) =>
    ApiClient.put<{ message: string; institution: Institution }>(
      `/admin/institutions/${id}`,
      data
    ),

  deleteInstitution: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/institutions/${id}`),

  reorderInstitutions: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; institutions: Institution[] }>(
      "/admin/institutions/reorder",
      { items }
    ),

  // GRADES
  getGrades: () =>
    ApiClient.get<{ total: number; grades: Grade[] }>("/admin/grades"),

  createGrade: (data: CreateGradeDto) =>
    ApiClient.post<{ message: string; grade: Grade }>("/admin/grades", data),

  updateGrade: (id: string, data: UpdateGradeDto) =>
    ApiClient.put<{ message: string; grade: Grade }>(
      `/admin/grades/${id}`,
      data
    ),

  deleteGrade: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/grades/${id}`),

  reorderGrades: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; grades: Grade[] }>(
      "/admin/grades/reorder",
      { items }
    ),

  // MEDIUMS
  getMediums: () =>
    ApiClient.get<{ total: number; mediums: Medium[] }>("/admin/mediums"),

  createMedium: (data: CreateMediumDto) =>
    ApiClient.post<{ message: string; medium: Medium }>("/admin/mediums", data),

  updateMedium: (id: string, data: UpdateMediumDto) =>
    ApiClient.put<{ message: string; medium: Medium }>(
      `/admin/mediums/${id}`,
      data
    ),

  deleteMedium: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/mediums/${id}`),

  // ACADEMIC YEARS
  getAcademicYears: () =>
    ApiClient.get<{ total: number; academicYears: AcademicYear[] }>(
      "/admin/academic-years"
    ),

  createAcademicYear: (data: CreateAcademicYearDto) =>
    ApiClient.post<{ message: string; academicYear: AcademicYear }>(
      "/admin/academic-years",
      data
    ),

  updateAcademicYear: (id: string, data: UpdateAcademicYearDto) =>
    ApiClient.put<{ message: string; academicYear: AcademicYear }>(
      `/admin/academic-years/${id}`,
      data
    ),

  deleteAcademicYear: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/academic-years/${id}`),

  reorderAcademicYears: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; academicYears: AcademicYear[] }>(
      "/admin/academic-years/reorder",
      { items }
    ),

  // SUBJECT CODES
  getSubjectCodes: () =>
    ApiClient.get<{ subjectCodes: SubjectCode[] }>("/admin/subject-codes"),

  createSubjectCode: (data: CreateSubjectCodeDto) =>
    ApiClient.post<{ subjectCode: SubjectCode }>("/admin/subject-codes", data),

  updateSubjectCode: (id: string, data: UpdateSubjectCodeDto) =>
    ApiClient.put<{ subjectCode: SubjectCode }>(
      `/admin/subject-codes/${id}`,
      data
    ),

  deleteSubjectCode: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/subject-codes/${id}`),

  // ENROLLMENT STATS
  getEnrollmentStats: () =>
    ApiClient.get<EnrollmentStats>("/admin/enrollment-stats"),

  getEnhancedEnrollmentStats: () =>
    ApiClient.get<any>("/admin/enrollment-stats/enhanced"),

  // BATCHES
  getBatches: (gradeId?: string) => {
    const queryParams = new URLSearchParams();
    if (gradeId) queryParams.append("gradeId", gradeId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; batches: any[] }>(
      `/admin/batches${queryString ? `?${queryString}` : ""}`
    );
  },

  createBatch: (data: {
    name: string;
    code?: string;
    gradeId: string;
    sortOrder?: number;
  }) => ApiClient.post<any>("/admin/batches", data),

  updateBatch: (
    id: string,
    data: {
      name?: string;
      code?: string;
      gradeId?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) => ApiClient.put<any>(`/admin/batches/${id}`, data),

  deleteBatch: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/batches/${id}`),

  reorderBatches: (items: { id: string; sortOrder: number }[]) =>
    ApiClient.post<{ message: string; batches: any[] }>(
      "/admin/batches/reorder",
      { items }
    ),

  // TEACHER ASSIGNMENTS
  getTeacherAssignments: (params?: {
    teacherProfileId?: string;
    subjectId?: string;
    gradeId?: string;
    mediumId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.teacherProfileId)
      queryParams.append("teacherProfileId", params.teacherProfileId);
    if (params?.subjectId) queryParams.append("subjectId", params.subjectId);
    if (params?.gradeId) queryParams.append("gradeId", params.gradeId);
    if (params?.mediumId) queryParams.append("mediumId", params.mediumId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; assignments: any[] }>(
      `/admin/teacher-assignments${queryString ? `?${queryString}` : ""}`
    );
  },

  createTeacherAssignment: (data: {
    teacherProfileId: string;
    subjectId: string;
    gradeId: string;
    mediumId: string;
    academicYear: string;
    canCreateExams?: boolean;
    isActive?: boolean;
  }) =>
    ApiClient.post<{ message: string; assignment: any }>(
      "/admin/teacher-assignments",
      data
    ),

  updateTeacherAssignment: (
    id: string,
    data: {
      canCreateExams?: boolean;
      isActive?: boolean;
    }
  ) =>
    ApiClient.put<{ message: string; assignment: any }>(
      `/admin/teacher-assignments/${id}`,
      data
    ),

  deleteTeacherAssignment: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/teacher-assignments/${id}`),

  // TEACHERS & FILTERED DROPDOWNS
  getTeachers: () =>
    ApiClient.get<{ total: number; teachers: any[] }>("/admin/teachers"),

  getFilteredSubjects: (gradeId?: string, mediumId?: string) => {
    const queryParams = new URLSearchParams();
    if (gradeId) queryParams.append("gradeId", gradeId);
    if (mediumId) queryParams.append("mediumId", mediumId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; subjects: any[] }>(
      `/admin/subjects/filtered${queryString ? `?${queryString}` : ""}`
    );
  },

  getFilteredTeachers: (
    subjectId?: string,
    gradeId?: string,
    mediumId?: string
  ) => {
    const queryParams = new URLSearchParams();
    if (subjectId) queryParams.append("subjectId", subjectId);
    if (gradeId) queryParams.append("gradeId", gradeId);
    if (mediumId) queryParams.append("mediumId", mediumId);
    const queryString = queryParams.toString();
    return ApiClient.get<{ total: number; teachers: any[] }>(
      `/admin/teachers/filtered${queryString ? `?${queryString}` : ""}`
    );
  },

  getTeacherCapabilities: (teacherProfileId: string) =>
    ApiClient.get<any>(`/admin/teachers/${teacherProfileId}/capabilities`),

  // SESSION MANAGEMENT
  getAllSessions: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/admin/security/sessions${queryString ? `?${queryString}` : ""}`
    );
  },

  terminateSession: (sessionId: string) =>
    ApiClient.delete<{ message: string }>(
      `/admin/security/sessions/${sessionId}`
    ),

  terminateUserSessions: (userId: string) =>
    ApiClient.delete<{ message: string }>(
      `/admin/security/sessions/user/${userId}`
    ),

  terminateAllSessions: () =>
    ApiClient.post<{ message: string }>(
      "/admin/security/sessions/terminate-all"
    ),

  // USER RESTRICTIONS
  getUserRestrictions: (userId: string) =>
    ApiClient.get<any>(`/admin/users/${userId}/restrictions`),

  blockUserLogin: (userId: string, reason: string, duration?: number) =>
    ApiClient.post<any>(`/admin/users/${userId}/restrictions/block`, {
      reason,
      duration,
    }),

  unblockUserLogin: (userId: string) =>
    ApiClient.post<any>(`/admin/users/${userId}/restrictions/unblock`),

  suspendUser: (userId: string, reason: string, until: string) =>
    ApiClient.post<any>(`/admin/users/${userId}/restrictions/suspend`, {
      reason,
      until,
    }),

  getRestrictionHistory: (userId: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());
    const queryString = queryParams.toString();
    return ApiClient.get<any>(
      `/admin/users/${userId}/restrictions/history${queryString ? `?${queryString}` : ""}`
    );
  },

  // SEMINARS
  getSeminars: () => ApiClient.get<any[]>("/admin/seminars"),

  createSeminar: (data: {
    title: string;
    description?: string;
    date: string;
    location?: string;
  }) => ApiClient.post<any>("/admin/seminars", data),

  updateSeminar: (
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: string;
      location?: string;
    }
  ) => ApiClient.put<any>(`/admin/seminars/${id}`, data),

  deleteSeminar: (id: string) =>
    ApiClient.delete<{ message: string }>(`/admin/seminars/${id}`),
};
