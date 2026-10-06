// API: Print Routes - Receipt, Kitchen, Invoice printing
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrintService, type ReceiptData, type KitchenTicketData, type InvoiceData } from '../../application/hardware/print.service.js';
import { HardwareDeviceService } from '../../application/hardware/device.service.js';
import { hardwareDeviceRepository, hardwareLogRepository, orderRepository, transactionRepository } from '../../infrastructure/database/repositories/container.js';
import { authMiddleware } from '../middleware/index.js';
import { config } from '../../shared/config/index.js';
import type { UserRole, HardwareDevice } from '../../domain/entities/index.js';

// Zod Schemas
const receiptSchema = z.object({
  orderId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  customData: z.object({
    storeName: z.string(),
    storeAddress: z.string().optional(),
    storePhone: z.string().optional(),
    orderNumber: z.string(),
    cashierName: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number(),
      modifiers: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })),
    subtotal: z.number(),
    taxAmount: z.number(),
    taxRate: z.number().optional(),
    discountAmount: z.number().optional(),
    totalAmount: z.number(),
    paymentMethod: z.string(),
    amountPaid: z.number().optional(),
    change: z.number().optional(),
    qrCode: z.string().optional(),
    footerMessage: z.string().optional(),
  }).optional(),
});

const kitchenTicketSchema = z.object({
  orderId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  customData: z.object({
    orderNumber: z.string(),
    tableNumber: z.string().optional(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      modifiers: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })),
    notes: z.string().optional(),
    priority: z.enum(['normal', 'rush']).optional(),
  }).optional(),
});

const invoiceSchema = z.object({
  deviceId: z.string().uuid().optional(),
  customData: z.object({
    invoiceNumber: z.string(),
    customerName: z.string().optional(),
    customerAddress: z.string().optional(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number(),
    })),
    subtotal: z.number(),
    taxAmount: z.number(),
    taxRate: z.number().optional(),
    totalAmount: z.number(),
    paymentStatus: z.enum(['paid', 'pending', 'partial']),
    notes: z.string().optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

type AuthenticatedRequest = FastifyRequest & { user: { tenantId: string; id: string; role: UserRole } };

export async function printRoutes(app: FastifyInstance) {
  const hardwareService = new HardwareDeviceService(hardwareDeviceRepository, hardwareLogRepository);
  const printService = new PrintService();

  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // ============== PRINT RECEIPT ==============

  app.post('/receipt', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = receiptSchema.parse(request.body);
    const startTime = Date.now();

    let device: HardwareDevice | null = null;
    let receiptData: ReceiptData | null = null;

    try {
      // Get device
      if (body.deviceId) {
        device = await hardwareService.getDevice(body.deviceId, tenantId);
      } else {
        device = await hardwareService.getDefaultPrinter(tenantId);
        if (!device) {
          throw new Error('No default printer configured');
        }
      }

      if (device.deviceType !== 'printer') {
        throw new Error('Selected device is not a printer');
      }

      // Get order data if orderId provided
      if (body.orderId) {
        const order = await orderRepository.findById(tenantId, body.orderId);
        const transaction = await transactionRepository.findByOrderId(tenantId, body.orderId);

        if (!order) {
          throw new Error('Order not found');
        }

        receiptData = {
          storeName: 'VentroPOS Cafe',
          orderNumber: order.orderNumber,
          date: order.paidAt || order.createdAt,
          cashierName: 'Kasir', // Would get from user lookup
          items: order.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            modifiers: item.modifiers?.map(m => m.modifierName),
            notes: item.notes,
          })),
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          taxRate: config.tax.rate,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          paymentMethod: transaction?.paymentMethod?.toUpperCase() || 'CASH',
          amountPaid: transaction?.amount,
          change: transaction?.changeAmount,
        };
      } else if (body.customData) {
        receiptData = body.customData as ReceiptData;
        receiptData.date = new Date();
      } else {
        throw new Error('Either orderId or customData must be provided');
      }

      // Print
      await printService.initializeDriver(device);
      await printService.printReceipt(receiptData);

      const durationMs = Date.now() - startTime;

      // Log success
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device.id,
        eventType: 'print_receipt',
        status: 'success',
        requestData: { orderId: body.orderId, deviceId: device.id },
        responseData: { orderNumber: receiptData.orderNumber },
        durationMs,
        errorMessage: null,
      });

      return reply.send({
        success: true,
        data: {
          printed: true,
          orderNumber: receiptData.orderNumber,
          durationMs,
        },
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device?.id ?? null,
        eventType: 'print_receipt',
        status: 'failed',
        requestData: { orderId: body.orderId, deviceId: body.deviceId },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: 'PRINT_ERROR',
          message: errorMessage,
        },
      });
    } finally {
      await printService.disconnect();
    }
  });

  // ============== PRINT KITCHEN TICKET ==============

  app.post('/kitchen', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = kitchenTicketSchema.parse(request.body);
    const startTime = Date.now();

    let device: HardwareDevice | null = null;
    let ticketData: KitchenTicketData | null = null;

    try {
      // Get device (kitchen printer)
      if (body.deviceId) {
        device = await hardwareService.getDevice(body.deviceId, tenantId);
      } else {
        // Try to find a printer specifically for kitchen
        const devices = await hardwareService.listDevices(tenantId, { isActive: true });
        device = devices.data.find(d => d.name.toLowerCase().includes('kitchen')) ?? null;
        if (!device) {
          // Fallback to any printer
          device = await hardwareService.getDefaultPrinter(tenantId);
        }
      }

      if (!device) {
        throw new Error('No printer configured');
      }

      if (device.deviceType !== 'printer') {
        throw new Error('Selected device is not a printer');
      }

      // Get order data if orderId provided
      if (body.orderId) {
        const order = await orderRepository.findById(tenantId, body.orderId);

        if (!order) {
          throw new Error('Order not found');
        }

        ticketData = {
          orderNumber: order.orderNumber,
          tableNumber: order.tableId, // Would look up table name
          date: new Date(),
          items: order.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            modifiers: item.modifiers?.map(m => m.modifierName),
            notes: item.notes,
          })),
          notes: order.notes,
        };
      } else if (body.customData) {
        ticketData = body.customData as KitchenTicketData;
        ticketData.date = new Date();
      } else {
        throw new Error('Either orderId or customData must be provided');
      }

      // Print
      await printService.initializeDriver(device);
      await printService.printKitchenTicket(ticketData);

      const durationMs = Date.now() - startTime;

      // Log success
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device.id,
        eventType: 'print_kitchen',
        status: 'success',
        requestData: { orderId: body.orderId, deviceId: device.id },
        responseData: { orderNumber: ticketData.orderNumber },
        durationMs,
        errorMessage: null,
      });

      return reply.send({
        success: true,
        data: {
          printed: true,
          orderNumber: ticketData.orderNumber,
          durationMs,
        },
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device?.id ?? null,
        eventType: 'print_kitchen',
        status: 'failed',
        requestData: { orderId: body.orderId, deviceId: body.deviceId },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: 'PRINT_ERROR',
          message: errorMessage,
        },
      });
    } finally {
      await printService.disconnect();
    }
  });

  // ============== PRINT INVOICE ==============

  app.post('/invoice', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = invoiceSchema.parse(request.body);
    const startTime = Date.now();

    let device: HardwareDevice | null = null;

    try {
      // Get device
      if (body.deviceId) {
        device = await hardwareService.getDevice(body.deviceId, tenantId);
      } else {
        device = await hardwareService.getDefaultPrinter(tenantId);
        if (!device) {
          throw new Error('No default printer configured');
        }
      }

      if (device.deviceType !== 'printer') {
        throw new Error('Selected device is not a printer');
      }

      const invoiceData: InvoiceData = {
        ...body.customData,
        date: new Date(),
        dueDate: body.customData.dueDate ? new Date(body.customData.dueDate) : undefined,
      };

      // Print
      await printService.initializeDriver(device);
      await printService.printInvoice(invoiceData);

      const durationMs = Date.now() - startTime;

      // Log success
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device.id,
        eventType: 'print_invoice',
        status: 'success',
        requestData: { deviceId: device.id },
        responseData: { invoiceNumber: invoiceData.invoiceNumber },
        durationMs,
        errorMessage: null,
      });

      return reply.send({
        success: true,
        data: {
          printed: true,
          invoiceNumber: invoiceData.invoiceNumber,
          durationMs,
        },
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await hardwareLogRepository.create({
        tenantId,
        deviceId: device?.id ?? null,
        eventType: 'print_invoice',
        status: 'failed',
        requestData: { deviceId: body.deviceId },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: 'PRINT_ERROR',
          message: errorMessage,
        },
      });
    } finally {
      await printService.disconnect();
    }
  });
}
