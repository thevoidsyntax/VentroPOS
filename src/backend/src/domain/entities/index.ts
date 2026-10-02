// Domain Entities - Simplified DDD
// These are PURE business logic with NO external dependencies

export type UserRole = 'owner' | 'manager' | 'kasir' | 'kitchen';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'voided' | 'held';
export type PaymentMethod = 'cash' | 'qris' | 'debit' | 'credit';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type StockOperationType = 'sale' | 'restock' | 'adjustment' | 'return' | 'void';
export type StockOpnameStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

// ============== TENANT ==============
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, unknown>;
  plan: 'starter' | 'basic' | 'premium';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============== USER ==============
export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// ============== CATEGORY ==============
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============== MODIFIER ==============
export interface ModifierGroup {
  id: string;
  tenantId: string;
  name: string;
  type: 'size' | 'extras' | 'topping' | 'custom';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Modifier {
  id: string;
  groupId: string;
  tenantId: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============== PRODUCT ==============
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  categoryId?: string;
  description?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isSerialized: boolean;
  imageUrl?: string;
  modifierGroupIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============== TABLE ==============
export interface Table {
  id: string;
  tenantId: string;
  tableNumber: string;
  capacity: number;
  positionX: number;
  positionY: number;
  status: TableStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============== ORDER ==============
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: OrderItemModifier[];
  notes?: string;
}

export interface OrderItemModifier {
  id: string;
  modifierId: string;
  modifierName: string;
  priceAdjustment: number;
}

export interface Order {
  id: string;
  tenantId: string;
  tableId?: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

// ============== TRANSACTION ==============
export interface TransactionSplit {
  id: string;
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails: Record<string, unknown>;
  referenceNumber?: string;
  userId: string;
  splits?: TransactionSplit[];
  createdAt: Date;
}

// ============== STOCK ==============
export interface StockLog {
  id: string;
  tenantId: string;
  productId: string;
  type: StockOperationType;
  quantity: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId?: string;
  createdAt: Date;
}

// ============== STOCK OPNAME ==============
export interface StockOpnameItem {
  id: string;
  opnameId: string;
  productId: string;
  productName?: string;
  systemQuantity: number;
  actualQuantity: number;
  variance: number;
  notes?: string;
}

export interface StockOpname {
  id: string;
  tenantId: string;
  userId: string;
  status: StockOpnameStatus;
  items: StockOpnameItem[];
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============== AUDIT ==============
export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============== IDEMPOTENCY ==============
export interface IdempotencyKey {
  id: string;
  tenantId: string;
  keyHash: string;
  orderId?: string;
  response?: unknown;
  createdAt: Date;
  expiresAt: Date;
}
