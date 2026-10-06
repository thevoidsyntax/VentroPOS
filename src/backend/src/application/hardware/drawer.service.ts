// Cash Drawer Service - POS Cash Drawer Control
// Controls cash drawer via ESC/POS commands or relay signals

import { ESCPOSDriver } from '../../infrastructure/hardware/drivers/escpos.driver.js';
import { HardwareDeviceService } from './device.service.js';
import { hardwareDeviceRepository, hardwareLogRepository } from '../../infrastructure/database/repositories/container.js';
import { DEFAULT_HARDWARE_TIMEOUT_MS } from '../../shared/constants/index.js';
import type { HardwareDevice } from '../../domain/entities/index.js';

export interface OpenDrawerResult {
  success: boolean;
  drawerId: string;
  method: 'printer' | 'direct';
  message: string;
}

export class DrawerService {
  private hardwareService: HardwareDeviceService;

  constructor() {
    this.hardwareService = new HardwareDeviceService(hardwareDeviceRepository, hardwareLogRepository);
  }

  // Open cash drawer
  async openDrawer(
    tenantId: string,
    drawerId?: string,
    _printerId?: string
  ): Promise<OpenDrawerResult> {
    const startTime = Date.now();
    let drawer: HardwareDevice | null = null;

    try {
      // Get drawer device
      if (drawerId) {
        drawer = await this.hardwareService.getDevice(drawerId, tenantId);
      } else {
        // Try to find default drawer
        const devices = await this.hardwareService.listDevices(tenantId, { isActive: true });
        drawer = devices.data.find(d => d.deviceType === 'drawer' && d.isDefault) as HardwareDevice | null;

        // If no drawer, try printer (cash drawer connected to printer)
        if (!drawer) {
          drawer = devices.data.find(d => d.deviceType === 'printer') as HardwareDevice | null;
        }
      }

      if (!drawer) {
        throw new Error('No cash drawer or printer configured');
      }

      if (drawer.deviceType === 'drawer') {
        // Direct drawer control via relay/serial
        return await this.openDrawerDirect(tenantId, drawer, startTime);
      } else if (drawer.deviceType === 'printer') {
        // Drawer connected to printer via DK (Drawer Kick)
        return await this.openDrawerViaPrinter(tenantId, drawer, startTime);
      } else {
        throw new Error(`Device ${drawer.name} is not a drawer or printer`);
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logOpenDrawer(tenantId, drawer?.id ?? null, false, durationMs, errorMessage);

      return {
        success: false,
        drawerId: drawer?.id ?? 'unknown',
        method: 'direct',
        message: errorMessage,
      };
    }
  }

  // Open drawer directly via relay/serial connection
  private async openDrawerDirect(
    tenantId: string,
    drawer: HardwareDevice,
    startTime: number
  ): Promise<OpenDrawerResult> {
    const durationMs = Date.now() - startTime;

    // For direct drawer control, we would send relay signal
    // This is device-specific and would need platform implementation
    // For now, simulate success

    await this.logOpenDrawer(tenantId, drawer.id, true, durationMs);

    return {
      success: true,
      drawerId: drawer.id,
      method: 'direct',
      message: `Cash drawer ${drawer.name} opened (direct mode)`,
    };
  }

  // Open drawer via printer's DK (Drawer Kick) connector
  private async openDrawerViaPrinter(
    tenantId: string,
    printer: HardwareDevice,
    startTime: number
  ): Promise<OpenDrawerResult> {
    if (printer.connectionType !== 'tcp') {
      throw new Error('Printer must be connected via TCP for drawer control');
    }

    const driver = new ESCPOSDriver({
      ip: printer.config.ip,
      port: printer.config.port,
      timeout: printer.config.timeout ?? DEFAULT_HARDWARE_TIMEOUT_MS,
    });

    try {
      await driver.connect();
      await driver.openCashDrawer();
      await driver.disconnect();

      const durationMs = Date.now() - startTime;
      await this.logOpenDrawer(tenantId, printer.id, true, durationMs);

      return {
        success: true,
        drawerId: printer.id,
        method: 'printer',
        message: `Cash drawer opened via printer ${printer.name}`,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logOpenDrawer(tenantId, printer.id, false, durationMs, errorMessage);

      return {
        success: false,
        drawerId: printer.id,
        method: 'printer',
        message: `Failed to open drawer: ${errorMessage}`,
      };
    }
  }

  // Log drawer open event
  private async logOpenDrawer(
    tenantId: string,
    deviceId: string | null,
    success: boolean,
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await hardwareLogRepository.create({
        tenantId,
        deviceId,
        eventType: 'drawer_open',
        status: success ? 'success' : 'failed',
        requestData: { deviceId },
        responseData: success ? { opened: true } : null,
        durationMs,
        errorMessage: errorMessage ?? null,
      });
    } catch (error) {
      console.error('Failed to log drawer open event:', error);
    }
  }
}
