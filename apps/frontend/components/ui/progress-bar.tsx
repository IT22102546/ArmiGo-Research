"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    { value, max = 100, size = "md", showLabel = false, className, ...props },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const roundedValue = Math.round(value);
    const roundedMax = Math.round(max);

    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div
          className={cn(
            "w-full bg-muted rounded-full overflow-hidden",
            sizeClasses[size]
          )}
        >
          <div className="h-full bg-primary transition-all duration-300">
            <svg width="100%" height="100%">
              <rect
                width={`${percentage}%`}
                height="100%"
                fill="currentColor"
                className="text-primary"
              />
            </svg>
          </div>
        </div>
        {showLabel && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
