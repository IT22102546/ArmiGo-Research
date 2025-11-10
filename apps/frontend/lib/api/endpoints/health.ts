// apps/frontend/lib/api/endpoints/health.ts
import { ApiClient } from "../api-client";

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: "up" | "down";
    redis: "up" | "down";
    storage: "up" | "down";
  };
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  requests: {
    total: number;
    success: number;
    errors: number;
    averageResponseTime: number;
  };
}

export const healthApi = {
  // Check health status
  check: () => ApiClient.get<HealthStatus>("/health"),

  // Get system metrics (admin only)
  getMetrics: () => ApiClient.get<SystemMetrics>("/health/metrics"),
};
