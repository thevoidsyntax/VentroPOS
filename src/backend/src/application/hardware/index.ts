// Application: Hardware Module Exports
export { HardwareDeviceService } from './device.service.js';
export { EDCService } from './edc.service.js';
export { ScannerService } from './scanner.service.js';
export { DrawerService } from './drawer.service.js';
export type {
  EDCTransaction,
  InitiatePaymentDTO,
  SettleBatchDTO,
  EDCTransactionStatus
} from './edc.service.js';
export type {
  ScanEvent,
  ProductLookupResult,
  ScanHandlerResult
} from './scanner.service.js';
export type { OpenDrawerResult } from './drawer.service.js';
