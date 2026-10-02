// Get Stock Opname Use Case
import type { StockOpname, StockOpnameItem } from '../../domain/entities/index.js';
import type { IProductRepository, IStockOpnameRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class GetStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(tenantId: string, opnameId: string): Promise<{
    opname: StockOpname;
    items: Array<StockOpnameItem & { productName?: string }>;
  }> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);

    // Batch fetch all products in single query, then map locally
    const productIds = items.map(i => i.productId);
    const products = await this.productRepo.findByIds(tenantId, productIds);
    const productMap = new Map(products.map(p => [p.id, p]));

    const enrichedItems = items.map(item => ({
      ...item,
      productName: productMap.get(item.productId)?.name || item.productName,
    }));

    return { opname, items: enrichedItems };
  }
}
