// Record Stock Count Use Case
import type { StockOpnameItem } from '../../domain/entities/index.js';
import type { IStockOpnameRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface RecordStockCountInput {
  productId: string;
  actualQuantity: number;
  notes?: string;
}

export class RecordStockCountUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    input: RecordStockCountInput
  ): Promise<StockOpnameItem> {
    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);
    const item = items.find(i => i.productId === input.productId);

    if (!item) {
      throw new NotFoundError(`Product '${input.productId}' not found in stock opname`);
    }

    return this.stockOpnameRepo.updateItem(tenantId, item.id, {
      actualQuantity: input.actualQuantity,
      notes: input.notes,
      variance: input.actualQuantity - item.systemQuantity,
    });
  }
}
