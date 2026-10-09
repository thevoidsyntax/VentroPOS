// Main Application Setup - Fastify with all plugins and routes
// Simplified DDD: Application entry point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from './shared/config/index.js';
import { AppError } from './shared/errors/index.js';
import { RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX_REQUESTS } from './shared/constants/index.js';
import { registerSecurityHeaders, rateLimitKeyGenerator, rateLimitErrorResponse } from './api/middleware/security.js';
import { RedisClient } from './infrastructure/cache/redis.js';

import { authRoutes } from './api/routes/auth.routes.js';
import { categoryRoutes } from './api/routes/category.routes.js';
import { productRoutes } from './api/routes/product.routes.js';
import { orderRoutes } from './api/routes/order.routes.js';
import { userRoutes } from './api/routes/user.routes.js';
import { tableRoutes } from './api/routes/table.routes.js';
import { stockRoutes } from './api/routes/stock.routes.js';
import { stockOpnameRoutes } from './api/routes/stock-opname.routes.js';
import { modifierRoutes } from './api/routes/modifier.routes.js';
import { reportRoutes } from './api/routes/report.routes.js';
import { hardwareRoutes } from './api/routes/hardware.routes.js';
import { printRoutes } from './api/routes/print.routes.js';
import { edcRoutes } from './api/routes/edc.routes.js';
import { hardwareMiscRoutes } from './api/routes/hardware-misc.routes.js';
import { healthRoutes } from './api/routes/health.routes.js';
import { PostgresConnection } from './infrastructure/database/postgres/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.isDevelopment
        ? {
            target: 'pino-pretty',
            options: { colorize: true },
          }
        : undefined,
    },
  });

  // ============== PLUGINS ==============

  // Security Headers (first, applies to all responses)
  await registerSecurityHeaders(app);

  // CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwt.secret,
    sign: { algorithm: 'HS256' },
    verify: { algorithms: ['HS256'] },
  });

  // ============== RATE LIMITING CONFIGURATION ==============

  // Redis Connection (for caching and distributed rate limiting)
  const redisInstance = RedisClient.getInstance();
  if (redisInstance && config.redis.url) {
    await redisInstance.connect().catch((err) => {
      app.log.warn({ err }, '[Redis] Connection failed, continuing without Redis');
    });
  }

  const redisClient = redisInstance?.getClient();

  if (redisClient) {
    app.log.info('[RateLimit] Redis connected - distributed rate limiting enabled');
  } else {
    app.log.warn('[RateLimit] Redis not available - using in-memory rate limiting');
  }

  // Global rate limit config
  const globalRateLimitConfig = {
    max: RATE_LIMIT_MAX_REQUESTS, // requests per minute per IP
    timeWindow: '1 minute',
    keyGenerator: rateLimitKeyGenerator,
    errorResponseBuilder: rateLimitErrorResponse,
    // Skip rate limiting for health check endpoints
    skip: (request: { url?: string }) => {
      const healthPaths = ['/health', '/ready', '/docs', '/favicon.ico'];
      return healthPaths.some((path) => request.url?.startsWith(path));
    },
    // Use Redis for distributed rate limiting if available
    ...(redisClient && { redis: redisClient }),
  };

  // Auth routes rate limit config (stricter for login attempts)
  const authRateLimitConfig = {
    max: AUTH_RATE_LIMIT_MAX_REQUESTS, // requests per minute per IP for auth endpoints
    timeWindow: '1 minute',
    keyGenerator: rateLimitKeyGenerator,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please try again later.',
      },
    }),
    // Use Redis for distributed rate limiting if available
    ...(redisClient && { redis: redisClient }),
  };

  // Global Rate Limiting
  await app.register(rateLimit, globalRateLimitConfig);

  // Apply stricter rate limiting to auth routes
  await app.register(async function (instance) {
    await instance.register(rateLimit, authRateLimitConfig);
    await instance.register(authRoutes, { prefix: '/auth' });
  }, { prefix: '/api/v1' });

  // Swagger Documentation
  const packageJson = await import('../package.json', { assert: { type: 'json' } });
  const apiVersion = packageJson.default.version;

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'VentroPOS API',
        description: 'Point of Sale System for Cafe - Complete REST API documentation',
        version: apiVersion,
        contact: {
          name: 'VentroPOS Support',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        ...(config.isProduction
          ? []
          : [{ url: `http://localhost:${config.server.port}`, description: 'Development server' }]),
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints (liveness/readiness)' },
        { name: 'Auth', description: 'Authentication and authorization endpoints' },
        { name: 'Users', description: 'User management (staff accounts)' },
        { name: 'Products', description: 'Product and menu management' },
        { name: 'Categories', description: 'Product category management' },
        { name: 'Orders', description: 'Order creation and management' },
        { name: 'Tables', description: 'Restaurant table management' },
        { name: 'Stock', description: 'Inventory and stock management' },
        { name: 'Modifiers', description: 'Product modifiers and customizations' },
        { name: 'Reports', description: 'Sales and business reports' },
        { name: 'Hardware', description: 'Hardware integration (printers, EDC, scanners)' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    logo: {
      type: 'image/svg+xml',
      content: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzEwYjk4MSIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIvPjx0ZXh0IHg9IjE2IiB5PSIyMiIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPlY8L3RleHQ+PC9zdmc+',
    },
  });

  // ============== ERROR HANDLER ==============

  app.setErrorHandler((error: Error | unknown, _request, reply) => {
    app.log.error(error);

    // JSON Parse errors
    if (error instanceof SyntaxError && 'body' in error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON in request body',
        },
      });
    }

    // Zod validation errors (FastifyError has validation property)
    if (typeof error === 'object' && error !== null && 'validation' in error) {
      const validationError = error as { validation: unknown };
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationError.validation,
        },
      });
    }

    // Custom app errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      });
    }

    // Default error
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: config.isDevelopment && error instanceof Error ? error.message : 'Internal server error',
      },
    });
  });

  // ============== HEALTH CHECKS ==============

  await app.register(healthRoutes, { prefix: '/health' });

  // ============== ROUTES ==============

  // Auth routes registered above (within rate-limited scope)

  // Protected routes (require auth)
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(tableRoutes, { prefix: '/api/v1/tables' });
  await app.register(stockRoutes, { prefix: '/api/v1/stock' });
  await app.register(stockOpnameRoutes, { prefix: '/api/v1/stock' });
  await app.register(modifierRoutes, { prefix: '/api/v1/modifiers' });
  await app.register(reportRoutes, { prefix: '/api/v1/reports' });
  await app.register(hardwareRoutes, { prefix: '/api/v1/hardware' });
  await app.register(printRoutes, { prefix: '/api/v1/hardware/print' });
  await app.register(edcRoutes, { prefix: '/api/v1/hardware/edc' });
  await app.register(hardwareMiscRoutes, { prefix: '/api/v1/hardware' });

  // ============== GRACEFUL SHUTDOWN ==============

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);

      // Close Redis connection
      await RedisClient.getInstance().close();

      // Close database connection
      await PostgresConnection.getInstance().close();

      // Close Fastify
      await app.close();

      app.log.info('Shutdown complete');
      process.exit(0);
    });
  });

  return app;
}
