import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/endpoints/admin";

interface EnumData {
  grades: Array<{ id: string; name: string }>;
  zones: Array<{ id: string; name: string }>;
  districts: Array<{ id: string; name: string; zoneId?: string }>;
  mediums: Array<{ id: string; name: string }>;
  subjectCodes: Array<{ id: string; name: string; code: string }>;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export function useEnums(): EnumData {
  const [grades, setGrades] = useState<EnumData["grades"]>([]);
  const [zones, setZones] = useState<EnumData["zones"]>([]);
  const [districts, setDistricts] = useState<EnumData["districts"]>([]);
  const [mediums, setMediums] = useState<EnumData["mediums"]>([]);
  const [subjectCodes, setSubjectCodes] = useState<EnumData["subjectCodes"]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [gradesRes, zonesRes, districtsRes, mediumsRes, subjectCodesRes] =
        await Promise.all([
          adminApi.getGrades().catch(() => ({ grades: [] })),
          adminApi.getZones().catch(() => ({ zones: [] })),
          adminApi.getDistricts().catch(() => ({ districts: [] })),
          adminApi.getMediums().catch(() => ({ mediums: [] })),
          adminApi.getSubjectCodes().catch(() => ({ subjectCodes: [] })),
        ]);
      setGrades(gradesRes.grades.map((g) => ({ id: g.id, name: g.name })));
      setZones(zonesRes.zones.map((z) => ({ id: z.id, name: z.name })));
      setDistricts(
        districtsRes.districts.map((d: any) => ({
          id: d.id,
          name: d.name,
          zoneId: d.zoneId,
        }))
      );
      setMediums(mediumsRes.mediums.map((m) => ({ id: m.id, name: m.name })));
      setSubjectCodes(
        subjectCodesRes.subjectCodes.map((sc) => ({
          id: sc.id,
          name: sc.name,
          code: sc.code,
        }))
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load enums";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    grades,
    zones,
    districts,
    mediums,
    subjectCodes,
    loading,
    error,
    refresh: load,
  };
}
