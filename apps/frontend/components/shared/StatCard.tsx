"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-green-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  info: "bg-blue-500 text-white",
  muted: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  count: number | string;
  variant?: keyof typeof variantStyles;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  count,
  variant = "primary",
  trend,
  subtitle,
  loading = false,
  onClick,
  className,
}: StatCardProps) {
  const TrendIcon =
    trend?.value === 0
      ? Minus
      : trend && trend.value > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    trend?.value === 0
      ? "text-muted-foreground"
      : trend && trend.value > 0
        ? "text-green-600"
        : "text-red-600";

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1 truncate">
              {typeof count === "number" ? count.toLocaleString() : count}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
          {trend && !loading && (
            <div
              className={cn("flex items-center gap-1 mt-2 text-sm", trendColor)}
            >
              <TrendIcon className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-full flex-shrink-0",
            variantStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

// Compact version for dense layouts
interface CompactStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export function CompactStatCard({
  label,
  value,
  icon: Icon,
  className,
}: CompactStatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg bg-muted/50",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
