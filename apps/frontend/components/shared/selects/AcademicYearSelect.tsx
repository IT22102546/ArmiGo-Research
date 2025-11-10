"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { academicYearsApi } from "@/lib/api/endpoints/academic-years";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("AcademicYearSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicYearSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeInactive?: boolean;
}

export function AcademicYearSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  includeInactive = false,
}: AcademicYearSelectProps) {
  const t = useTranslations("shared.selects");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, [includeInactive]);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await academicYearsApi.getAll({ includeInactive });
      // Backend returns { academicYears: [...], total, page, limit }
      setAcademicYears(response?.academicYears || []);
    } catch (error) {
      logger.error("Error fetching academic years:", {
        message: getErrorMessage(error),
      });
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("academicYear.loading")}</span>
          </div>
        ) : (
          <SelectValue
            placeholder={placeholder ?? t("academicYear.placeholder")}
          />
        )}
      </SelectTrigger>
      <SelectContent>
        {academicYears.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("academicYear.empty")}
          </div>
        ) : (
          academicYears
            .filter((year) => year.id)
            .map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.year} {year.isCurrent && t("academicYear.current")}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
