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
import { productRepository, stockLogRepository, stockOpnameRepository } from '../../infrastructure/database/repositories/container.js';
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
const recordStockCountUseCase = new RecordStockCountUseCase(stockOpnameRepository);
const batchRecordStockCountUseCase = new BatchRecordStockCountUseCase(stockOpnameRepository);
const submitStockOpnameUseCase = new SubmitStockOpnameUseCase(productRepository, stockLogRepository, stockOpnameRepository);
const cancelStockOpnameUseCase = new CancelStockOpnameUseCase(stockOpnameRepository);
const getStockOpnameUseCase = new GetStockOpnameUseCase(productRepository, stockOpnameRepository);
const listStockOpnamesUseCase = new ListStockOpnamesUseCase(stockOpnameRepository);

export async function stockOpnameRoutes(fastify: FastifyInstance): Promise<void> {
  // All routes require authentication and manager role
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', requireManager);

  // ============== LIST STOCK OPNAMES ==============
  fastify.get('/stock/opnames', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tenantId = request.tenantId!;
      const query = request.query as { status?: string; fromDate?: string; toDate?: string };

      const result = await listStockOpnamesUseCase.execute(tenantId, {
        status: query.status as 'draft' | 'in_progress' | 'completed' | 'cancelled',
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      });

      return reply.send({ success: true, data: result });
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

  // ============== CREATE STOCK OPNAME ==============
  fastify.post('/stock/opnames', { schema: createStockOpnameSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tenantId = request.tenantId!;
      const userId = request.userId!;
      const body = request.body as { notes?: string; productIds: string[] };

      const result = await createStockOpnameUseCase.execute(tenantId, userId, {
        notes: body.notes,
        productIds: body.productIds,
      });

      return reply.status(201).send({ success: true, data: result });
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

  // ============== GET STOCK OPNAME ==============
  fastify.get<{ Params: { id: string } }>('/stock/opnames/:id', async (request, reply) => {
    try {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const result = await getStockOpnameUseCase.execute(tenantId, id);

      return reply.send({ success: true, data: result });
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

  // ============== RECORD STOCK COUNT ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/counts', {
    schema: recordStockCountSchema,
  }, async (request, reply) => {
    try {
      const tenantId = request.tenantId!;
      const { id } = request.params;
      const body = request.body as { productId: string; actualQuantity: number; notes?: string };

      const result = await recordStockCountUseCase.execute(tenantId, id, {
        productId: body.productId,
        actualQuantity: body.actualQuantity,
        notes: body.notes,
      });

      return reply.send({ success: true, data: result });
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

  // ============== BATCH RECORD STOCK COUNTS ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/counts/batch', {
    schema: batchRecordStockCountSchema,
  }, async (request, reply) => {
    try {
      const tenantId = request.tenantId!;
      const { id } = request.params;
      const body = request.body as { counts: Array<{ productId: string; actualQuantity: number; notes?: string }> };

      const result = await batchRecordStockCountUseCase.execute(tenantId, id, body.counts);

      return reply.send({ success: true, data: result });
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

  // ============== SUBMIT STOCK OPNAME ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/submit', async (request, reply) => {
    try {
      const tenantId = request.tenantId!;
      const userId = request.userId!;
      const { id } = request.params;

      const result = await submitStockOpnameUseCase.execute(tenantId, userId, id, {
        applyAdjustments: true,
      });

      return reply.send({ success: true, data: result });
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

  // ============== CANCEL STOCK OPNAME ==============
  fastify.post<{ Params: { id: string } }>('/stock/opnames/:id/cancel', async (request, reply) => {
    try {
      const tenantId = request.tenantId!;
      const { id } = request.params;

      const result = await cancelStockOpnameUseCase.execute(tenantId, id);

      return reply.send({ success: true, data: result });
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
