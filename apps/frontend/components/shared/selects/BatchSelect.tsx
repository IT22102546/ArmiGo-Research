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

const logger = createLogger("BatchSelect");
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Batch {
  id: string;
  name: string;
  code?: string;
  gradeId: string;
  capacity?: number;
}

interface BatchSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  gradeId?: string; // For cascading - only show batches for this grade
  placeholder?: string;
  disabled?: boolean;
  includeInactive?: boolean;
}

export function BatchSelect({
  value,
  onValueChange,
  gradeId,
  placeholder,
  disabled = false,
  includeInactive = false,
}: BatchSelectProps) {
  const t = useTranslations("shared.selects");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gradeId) {
      fetchBatches();
    } else {
      setBatches([]);
    }
  }, [gradeId, includeInactive]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (gradeId) params.append("gradeId", gradeId);
      if (!includeInactive) params.append("isActive", "true");

      const url = `/admin/batches?${params.toString()}`;
      const response = await ApiClient.get<any>(url);
      const batchesData = response?.data?.batches || response?.batches || [];
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (error) {
      logger.error("Error fetching batches:", {
        message: getErrorMessage(error),
      });
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading || !gradeId;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("batch.loading")}</span>
          </div>
        ) : (
          <SelectValue
            placeholder={
              !gradeId
                ? t("batch.selectGradeFirst")
                : (placeholder ?? t("batch.placeholder"))
            }
          />
        )}
      </SelectTrigger>
      <SelectContent>
        {!gradeId ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("batch.selectGradeFirstMessage")}
          </div>
        ) : batches.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("batch.empty")}
          </div>
        ) : (
          batches
            .filter((batch) => batch.id)
            .map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name} {batch.code && `(${batch.code})`}
                {batch.capacity &&
                  ` - ${t("batch.capacity")} ${batch.capacity}`}
              </SelectItem>
            ))
        )}
      </SelectContent>
    </Select>
  );
}
