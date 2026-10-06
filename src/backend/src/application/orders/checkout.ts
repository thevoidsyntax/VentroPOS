// Checkout Use Case
import type { Order, Transaction } from '../../domain/entities/index.js';
import type {
  IOrderRepository,
  IProductRepository,
  ITransactionRepository,
  IStockLogRepository,
  IIdempotencyKeyRepository,
} from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

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

    const stockUpdates: Array<{id: string; quantity: number}> = [];
    const stockLogs: Array<{productId: string; newQty: number; quantity: number}> = [];

    for (const item of order.items) {
      const p = pMap.get(item.productId);
      if (!p) continue;
      const newQty = p.stockQuantity - item.quantity;
      stockUpdates.push({ id: p.id, quantity: newQty });
      stockLogs.push({ productId: p.id, newQty, quantity: item.quantity });
    }

    await this.productRepo.batchUpdateStock(tenantId, stockUpdates);

    // Batch insert stock logs - single DB round-trip instead of N
    await this.logRepo.batchCreate(tenantId, stockLogs.map(log => ({
      tenantId,
      productId: log.productId,
      type: 'sale',
      quantity: -log.quantity,
      balanceAfter: log.newQty,
      referenceType: 'order',
      referenceId: order.id,
    })));

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
