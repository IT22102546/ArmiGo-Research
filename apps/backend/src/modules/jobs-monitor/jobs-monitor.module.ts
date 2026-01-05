import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JobsMonitorController } from "./jobs-monitor.controller";
import { JobsMonitorService } from "./jobs-monitor.service";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: parseInt(configService.get("REDIS_PORT", "6379")),
          password: configService.get("REDIS_PASSWORD"),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: "email" },
      { name: "notifications" },
      { name: "files" },
      { name: "exams" }
    ),
  ],
  controllers: [JobsMonitorController],
  providers: [JobsMonitorService],
  exports: [JobsMonitorService],
})
export class JobsMonitorModule {}
