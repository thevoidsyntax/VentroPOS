// Stock Routes - API Endpoints for basic stock operations
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  GetStockAlertsUseCase,
  ReceiveStockUseCase,
  AdjustStockUseCase,
  GetStockHistoryUseCase,
  GetStockOverviewUseCase,
} from '../../application/stock/index.js';
import { productRepository, stockLogRepository } from '../../infrastructure/database/repositories/container.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

// Schema for request bodies
const receiveStockSchema = {
  body: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: { type: 'string', format: 'uuid' },
      quantity: { type: 'number', minimum: 1 },
      notes: { type: 'string' },
      referenceNumber: { type: 'string' },
    },
  },
};

const adjustStockSchema = {
  body: {
    type: 'object',
    required: ['productId', 'newQuantity', 'reason'],
    properties: {
      productId: { type: 'string', format: 'uuid' },
      newQuantity: { type: 'number', minimum: 0 },
      reason: { type: 'string' },
      referenceNumber: { type: 'string' },
    },
  },
};

const stockHistoryQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      productId: { type: 'string', format: 'uuid' },
      type: { type: 'string', enum: ['sale', 'restock', 'adjustment', 'return', 'void'] },
      fromDate: { type: 'string', format: 'date-time' },
      toDate: { type: 'string', format: 'date-time' },
    },
  },
};

export async function stockRoutes(fastify: FastifyInstance): Promise<void> {
  const getStockAlertsUseCase = new GetStockAlertsUseCase(productRepository);
  const receiveStockUseCase = new ReceiveStockUseCase(productRepository, stockLogRepository);
  const adjustStockUseCase = new AdjustStockUseCase(productRepository, stockLogRepository);
  const getStockHistoryUseCase = new GetStockHistoryUseCase(productRepository, stockLogRepository);
  const getStockOverviewUseCase = new GetStockOverviewUseCase(productRepository);

  // ============== GET STOCK OVERVIEW ==============
  fastify.get('/overview', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const overview = await getStockOverviewUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: overview });
  });

  // ============== GET STOCK ALERTS ==============
  fastify.get('/alerts', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const alerts = await getStockAlertsUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: alerts });
  });

  // ============== RECEIVE STOCK (RESTOCK) ==============
  fastify.post('/receive', {
    onRequest: [authMiddleware, requireManager],
    schema: receiveStockSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      productId: string;
      quantity: number;
      notes?: string;
      referenceNumber?: string;
    };

    try {
      const result = await receiveStockUseCase.execute(
        request.tenantId!,
        request.userId!,
        body
      );
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

  // ============== ADJUST STOCK ==============
  fastify.post('/adjust', {
    onRequest: [authMiddleware, requireManager],
    schema: adjustStockSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      productId: string;
      newQuantity: number;
      reason: string;
      referenceNumber?: string;
    };

    try {
      const result = await adjustStockUseCase.execute(
        request.tenantId!,
        request.userId!,
        body
      );
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

  // ============== GET STOCK HISTORY ==============
  fastify.get('/history', {
    onRequest: [authMiddleware],
    schema: stockHistoryQuerySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      productId?: string;
      type?: 'sale' | 'restock' | 'adjustment' | 'return' | 'void';
      fromDate?: string;
      toDate?: string;
      page?: string;
      limit?: string;
    };

    const result = await getStockHistoryUseCase.execute(request.tenantId!, {
      productId: query.productId,
      type: query.type,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    });

    return reply.send({ success: true, data: result });
  });
}
