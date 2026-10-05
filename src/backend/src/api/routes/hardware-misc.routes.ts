// API: Hardware Misc Routes - Scanner, Drawer
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ScannerService } from '../../application/hardware/scanner.service.js';
import { DrawerService } from '../../application/hardware/drawer.service.js';
import { authMiddleware } from '../middleware/index.js';
import type { UserRole } from '../../domain/entities/index.js';

// Zod Schemas
const scanSchema = z.object({
  barcode: z.string().min(3).max(100),
  deviceId: z.string().uuid().optional(),
});

const openDrawerSchema = z.object({
  drawerId: z.string().uuid().optional(),
  printerId: z.string().uuid().optional(),
});

type AuthenticatedRequest = FastifyRequest & { user: { tenantId: string; id: string; role: UserRole } };

export async function hardwareMiscRoutes(app: FastifyInstance) {
  const scannerService = new ScannerService();
  const drawerService = new DrawerService();

  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // ============== BARCODE SCANNER ==============

  // Record barcode scan event
  app.post('/scan', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = scanSchema.parse(request.body);

    const result = await scannerService.processScan(
      tenantId,
      body.barcode,
      body.deviceId,
      'api'
    );

    if (result.success) {
      return reply.send({
        success: true,
        data: {
          scanned: true,
          barcode: result.event.barcode,
          timestamp: result.event.timestamp,
        },
      });
    } else {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SCAN_ERROR',
          message: result.message,
        },
      });
    }
  });

  // Validate barcode format
  app.get('/scan/validate/:barcode', async (request: FastifyRequest<{ Params: { barcode: string } }>, reply: FastifyReply) => {
    const { barcode } = request.params;
    const validation = scannerService.validateBarcode(barcode);

    return reply.send({
      success: true,
      data: validation,
    });
  });

  // ============== CASH DRAWER ==============

  // Open cash drawer
  app.post('/drawer/open', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const body = openDrawerSchema.parse(request.body);

    const result = await drawerService.openDrawer(
      tenantId,
      body.drawerId,
      body.printerId
    );

    if (result.success) {
      return reply.send({
        success: true,
        data: {
          opened: true,
          drawerId: result.drawerId,
          method: result.method,
          message: result.message,
        },
      });
    } else {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'DRAWER_ERROR',
          message: result.message,
        },
      });
    }
  });
}
