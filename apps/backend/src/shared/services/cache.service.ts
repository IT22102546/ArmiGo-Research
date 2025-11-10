import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { RedisOptions } from "ioredis";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis | null;
  private readonly defaultTTL = 3600; // 1 hour
  private readonly isRedisEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.isRedisEnabled = this.config.get<boolean>("redis.enabled", false);

    if (!this.isRedisEnabled) {
      this.logger.log("Redis is disabled - using in-memory cache fallback");
      this.redis = null;
      return;
    }

    const options: RedisOptions = {
      host: this.config.get<string>("redis.host", "localhost"),
      port: this.config.get<number>("redis.port", 6379),
      password: this.config.get<string | undefined>("redis.password"),
      db: this.config.get<number>("redis.database", 0),
      keyPrefix: this.config.get<string>("redis.prefix") ?? "",
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 500, 2000),
      reconnectOnError: (err) =>
        /READONLY|ETIMEDOUT|ECONNRESET/.test(err.message),
      lazyConnect: false,
    };

    this.redis = new Redis(options);

    this.redis.on("connect", () => this.logger.log("Redis connected"));
    this.redis.on("ready", () => this.logger.log("Redis ready"));
    this.redis.on("reconnecting", () =>
      this.logger.warn("Redis reconnecting...")
    );
    this.redis.on("end", () => this.logger.warn("Redis connection closed"));
    this.redis.on("error", (error) =>
      this.logger.error("Redis error", this.err(error))
    );
  }

  async onModuleDestroy() {
    if (!this.redis) {return;}

    try {
      await this.redis.quit();
      this.logger.log("Redis quit gracefully");
    } catch (e) {
      this.logger.warn("Redis quit failed, forcing disconnect");
      this.redis.disconnect();
    }
  }

  // In-memory cache fallback
  private readonly memoryCache = new Map<
    string,
    { value: unknown; expiry: number }
  >();

  /** Format unknown errors safely */
  private err(e: unknown): string {
    if (e instanceof Error) {return e.stack ?? e.message;}
    try {
      return typeof e === "object" ? JSON.stringify(e) : String(e);
    } catch {
      return String(e);
    }
  }

  private cleanExpiredMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiry < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      this.logger.warn(
        "JSON stringify failed; storing as string via toString()"
      );
      return String(value);
    }
  }

  private safeParse<T>(value: string | null): T | null {
    if (value == null) {return null;}
    try {
      return JSON.parse(value) as T;
    } catch {
      this.logger.warn("JSON parse failed; returning null");
      return null;
    }
  }

  // -------- Basic ops --------
  async get<T = Json>(key: string): Promise<T | null> {
    if (!this.isRedisEnabled) {
      this.cleanExpiredMemoryCache();
      const item = this.memoryCache.get(key);
      if (item && item.expiry > Date.now()) {
        return item.value as T;
      }
      return null;
    }

    try {
      const value = await this.redis!.get(key);
      return this.safeParse<T>(value);
    } catch (error) {
      this.logger.error(`Error getting key ${key}`, this.err(error));
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    if (!this.isRedisEnabled) {
      const expiry = Date.now() + ttl * 1000;
      this.memoryCache.set(key, { value, expiry });
      return;
    }

    try {
      await this.redis!.set(key, this.safeStringify(value), "EX", ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, this.err(error));
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisEnabled) {
      this.memoryCache.delete(key);
      return;
    }

    try {
      await this.redis!.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}`, this.err(error));
    }
  }

  /** Non-blocking delete by pattern (SCAN) */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isRedisEnabled) {
      // Simple pattern matching for in-memory cache
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
      return;
    }

    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.redis!.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          1000
        );
        cursor = next;
        if (keys.length) {
          const chunkSize = 1000;
          for (let i = 0; i < keys.length; i += chunkSize) {
            await this.redis!.del(...keys.slice(i, i + chunkSize));
          }
        }
      } while (cursor !== "0");
    } catch (error) {
      this.logger.error(
        `Error deleting by pattern ${pattern}`,
        this.err(error)
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisEnabled) {
      this.cleanExpiredMemoryCache();
      const item = this.memoryCache.get(key);
      return item !== undefined && item.expiry > Date.now();
    }

    try {
      return (await this.redis!.exists(key)) === 1;
    } catch (error) {
      this.logger.error(
        `Error checking existence of key ${key}`,
        this.err(error)
      );
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isRedisEnabled) {
      const current = (await this.get<number>(key)) || 0;
      const newValue = current + 1;
      await this.set(key, newValue);
      return newValue;
    }

    try {
      return await this.redis!.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}`, this.err(error));
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.isRedisEnabled) {
      const item = this.memoryCache.get(key);
      if (item) {
        item.expiry = Date.now() + ttl * 1000;
      }
      return;
    }

    try {
      await this.redis!.expire(key, ttl);
    } catch (error) {
      this.logger.error(
        `Error setting expiration for key ${key}`,
        this.err(error)
      );
    }
  }

  async mget<T = Json>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isRedisEnabled) {
      this.cleanExpiredMemoryCache();
      return keys.map((key) => {
        const item = this.memoryCache.get(key);
        if (item && item.expiry > Date.now()) {
          return item.value as T;
        }
        return null;
      });
    }

    try {
      const values = await this.redis!.mget(...keys);
      return values.map((v) => this.safeParse<T>(v));
    } catch (error) {
      this.logger.error("Error getting multiple keys", this.err(error));
      return keys.map(() => null);
    }
  }

  async cacheFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {return cached;}

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  // -------- Keys & TTLs --------
  static readonly CACHE_KEYS = {
    USER: (id: string) => `user:${id}`,
    USER_PERMISSIONS: (id: string) => `user:permissions:${id}`,
    EXAM: (id: string) => `exam:${id}`,
    EXAM_RESULTS: (examId: string, userId: string) =>
      `exam:results:${examId}:${userId}`,
    CLASS: (id: string) => `class:${id}`,
    TIMETABLE: (gradeId: string) => `timetable:${gradeId}`,
    SUBJECTS: () => "subjects:all",
    PUBLICATIONS: () => "publications:active",
    PUBLICATION: (id: string) => `publication:${id}`,
    WALLET: (userId: string) => `wallet:${userId}`,
    PAYMENT_HISTORY: (userId: string) => `payments:${userId}`,
    TRANSFER_REQUESTS: (teacherId: string) => `transfers:${teacherId}`,
    RANKINGS: (examId: string) => `rankings:${examId}`,
    ATTENDANCE: (userId: string, month: string) =>
      `attendance:${userId}:${month}`,
  } as const;

  static readonly TTL = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400,
    USER_SESSION: 1800,
    EXAM_DATA: 300,
    STATIC_DATA: 86400,
  } as const;
}
