// Orders Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateOrderUseCase,
  CheckoutUseCase,
  UpdateOrderStatusUseCase,
  VoidOrderUseCase,
  GetOrdersUseCase,
} from '../../application/orders/index.js';
import {
  orderRepository,
  productRepository,
  transactionRepository,
  tableRepository,
  stockLogRepository,
  idempotencyKeyRepository,
} from '../../infrastructure/database/repositories/container.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamsSchema,
  getOrdersQuerySchema,
  checkoutSchema,
  voidOrderSchema,
} from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireKasir, requireManager } from '../middleware/index.js';
import type { Order } from '../../domain/entities/index.js';

export async function orderRoutes(fastify: FastifyInstance): Promise<void> {
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepository, productRepository, tableRepository, stockLogRepository
  );
  const checkoutUseCase = new CheckoutUseCase(
    orderRepository, transactionRepository, productRepository, stockLogRepository, idempotencyKeyRepository
  );
  const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
  const voidOrderUseCase = new VoidOrderUseCase(
    orderRepository, productRepository, stockLogRepository
  );
  const getOrdersUseCase = new GetOrdersUseCase(orderRepository);

  // ============== GET ORDERS ==============
  fastify.get('/', {
    onRequest: [authMiddleware],
    schema: getOrdersQuerySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      status?: string;
      tableId?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    };

    const filters: {
      status?: Order['status'][];
      tableId?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {};

    if (query.status) {
      filters.status = query.status.split(',') as Order['status'][];
    }
    if (query.tableId) filters.tableId = query.tableId;
    if (query.fromDate) {
      const fromDate = new Date(query.fromDate);
      if (isNaN(fromDate.getTime())) {
        return reply.status(400).send({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid fromDate format' } });
      }
      filters.fromDate = fromDate;
    }
    if (query.toDate) {
      const toDate = new Date(query.toDate);
      if (isNaN(toDate.getTime())) {
        return reply.status(400).send({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid toDate format' } });
      }
      filters.toDate = toDate;
    }
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;

    const result = await getOrdersUseCase.execute(request.tenantId!, filters);
    return reply.send({ success: true, ...result });
  });

  // ============== CREATE ORDER ==============
  fastify.post('/', {
    onRequest: [authMiddleware, requireKasir],
    schema: createOrderSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      tableId?: string;
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ modifierId: string; name: string; priceAdjustment: number }>;
        notes?: string;
      }>;
      customerName?: string;
      notes?: string;
      applyDiscount?: { type: 'percentage' | 'fixed'; value: number };
    };

    try {
      const order = await createOrderUseCase.execute(request.tenantId!, request.userId!, {
        tableId: body.tableId,
        items: body.items,
        customerName: body.customerName,
        notes: body.notes,
        applyDiscount: body.applyDiscount,
      });
      return reply.status(201).send({ success: true, data: order });
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

  // ============== GET ORDER BY ID ==============
  fastify.get('/:id', {
    onRequest: [authMiddleware],
    schema: orderIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const order = await orderRepository.findById(request.tenantId!, id);
    if (!order) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }
    return reply.send({ success: true, data: order });
  });

  // ============== UPDATE ORDER STATUS ==============
  fastify.put('/:id/status', {
    onRequest: [authMiddleware, requireKasir],
    schema: updateOrderStatusSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: Order['status'] };

    try {
      const order = await updateOrderStatusUseCase.execute(
        request.tenantId!, id, status
      );
      return reply.send({ success: true, data: order });
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

  // ============== CHECKOUT ==============
  fastify.post('/checkout', {
    onRequest: [authMiddleware, requireKasir],
    schema: checkoutSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      orderId: string;
      paymentMethod: 'cash' | 'qris' | 'debit' | 'credit';
      cashReceived?: number;
      referenceNumber?: string;
      splitPayments?: Array<{ method: 'cash' | 'qris' | 'debit' | 'credit'; amount: number }>;
      idempotencyKey?: string;
    };

    try {
      const result = await checkoutUseCase.execute(request.tenantId!, request.userId!, {
        orderId: body.orderId,
        paymentMethod: body.paymentMethod,
        cashReceived: body.cashReceived,
        referenceNumber: body.referenceNumber,
        splitPayments: body.splitPayments,
        idempotencyKey: body.idempotencyKey,
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

  // ============== VOID ORDER ==============
  fastify.post('/:id/void', {
    onRequest: [authMiddleware, requireManager],
    schema: voidOrderSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const order = await voidOrderUseCase.execute(
        request.tenantId!, id
      );
      return reply.send({ success: true, data: order });
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

  // ============== HOLD ORDER ==============
  fastify.post('/:id/hold', {
    onRequest: [authMiddleware, requireKasir],
    schema: orderIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const order = await updateOrderStatusUseCase.execute(
        request.tenantId!, id, 'held'
      );
      return reply.send({ success: true, data: order });
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

  // ============== RESUME ORDER ==============
  fastify.post('/:id/resume', {
    onRequest: [authMiddleware, requireKasir],
    schema: orderIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const order = await updateOrderStatusUseCase.execute(
        request.tenantId!, id, 'pending'
      );
      return reply.send({ success: true, data: order });
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
