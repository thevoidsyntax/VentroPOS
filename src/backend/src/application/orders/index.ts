// Orders Application Service - Use Cases

import type { Order, OrderItem, Transaction } from '../../domain/entities/index.js';
import type {
  IOrderRepository,
  IProductRepository,
  ITransactionRepository,
  ITableRepository,
  IStockLogRepository,
  IIdempotencyKeyRepository,
} from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';

const TAX_RATE = config.tax.rate;

// Create Order
export interface CreateOrderInput {
  tableId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    modifiers?: Array<{ modifierId: string; name: string; priceAdjustment: number }>;
    notes?: string;
  }>;
  customerName?: string;
  notes?: string;
  applyDiscount?: { type: 'percentage' | 'fixed'; value: number };
}

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private tableRepo: ITableRepository,
    _logRepo: IStockLogRepository
  ) {
    void _logRepo;
  }

  async execute(tenantId: string, userId: string, input: CreateOrderInput): Promise<Order> {
    if (input.tableId) {
      const table = await this.tableRepo.findById(tenantId, input.tableId);
      if (!table) throw new NotFoundError(`Table '${input.tableId}'`);
    }

    // Batch fetch all products at once
    const ids = input.items.map(i => i.productId);
    const products = await this.productRepo.findByIds(tenantId, ids);
    const prodMap = new Map(products.map(p => [p.id, p]));

    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    for (const item of input.items) {
      const p = prodMap.get(item.productId);
      if (!p) throw new NotFoundError(`Product '${item.productId}'`);
      if (!p.isActive) throw new BusinessRuleError(`Product '${p.name}' is inactive`);
      if (p.stockQuantity < item.quantity) {
        throw new BusinessRuleError(`Insufficient stock for '${p.name}'`);
      }
      const modTotal = item.modifiers?.reduce((s, m) => s + m.priceAdjustment, 0) ?? 0;
      const unitPrice = p.price + modTotal;
      const totalPrice = unitPrice * item.quantity;
      orderItems.push({
        id: crypto.randomUUID(),
        orderId: '',
        productId: p.id,
        productName: p.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        modifiers: (item.modifiers ?? []).map(m => ({
          id: crypto.randomUUID(),
          modifierId: m.modifierId,
          modifierName: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
        notes: item.notes,
      });
      subtotal += totalPrice;
    }

    let discountAmount = 0;
    if (input.applyDiscount) {
      if (input.applyDiscount.type === 'percentage') {
        const pct = input.applyDiscount.value;
        if (pct < 0 || pct > 100) throw new BusinessRuleError('Discount pct 0-100');
        discountAmount = (subtotal * pct) / 100;
      } else {
        discountAmount = input.applyDiscount.value;
        if (discountAmount < 0 || discountAmount > subtotal) {
          throw new BusinessRuleError('Fixed discount exceeds subtotal');
        }
      }
    }

    const taxable = subtotal - discountAmount;
    const taxAmount = Math.round(taxable * TAX_RATE * 100) / 100;
    const total = Math.round((taxable + taxAmount) * 100) / 100;
    const order = await this.orderRepo.create(tenantId, {
      tenantId,
      tableId: input.tableId,
      userId,
      orderNumber: await this.orderRepo.generateOrderNumber(tenantId),
      status: 'pending',
      items: orderItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount: total,
      customerName: input.customerName,
      notes: input.notes,
    });

    if (input.tableId) await this.tableRepo.updateStatus(tenantId, input.tableId, 'occupied');
    return order;
  }
}

// Checkout
export interface CheckoutInput {
  orderId: string;
  paymentMethod: 'cash' | 'qris' | 'debit' | 'credit';
  cashReceived?: number;
  referenceNumber?: string;
  splitPayments?: Array<{ method: 'cash' | 'qris' | 'debit' | 'credit'; amount: number }>;
  idempotencyKey?: string;
}

export interface CheckoutResult { transaction: Transaction; order: Order; changeAmount?: number }

export class CheckoutUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private txRepo: ITransactionRepository,
    private productRepo: IProductRepository,
    private logRepo: IStockLogRepository,
    private idemRepo?: IIdempotencyKeyRepository
  ) {}

  async execute(tenantId: string, userId: string, input: CheckoutInput): Promise<CheckoutResult> {
    if (input.idempotencyKey && this.idemRepo) {
      const h = await this.hash(input.idempotencyKey);
      const cached = await this.idemRepo.checkAndLock(tenantId, h);
      if (cached?.response) return cached.response as CheckoutResult;
    }

    const order = await this.orderRepo.findById(tenantId, input.orderId);
    if (!order) throw new NotFoundError(`Order '${input.orderId}'`);
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new BusinessRuleError(`Order status: ${order.status}`);
    }

    let changeAmount = 0;
    const total = order.totalAmount;
    if (input.splitPayments) {
      const splitTotal = input.splitPayments.reduce((s, p) => s + p.amount, 0);
      if (splitTotal < total) throw new BusinessRuleError('Split total < order amount');
    }
    if (input.paymentMethod === 'cash' || input.splitPayments) {
      const cashTotal = input.splitPayments?.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0) ?? input.cashReceived ?? 0;
      if (cashTotal < total) throw new BusinessRuleError('Cash < total');
      changeAmount = Math.round((cashTotal - total) * 100) / 100;
    }

    const tx = await this.txRepo.create(tenantId, {
      tenantId,
      orderId: order.id,
      amount: total,
      changeAmount,
      paymentMethod: input.paymentMethod,
      paymentDetails: {
        ...(input.referenceNumber ? { referenceNumber: input.referenceNumber } : {}),
        ...(input.splitPayments ? { splits: input.splitPayments } : {}),
      },
      referenceNumber: input.referenceNumber,
      userId,
    });

    // Batch deduct stock - single DB round-trip
    const prodIds = order.items.map(i => i.productId);
    const prods = await this.productRepo.findByIds(tenantId, prodIds);
    const pMap = new Map(prods.map(p => [p.id, p]));

    // Prepare batch updates
    const stockUpdates: Array<{id: string; quantity: number}> = [];
    const stockLogs: Array<{productId: string; newQty: number; quantity: number}> = [];

    for (const item of order.items) {
      const p = pMap.get(item.productId);
      if (!p) continue;
      const newQty = p.stockQuantity - item.quantity;
      stockUpdates.push({ id: p.id, quantity: newQty });
      stockLogs.push({ productId: p.id, newQty, quantity: item.quantity });
    }

    // Batch update all stock in single transaction
    await this.productRepo.batchUpdateStock(tenantId, stockUpdates);

    // Create stock logs
    for (const log of stockLogs) {
      await this.logRepo.create(tenantId, {
        tenantId,
        productId: log.productId,
        type: 'sale',
        quantity: -log.quantity,
        balanceAfter: log.newQty,
        referenceType: 'order',
        referenceId: order.id,
      });
    }

    const updated = await this.orderRepo.updateStatus(tenantId, order.id, 'paid');
    const result: CheckoutResult = { transaction: tx, order: updated, changeAmount: changeAmount > 0 ? changeAmount : undefined };

    if (input.idempotencyKey && this.idemRepo) {
      const h = await this.hash(input.idempotencyKey);
      await this.idemRepo.storeResponse(tenantId, h, order.id, result);
    }
    return result;
  }

  private async hash(key: string): Promise<string> {
    const buf = new TextEncoder().encode(key);
    const h = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Update Order Status
export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  private readonly transitions: Record<string, string[]> = {
    pending: ['confirmed', 'voided', 'held'],
    confirmed: ['preparing', 'voided', 'held'],
    preparing: ['ready', 'voided'],
    ready: ['served', 'voided'],
    served: ['paid'],
    paid: [],
    voided: [],
    held: ['pending', 'confirmed', 'voided'],
  };

  async execute(tenantId: string, orderId: string, newStatus: Order['status']): Promise<Order> {
    const order = await this.orderRepo.findById(tenantId, orderId);
    if (!order) throw new NotFoundError(`Order '${orderId}'`);
    const allowed = this.transitions[order.status] ?? [];
    if (!allowed.includes(newStatus)) throw new BusinessRuleError(`Cannot ${order.status} → ${newStatus}`);
    return this.orderRepo.updateStatus(tenantId, orderId, newStatus);
  }
}

// Void Order
export class VoidOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private logRepo: IStockLogRepository
  ) {}

  async execute(tenantId: string, orderId: string, _input?: string): Promise<Order> {
    const order = await this.orderRepo.findById(tenantId, orderId);
    if (!order) throw new NotFoundError(`Order '${orderId}'`);
    if (order.status !== 'paid') throw new BusinessRuleError('Only paid orders can be voided');

    // Batch restore stock - single DB round-trip
    const prodIds = order.items.map(i => i.productId);
    const prods = await this.productRepo.findByIds(tenantId, prodIds);
    const pMap = new Map(prods.map(p => [p.id, p]));

    // Prepare batch updates
    const stockUpdates: Array<{id: string; quantity: number}> = [];
    const stockLogs: Array<{productId: string; newQty: number; quantity: number}> = [];

    for (const item of order.items) {
      const p = pMap.get(item.productId);
      if (!p) continue;
      const newQty = p.stockQuantity + item.quantity;
      stockUpdates.push({ id: p.id, quantity: newQty });
      stockLogs.push({ productId: p.id, newQty, quantity: item.quantity });
    }

    // Batch restore all stock in single transaction
    await this.productRepo.batchUpdateStock(tenantId, stockUpdates);

    // Create stock logs
    for (const log of stockLogs) {
      await this.logRepo.create(tenantId, {
        tenantId,
        productId: log.productId,
        type: 'void',
        quantity: log.quantity,
        balanceAfter: log.newQty,
        referenceType: 'order',
        referenceId: order.id,
      });
    }

    return this.orderRepo.updateStatus(tenantId, orderId, 'voided');
  }
}

// Get Orders
export interface GetOrdersInput {
  status?: Order['status'][];
  tableId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class GetOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(tenantId: string, input: GetOrdersInput = {}) {
    const orders = await this.orderRepo.findAll(tenantId, {
      status: input.status,
      tableId: input.tableId,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.max(1, input.limit ?? 50);
    const start = (page - 1) * limit;
    return { data: orders.slice(start, start + limit), meta: { page, limit, total: orders.length } };
  }
}
