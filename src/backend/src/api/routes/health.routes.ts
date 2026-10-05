// Health Check Routes - Liveness and Readiness probes
/**
 * @module api/routes/health
 */

import type { FastifyInstance, FastifyReply } from 'fastify';
import { PostgresConnection } from '../../infrastructure/database/postgres/index.js';
import { RedisClient } from '../../infrastructure/cache/redis.js';

/**
 * Health check response schema
 */
const healthResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    timestamp: { type: 'string' },
    uptime: { type: 'number' },
  },
};

const readyResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    checks: {
      type: 'object',
      properties: {
        database: { type: 'boolean' },
        redis: { type: 'boolean' },
      },
    },
    timestamp: { type: 'string' },
  },
};

/**
 * Health routes - Kubernetes-style liveness and readiness probes
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Liveness probe - basic health check
  fastify.get('/liveness', {
    schema: {
      description: 'Liveness probe - basic health check',
      tags: ['Health'],
      response: {
        200: healthResponseSchema,
      },
    },
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Alias /health for /liveness
  fastify.get('/', {
    schema: {
      description: 'Liveness probe alias',
      tags: ['Health'],
      response: {
        200: healthResponseSchema,
      },
    },
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Readiness probe - checks all dependencies
  fastify.get('/readiness', {
    schema: {
      description: 'Readiness probe - checks database and cache connectivity',
      tags: ['Health'],
      response: {
        200: readyResponseSchema,
        503: readyResponseSchema,
      },
    },
  }, async (_request, reply: FastifyReply) => {
    const checks: Record<string, boolean> = {
      database: false,
      redis: false,
    };

    try {
      const db = PostgresConnection.getInstance();
      checks.database = await db.healthCheck();
    } catch {
      checks.database = false;
    }

    try {
      checks.redis = await RedisClient.getInstance().healthCheck();
    } catch {
      checks.redis = false;
    }

    const allHealthy = Object.values(checks).every(Boolean);

    if (!allHealthy) {
      return reply.status(503).send({
        status: 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  });
}
