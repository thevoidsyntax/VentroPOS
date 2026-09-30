// Repository Interfaces - Domain Layer
// These define contracts, implementations are in Infrastructure

import type { Tenant, User, Category, Product, Table, Order, Transaction, StockLog, AuditLog } from '../entities/index.js';

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
  findBySku(tenantId: string, sku: string): Promise<Product | null>;
  findAll(tenantId: string, filters?: ProductFilters): Promise<Product[]>;
  update(tenantId: string, id: string, data: Partial<Product>): Promise<Product>;
  updateStock(tenantId: string, id: string, quantity: number): Promise<Product>;
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
  findByProduct(tenantId: string, productId: string): Promise<StockLog[]>;
  findAll(tenantId: string, filters?: StockLogFilters): Promise<StockLog[]>;
}

export interface StockLogFilters {
  productId?: string;
  type?: StockLog['type'];
  fromDate?: Date;
  toDate?: Date;
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
