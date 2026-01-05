"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("GradeSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Grade {
  id: string;
  name: string;
  code?: string;
}

interface GradeSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeInactive?: boolean;
  allowClear?: boolean;
}

export function GradeSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  includeInactive = false,
  allowClear = false,
}: GradeSelectProps) {
  const t = useTranslations("shared.selects");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, [includeInactive]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradesApi.getAll({ includeInactive });
      // Backend returns { grades: [...], total, page, limit }
      setGrades(response?.grades || []);
    } catch (error) {
      logger.error("Error fetching grades:", {
        message: getErrorMessage(error),
      });
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (newValue: string) => {
    if (allowClear && newValue === "clear") {
      onValueChange?.("");
      return;
    }
    onValueChange?.(newValue);
  };

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("grade.loading")}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder ?? t("grade.placeholder")} />
        )}
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="clear">
            <span className="text-muted-foreground">{t("clearSelection")}</span>
          </SelectItem>
        )}

        {grades.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("grade.empty")}
          </div>
        ) : (
          grades
            .filter((grade) => grade.id)
            .map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name} {grade.code && `(${grade.code})`}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
