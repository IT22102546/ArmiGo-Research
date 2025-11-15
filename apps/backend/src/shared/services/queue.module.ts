import { BullModule } from "@nestjs/bull";
import { Module, DynamicModule, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QueueService } from "./queue.service";

/** Bull queues module — enables Bull when REDIS_ENABLED=true. */
@Module({})
export class QueueModule {
  private static readonly logger = new Logger(QueueModule.name);

  static forRoot(): DynamicModule {
    // Check if Redis is enabled at module registration time
    const redisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === "true";

    if (!redisEnabled) {
      this.logger.warn(
        "Redis is disabled (REDIS_ENABLED=false). Queue functionality will be unavailable. " +
          "Set REDIS_ENABLED=true in your environment to enable background job processing."
      );
      return {
        module: QueueModule,
        imports: [],
        providers: [],
        exports: [],
      };
    }

    this.logger.log("Redis is enabled. Initializing Bull queue module...");

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            redis: {
              host: configService.get("redis.host", "localhost"),
              port: configService.get("redis.port", 6379),
              password: configService.get("redis.password"),
              db: configService.get("redis.queueDatabase", 1), // Different DB for queues
            },
            defaultJobOptions: {
              removeOnComplete: 100, // Keep last 100 completed jobs
              removeOnFail: 50, // Keep last 50 failed jobs
            },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue(
          { name: "email" },
          { name: "notifications" },
          { name: "file-processing" },
          { name: "exam-processing" }
        ),
      ],
      providers: [QueueService],
      exports: [QueueService],
    };
  }
}
