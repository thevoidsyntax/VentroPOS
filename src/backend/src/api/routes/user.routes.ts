// Users Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateUserUseCase,
  GetUsersUseCase,
  GetUserUseCase,
  UpdateUserUseCase,
  UpdatePasswordUseCase,
  DeactivateUserUseCase,
  AdminResetPasswordUseCase,
} from '../../application/users/index.js';
import { PostgresUserRepository } from '../../infrastructure/database/repositories/index.js';
import { createUserSchema, updateUserSchema, userIdParamsSchema } from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const userRepo = new PostgresUserRepository();

  const createUserUseCase = new CreateUserUseCase(userRepo);
  const getUsersUseCase = new GetUsersUseCase(userRepo);
  const getUserUseCase = new GetUserUseCase(userRepo);
  const updateUserUseCase = new UpdateUserUseCase(userRepo);
  const updatePasswordUseCase = new UpdatePasswordUseCase(userRepo);
  const deactivateUserUseCase = new DeactivateUserUseCase(userRepo);
  const adminResetPasswordUseCase = new AdminResetPasswordUseCase(userRepo);

  // ============== LIST USERS ==============
  fastify.get('/', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await getUsersUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: users });
  });

  // ============== GET USER BY ID ==============
  fastify.get('/:id', {
    onRequest: [authMiddleware],
    schema: userIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const user = await getUserUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: user });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== CREATE USER ==============
  fastify.post('/', {
    onRequest: [authMiddleware, requireManager],
    schema: createUserSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      email: string;
      password: string;
      name: string;
      role: 'owner' | 'manager' | 'kasir' | 'kitchen';
    };

    try {
      const user = await createUserUseCase.execute(
        request.tenantId!,
        request.userRole!,
        body
      );
      return reply.status(201).send({ success: true, data: user });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== UPDATE USER ==============
  fastify.put('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateUserSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      email?: string;
      name?: string;
      role?: 'owner' | 'manager' | 'kasir' | 'kitchen';
      isActive?: boolean;
    };

    try {
      const user = await updateUserUseCase.execute(
        request.tenantId!,
        request.userRole!,
        id,
        body
      );
      return reply.send({ success: true, data: user });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== DEACTIVATE USER ==============
  fastify.delete('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: userIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deactivateUserUseCase.execute(request.tenantId!, request.userRole!, id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== CHANGE OWN PASSWORD ==============
  fastify.put('/me/password', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    try {
      await updatePasswordUseCase.execute(
        request.tenantId!,
        request.userId!,
        body
      );
      return reply.send({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== ADMIN RESET PASSWORD ==============
  fastify.post('/:id/reset-password', {
    onRequest: [authMiddleware, requireManager],
    schema: userIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { newPassword: string };

    try {
      await adminResetPasswordUseCase.execute(
        request.tenantId!,
        request.userRole!,
        id,
        body
      );
      return reply.send({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });
}
