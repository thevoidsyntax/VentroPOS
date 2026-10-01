// Tables Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTableUseCase,
  GetTablesUseCase,
  GetTableUseCase,
  UpdateTableUseCase,
  DeleteTableUseCase,
  OccupyTableUseCase,
  ReleaseTableUseCase,
  GetTableLayoutUseCase,
} from '../../application/tables/index.js';
import { tableRepository } from '../../infrastructure/database/repositories/container.js';
import { createTableSchema, updateTableSchema, tableIdParamsSchema } from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

export async function tableRoutes(fastify: FastifyInstance): Promise<void> {
  const createTableUseCase = new CreateTableUseCase(tableRepository);
  const getTablesUseCase = new GetTablesUseCase(tableRepository);
  const getTableUseCase = new GetTableUseCase(tableRepository);
  const updateTableUseCase = new UpdateTableUseCase(tableRepository);
  const deleteTableUseCase = new DeleteTableUseCase(tableRepository);
  const occupyTableUseCase = new OccupyTableUseCase(tableRepository);
  const releaseTableUseCase = new ReleaseTableUseCase(tableRepository);
  const getTableLayoutUseCase = new GetTableLayoutUseCase(tableRepository);

  // ============== LIST TABLES ==============
  fastify.get('/', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const tables = await getTablesUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: tables });
  });

  // ============== GET TABLE LAYOUT ==============
  fastify.get('/layout', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const layout = await getTableLayoutUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: layout });
  });

  // ============== GET TABLE BY ID ==============
  fastify.get('/:id', {
    onRequest: [authMiddleware],
    schema: tableIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const table = await getTableUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: table });
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

  // ============== CREATE TABLE ==============
  fastify.post('/', {
    onRequest: [authMiddleware, requireManager],
    schema: createTableSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      tableNumber: string;
      capacity?: number;
      positionX?: number;
      positionY?: number;
    };

    try {
      const table = await createTableUseCase.execute(request.tenantId!, body);
      return reply.status(201).send({ success: true, data: table });
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

  // ============== UPDATE TABLE ==============
  fastify.put('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateTableSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      tableNumber?: string;
      capacity?: number;
      positionX?: number;
      positionY?: number;
      status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
    };

    try {
      const table = await updateTableUseCase.execute(request.tenantId!, id, body);
      return reply.send({ success: true, data: table });
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

  // ============== DELETE TABLE ==============
  fastify.delete('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: tableIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteTableUseCase.execute(request.tenantId!, id);
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

  // ============== OCCUPY TABLE ==============
  fastify.post('/:id/occupy', {
    onRequest: [authMiddleware],
    schema: tableIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const table = await occupyTableUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: table });
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

  // ============== RELEASE TABLE ==============
  fastify.post('/:id/release', {
    onRequest: [authMiddleware],
    schema: tableIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const table = await releaseTableUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: table });
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
