// Get Orders Use Case
import type { Order } from '../../domain/entities/index.js';
import type { IOrderRepository } from '../../domain/repositories/index.js';

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
