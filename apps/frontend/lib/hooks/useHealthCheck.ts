import { useEffect, useState } from "react";
import { buildApiUrl } from "../api/api-client";

interface HealthStatus {
  isHealthy: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  error: string | null;
}

export function useHealthCheck(intervalMs: number = 30000) {
  const [status, setStatus] = useState<HealthStatus>({
    isHealthy: true,
    isChecking: false,
    lastCheck: null,
    error: null,
  });

  const checkHealth = async () => {
    try {
      setStatus((prev) => ({ ...prev, isChecking: true }));

      const response = await fetch(buildApiUrl("/health"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't wait too long for health check
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setStatus({
          isHealthy: true,
          isChecking: false,
          lastCheck: new Date(),
          error: null,
        });
      } else {
        throw new Error(`Health check failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setStatus({
        isHealthy: false,
        isChecking: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval for periodic checks
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { ...status, refetch: checkHealth };
}
