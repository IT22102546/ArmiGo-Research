"use client";

import React from "react";

interface TrendComparisonCardProps {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: "up" | "down" | "stable";
  isPositive: boolean;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export const TrendComparisonCard: React.FC<TrendComparisonCardProps> = ({
  metric,
  current,
  previous,
  change,
  changePercentage,
  trend,
  isPositive,
  prefix = "",
  suffix = "",
  icon,
}) => {
  const trendColor = isPositive
    ? "text-green-600"
    : change < 0
      ? "text-green-600"
      : "text-red-600";

  const trendBgColor = isPositive
    ? "bg-green-50"
    : change < 0
      ? "bg-green-50"
      : "bg-red-50";

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{metric}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold text-foreground">
          {prefix}
          {typeof current === "number" ? current.toLocaleString() : current}
          {suffix}
        </p>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trendBgColor} ${trendColor}`}
          >
            {trendIcon} {Math.abs(changePercentage).toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Previous: {prefix}
          {typeof previous === "number" ? previous.toLocaleString() : previous}
          {suffix}
        </p>
      </div>
    </div>
  );
};
