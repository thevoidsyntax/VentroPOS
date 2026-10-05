// Domain Entity: HardwareDevice
export interface HardwareDevice {
  id: string;
  tenantId: string;
  deviceType: 'printer' | 'edc' | 'scanner' | 'drawer';
  name: string;
  connectionType: 'usb' | 'serial' | 'tcp' | 'bluetooth';
  config: HardwareConfig;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Hardware device configuration based on connection type
export interface HardwareConfig {
  // TCP connection
  ip?: string;
  port?: number;

  // Serial connection
  baudRate?: number;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 1.5 | 2;
  parity?: 'none' | 'even' | 'odd';

  // USB connection
  vendorId?: string;
  productId?: string;

  // Bluetooth
  macAddress?: string;

  // Generic
  timeout?: number; // ms
  retryCount?: number;
}

// Domain Entity: HardwareLog
export interface HardwareLog {
  id: string;
  tenantId: string;
  deviceId: string | null;
  eventType: string;
  status: 'success' | 'failed' | 'pending';
  requestData: Record<string, unknown> | null;
  responseData: Record<string, unknown> | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

// Create DTO
export interface CreateHardwareDeviceDTO {
  deviceType: 'printer' | 'edc' | 'scanner' | 'drawer';
  name: string;
  connectionType: 'usb' | 'serial' | 'tcp' | 'bluetooth';
  config: HardwareConfig;
  isDefault?: boolean;
}

// Update DTO
export interface UpdateHardwareDeviceDTO {
  name?: string;
  connectionType?: 'usb' | 'serial' | 'tcp' | 'bluetooth';
  config?: HardwareConfig;
  isActive?: boolean;
  isDefault?: boolean;
}

// Hardware event types
export const HARDWARE_EVENT_TYPES = {
  PRINT_RECEIPT: 'print_receipt',
  PRINT_KITCHEN: 'print_kitchen',
  PRINT_INVOICE: 'print_invoice',
  EDC_PAYMENT: 'edc_payment',
  EDC_CANCEL: 'edc_cancel',
  EDC_SETTLE: 'edc_settle',
  DRAWER_OPEN: 'drawer_open',
  BARCODE_SCAN: 'barcode_scan',
  DEVICE_CONNECT: 'device_connect',
  DEVICE_DISCONNECT: 'device_disconnect',
  DEVICE_TEST: 'device_test',
} as const;

export type HardwareEventType = (typeof HARDWARE_EVENT_TYPES)[keyof typeof HARDWARE_EVENT_TYPES];
