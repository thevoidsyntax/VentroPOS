// Orders & Checkout Application Service
// Simplified DDD: Order Aggregate with Checkout Flow

import type { Order, OrderItem, Transaction } from '../../domain/entities/index.js';
import type {
  IOrderRepository,
  IProductRepository,
  ITransactionRepository,
  ITableRepository,
  IStockLogRepository
} from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

// ============== CART DTOs ==============

export interface CartItemInput {
  productId: string;
  quantity: number;
  modifiers?: { modifierId: string; name: string; priceAdjustment: number }[];
  notes?: string;
}

export interface CreateOrderInput {
  tableId?: string;
  items: CartItemInput[];
  customerName?: string;
  notes?: string;
  applyDiscount?: { type: 'percentage' | 'fixed'; value: number };
}

// ============== CREATE ORDER USE CASE ==============

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private tableRepo: ITableRepository,
    _stockLogRepo: IStockLogRepository
  ) {
    void _stockLogRepo; // Reserved for future stock tracking at order creation
  }

  async execute(tenantId: string, userId: string, input: CreateOrderInput): Promise<Order> {
    // Validate table if provided
    if (input.tableId) {
      const table = await this.tableRepo.findById(tenantId, input.tableId);
      if (!table) {
        throw new NotFoundError(`Table with id '${input.tableId}'`);
      }
    }

    // Build order items with product details
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      const product = await this.productRepo.findById(tenantId, itemInput.productId);

      if (!product) {
        throw new NotFoundError(`Product with id '${itemInput.productId}'`);
      }

      if (!product.isActive) {
        throw new BusinessRuleError(`Product '${product.name}' is not available`);
      }

      // Validate stock availability
      if (product.stockQuantity < itemInput.quantity) {
        throw new BusinessRuleError(
          `Insufficient stock for '${product.name}': requested ${itemInput.quantity}, available ${product.stockQuantity}`
        );
      }

      // Calculate modifiers price
      const modifiersTotal = itemInput.modifiers?.reduce((sum, m) => sum + m.priceAdjustment, 0) ?? 0;
      const unitPrice = product.price + modifiersTotal;
      const totalPrice = unitPrice * itemInput.quantity;

      orderItems.push({
        id: crypto.randomUUID(),
        orderId: '', // Will be set after order creation
        productId: product.id,
        productName: product.name,
        quantity: itemInput.quantity,
        unitPrice,
        totalPrice,
        modifiers: (itemInput.modifiers ?? []).map(m => ({
          id: crypto.randomUUID(),
          modifierId: m.modifierId,
          modifierName: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
        notes: itemInput.notes,
      });

      subtotal += totalPrice;
    }

    // Calculate discount
    let discountAmount = 0;
    if (input.applyDiscount) {
      if (input.applyDiscount.type === 'percentage') {
        discountAmount = (subtotal * input.applyDiscount.value) / 100;
      } else {
        discountAmount = input.applyDiscount.value;
      }
    }

    // Calculate tax (assume 11% PPN for Indonesia)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * 0.11 * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Generate order number
    const orderNumber = await this.orderRepo.generateOrderNumber(tenantId);

    // Create order
    const order = await this.orderRepo.create(tenantId, {
      tenantId,
      tableId: input.tableId,
      userId,
      orderNumber,
      status: 'pending',
      items: orderItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      customerName: input.customerName,
      notes: input.notes,
    });

    // Update table status if assigned
    if (input.tableId) {
      await this.tableRepo.updateStatus(tenantId, input.tableId, 'occupied');
    }

    return order;
  }
}

// ============== CHECKOUT USE CASE ==============

export interface CheckoutInput {
  orderId: string;
  paymentMethod: 'cash' | 'qris' | 'debit' | 'credit';
  cashReceived?: number; // For cash payment
  referenceNumber?: string;
  splitPayments?: { method: 'cash' | 'qris' | 'debit' | 'credit'; amount: number }[];
  /** Idempotency key to prevent duplicate checkout on retry */
  idempotencyKey?: string;
}

export interface CheckoutResult {
  transaction: Transaction;
  order: Order;
  changeAmount?: number;
}

export class CheckoutUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private transactionRepo: ITransactionRepository,
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: CheckoutInput
  ): Promise<CheckoutResult> {
    // Get order
    const order = await this.orderRepo.findById(tenantId, input.orderId);

    if (!order) {
      throw new NotFoundError(`Order with id '${input.orderId}'`);
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new BusinessRuleError(`Order cannot be checked out. Current status: ${order.status}`);
    }

    // Calculate total amount
    const totalAmount = order.totalAmount;
    let changeAmount = 0;
    let cashReceived = input.cashReceived;

    // Handle split payments
    if (input.splitPayments) {
      const splitTotal = input.splitPayments.reduce((sum, s) => sum + s.amount, 0);
      if (splitTotal < totalAmount) {
        throw new BusinessRuleError('Split payment total is less than order amount');
      }
    }

    // Validate cash payment
    if (input.paymentMethod === 'cash' || input.splitPayments) {
      const effectiveCash = input.splitPayments
        ?.filter(s => s.method === 'cash')
        .reduce((sum, s) => sum + s.amount, 0) ?? cashReceived ?? 0;

      if (effectiveCash < totalAmount) {
        throw new BusinessRuleError('Cash received is less than order amount');
      }

      if (input.splitPayments) {
        cashReceived = effectiveCash;
      }

      changeAmount = Math.round(((cashReceived ?? 0) - totalAmount) * 100) / 100;
    }

    // Create transaction
    const transaction = await this.transactionRepo.create(tenantId, {
      tenantId,
      orderId: order.id,
      amount: totalAmount,
      changeAmount,
      paymentMethod: input.paymentMethod,
      paymentDetails: {
        ...(input.referenceNumber && { referenceNumber: input.referenceNumber }),
        ...(input.splitPayments && { splits: input.splitPayments }),
      },
      referenceNumber: input.referenceNumber,
      userId,
    });

    // Deduct stock for each item
    for (const item of order.items) {
      const product = await this.productRepo.findById(tenantId, item.productId);

      if (product) {
        // Update product stock
        const newQuantity = product.stockQuantity - item.quantity;
        await this.productRepo.updateStock(tenantId, item.productId, newQuantity);

        // Create stock log
        await this.stockLogRepo.create(tenantId, {
          tenantId,
          productId: product.id,
          type: 'sale',
          quantity: -item.quantity,
          balanceAfter: newQuantity,
          referenceType: 'order',
          referenceId: order.id,
          userId,
        });
      }
    }

    // Update order status to paid
    const updatedOrder = await this.orderRepo.updateStatus(tenantId, order.id, 'paid');

    return {
      transaction,
      order: updatedOrder,
      changeAmount: changeAmount > 0 ? changeAmount : undefined,
    };
  }
}

// ============== UPDATE ORDER STATUS USE CASE ==============

export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  private validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'voided', 'held'],
    confirmed: ['preparing', 'voided', 'held'],
    preparing: ['ready', 'voided'],
    ready: ['served', 'voided'],
    served: ['paid'],
    paid: [],
    voided: [],
    held: ['pending', 'confirmed', 'voided'],
  };

  async execute(
    tenantId: string,
    orderId: string,
    newStatus: Order['status'],
    _userId: string
  ): Promise<Order> {
    const order = await this.orderRepo.findById(tenantId, orderId);

    if (!order) {
      throw new NotFoundError(`Order with id '${orderId}'`);
    }

    const allowed = this.validTransitions[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid status transition from '${order.status}' to '${newStatus}'`
      );
    }

    return this.orderRepo.updateStatus(tenantId, orderId, newStatus);
  }
}

// ============== VOID ORDER USE CASE ==============

export interface VoidOrderInput {
  reason?: string;
}

export class VoidOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    orderId: string,
    userId: string,
    input: VoidOrderInput
  ): Promise<Order> {
    const order = await this.orderRepo.findById(tenantId, orderId);

    if (!order) {
      throw new NotFoundError(`Order with id '${orderId}'`);
    }

    // Can only void if already paid
    if (order.status !== 'paid') {
      throw new BusinessRuleError('Can only void paid orders');
    }

    // Restore stock for each item
    for (const item of order.items) {
      const product = await this.productRepo.findById(tenantId, item.productId);

      if (product) {
        const newQuantity = product.stockQuantity + item.quantity;
        await this.productRepo.updateStock(tenantId, item.productId, newQuantity);

        await this.stockLogRepo.create(tenantId, {
          tenantId,
          productId: product.id,
          type: 'void',
          quantity: item.quantity,
          balanceAfter: newQuantity,
          referenceType: 'order',
          referenceId: order.id,
          notes: input.reason,
          userId,
        });
      }
    }

    return this.orderRepo.updateStatus(tenantId, orderId, 'voided');
  }
}

// ============== GET ORDERS USE CASE ==============

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

    // Sort by createdAt desc
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const page = input.page ?? 1;
    const limit = input.limit ?? 50;
    const start = (page - 1) * limit;
    const paginatedOrders = orders.slice(start, start + limit);

    return {
      data: paginatedOrders,
      meta: {
        page,
        limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / limit),
      },
    };
  }
}
