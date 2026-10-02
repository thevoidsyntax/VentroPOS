// Create Stock Opname Use Case
import type { Product, StockOpname, StockOpnameItem } from '../../domain/entities/index.js';
import type { IProductRepository, IStockOpnameRepository } from '../../domain/repositories/index.js';
import { BusinessRuleError } from '../../shared/errors/index.js';

export interface CreateStockOpnameInput {
  notes?: string;
  productIds?: string[];
}

export class CreateStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: CreateStockOpnameInput = {}
  ): Promise<{ opname: StockOpname; items: StockOpnameItem[] }> {
    const products = input.productIds?.length
      ? await this.productRepo.findByIds(tenantId, input.productIds)
      : await this.productRepo.findAll(tenantId, { isActive: true });

    const validProducts = products.filter((p): p is Product => p !== null);

    if (validProducts.length === 0) {
      throw new BusinessRuleError('No products found for stock opname');
    }

    const opname = await this.stockOpnameRepo.create(tenantId, {
      tenantId,
      userId,
      status: 'in_progress',
      items: [],
      notes: input.notes,
    });

    // Create first item with createItem
    const firstItem = await this.stockOpnameRepo.createItem(tenantId, {
      opnameId: opname.id,
      productId: validProducts[0].id,
      systemQuantity: validProducts[0].stockQuantity,
      actualQuantity: validProducts[0].stockQuantity,
      variance: 0,
    });

    // Batch create remaining items
    const remainingItems = validProducts.length > 1
      ? await this.stockOpnameRepo.updateItemBatch(
          tenantId,
          opname.id,
          validProducts.slice(1).map(p => ({
            productId: p.id,
            actualQuantity: p.stockQuantity,
          }))
        )
      : [];

    return {
      opname,
      items: [firstItem, ...remainingItems],
    };
  }
}
