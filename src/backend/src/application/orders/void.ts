// Void Order Use Case
import type { Order } from '../../domain/entities/index.js';
import type {
  IOrderRepository,
  IProductRepository,
  IStockLogRepository,
} from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export class VoidOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private logRepo: IStockLogRepository
  ) {}

  async execute(tenantId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(tenantId, orderId);
    if (!order) throw new NotFoundError(`Order '${orderId}'`);
    if (order.status !== 'paid') throw new BusinessRuleError('Only paid orders can be voided');

    // Batch restore stock - single DB round-trip
    const prodIds = order.items.map(i => i.productId);
    const prods = await this.productRepo.findByIds(tenantId, prodIds);
    const pMap = new Map(prods.map(p => [p.id, p]));

    const stockUpdates: Array<{id: string; quantity: number}> = [];
    const stockLogs: Array<{productId: string; newQty: number; quantity: number}> = [];

    for (const item of order.items) {
      const p = pMap.get(item.productId);
      if (!p) continue;
      const newQty = p.stockQuantity + item.quantity;
      stockUpdates.push({ id: p.id, quantity: newQty });
      stockLogs.push({ productId: p.id, newQty, quantity: item.quantity });
    }

    await this.productRepo.batchUpdateStock(tenantId, stockUpdates);

    // Batch insert stock logs - single DB round-trip instead of N
    await this.logRepo.batchCreate(tenantId, stockLogs.map(log => ({
      tenantId,
      productId: log.productId,
      type: 'void',
      quantity: log.quantity,
      balanceAfter: log.newQty,
      referenceType: 'order',
      referenceId: order.id,
    })));

    return this.orderRepo.updateStatus(tenantId, orderId, 'voided');
  }
}
