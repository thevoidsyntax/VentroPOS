// Order Schemas - API Input Validation
import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid().optional().describe('Associated table ID'),
    items: z.array(z.object({
      productId: z.string().uuid().describe('Product ID'),
      quantity: z.number().int().positive().describe('Quantity'),
      unitPrice: z.number().positive().describe('Price at time of order'),
      modifiers: z.array(z.object({
        modifierId: z.string().uuid().describe('Modifier ID'),
        name: z.string().describe('Modifier name'),
        priceAdjustment: z.number().describe('Price adjustment'),
      })).optional().describe('Selected modifiers'),
      notes: z.string().optional().describe('Special instructions'),
    })).min(1).describe('Order items'),
    notes: z.string().optional().describe('Order notes'),
    customerName: z.string().optional().describe('Customer name for dine-in'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Order ID') }),
  body: z.object({
    status: z.enum(['confirmed', 'preparing', 'ready', 'served']).describe('New status'),
  }),
});

export const checkoutSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['cash', 'qris', 'debit', 'credit']).describe('Payment method'),
    cashReceived: z.number().positive().optional().describe('Cash amount received'),
    referenceNumber: z.string().optional().describe('External reference number'),
    splitPayments: z.array(z.object({
      method: z.enum(['cash', 'qris', 'debit', 'credit']).describe('Split payment method'),
      amount: z.number().positive().describe('Split amount'),
    })).optional().describe('Split payment details'),
    idempotencyKey: z.string().optional().describe('Idempotency key'),
  }),
});

export const orderIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Order ID') }),
});

export const orderQuerySchema = z.object({
  querystring: z.object({
    status: z.string().optional().describe('Filter by status'),
    tableId: z.string().uuid().optional().describe('Filter by table'),
    fromDate: z.string().optional().describe('From date'),
    toDate: z.string().optional().describe('To date'),
    page: z.string().optional().describe('Page number'),
    limit: z.string().optional().describe('Items per page'),
  }),
});
