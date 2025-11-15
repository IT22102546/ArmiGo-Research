"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { authApi } from "@/lib/api/endpoints/auth";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

type HealthStatus = "offline" | "checking" | "error" | "healthy" | "degraded";

interface StatusInfo {
  status: HealthStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Activity;
  description?: string;
}

interface HealthIndicatorProps {
  className?: string;
  showLabel?: boolean;
  minimal?: boolean;
  showRefresh?: boolean;
}

export function HealthIndicator({
  className,
  showLabel = false,
  minimal = false,
  showRefresh = false,
}: HealthIndicatorProps) {
  const t = useTranslations("shared.healthIndicator");
  const [isOnline, setIsOnline] = useState(true);

  // Monitor browser online/offline status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check backend health
  const {
    data: health,
    isError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.health.backend(),
    queryFn: async () => {
      try {
        return await authApi.health();
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
    enabled: isOnline, // Only check when online
    staleTime: 10000,
  });

  // Determine overall status
  const getStatus = (): StatusInfo => {
    if (!isOnline) {
      return {
        status: "offline",
        label: t("status.offline"),
        description: t("description.offline"),
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        icon: WifiOff,
      };
    }

    if (isLoading || isFetching) {
      return {
        status: "checking",
        label: t("status.checking"),
        description: t("description.checking"),
        color: "text-blue-500",
        bgColor: "bg-blue-500",
        icon: Activity,
      };
    }

    if (isError) {
      return {
        status: "error",
        label: t("status.error"),
        description: t("description.error"),
        color: "text-destructive",
        bgColor: "bg-destructive",
        icon: AlertCircle,
      };
    }

    if (health?.status === "ok" || health?.status === "healthy") {
      return {
        status: "healthy",
        label: t("status.healthy"),
        description: t("description.healthy"),
        color: "text-green-600",
        bgColor: "bg-green-500",
        icon: CheckCircle,
      };
    }

    return {
      status: "degraded",
      label: t("status.degraded"),
      description: t("description.degraded"),
      color: "text-amber-500",
      bgColor: "bg-amber-500",
      icon: AlertCircle,
    };
  };

  const statusInfo = getStatus();
  const StatusIcon = statusInfo.icon;

  // Minimal version - just a dot with tooltip
  if (minimal) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn("flex items-center gap-1.5", className)}
              role="status"
              aria-label={`${t("systemStatus")}: ${statusInfo.label}`}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  statusInfo.bgColor,
                  statusInfo.status === "checking" && "animate-pulse"
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">{statusInfo.label}</p>
            {statusInfo.description && (
              <p className="text-xs text-muted-foreground">
                {statusInfo.description}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version with icon and optional label
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-label={`${t("systemStatus")}: ${statusInfo.label}`}
    >
      <StatusIcon
        className={cn(
          "h-4 w-4 transition-colors",
          statusInfo.color,
          statusInfo.status === "checking" && "animate-pulse"
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn("text-sm font-medium", statusInfo.color)}>
          {statusInfo.label}
        </span>
      )}
      {showRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={t("refreshStatus")}
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}

export function NavbarHealthIndicator() {
  return <HealthIndicator minimal className="ml-2" />;
}

export function DashboardHealthIndicator() {
  const t = useTranslations("shared.healthIndicator");
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("systemStatus")}
        </h3>
      </div>
      <HealthIndicator showLabel showRefresh />
    </div>
  );
}

export function CompactHealthStatus({ className }: { className?: string }) {
  const t = useTranslations("shared.healthIndicator");
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <HealthIndicator minimal />
      <span className="text-xs text-muted-foreground">{t("system")}</span>
    </div>
  );
}
