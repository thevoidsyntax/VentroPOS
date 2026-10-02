// Batch Record Stock Counts Use Case
import type { StockOpnameItem } from '../../domain/entities/index.js';
import type { IStockOpnameRepository } from '../../domain/repositories/index.js';

export class BatchRecordStockCountUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    counts: Array<{ productId: string; actualQuantity: number; notes?: string }>
  ): Promise<StockOpnameItem[]> {
    return this.stockOpnameRepo.updateItemBatch(tenantId, opnameId, counts);
  }
}
