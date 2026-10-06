// Repository Interfaces - Domain Layer
// These define contracts, implementations are in Infrastructure

import type { Tenant, User, Category, Product, Table, Order, Transaction, StockLog, AuditLog, ModifierGroup, Modifier, StockOpname, StockOpnameItem, StockOpnameStatus } from '../entities/index.js';

export interface ITenantRepository {
  create(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
}

export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findAll(tenantId: string): Promise<User[]>;
  update(tenantId: string, id: string, data: Partial<User>): Promise<User>;
  deactivate(tenantId: string, id: string): Promise<void>;
}

export interface ICategoryRepository {
  create(tenantId: string, category: Omit<Category, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  findById(tenantId: string, id: string): Promise<Category | null>;
  findAll(tenantId: string): Promise<Category[]>;
  update(tenantId: string, id: string, data: Partial<Category>): Promise<Category>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IProductRepository {
  create(tenantId: string, product: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  findById(tenantId: string, id: string): Promise<Product | null>;
  findByIds(tenantId: string, ids: string[]): Promise<Product[]>;
  findBySku(tenantId: string, sku: string): Promise<Product | null>;
  findAll(tenantId: string, filters?: ProductFilters): Promise<Product[]>;
  update(tenantId: string, id: string, data: Partial<Product>): Promise<Product>;
  updateStock(tenantId: string, id: string, quantity: number): Promise<Product>;
  batchUpdateStock(tenantId: string, updates: Array<{id: string; quantity: number}>): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
}

export interface ITableRepository {
  create(tenantId: string, table: Omit<Table, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Table>;
  findById(tenantId: string, id: string): Promise<Table | null>;
  findAll(tenantId: string): Promise<Table[]>;
  update(tenantId: string, id: string, data: Partial<Table>): Promise<Table>;
  updateStatus(tenantId: string, id: string, status: Table['status']): Promise<Table>;
  delete(tenantId: string, id: string): Promise<void>;
}

// ============== MODIFIER GROUP ==============
export interface IModifierGroupRepository {
  create(tenantId: string, data: Omit<ModifierGroup, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ModifierGroup>;
  findById(tenantId: string, id: string): Promise<ModifierGroup | null>;
  findAll(tenantId: string): Promise<ModifierGroup[]>;
  update(tenantId: string, id: string, data: Partial<ModifierGroup>): Promise<ModifierGroup>;
  delete(tenantId: string, id: string): Promise<void>;
}

// ============== MODIFIER ==============
export interface IModifierRepository {
  create(tenantId: string, groupId: string, data: Omit<Modifier, 'id' | 'groupId' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Modifier>;
  findById(tenantId: string, id: string): Promise<Modifier | null>;
  findByGroup(tenantId: string, groupId: string): Promise<Modifier[]>;
  update(tenantId: string, id: string, data: Partial<Modifier>): Promise<Modifier>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IOrderRepository {
  create(tenantId: string, order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  findById(tenantId: string, id: string): Promise<Order | null>;
  findByOrderNumber(tenantId: string, orderNumber: string): Promise<Order | null>;
  findAll(tenantId: string, filters?: OrderFilters): Promise<Order[]>;
  findByTable(tenantId: string, tableId: string): Promise<Order[]>;
  update(tenantId: string, id: string, data: Partial<Order>): Promise<Order>;
  updateStatus(tenantId: string, id: string, status: Order['status']): Promise<Order>;
  generateOrderNumber(tenantId: string): Promise<string>;
}

export interface OrderFilters {
  status?: Order['status'][];
  tableId?: string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ITransactionRepository {
  create(tenantId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  findById(tenantId: string, id: string): Promise<Transaction | null>;
  findByOrderId(tenantId: string, orderId: string): Promise<Transaction | null>;
  findAll(tenantId: string, filters?: TransactionFilters): Promise<Transaction[]>;
}

export interface TransactionFilters {
  fromDate?: Date;
  toDate?: Date;
  paymentMethod?: Transaction['paymentMethod'];
  userId?: string;
}

export interface IStockLogRepository {
  create(tenantId: string, log: Omit<StockLog, 'id' | 'createdAt'>): Promise<StockLog>;
  batchCreate(tenantId: string, logs: Array<Omit<StockLog, 'id' | 'createdAt'>>): Promise<void>;
  findByProduct(tenantId: string, productId: string): Promise<StockLog[]>;
  findAll(tenantId: string, filters?: StockLogFilters): Promise<StockLog[]>;
}

export interface StockLogFilters {
  productId?: string;
  type?: StockLog['type'];
  fromDate?: Date;
  toDate?: Date;
}

// ============== STOCK OPNAME REPOSITORY ==============
export interface StockOpnameFilters {
  status?: StockOpnameStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface IStockOpnameRepository {
  create(tenantId: string, data: Omit<StockOpname, 'id' | 'createdAt'>): Promise<StockOpname>;
  createItem(tenantId: string, data: Omit<StockOpnameItem, 'id'>): Promise<StockOpnameItem>;
  findById(tenantId: string, id: string): Promise<StockOpname | null>;
  findAll(tenantId: string, filters?: StockOpnameFilters): Promise<StockOpname[]>;
  update(tenantId: string, id: string, data: Partial<StockOpname>): Promise<StockOpname>;
  updateItem(tenantId: string, id: string, data: Partial<StockOpnameItem>): Promise<StockOpnameItem>;
  getItems(tenantId: string, opnameId: string): Promise<StockOpnameItem[]>;
  updateItemBatch(tenantId: string, opnameId: string, items: Array<{productId: string; actualQuantity: number; notes?: string}>): Promise<StockOpnameItem[]>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IAuditLogRepository {
  create(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  findByTenant(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]>;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
}

// ============== IDEMPOTENCY KEY ==============
export interface IdempotencyKey {
  id: string;
  tenantId: string;
  keyHash: string;
  orderId?: string;
  response?: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export interface IIdempotencyKeyRepository {
  /**
   * Check if an idempotency key exists and is valid (not expired).
   * Returns the cached response if exists, null otherwise.
   */
  checkAndLock(tenantId: string, keyHash: string): Promise<IdempotencyKey | null>;
  /**
   * Store the response for an idempotency key.
   * Called after successful checkout.
   */
  storeResponse(tenantId: string, keyHash: string, orderId: string, response: unknown): Promise<void>;
  /**
   * Clean up expired keys.
   */
  cleanupExpired(): Promise<void>;
}

// ============== HARDWARE DEVICE ==============
import type { HardwareDevice, HardwareLog, HardwareDeviceType, HardwareLogStatus, HardwareConfig } from '../entities/index.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HardwareDeviceQuery {
  deviceType?: HardwareDeviceType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface HardwareLogQuery {
  deviceId?: string;
  eventType?: string;
  status?: HardwareLogStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateHardwareDeviceDTO {
  deviceType: HardwareDeviceType;
  name: string;
  connectionType: 'usb' | 'serial' | 'tcp' | 'bluetooth';
  config: HardwareConfig;
  isDefault?: boolean;
}

export interface UpdateHardwareDeviceDTO {
  name?: string;
  connectionType?: 'usb' | 'serial' | 'tcp' | 'bluetooth';
  config?: HardwareConfig;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface IHardwareDeviceRepository {
  create(data: CreateHardwareDeviceDTO, tenantId: string): Promise<HardwareDevice>;
  findById(id: string, tenantId: string): Promise<HardwareDevice | null>;
  findByTenant(tenantId: string, query?: HardwareDeviceQuery): Promise<PaginatedResult<HardwareDevice>>;
  findDefault(deviceType: HardwareDeviceType, tenantId: string): Promise<HardwareDevice | null>;
  update(id: string, tenantId: string, data: UpdateHardwareDeviceDTO): Promise<HardwareDevice | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  testConnection(id: string, tenantId: string): Promise<{ success: boolean; message: string }>;
}

export interface IHardwareLogRepository {
  create(log: Omit<HardwareLog, 'id' | 'createdAt'>): Promise<HardwareLog>;
  findByTenant(tenantId: string, query?: HardwareLogQuery): Promise<PaginatedResult<HardwareLog>>;
}
