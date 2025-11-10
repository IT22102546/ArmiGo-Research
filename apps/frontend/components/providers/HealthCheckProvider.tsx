"use client";

import { useHealthCheck } from "@/lib/hooks/useHealthCheck";
import { MaintenancePage } from "@/components/shared/MaintenancePage";
import { useEffect, useState } from "react";

interface HealthCheckProviderProps {
  children: React.ReactNode;
}

export function HealthCheckProvider({ children }: HealthCheckProviderProps) {
  const { isHealthy, error, refetch, lastCheck } = useHealthCheck(30000); 

  if (!isHealthy && lastCheck && error) {
    return <MaintenancePage onRetry={refetch} error={error} />;
  }

  return <>{children}</>;
}
