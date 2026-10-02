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

import { authRoutes } from './api/routes/auth.routes.js';
import { categoryRoutes } from './api/routes/category.routes.js';
import { productRoutes } from './api/routes/product.routes.js';
import { orderRoutes } from './api/routes/order.routes.js';
import { userRoutes } from './api/routes/user.routes.js';
import { tableRoutes } from './api/routes/table.routes.js';
import { stockRoutes } from './api/routes/stock.routes.js';
import { modifierRoutes } from './api/routes/modifier.routes.js';
import { reportRoutes } from './api/routes/report.routes.js';
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

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger Documentation
  if (config.isDevelopment) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'VentroPos API',
          description: 'Point of Sale API for Cafe',
          version: '1.0.0',
        },
        servers: [
          { url: `http://localhost:${config.server.port}` },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
    });
  }

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

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  app.get('/ready', async (_request, reply) => {
    // Check database connection
    try {
      const db = PostgresConnection.getInstance();
      const dbHealthy = await db.healthCheck();
      if (!dbHealthy) {
        return reply.status(503).send({
          status: 'not_ready',
          checks: { database: false },
        });
      }
      return { status: 'ready', checks: { database: true } };
    } catch {
      return reply.status(503).send({
        status: 'not_ready',
        checks: { database: false },
      });
    }
  });

  // ============== ROUTES ==============

  // Auth routes (public)
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Protected routes (require auth)
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(tableRoutes, { prefix: '/api/v1/tables' });
  await app.register(stockRoutes, { prefix: '/api/v1/stock' });
  await app.register(modifierRoutes, { prefix: '/api/v1/modifiers' });
  await app.register(reportRoutes, { prefix: '/api/v1/reports' });

  // ============== GRACEFUL SHUTDOWN ==============

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  });

  return app;
}
