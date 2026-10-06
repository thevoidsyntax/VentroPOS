// Stock Opname Routes - API Endpoints for Stock Taking
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateStockOpnameUseCase,
  RecordStockCountUseCase,
  BatchRecordStockCountUseCase,
  SubmitStockOpnameUseCase,
  CancelStockOpnameUseCase,
  GetStockOpnameUseCase,
  ListStockOpnamesUseCase,
} from '../../application/stock/index.js';
import { productRepository, stockOpnameRepository } from '../../infrastructure/database/repositories/container.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

// Schema for request bodies
const createStockOpnameSchema = {
  body: {
    type: 'object',
    properties: {
      notes: { type: 'string' },
      productIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    },
  },
};

const recordStockCountSchema = {
  body: {
    type: 'object',
    required: ['productId', 'actualQuantity'],
    properties: {
      productId: { type: 'string', format: 'uuid' },
      actualQuantity: { type: 'number', minimum: 0 },
      notes: { type: 'string' },
    },
  },
};

const batchRecordStockCountSchema = {
  body: {
    type: 'object',
    required: ['counts'],
    properties: {
      counts: {
        type: 'array',
        items: {
          type: 'object',
          required: ['productId', 'actualQuantity'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            actualQuantity: { type: 'number', minimum: 0 },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
};

// Initialize use cases
const createStockOpnameUseCase = new CreateStockOpnameUseCase(productRepository, stockOpnameRepository);
const recordStockCountUseCase = new RecordStockCountUseCase(productRepository, stockOpnameRepository);
const batchRecordStockCountUseCase = new BatchRecordStockCountUseCase(productRepository, stockOpnameRepository);
const submitStockOpnameUseCase = new SubmitStockOpnameUseCase(productRepository, stockOpnameRepository);
const cancelStockOpnameUseCase = new CancelStockOpnameUseCase(stockOpnameRepository);
const getStockOpnameUseCase = new GetStockOpnameUseCase(stockOpnameRepository, productRepository);
const listStockOpnamesUseCase = new ListStockOpnamesUseCase(stockOpnameRepository);

export async function stockOpnameRoutes(fastify: FastifyInstance): Promise<void> {
  // All routes require authentication and manager role
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', requireManager);

  // ============== LIST STOCK OPNAMES ==============
  fastify.get('/stock/opnames', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user;
      const query = request.query as { status?: string; fromDate?: string; toDate?: string; page?: string; limit?: string };

      const result = await listStockOpnamesUseCase.execute(user.tenantId, {
        status: query.status as 'draft' | 'in_progress' | 'completed' | 'cancelled',
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== CREATE STOCK OPNAME ==============
  fastify.post('/stock/opnames', { schema: createStockOpnameSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user;
      const body = request.body as { notes?: string; productIds: string[] };

      const result = await createStockOpnameUseCase.execute(user.tenantId, user.id, {
        notes: body.notes,
        productIds: body.productIds,
      });

      return reply.status(201).send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== GET STOCK OPNAME ==============
  fastify.get<{ Params: { id: string } }>('/stock/opnames/:id', async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params;

      const result = await getStockOpnameUseCase.execute(user.tenantId, id);

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== RECORD STOCK COUNT ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/counts', {
    schema: recordStockCountSchema,
  }, async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params;
      const body = request.body as { productId: string; actualQuantity: number; notes?: string };

      const result = await recordStockCountUseCase.execute(user.tenantId, id, {
        productId: body.productId,
        actualQuantity: body.actualQuantity,
        notes: body.notes,
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== BATCH RECORD STOCK COUNTS ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/counts/batch', {
    schema: batchRecordStockCountSchema,
  }, async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params;
      const body = request.body as { counts: Array<{ productId: string; actualQuantity: number; notes?: string }> };

      const result = await batchRecordStockCountUseCase.execute(user.tenantId, id, body.counts);

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== SUBMIT STOCK OPNAME ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/submit', async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params;

      const result = await submitStockOpnameUseCase.execute(user.tenantId, id);

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });

  // ============== CANCEL STOCK OPNAME ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/cancel', async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params;

      const result = await cancelStockOpnameUseCase.execute(user.tenantId, id);

      return reply.send({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.from(error);
    }
  });
}
