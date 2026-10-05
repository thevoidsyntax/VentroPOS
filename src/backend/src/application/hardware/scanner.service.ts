// Scanner Service - Barcode Scanner Event Handler
// Handles barcode scan events from USB HID or Web Serial API

import { hardwareLogRepository } from '../../infrastructure/database/repositories/container.js';

export interface ScanEvent {
  barcode: string;
  source: 'keyboard' | 'serial' | 'api';
  timestamp: Date;
  deviceId?: string;
}

export interface ProductLookupResult {
  found: boolean;
  productId?: string;
  productName?: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  message: string;
}

export interface ScanHandlerResult {
  success: boolean;
  event: ScanEvent;
  product?: ProductLookupResult;
  message: string;
}

export class ScannerService {
  // Process a barcode scan event
  async processScan(
    tenantId: string,
    barcode: string,
    deviceId?: string,
    source: 'keyboard' | 'serial' | 'api' = 'api'
  ): Promise<ScanHandlerResult> {
    const event: ScanEvent = {
      barcode: barcode.trim(),
      source,
      timestamp: new Date(),
      deviceId,
    };

    const startTime = Date.now();

    // Validate barcode format
    if (!event.barcode || event.barcode.length < 3) {
      const result: ScanHandlerResult = {
        success: false,
        event,
        message: 'Invalid barcode format',
      };

      await this.logScan(tenantId, event, false, null, Date.now() - startTime, 'Invalid barcode');
      return result;
    }

    // Log the scan event
    await this.logScan(tenantId, event, true, null, Date.now() - startTime);

    return {
      success: true,
      event,
      message: 'Scan processed successfully',
    };
  }

  // Log scan event to hardware logs
  private async logScan(
    tenantId: string,
    event: ScanEvent,
    success: boolean,
    productResult: ProductLookupResult | null,
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await hardwareLogRepository.create({
        tenantId,
        deviceId: event.deviceId ?? null,
        eventType: 'barcode_scan',
        status: success ? 'success' : 'failed',
        requestData: {
          barcode: event.barcode,
          source: event.source,
        },
        responseData: productResult ? {
          found: productResult.found,
          productId: productResult.productId,
          productName: productResult.productName,
          sku: productResult.sku,
          price: productResult.price,
          stockQuantity: productResult.stockQuantity,
        } : null,
        durationMs,
        errorMessage: errorMessage ?? null,
      });
    } catch (error) {
      // Don't fail the scan if logging fails
      console.error('Failed to log scan event:', error);
    }
  }

  // Validate barcode format
  validateBarcode(barcode: string): { valid: boolean; type?: 'ean13' | 'upc' | 'code128' | 'qr' | 'unknown' } {
    const cleaned = barcode.trim();

    // EAN-13 (13 digits)
    if (/^\d{13}$/.test(cleaned)) {
      return { valid: true, type: 'ean13' };
    }

    // UPC-A (12 digits)
    if (/^\d{12}$/.test(cleaned)) {
      return { valid: true, type: 'upc' };
    }

    // Code 128 / Code 39 (alphanumeric)
    if (/^[A-Za-z0-9\-./+%$\s]{1,48}$/.test(cleaned)) {
      return { valid: true, type: 'code128' };
    }

    // QR Code (variable length, may contain special chars)
    if (cleaned.length >= 4 && cleaned.length <= 4296) {
      return { valid: true, type: 'qr' };
    }

    return { valid: false };
  }
}
