import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { MetricsService } from "../../shared/services/metrics.service";

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, route } = req;
    const routePath = route?.path || req.path;

    // Track active connections
    this.metricsService.setActiveConnections(this.getActiveConnections());

    res.on("finish", () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = res.statusCode.toString();

      // Record metrics
      this.metricsService.incrementHttpRequests(method, routePath, status);
      this.metricsService.observeHttpDuration(
        method,
        routePath,
        status,
        duration
      );
    });

    next();
  }

  private getActiveConnections(): number {
    // This would typically come from your connection pool or server statistics
    // For now, return a placeholder value
    return process.listenerCount("connection") || 0;
  }
}
