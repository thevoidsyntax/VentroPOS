// List Stock Opnames Use Case
import type { StockOpname } from '../../domain/entities/index.js';
import type { IStockOpnameRepository, StockOpnameFilters } from '../../domain/repositories/index.js';

export class ListStockOpnamesUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(tenantId: string, filters?: StockOpnameFilters): Promise<{
    opnames: StockOpname[];
  }> {
    const opnames = await this.stockOpnameRepo.findAll(tenantId, filters);
    return { opnames };
  }
}
