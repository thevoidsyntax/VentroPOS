// EDC Service - Electronic Data Capture Payment Processing
import { EDCDriver, type PaymentRequest } from '../../infrastructure/hardware/drivers/edc.driver.js';
import { HardwareDeviceService } from './device.service.js';
import { hardwareDeviceRepository, hardwareLogRepository } from '../../infrastructure/database/repositories/container.js';
import type { HardwareDevice } from '../../domain/entities/index.js';
import { v4 as uuidv4 } from 'uuid';

// EDC Transaction status
export type EDCTransactionStatus = 'pending' | 'processing' | 'approved' | 'declined' | 'cancelled' | 'failed';

// EDC Transaction record for idempotency
export interface EDCTransaction {
  id: string;
  tenantId: string;
  orderId: string;
  deviceId: string;
  amount: number;
  status: EDCTransactionStatus;
  referenceNumber?: string;
  authCode?: string;
  cardNumber?: string;
  cardType?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Payment initiation request
export interface InitiatePaymentDTO {
  orderId: string;
  amount: number;
  deviceId?: string; // Optional, uses default EDC if not specified
}

// Settlement request
export interface SettleBatchDTO {
  deviceId?: string;
  batchNumber?: string;
}

export class EDCService {
  private driver: EDCDriver | null = null;
  private currentDeviceId: string | null = null;
  private hardwareService: HardwareDeviceService;

  constructor() {
    this.hardwareService = new HardwareDeviceService(hardwareDeviceRepository, hardwareLogRepository);
  }

  async initializeDriver(tenantId: string, deviceId?: string): Promise<void> {
    let device: HardwareDevice | null = null;

    if (deviceId) {
      device = await this.hardwareService.getDevice(deviceId, tenantId);
    } else {
      device = await this.hardwareService.getDefaultEDC(tenantId);
      if (!device) {
        throw new Error('No default EDC terminal configured');
      }
    }

    if (device.deviceType !== 'edc') {
      throw new Error('Selected device is not an EDC terminal');
    }

    this.currentDeviceId = device.id;

    this.driver = new EDCDriver({
      ip: device.config.ip,
      port: device.config.port,
      timeout: device.config.timeout,
    });

    await this.driver.connect();
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.disconnect();
      this.driver = null;
      this.currentDeviceId = null;
    }
  }

  async processPayment(
    tenantId: string,
    dto: InitiatePaymentDTO,
    idempotencyKey: string
  ): Promise<{
    transactionId: string;
    status: EDCTransactionStatus;
    referenceNumber?: string;
    authCode?: string;
    cardNumber?: string;
    cardType?: string;
    message: string;
  }> {
    // Check idempotency - prevent duplicate payments
    const existingLog = await hardwareLogRepository.findByTenant(tenantId, {
      eventType: 'edc_payment',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    });

    const duplicate = existingLog.data.find(
      log => log.requestData?.idempotencyKey === idempotencyKey
    );

    if (duplicate) {
      // Return cached result
      return {
        transactionId: duplicate.id,
        status: duplicate.status === 'success' ? 'approved' : 'declined',
        referenceNumber: duplicate.responseData?.referenceNumber as string,
        authCode: duplicate.responseData?.authCode as string,
        cardNumber: duplicate.responseData?.cardNumber as string,
        cardType: duplicate.responseData?.cardType as string,
        message: duplicate.errorMessage || 'Transaction already processed',
      };
    }

    const transactionId = uuidv4();
    const startTime = Date.now();

    try {
      // Initialize driver if needed
      if (!this.driver) {
        await this.initializeDriver(tenantId, dto.deviceId);
      }

      if (!this.driver) {
        throw new Error('EDC driver not initialized');
      }

      // Create pending log
      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_payment',
        status: 'pending',
        requestData: {
          idempotencyKey,
          orderId: dto.orderId,
          amount: dto.amount,
          transactionId,
        },
        responseData: null,
        durationMs: null,
        errorMessage: null,
      });

      // Process payment
      const paymentRequest: PaymentRequest = {
        amount: dto.amount,
        transactionId,
        currency: 'IDR',
      };

      const response = await this.driver.processPayment(paymentRequest);
      const durationMs = Date.now() - startTime;

      if (response.success) {
        // Log success
        await hardwareLogRepository.create({
          tenantId,
          deviceId: this.currentDeviceId,
          eventType: 'edc_payment',
          status: 'success',
          requestData: {
            idempotencyKey,
            orderId: dto.orderId,
            amount: dto.amount,
            transactionId,
          },
          responseData: {
            referenceNumber: response.referenceNumber,
            authCode: response.authCode,
            cardNumber: response.cardNumber,
            cardType: response.cardType,
          },
          durationMs,
          errorMessage: null,
        });

        return {
          transactionId: response.transactionId,
          status: 'approved',
          referenceNumber: response.referenceNumber,
          authCode: response.authCode,
          cardNumber: response.cardNumber,
          cardType: response.cardType,
          message: response.message,
        };
      } else {
        // Log failure
        await hardwareLogRepository.create({
          tenantId,
          deviceId: this.currentDeviceId,
          eventType: 'edc_payment',
          status: 'failed',
          requestData: {
            idempotencyKey,
            orderId: dto.orderId,
            amount: dto.amount,
            transactionId,
          },
          responseData: null,
          durationMs,
          errorMessage: response.message,
        });

        return {
          transactionId: response.transactionId,
          status: 'declined',
          message: response.message,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error
      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_payment',
        status: 'failed',
        requestData: {
          idempotencyKey,
          orderId: dto.orderId,
          amount: dto.amount,
          transactionId,
        },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return {
        transactionId,
        status: 'failed',
        message: errorMessage,
      };
    }
  }

  async cancelPayment(
    tenantId: string,
    transactionId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();

    try {
      if (!this.driver) {
        await this.initializeDriver(tenantId);
      }

      if (!this.driver) {
        throw new Error('EDC driver not initialized');
      }

      const result = await this.driver.cancelTransaction(transactionId);
      const durationMs = Date.now() - startTime;

      // Log
      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_cancel',
        status: result.success ? 'success' : 'failed',
        requestData: {
          idempotencyKey,
          originalTransactionId: transactionId,
        },
        responseData: result.success ? { voided: true } : null,
        durationMs,
        errorMessage: result.success ? null : result.message,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_cancel',
        status: 'failed',
        requestData: {
          idempotencyKey,
          originalTransactionId: transactionId,
        },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async settleBatch(
    tenantId: string,
    dto: SettleBatchDTO
  ): Promise<{
    batchNumber: string;
    totalTransactions: number;
    totalAmount: number;
    success: boolean;
    message: string;
  }> {
    const startTime = Date.now();
    const batchNumber = dto.batchNumber || `BATCH-${Date.now()}`;

    try {
      if (!this.driver) {
        await this.initializeDriver(tenantId, dto.deviceId);
      }

      if (!this.driver) {
        throw new Error('EDC driver not initialized');
      }

      const result = await this.driver.settleBatch({ batchNumber });
      const durationMs = Date.now() - startTime;

      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_settle',
        status: result.success ? 'success' : 'failed',
        requestData: { batchNumber },
        responseData: {
          totalTransactions: result.totalTransactions,
          totalAmount: result.totalAmount,
        },
        durationMs,
        errorMessage: result.success ? null : result.message,
      });

      return {
        batchNumber: result.batchNumber,
        totalTransactions: result.totalTransactions,
        totalAmount: result.totalAmount,
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await hardwareLogRepository.create({
        tenantId,
        deviceId: this.currentDeviceId,
        eventType: 'edc_settle',
        status: 'failed',
        requestData: { batchNumber },
        responseData: null,
        durationMs,
        errorMessage,
      });

      return {
        batchNumber,
        totalTransactions: 0,
        totalAmount: 0,
        success: false,
        message: errorMessage,
      };
    }
  }
}
