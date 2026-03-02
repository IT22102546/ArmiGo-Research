import { ApiClient } from '../../api-client';

export interface Province {
  id: string;
  name: string;
  code?: string;
  sortOrder: number;
  districts?: District[];
}

export interface District {
  id: string;
  name: string;
  code?: string;
  provinceId?: string;
  sortOrder: number;
  zones?: Zone[];
  province?: Province;
}

export interface Zone {
  id: string;
  name: string;
  code?: string;
  districtId: string;
  sortOrder: number;
  district?: District;
}

export const geographyApi = {
  // Provinces
  getAllProvinces: () =>
    ApiClient.get<{ success: boolean; data: Province[] }>('/api/v1/geography/provinces'),
  getProvinceById: (id: string) =>
    ApiClient.get<{ success: boolean; data: Province }>(`/api/v1/geography/provinces/${id}`),
  createProvince: (data: any) =>
    ApiClient.post<{ success: boolean; data: Province; message: string }>(
      '/api/v1/geography/provinces',
      data
    ),
  updateProvince: (id: string, data: any) =>
    ApiClient.put<{ success: boolean; data: Province; message: string }>(
      `/api/v1/geography/provinces/${id}`,
      data
    ),
  deleteProvince: (id: string) =>
    ApiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/geography/provinces/${id}`
    ),

  // Districts
  getAllDistricts: () =>
    ApiClient.get<{ success: boolean; data: District[] }>('/api/v1/geography/districts'),
  getDistrictsByProvince: (provinceId: string) =>
    ApiClient.get<{ success: boolean; data: District[] }>(
      `/api/v1/geography/provinces/${provinceId}/districts`
    ),
  createDistrict: (data: any) =>
    ApiClient.post<{ success: boolean; data: District; message: string }>(
      '/api/v1/geography/districts',
      data
    ),
  updateDistrict: (id: string, data: any) =>
    ApiClient.put<{ success: boolean; data: District; message: string }>(
      `/api/v1/geography/districts/${id}`,
      data
    ),

  // Zones
  getAllZones: () =>
    ApiClient.get<{ success: boolean; data: Zone[] }>('/api/v1/geography/zones'),
  getZonesByDistrict: (districtId: string) =>
    ApiClient.get<{ success: boolean; data: Zone[] }>(
      `/api/v1/geography/districts/${districtId}/zones`
    ),
  createZone: (data: any) =>
    ApiClient.post<{ success: boolean; data: Zone; message: string }>(
      '/api/v1/geography/zones',
      data
    ),
  updateZone: (id: string, data: any) =>
    ApiClient.put<{ success: boolean; data: Zone; message: string }>(
      `/api/v1/geography/zones/${id}`,
      data
    ),
  deleteZone: (id: string) =>
    ApiClient.delete<{ success: boolean; message: string }>(`/api/v1/geography/zones/${id}`),
};

export interface Hospital {
  id: string;
  name: string;
  registrationNo: string;
  type: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  districtId: string;
  zoneId?: string;
  status: string;
  adminEmail: string;
  bedCapacity?: number;
  totalStaff?: number;
  specialization?: string[];
  district?: { id: string; name: string };
  zone?: { id: string; name: string };
}

export const hospitalApi = {
  createHospital: (data: any) =>
    ApiClient.post<{ success: boolean; data: Hospital; message: string }>(
      '/api/v1/hospitals',
      data
    ),
  getAllHospitals: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.districtId) params.append('districtId', filters.districtId);
    if (filters?.zoneId) params.append('zoneId', filters.zoneId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page);
    if (filters?.limit) params.append('limit', filters.limit);

    return ApiClient.get<{ success: boolean; data: Hospital[]; pagination: any }>(
      `/api/v1/hospitals?${params}`
    );
  },
  getHospitalById: (id: string) =>
    ApiClient.get<{ success: boolean; data: Hospital }>(`/api/v1/hospitals/${id}`),
  updateHospital: (id: string, data: any) =>
    ApiClient.put<{ success: boolean; data: Hospital; message: string }>(
      `/api/v1/hospitals/${id}`,
      data
    ),
  getHospitalsByDistrict: (districtId: string) =>
    ApiClient.get<{ success: boolean; data: Hospital[] }>(
      `/api/v1/hospitals/district/${districtId}`
    ),
  getHospitalsByZone: (zoneId: string) =>
    ApiClient.get<{ success: boolean; data: Hospital[] }>(`/api/v1/hospitals/zone/${zoneId}`),
  getActiveHospitals: () =>
    ApiClient.get<{ success: boolean; data: Hospital[] }>('/api/v1/hospitals/list/active'),
};
