// API: EDC Routes - Electronic Data Capture Terminal Payment Processing
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { EDCService } from '../../application/hardware/edc.service.js';
import { hardwareLogRepository } from '../../infrastructure/database/repositories/container.js';
import { authMiddleware } from '../middleware/index.js';
import type { UserRole } from '../../domain/entities/index.js';

// Zod Schemas
const paymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  deviceId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(64),
});

const cancelSchema = z.object({
  transactionId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(64),
});

const settleSchema = z.object({
  deviceId: z.string().uuid().optional(),
  batchNumber: z.string().optional(),
});

type AuthenticatedRequest = FastifyRequest & { user: { tenantId: string; id: string; role: UserRole } };

export async function edcRoutes(app: FastifyInstance) {
  const edcService = new EDCService();

  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // ============== PROCESS PAYMENT ==============

  app.post('/payment', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = paymentSchema.parse(request.body);

    try {
      const result = await edcService.processPayment(
        tenantId,
        {
          orderId: body.orderId,
          amount: body.amount,
          deviceId: body.deviceId,
        },
        body.idempotencyKey
      );

      if (result.status === 'approved') {
        return reply.send({
          success: true,
          data: {
            status: result.status,
            transactionId: result.transactionId,
            referenceNumber: result.referenceNumber,
            authCode: result.authCode,
            cardNumber: result.cardNumber,
            cardType: result.cardType,
            message: result.message,
          },
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PAYMENT_DECLINED',
            message: result.message,
            transactionId: result.transactionId,
          },
        });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'EDC_ERROR',
          message: error instanceof Error ? error.message : 'Payment processing failed',
        },
      });
    } finally {
      await edcService.disconnect();
    }
  });

  // ============== CANCEL PAYMENT ==============

  app.post('/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = cancelSchema.parse(request.body);

    try {
      const result = await edcService.cancelPayment(
        tenantId,
        body.transactionId,
        body.idempotencyKey
      );

      if (result.success) {
        return reply.send({
          success: true,
          data: {
            cancelled: true,
            message: result.message,
          },
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CANCEL_FAILED',
            message: result.message,
          },
        });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'EDC_ERROR',
          message: error instanceof Error ? error.message : 'Cancel processing failed',
        },
      });
    } finally {
      await edcService.disconnect();
    }
  });

  // ============== SETTLEMENT ==============

  app.post('/settle', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = settleSchema.parse(request.body);

    try {
      const result = await edcService.settleBatch(tenantId, {
        deviceId: body.deviceId,
        batchNumber: body.batchNumber,
      });

      if (result.success) {
        return reply.send({
          success: true,
          data: {
            batchNumber: result.batchNumber,
            totalTransactions: result.totalTransactions,
            totalAmount: result.totalAmount,
            message: result.message,
          },
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SETTLEMENT_FAILED',
            message: result.message,
          },
        });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'EDC_ERROR',
          message: error instanceof Error ? error.message : 'Settlement processing failed',
        },
      });
    } finally {
      await edcService.disconnect();
    }
  });

  // ============== CHECK STATUS ==============

  app.get('/status/:transactionId', async (request: FastifyRequest<{ Params: { transactionId: string } }>, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const { transactionId } = request.params;

    try {
      // Find transaction in logs
      const logs = await hardwareLogRepository.findByTenant(tenantId, {
        eventType: 'edc_payment',
        limit: 100,
      });

      const transaction = logs.data.find(
        log => log.requestData?.transactionId === transactionId
      );

      if (!transaction) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          transactionId: transaction.requestData?.transactionId,
          status: transaction.status === 'success' ? 'approved' : 'declined',
          amount: transaction.requestData?.amount,
          referenceNumber: transaction.responseData?.referenceNumber,
          authCode: transaction.responseData?.authCode,
          cardNumber: transaction.responseData?.cardNumber,
          cardType: transaction.responseData?.cardType,
          createdAt: transaction.createdAt,
          errorMessage: transaction.errorMessage,
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'EDC_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get status',
        },
      });
    }
  });
}
