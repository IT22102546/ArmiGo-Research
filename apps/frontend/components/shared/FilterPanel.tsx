"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Filter, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange" | "search";
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
}

interface FilterPanelProps {
  title?: string;
  filters: FilterConfig[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
  showResetButton?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  title,
  filters,
  values,
  onChange,
  onReset,
  onApply,
  showResetButton = true,
  collapsible = false,
  defaultOpen = true,
  variant = "card",
  className,
}) => {
  const t = useTranslations("shared.filterPanel");
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const displayTitle = title || t("title");

  const activeFilterCount = Object.entries(values).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  const hasActiveFilters = activeFilterCount > 0;

  const FilterContent = () => (
    <div
      className={cn(
        "grid gap-4",
        variant === "card"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      )}
    >
      {filters.map((filter) => (
        <div key={filter.key} className="space-y-1.5">
          <Label htmlFor={filter.key} className="text-sm font-medium">
            {filter.label}
          </Label>
          {(filter.type === "text" || filter.type === "search") && (
            <div className="relative">
              {filter.type === "search" && (
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <Input
                id={filter.key}
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className={cn(filter.type === "search" && "pl-9")}
                aria-label={filter.label}
              />
            </div>
          )}
          {filter.type === "select" && (
            <Select
              value={values[filter.key] || filter.defaultValue || "all"}
              onValueChange={(value) => onChange(filter.key, value)}
            >
              <SelectTrigger id={filter.key} aria-label={filter.label}>
                <SelectValue placeholder={filter.placeholder || t("select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {filter.options
                  ?.filter((option) => option.value)
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {filter.type === "date" && (
            <Input
              id={filter.key}
              type="date"
              value={values[filter.key] || ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              aria-label={filter.label}
            />
          )}
          {filter.type === "dateRange" && (
            <div className="flex gap-2">
              <Input
                id={`${filter.key}-start`}
                type="date"
                value={values[`${filter.key}Start`] || ""}
                onChange={(e) => onChange(`${filter.key}Start`, e.target.value)}
                aria-label={`${filter.label} start date`}
              />
              <Input
                id={`${filter.key}-end`}
                type="date"
                value={values[`${filter.key}End`] || ""}
                onChange={(e) => onChange(`${filter.key}End`, e.target.value)}
                aria-label={`${filter.label} end date`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (variant === "inline") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="font-medium">{displayTitle}</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {t("activeCount", { count: activeFilterCount })}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showResetButton && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" aria-hidden="true" />
                {t("clear")}
              </Button>
            )}
            {onApply && (
              <Button size="sm" className="h-8" onClick={onApply}>
                {t("apply")}
              </Button>
            )}
          </div>
        </div>
        <FilterContent />
      </div>
    );
  }

  const CardWrapper = collapsible ? Collapsible : React.Fragment;
  const cardWrapperProps = collapsible
    ? { open: isOpen, onOpenChange: setIsOpen }
    : {};

  return (
    <CardWrapper {...cardWrapperProps}>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {collapsible ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 hover:bg-transparent"
                  >
                    <Filter className="h-5 w-5 mr-2" aria-hidden="true" />
                    <CardTitle className="text-base">{displayTitle}</CardTitle>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 ml-2 transition-transform",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <>
                  <Filter className="h-5 w-5" aria-hidden="true" />
                  <CardTitle className="text-base">{displayTitle}</CardTitle>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">
                      {t("activeCount", { count: activeFilterCount })}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showResetButton && hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t("reset")}
                </Button>
              )}
              {onApply && (
                <Button size="sm" className="h-8" onClick={onApply}>
                  {t("applyShort")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {collapsible ? (
          <CollapsibleContent>
            <CardContent>
              <FilterContent />
            </CardContent>
          </CollapsibleContent>
        ) : (
          <CardContent>
            <FilterContent />
          </CardContent>
        )}
      </Card>
    </CardWrapper>
  );
};

export default FilterPanel;
