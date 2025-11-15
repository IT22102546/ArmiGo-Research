"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/types/api.types";

const logger = createLogger("MediumSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Medium {
  id: string;
  name: string;
  code?: string;
}

interface MediumSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeInactive?: boolean;
  allowClear?: boolean;
}

export function MediumSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  includeInactive = false,
  allowClear = false,
}: MediumSelectProps) {
  const t = useTranslations("shared.selects");
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMediums();
  }, [includeInactive]);

  const fetchMediums = async () => {
    try {
      setLoading(true);
      const response = await mediumsApi.getAll({ includeInactive });
      // Backend returns { mediums: [...], total, page, limit }
      setMediums(response?.mediums || []);
    } catch (error) {
      logger.error("Error fetching mediums:", {
        message: getErrorMessage(error),
      });
      setMediums([]);
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
            <span>{t("medium.loading")}</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder ?? t("medium.placeholder")} />
        )}
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="clear">
            <span className="text-muted-foreground">{t("clearSelection")}</span>
          </SelectItem>
        )}

        {mediums.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("medium.empty")}
          </div>
        ) : (
          mediums
            .filter((medium) => medium.id)
            .map((medium) => (
              <SelectItem key={medium.id} value={medium.id}>
                {medium.name} {medium.code && `(${medium.code})`}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
