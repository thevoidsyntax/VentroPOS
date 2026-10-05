// Application: Hardware Device Service
import type { IHardwareDeviceRepository, CreateHardwareDeviceDTO, UpdateHardwareDeviceDTO, HardwareDeviceQuery } from '../../domain/repositories/index.js';
import type { HardwareDevice } from '../../domain/entities/index.js';
import type { IHardwareLogRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class HardwareDeviceService {
  constructor(
    private readonly deviceRepository: IHardwareDeviceRepository,
    private readonly logRepository: IHardwareLogRepository
  ) {}

  async createDevice(data: CreateHardwareDeviceDTO, tenantId: string): Promise<HardwareDevice> {
    const device = await this.deviceRepository.create(data, tenantId);

    // Log device registration
    await this.logRepository.create({
      tenantId,
      deviceId: device.id,
      eventType: 'device_register',
      status: 'success',
      requestData: { name: device.name, type: device.deviceType },
      responseData: { deviceId: device.id },
      durationMs: null,
      errorMessage: null,
    });

    return device;
  }

  async getDevice(id: string, tenantId: string): Promise<HardwareDevice> {
    const device = await this.deviceRepository.findById(id, tenantId);
    if (!device) {
      throw new NotFoundError('Hardware device');
    }
    return device;
  }

  async listDevices(tenantId: string, query?: HardwareDeviceQuery) {
    return this.deviceRepository.findByTenant(tenantId, query);
  }

  async updateDevice(id: string, tenantId: string, data: UpdateHardwareDeviceDTO): Promise<HardwareDevice> {
    const device = await this.deviceRepository.update(id, tenantId, data);
    if (!device) {
      throw new NotFoundError('Hardware device');
    }
    return device;
  }

  async deleteDevice(id: string, tenantId: string): Promise<void> {
    const deleted = await this.deviceRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Hardware device');
    }

    // Log device removal
    await this.logRepository.create({
      tenantId,
      deviceId: id,
      eventType: 'device_remove',
      status: 'success',
      requestData: { deviceId: id },
      responseData: null,
      durationMs: null,
      errorMessage: null,
    });
  }

  async testDevice(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const result = await this.deviceRepository.testConnection(id, tenantId);

    // Log test
    await this.logRepository.create({
      tenantId,
      deviceId: id,
      eventType: 'device_test',
      status: result.success ? 'success' : 'failed',
      requestData: { deviceId: id },
      responseData: { success: result.success, message: result.message },
      durationMs: null,
      errorMessage: result.success ? null : result.message,
    });

    return result;
  }

  async getLogs(tenantId: string, query?: Parameters<IHardwareLogRepository['findByTenant']>[1]) {
    return this.logRepository.findByTenant(tenantId, query);
  }

  async getDefaultPrinter(tenantId: string): Promise<HardwareDevice | null> {
    return this.deviceRepository.findDefault('printer', tenantId);
  }

  async getDefaultEDC(tenantId: string): Promise<HardwareDevice | null> {
    return this.deviceRepository.findDefault('edc', tenantId);
  }
}
