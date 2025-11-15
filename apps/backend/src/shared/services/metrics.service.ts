import { Injectable } from "@nestjs/common";
// import { Counter, Histogram, Gauge, register } from 'prom-client'; // Optional - install prom-client to enable

/**
 * MetricsService - Prometheus metrics collection (Currently disabled)
 * To enable: npm install prom-client and uncomment imports
 */
@Injectable()
export class MetricsService {
  constructor() {
    // Metrics disabled - no initialization needed
  }

  // Stub methods - no-op implementations
  incrementHttpRequests(method: string, route: string, status: string): void {}

  observeHttpDuration(
    method: string,
    route: string,
    status: string,
    duration: number
  ): void {}

  setActiveConnections(count: number): void {}

  setDatabaseConnections(count: number): void {}

  setRedisConnections(count: number): void {}

  incrementMarketplacePurchases(
    publicationType: string,
    paymentMethod: string
  ): void {}

  incrementMarketplaceFailedPurchases(
    errorType: string,
    paymentMethod: string
  ): void {}

  incrementMarketplaceRevenue(amount: number, publicationType: string): void {}

  setActiveUsers(userType: string, count: number): void {}

  setWalletBalanceTotal(amount: number): void {}

  incrementPublicationViews(
    publicationType: string,
    grade: string,
    subject: string
  ): void {}

  incrementPublicationDownloads(
    publicationType: string,
    grade: string,
    subject: string
  ): void {}

  incrementPublicationUploads(
    userType: string,
    publicationType: string
  ): void {}

  async getMetrics(): Promise<string> {
    return "# Metrics collection disabled. Install prom-client to enable.";
  }

  clearMetrics(): void {}

  getRegistry(): any {
    return null;
  }
}
