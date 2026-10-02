// Stock Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  GetStockAlertsUseCase,
  ReceiveStockUseCase,
  AdjustStockUseCase,
  GetStockHistoryUseCase,
  GetStockOverviewUseCase,
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

// Stock Opname schemas
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

const submitStockOpnameSchema = {
  body: {
    type: 'object',
    required: ['applyAdjustments'],
    properties: {
      applyAdjustments: { type: 'boolean' },
    },
  },
};

const stockOpnameParamsSchema = {
  params: {
    type: 'object',
    required: ['opnameId'],
    properties: {
      opnameId: { type: 'string', format: 'uuid' },
    },
  },
};

const listStockOpnamesQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['draft', 'in_progress', 'completed', 'cancelled'] },
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
  const createStockOpnameUseCase = new CreateStockOpnameUseCase(productRepository, stockOpnameRepository);
  const recordStockCountUseCase = new RecordStockCountUseCase(stockOpnameRepository);
  const batchRecordStockCountUseCase = new BatchRecordStockCountUseCase(stockOpnameRepository);
  const submitStockOpnameUseCase = new SubmitStockOpnameUseCase(productRepository, stockLogRepository, stockOpnameRepository);
  const cancelStockOpnameUseCase = new CancelStockOpnameUseCase(stockOpnameRepository);
  const getStockOpnameUseCase = new GetStockOpnameUseCase(productRepository, stockOpnameRepository);
  const listStockOpnamesUseCase = new ListStockOpnamesUseCase(stockOpnameRepository);

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
    };

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (query.fromDate) {
      fromDate = new Date(query.fromDate);
      if (isNaN(fromDate.getTime())) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_DATE', message: 'Invalid fromDate format' },
        });
      }
    }
    if (query.toDate) {
      toDate = new Date(query.toDate);
      if (isNaN(toDate.getTime())) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_DATE', message: 'Invalid toDate format' },
        });
      }
    }

    try {
      const result = await getStockHistoryUseCase.execute(request.tenantId!, {
        productId: query.productId,
        type: query.type,
        fromDate,
        toDate,
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

  // ============== STOCK OPNAME ROUTES ==============

  // GET /api/v1/stock/opnames - List all stock opnames
  fastify.get('/opnames', {
    onRequest: [authMiddleware],
    schema: listStockOpnamesQuerySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
      fromDate?: string;
      toDate?: string;
    };

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (query.fromDate) {
      fromDate = new Date(query.fromDate);
      if (isNaN(fromDate.getTime())) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_DATE', message: 'Invalid fromDate format' },
        });
      }
    }
    if (query.toDate) {
      toDate = new Date(query.toDate);
      if (isNaN(toDate.getTime())) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_DATE', message: 'Invalid toDate format' },
        });
      }
    }

    try {
      const result = await listStockOpnamesUseCase.execute(request.tenantId!, {
        status: query.status,
        fromDate,
        toDate,
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

  // POST /api/v1/stock/opnames - Create new stock opname
  fastify.post('/opnames', {
    onRequest: [authMiddleware, requireManager],
    schema: createStockOpnameSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      notes?: string;
      productIds?: string[];
    };

    try {
      const result = await createStockOpnameUseCase.execute(
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

  // GET /api/v1/stock/opnames/:opnameId - Get stock opname details
  fastify.get<{ Params: { opnameId: string } }>('/opnames/:opnameId', {
    onRequest: [authMiddleware],
    schema: stockOpnameParamsSchema,
  }, async (request, reply: FastifyReply) => {
    const { opnameId } = request.params;

    try {
      const result = await getStockOpnameUseCase.execute(request.tenantId!, opnameId);
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

  // POST /api/v1/stock/opnames/:opnameId/counts - Record single item count
  fastify.post<{ Params: { opnameId: string } }>('/opnames/:opnameId/counts', {
    onRequest: [authMiddleware, requireManager],
    schema: { ...stockOpnameParamsSchema, ...recordStockCountSchema },
  }, async (request, reply: FastifyReply) => {
    const { opnameId } = request.params;
    const body = request.body as {
      productId: string;
      actualQuantity: number;
      notes?: string;
    };

    try {
      const result = await recordStockCountUseCase.execute(
        request.tenantId!,
        opnameId,
        body
      );
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

  // POST /api/v1/stock/opnames/:opnameId/counts/batch - Record multiple item counts
  fastify.post<{ Params: { opnameId: string } }>('/opnames/:opnameId/counts/batch', {
    onRequest: [authMiddleware, requireManager],
    schema: { ...stockOpnameParamsSchema, ...batchRecordStockCountSchema },
  }, async (request, reply: FastifyReply) => {
    const { opnameId } = request.params;
    const body = request.body as {
      counts: Array<{ productId: string; actualQuantity: number; notes?: string }>;
    };

    try {
      const result = await batchRecordStockCountUseCase.execute(
        request.tenantId!,
        opnameId,
        body.counts
      );
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

  // POST /api/v1/stock/opnames/:opnameId/submit - Submit and complete stock opname
  fastify.post<{ Params: { opnameId: string } }>('/opnames/:opnameId/submit', {
    onRequest: [authMiddleware, requireManager],
    schema: { ...stockOpnameParamsSchema, ...submitStockOpnameSchema },
  }, async (request, reply: FastifyReply) => {
    const { opnameId } = request.params;
    const body = request.body as {
      applyAdjustments: boolean;
    };

    try {
      const result = await submitStockOpnameUseCase.execute(
        request.tenantId!,
        request.userId!,
        opnameId,
        body
      );
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

  // POST /api/v1/stock/opnames/:opnameId/cancel - Cancel stock opname
  fastify.post<{ Params: { opnameId: string } }>('/opnames/:opnameId/cancel', {
    onRequest: [authMiddleware, requireManager],
    schema: stockOpnameParamsSchema,
  }, async (request, reply: FastifyReply) => {
    const { opnameId } = request.params;

    try {
      const result = await cancelStockOpnameUseCase.execute(
        request.tenantId!,
        opnameId
      );
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
