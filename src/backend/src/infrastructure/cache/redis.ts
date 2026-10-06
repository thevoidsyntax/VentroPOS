// Redis Client - Caching Layer
// Provides distributed caching for carts, sessions, and rate limiting

import Redis from 'ioredis';
import { config } from '../../shared/config/index.js';
import { RETRY_BASE_DELAY, RETRY_MAX_DELAY, RETRY_MAX_ATTEMPTS, CACHE_TTL_15_MIN, CACHE_TTL_1_HOUR, RATE_LIMIT_WINDOW_SECONDS } from '../../shared/constants/index.js';
import pino from 'pino';

const logger = pino({ level: config.logging.level });

export class RedisClient {
  private client: Redis | null = null;
  private static instance: RedisClient;
  private static initPromise: Promise<RedisClient> | null = null;

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      // Double-checked locking with promise for async initialization
      if (!RedisClient.initPromise) {
        RedisClient.initPromise = Promise.resolve().then(() => {
          RedisClient.instance = new RedisClient();
          return RedisClient.instance;
        });
      }
    }
    return RedisClient.instance;
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  async connect(): Promise<void> {
    if (!config.redis.url) {
      logger.warn('[Redis] REDIS_URL not configured, caching disabled');
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: RETRY_MAX_ATTEMPTS,
        retryStrategy: (times: number) => {
          if (times > RETRY_MAX_ATTEMPTS) {
            logger.warn('[Redis] Max retries reached, disabling cache');
            return null;
          }
          return Math.min(times * RETRY_BASE_DELAY, RETRY_MAX_DELAY);
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        logger.error({ err }, '[Redis] Connection error');
      });

      this.client.on('connect', () => {
        logger.info('[Redis] Connected successfully');
      });

      await this.client.connect();
    } catch (error) {
      logger.warn({ error }, '[Redis] Failed to connect, caching disabled');
      this.client = null;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) return null;
    try {
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected()) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
    } catch (error) {
      console.error('[Redis] Set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await this.client!.del(key);
    } catch (error) {
      console.error('[Redis] Del error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch (error) {
      console.error('[Redis] DelPattern error:', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

// Cart caching helpers
export const CartCache = {
  key: (tenantId: string, cartId: string) => `cart:${tenantId}:${cartId}`,
  ttl: CACHE_TTL_1_HOUR, // 1 hour

  async get(tenantId: string, cartId: string) {
    return RedisClient.getInstance().get(CartCache.key(tenantId, cartId));
  },

  async set(tenantId: string, cartId: string, cart: unknown) {
    return RedisClient.getInstance().set(CartCache.key(tenantId, cartId), cart, CartCache.ttl);
  },

  async del(tenantId: string, cartId: string) {
    return RedisClient.getInstance().del(CartCache.key(tenantId, cartId));
  },
};

// Session caching helpers
export const SessionCache = {
  key: (tenantId: string, userId: string) => `session:${tenantId}:${userId}`,
  ttl: CACHE_TTL_15_MIN, // 15 minutes (aligned with JWT access token)

  async get(tenantId: string, userId: string) {
    return RedisClient.getInstance().get(SessionCache.key(tenantId, userId));
  },

  async set(tenantId: string, userId: string, session: unknown) {
    return RedisClient.getInstance().set(SessionCache.key(tenantId, userId), session, SessionCache.ttl);
  },

  async del(tenantId: string, userId: string) {
    return RedisClient.getInstance().del(SessionCache.key(tenantId, userId));
  },

  async invalidateUser(tenantId: string, userId: string) {
    // Invalidate all sessions for a user
    return RedisClient.getInstance().delPattern(`session:${tenantId}:${userId}:*`);
  },
};

// Rate limit counter helper (for distributed rate limiting)
export const RateLimitCache = {
  key: (identifier: string, window: string) => `ratelimit:${identifier}:${window}`,

  async increment(identifier: string, windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS): Promise<number> {
    const client = RedisClient.getInstance().getClient();
    if (!client) return 0;

    try {
      const key = RateLimitCache.key(identifier, windowSeconds.toString());
      const multi = client.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();

      if (results && results[0] && Array.isArray(results[0])) {
        return results[0][1] as number;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  async getCount(identifier: string, windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS): Promise<number> {
    const client = RedisClient.getInstance().getClient();
    if (!client) return 0;

    try {
      const key = RateLimitCache.key(identifier, windowSeconds.toString());
      const count = await client.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  },
};

// Export singleton getter
export const getRedis = () => RedisClient.getInstance();
