'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geographyApi, hospitalApi, Province, District, Zone, Hospital } from '@/lib/api/endpoints/geography';
import { toast } from 'sonner';

// Query keys
export const GEOGRAPHY_QUERY_KEYS = {
  provinces: ['provinces'] as const,
  allProvinces: () => [...GEOGRAPHY_QUERY_KEYS.provinces, 'all'] as const,
  provinceById: (id: string) => [...GEOGRAPHY_QUERY_KEYS.provinces, id] as const,
  districts: ['districts'] as const,
  allDistricts: () => [...GEOGRAPHY_QUERY_KEYS.districts, 'all'] as const,
  districtsByProvince: (provinceId: string) => [...GEOGRAPHY_QUERY_KEYS.districts, 'byProvince', provinceId] as const,
  zones: ['zones'] as const,
  allZones: () => [...GEOGRAPHY_QUERY_KEYS.zones, 'all'] as const,
  zonesByDistrict: (districtId: string) => [...GEOGRAPHY_QUERY_KEYS.zones, 'byDistrict', districtId] as const,
  hospitals: ['hospitals'] as const,
  allHospitals: () => [...GEOGRAPHY_QUERY_KEYS.hospitals, 'all'] as const,
  hospitalById: (id: string) => [...GEOGRAPHY_QUERY_KEYS.hospitals, id] as const,
  activeHospitals: () => [...GEOGRAPHY_QUERY_KEYS.hospitals, 'active'] as const,
};

// ============ PROVINCES ============

export const useGetProvinces = () =>
  useQuery({
    queryKey: GEOGRAPHY_QUERY_KEYS.allProvinces(),
    queryFn: async () => {
      const response = await geographyApi.getAllProvinces();
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

export const useGetDistrictsByProvince = (provinceId: string | undefined) =>
  useQuery({
    queryKey: GEOGRAPHY_QUERY_KEYS.districtsByProvince(provinceId || ''),
    queryFn: async () => {
      if (!provinceId) return [];
      const response = await geographyApi.getDistrictsByProvince(provinceId);
      return response.data;
    },
    enabled: !!provinceId,
    staleTime: 1000 * 60 * 10,
  });

// ============ DISTRICTS ============

export const useGetDistricts = () =>
  useQuery({
    queryKey: GEOGRAPHY_QUERY_KEYS.allDistricts(),
    queryFn: async () => {
      const response = await geographyApi.getAllDistricts();
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

// ============ ZONES ============

export const useGetZonesByDistrict = (districtId: string | undefined) =>
  useQuery({
    queryKey: GEOGRAPHY_QUERY_KEYS.zonesByDistrict(districtId || ''),
    queryFn: async () => {
      if (!districtId) return [];
      const response = await geographyApi.getZonesByDistrict(districtId);
      return response.data;
    },
    enabled: !!districtId,
    staleTime: 1000 * 60 * 10,
  });

// ============ HOSPITALS ============

export const useGetActiveHospitals = () =>
  useQuery({
    queryKey: GEOGRAPHY_QUERY_KEYS.activeHospitals(),
    queryFn: async () => {
      const response = await hospitalApi.getActiveHospitals();
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

export const useGetHospitals = (filters?: any) =>
  useQuery({
    queryKey: ['hospitals', filters],
    queryFn: async () => {
      const response = await hospitalApi.getAllHospitals(filters);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

export const useGetHospitalsByDistrict = (districtId: string | undefined) =>
  useQuery({
    queryKey: ['hospitals', 'byDistrict', districtId],
    queryFn: async () => {
      if (!districtId) return [];
      const response = await hospitalApi.getHospitalsByDistrict(districtId);
      return response.data;
    },
    enabled: !!districtId,
    staleTime: 1000 * 60 * 10,
  });

export const useCreateHospital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hospitalApi.createHospital(data),
    onSuccess: (data: any) => {
      toast.success((data as any)?.message || 'Hospital created successfully');
      queryClient.invalidateQueries({
        queryKey: GEOGRAPHY_QUERY_KEYS.allHospitals(),
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create hospital';
      toast.error(message);
    },
  });
};

export const useUpdateHospital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      hospitalApi.updateHospital(id, data),
    onSuccess: (data: any) => {
      toast.success((data as any)?.message || 'Hospital updated successfully');
      queryClient.invalidateQueries({
        queryKey: GEOGRAPHY_QUERY_KEYS.allHospitals(),
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update hospital';
      toast.error(message);
    },
  });
};
