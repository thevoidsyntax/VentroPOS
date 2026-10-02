// Stock Overview Use Case
import type { Product } from '../../domain/entities/index.js';
import type { IProductRepository } from '../../domain/repositories/index.js';

export interface StockOverviewItem {
  product: Product;
  lowStock: boolean;
  outOfStock: boolean;
}

export class GetStockOverviewUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<{
    items: StockOverviewItem[];
    summary: {
      totalProducts: number;
      inStock: number;
      lowStock: number;
      outOfStock: number;
    };
  }> {
    const products = await this.productRepo.findAll(tenantId, { isActive: true });

    const items: StockOverviewItem[] = products.map(product => ({
      product,
      lowStock: product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold,
      outOfStock: product.stockQuantity === 0,
    }));

    return {
      items,
      summary: {
        totalProducts: items.length,
        inStock: items.filter(i => !i.lowStock && !i.outOfStock).length,
        lowStock: items.filter(i => i.lowStock).length,
        outOfStock: items.filter(i => i.outOfStock).length,
      },
    };
  }
}
