"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium",
  {
    variants: {
      status: {
        // General statuses
        default: "bg-muted text-muted-foreground",
        draft: "bg-muted/60 text-muted-foreground border-muted-foreground/30",
        pending:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
        processing:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
        active:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
        success:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
        approved:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
        completed:
          "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
        inactive:
          "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
        cancelled: "bg-destructive/10 text-destructive border-destructive/30",
        rejected: "bg-destructive/10 text-destructive border-destructive/30",
        error: "bg-destructive/10 text-destructive border-destructive/30",
        warning:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
        info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
        published:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
      },
      size: {
        sm: "text-xs px-1.5 py-0.5",
        default: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      status: "default",
      size: "default",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  size,
  children,
  className,
  icon,
  pulse,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        statusBadgeVariants({ status, size }),
        pulse && "animate-pulse",
        className
      )}
    >
      {icon}
      {children}
    </Badge>
  );
}

// Map string status values to badge status variants
const statusMap: Record<
  string,
  VariantProps<typeof statusBadgeVariants>["status"]
> = {
  // Exam/Content statuses
  DRAFT: "draft",
  PENDING_APPROVAL: "pending",
  APPROVED: "approved",
  PUBLISHED: "published",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",

  // Approval statuses
  PENDING: "pending",

  // User statuses
  ACTIVE_USER: "active",
  INACTIVE: "inactive",
  SUSPENDED: "cancelled",

  // Payment statuses
  PAID: "success",
  UNPAID: "pending",
  OVERDUE: "error",
  REFUNDED: "info",

  // General
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export function getStatusVariant(
  status: string
): VariantProps<typeof statusBadgeVariants>["status"] {
  return statusMap[status.toUpperCase()] || "default";
}

export function AutoStatusBadge({
  status,
  showLabel = true,
  size,
  className,
  icon,
}: {
  status: string;
  showLabel?: boolean;
  size?: VariantProps<typeof statusBadgeVariants>["size"];
  className?: string;
  icon?: React.ReactNode;
}) {
  const variant = getStatusVariant(status);
  const label = status.replace(/_/g, " ");

  return (
    <StatusBadge status={variant} size={size} className={className} icon={icon}>
      {showLabel ? label : null}
    </StatusBadge>
  );
}

export { statusBadgeVariants };
