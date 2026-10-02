// Update Stock Opname Use Case
import type { StockOpnameItem } from '../../domain/entities/index.js';
import type { IStockOpnameRepository } from '../../domain/repositories/index.js';

export interface UpdateStockOpnameInput {
  items: Array<{ productId: string; actualQuantity: number; notes?: string }>;
}

export class UpdateStockOpnameUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    input: UpdateStockOpnameInput
  ): Promise<StockOpnameItem[]> {
    return this.stockOpnameRepo.updateItemBatch(tenantId, opnameId, input.items);
  }
}
