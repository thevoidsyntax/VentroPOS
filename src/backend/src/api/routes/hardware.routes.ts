// API: Hardware Routes
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { HardwareDeviceService } from '../../application/hardware/index.js';
import { hardwareDeviceRepository, hardwareLogRepository } from '../../infrastructure/database/repositories/container.js';
import { authMiddleware } from '../middleware/index.js';
import type { UserRole } from '../../domain/entities/index.js';

// Zod Schemas
const deviceTypeEnum = z.enum(['printer', 'edc', 'scanner', 'drawer']);
const connectionTypeEnum = z.enum(['usb', 'serial', 'tcp', 'bluetooth']);

const createDeviceSchema = z.object({
  deviceType: deviceTypeEnum,
  name: z.string().min(1).max(100),
  connectionType: connectionTypeEnum,
  config: z.object({
    ip: z.string().optional(),
    port: z.number().optional(),
    baudRate: z.number().optional(),
    timeout: z.number().optional(),
    retryCount: z.number().optional(),
  }).passthrough(),
  isDefault: z.boolean().optional(),
});

const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  connectionType: connectionTypeEnum.optional(),
  config: z.object({
    ip: z.string().optional(),
    port: z.number().optional(),
    baudRate: z.number().optional(),
    timeout: z.number().optional(),
    retryCount: z.number().optional(),
  }).passthrough().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const listDevicesSchema = z.object({
  deviceType: deviceTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const listLogsSchema = z.object({
  deviceId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  status: z.enum(['success', 'failed', 'pending']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

type AuthenticatedRequest = FastifyRequest & { user: { tenantId: string; id: string; role: UserRole } };

export async function hardwareRoutes(app: FastifyInstance) {
  // Initialize service with container repositories
  const hardwareService = new HardwareDeviceService(hardwareDeviceRepository, hardwareLogRepository);

  // All routes require authentication
  app.addHook('onRequest', authMiddleware);

  // ============== DEVICE MANAGEMENT ==============

  // List devices
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const query = listDevicesSchema.parse(request.query);

    const result = await hardwareService.listDevices(tenantId, {
      deviceType: query.deviceType,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
    });

    return reply.send({ success: true, data: result });
  });

  // Create device
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const data = createDeviceSchema.parse(request.body);

    const device = await hardwareService.createDevice({
      deviceType: data.deviceType,
      name: data.name,
      connectionType: data.connectionType,
      config: data.config,
      isDefault: data.isDefault,
    }, tenantId);

    return reply.status(201).send({ success: true, data: device });
  });

  // Get device by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const { id } = request.params;

    const device = await hardwareService.getDevice(id, tenantId);
    return reply.send({ success: true, data: device });
  });

  // Update device
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const { id } = request.params;
    const data = updateDeviceSchema.parse(request.body);

    const device = await hardwareService.updateDevice(id, tenantId, {
      name: data.name,
      connectionType: data.connectionType,
      config: data.config,
      isActive: data.isActive,
      isDefault: data.isDefault,
    });

    return reply.send({ success: true, data: device });
  });

  // Delete device
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const { id } = request.params;

    await hardwareService.deleteDevice(id, tenantId);
    return reply.status(204).send();
  });

  // Test device connection
  app.post('/:id/test', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const { id } = request.params;

    const result = await hardwareService.testDevice(id, tenantId);
    return reply.send({ success: true, data: result });
  });

  // ============== HARDWARE LOGS ==============

  // List hardware logs
  app.get('/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = (request as AuthenticatedRequest).user;
    const query = listLogsSchema.parse(request.query);

    const result = await hardwareService.getLogs(tenantId, {
      deviceId: query.deviceId,
      eventType: query.eventType,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return reply.send({ success: true, data: result });
  });
}
