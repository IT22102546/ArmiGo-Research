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

const logger = createLogger("TeacherSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  teacherProfile?: {
    specialization?: string;
    department?: string;
  };
}

interface TeacherSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function TeacherSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  allowClear = false,
}: TeacherSelectProps) {
  const t = useTranslations("shared.selects");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log("🔍 Fetching teachers...");

      // The ApiClient.get() returns the direct response data (which is the { data: [], pagination: {} } object)
      const response = await ApiClient.get<any>(
        "/users?role=INTERNAL_TEACHER,EXTERNAL_TEACHER&status=ACTIVE&limit=100"
      );
      setTeachers(Array.isArray(response) ? response : []);
    } catch (error) {
      logger.error("Error fetching teachers:", {
        message: getErrorMessage(error),
      });
      setTeachers([]);
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
      <SelectTrigger className="w-full">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("teacher.loading")}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder ?? t("teacher.placeholder")} />
        )}
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="clear">
            <span className="text-muted-foreground">{t("clearSelection")}</span>
          </SelectItem>
        )}

        {teachers.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("teacher.empty")}
          </div>
        ) : (
          teachers
            .filter((teacher) => teacher.id)
            .map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
                {teacher.teacherProfile?.specialization &&
                  ` - ${teacher.teacherProfile.specialization}`}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
