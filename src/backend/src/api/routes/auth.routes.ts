// Auth Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services
/**
 * @module api/routes/auth
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterUseCase, LoginUseCase, RefreshTokenUseCase, GetCurrentUserUseCase } from '../../application/auth/index.js';
import { PostgresTenantRepository, PostgresUserRepository } from '../../infrastructure/database/repositories/index.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/index.js';
import { config } from '../../shared/config/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware } from '../middleware/index.js';

/**
 * Auth routes - handles authentication endpoints
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize repositories and services
  const tenantRepo = new PostgresTenantRepository();
  const userRepo = new PostgresUserRepository();

  // Initialize use cases with dependencies
  const registerUseCase = new RegisterUseCase(
    tenantRepo,
    userRepo,
    (password: string) => bcrypt.hash(password, config.security.bcryptRounds)
  );

  const loginUseCase = new LoginUseCase(
    userRepo,
    (password: string, hash: string) => bcrypt.compare(password, hash),
    async (payload) => {
      const accessToken = fastify.jwt.sign(
        { ...payload, type: 'access' },
        { expiresIn: config.jwt.accessExpiresIn }
      );
      const refreshToken = fastify.jwt.sign(
        { ...payload, type: 'refresh' },
        { expiresIn: config.jwt.refreshExpiresIn }
      );
      return {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn,
      };
    }
  );

  const refreshTokenUseCase = new RefreshTokenUseCase(
    async (token: string) => {
      return fastify.jwt.verify<{
        sub: string;
        tenantId: string;
        email: string;
        role: string;
        type: 'access' | 'refresh';
      }>(token);
    },
    async (payload) => {
      const accessToken = fastify.jwt.sign(
        { ...payload, type: 'access' },
        { expiresIn: config.jwt.accessExpiresIn }
      );
      const refreshToken = fastify.jwt.sign(
        { ...payload, type: 'refresh' },
        { expiresIn: config.jwt.refreshExpiresIn }
      );
      return {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn,
      };
    },
    userRepo
  );

  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);

  // ============== REGISTER (Rate Limited) ==============
  fastify.post('/register', {
    schema: registerSchema,
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantName, email, password, ownerName } = request.body as {
      tenantName: string;
      email: string;
      password: string;
      ownerName: string;
    };

    try {
      const result = await registerUseCase.execute({
        tenantName,
        email,
        password,
        ownerName,
      });

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      throw error;
    }
  });

  // ============== LOGIN (Rate Limited) ==============
  fastify.post('/login', {
    schema: loginSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    try {
      const result = await loginUseCase.execute({ email, password });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      throw error;
    }
  });

  // ============== REFRESH TOKEN ==============
  fastify.post('/refresh', {
    schema: refreshTokenSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    try {
      const tokens = await refreshTokenUseCase.execute({ refreshToken });

      return reply.send({
        success: true,
        data: tokens,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      throw error;
    }
  });

  // ============== GET CURRENT USER ==============
  fastify.get('/me', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getCurrentUserUseCase.execute(request.tenantId!, request.userId!);

    return reply.send({
      success: true,
      data: user,
    });
  });
}
