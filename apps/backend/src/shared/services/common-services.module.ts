import { Module, Global } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { AnalyticsService } from "./analytics.service";
import { RegistrationNumberService } from "./registration-number.service";
// Import database module
import { DatabaseModule } from "../../database";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [MetricsService, AnalyticsService, RegistrationNumberService],
  exports: [MetricsService, AnalyticsService, RegistrationNumberService],
})
export class CommonServicesModule {}
