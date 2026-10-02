// Update Order Status Use Case
import type { Order } from '../../domain/entities/index.js';
import type { IOrderRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

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
