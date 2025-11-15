"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiClient } from "@/lib/api/api-client";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("SubjectSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

interface SubjectSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeInactive?: boolean;
  allowClear?: boolean;
}

export function SubjectSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  includeInactive = false,
  allowClear = false,
}: SubjectSelectProps) {
  const t = useTranslations("shared.selects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [includeInactive]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const url = includeInactive ? "/subjects" : "/subjects?isActive=true";
      const response = await ApiClient.get<Subject[]>(url);
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      logger.error("Error fetching subjects:", {
        message: getErrorMessage(error),
      });
      setSubjects([]);
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
            <span>{t("subject.loading")}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder ?? t("subject.placeholder")} />
        )}
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="clear">
            <span className="text-muted-foreground">{t("clearSelection")}</span>
          </SelectItem>
        )}

        {subjects.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("subject.empty")}
          </div>
        ) : (
          subjects
            .filter((subject) => subject.id)
            .map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name} {subject.code && `(${subject.code})`}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
