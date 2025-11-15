import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
// import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'; // Optional - install @nestjs/cache-manager to enable
// import { redisStore } from 'cache-manager-redis-store'; // Optional - install cache-manager-redis-store for Redis support
import { CacheService } from "../../shared/services/cache.service";

/**
 * CacheModule - Cache configuration (Currently using in-memory only)
 * To enable Redis: npm install @nestjs/cache-manager cache-manager-redis-store
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
