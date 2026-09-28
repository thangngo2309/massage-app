import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');

    const port = Number(this.configService.get<string>('REDIS_PORT', '7379'));

    const password = this.configService.get<string>('REDIS_PASSWORD');

    const db = Number(this.configService.get<string>('REDIS_DB', '0'));

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,

      maxRetriesPerRequest: 3,

      retryStrategy: (times) => {
        return Math.min(times * 500, 5000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis connected: ${host}:${port}`);
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  /**
   * ================================================================
   * SET
   * ================================================================
   *
   * value được JSON.stringify trước khi lưu.
   *
   * ttl tính bằng giây.
   */

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.client.set(key, serializedValue, 'EX', ttlSeconds);

      return;
    }

    await this.client.set(key, serializedValue);
  }

  /**
   * ================================================================
   * GET
   * ================================================================
   */

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * ================================================================
   * DELETE
   * ================================================================
   */

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * ================================================================
   * EXISTS
   * ================================================================
   */

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);

    return result > 0;
  }

  /**
   * ================================================================
   * TTL
   * ================================================================
   */

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * ================================================================
   * EXPIRE
   * ================================================================
   */

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);

    return result === 1;
  }

  /**
   * ================================================================
   * INCREMENT
   * ================================================================
   */

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * ================================================================
   * PING
   * ================================================================
   */

  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * ================================================================
   * MODULE DESTROY
   * ================================================================
   */

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
