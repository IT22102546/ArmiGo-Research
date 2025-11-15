import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { CommonServicesModule } from "../../shared/services/common-services.module";
import { CacheModule } from "../../infrastructure/cache/cache.module";

@Module({
  imports: [CommonServicesModule, CacheModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
