import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { CommonServicesModule } from "../../shared/services/common-services.module";

@Module({
  imports: [CommonServicesModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
