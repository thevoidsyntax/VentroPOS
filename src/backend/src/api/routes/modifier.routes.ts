// Modifiers Routes - API Endpoints
// CRUD for modifier groups and individual modifiers

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateModifierGroupUseCase,
  GetModifierGroupsUseCase,
  GetModifierGroupUseCase,
  UpdateModifierGroupUseCase,
  DeleteModifierGroupUseCase,
  CreateModifierUseCase,
  GetModifiersUseCase,
  UpdateModifierUseCase,
  DeleteModifierUseCase,
} from '../../application/modifiers/index.js';
import {
  PostgresModifierGroupRepository,
  PostgresModifierRepository,
} from '../../infrastructure/database/repositories/index.js';
import {
  createModifierGroupSchema,
  updateModifierGroupSchema,
  modifierGroupIdParamsSchema,
  createModifierSchema,
  updateModifierSchema,
  modifierIdParamsSchema,
} from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

export async function modifierRoutes(fastify: FastifyInstance): Promise<void> {
  const modifierGroupRepo = new PostgresModifierGroupRepository();
  const modifierRepo = new PostgresModifierRepository();

  const createModifierGroupUseCase = new CreateModifierGroupUseCase(modifierGroupRepo);
  const getModifierGroupsUseCase = new GetModifierGroupsUseCase(modifierGroupRepo);
  const getModifierGroupUseCase = new GetModifierGroupUseCase(modifierGroupRepo);
  const updateModifierGroupUseCase = new UpdateModifierGroupUseCase(modifierGroupRepo);
  const deleteModifierGroupUseCase = new DeleteModifierGroupUseCase(modifierGroupRepo);

  const createModifierUseCase = new CreateModifierUseCase(modifierGroupRepo, modifierRepo);
  const getModifiersUseCase = new GetModifiersUseCase(modifierRepo);
  const updateModifierUseCase = new UpdateModifierUseCase(modifierRepo);
  const deleteModifierUseCase = new DeleteModifierUseCase(modifierRepo);

  // ============== MODIFIER GROUPS ==============

  // GET /modifier-groups
  fastify.get('/groups', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const groups = await getModifierGroupsUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: groups });
  });

  // GET /modifier-groups/:id
  fastify.get('/groups/:id', {
    onRequest: [authMiddleware],
    schema: modifierGroupIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const group = await getModifierGroupUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: group });
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

  // POST /modifier-groups
  fastify.post('/groups', {
    onRequest: [authMiddleware, requireManager],
    schema: createModifierGroupSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      name: string;
      type: 'size' | 'extras' | 'topping' | 'custom';
      isRequired?: boolean;
      minSelections?: number;
      maxSelections?: number;
    };

    try {
      const group = await createModifierGroupUseCase.execute(request.tenantId!, body);
      return reply.status(201).send({ success: true, data: group });
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

  // PUT /modifier-groups/:id
  fastify.put('/groups/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateModifierGroupSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      type?: 'size' | 'extras' | 'topping' | 'custom';
      isRequired?: boolean;
      minSelections?: number;
      maxSelections?: number;
    };

    try {
      const group = await updateModifierGroupUseCase.execute(request.tenantId!, id, body);
      return reply.send({ success: true, data: group });
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

  // DELETE /modifier-groups/:id
  fastify.delete('/groups/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: modifierGroupIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteModifierGroupUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true });
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

  // ============== MODIFIERS (under a group) ==============

  // GET /groups/:groupId/modifiers
  fastify.get('/groups/:groupId/modifiers', {
    onRequest: [authMiddleware],
    schema: modifierGroupIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { groupId } = request.params as { groupId: string };

    const modifiers = await getModifiersUseCase.execute(request.tenantId!, groupId);
    return reply.send({ success: true, data: modifiers });
  });

  // POST /groups/:groupId/modifiers
  fastify.post('/groups/:groupId/modifiers', {
    onRequest: [authMiddleware, requireManager],
    schema: createModifierSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { groupId } = request.params as { groupId: string };
    const body = request.body as {
      name: string;
      priceAdjustment?: number;
      sortOrder?: number;
    };

    try {
      const modifier = await createModifierUseCase.execute(request.tenantId!, groupId, body);
      return reply.status(201).send({ success: true, data: modifier });
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

  // PUT /modifiers/:id
  fastify.put('/modifiers/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateModifierSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    };

    try {
      const modifier = await updateModifierUseCase.execute(request.tenantId!, id, body);
      return reply.send({ success: true, data: modifier });
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

  // DELETE /modifiers/:id
  fastify.delete('/modifiers/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: modifierIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteModifierUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true });
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
