"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classesApi } from "@/lib/api/endpoints/classes";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("ClassSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Class {
  id: string;
  name: string;
  code?: string;
  subject?: {
    id: string;
    name: string;
  };
  grade?: {
    id: string;
    name: string;
  };
}

interface ClassSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function ClassSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  allowClear = false,
}: ClassSelectProps) {
  const t = useTranslations("shared.selects");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getAll();
      // Backend returns { classes: [...], total, page, limit }
      setClasses(response?.classes || []);
    } catch (error) {
      logger.error("Error fetching classes:", {
        message: getErrorMessage(error),
      });
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (newValue: string) => {
    if (allowClear && newValue === "clear") {
      logger.debug("Clearing selection");
      onValueChange?.("");
      return;
    }
    logger.debug("Selected class:", newValue);
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
            <span>{t("class.loading")}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder ?? t("class.placeholder")} />
        )}
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="clear">
            <span className="text-muted-foreground">{t("clearSelection")}</span>
          </SelectItem>
        )}
        {classes.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("class.empty")}
          </div>
        ) : (
          classes
            .filter((cls) => cls.id)
            .map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
                {cls.subject && cls.grade && (
                  <span className="text-muted-foreground ml-2">
                    ({cls.subject.name} - {cls.grade.name})
                  </span>
                )}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
