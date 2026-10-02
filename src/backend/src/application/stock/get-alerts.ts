// Stock Alerts Use Case
import type { IProductRepository } from '../../domain/repositories/index.js';

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

export class GetStockAlertsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<StockAlert[]> {
    const products = await this.productRepo.findAll(tenantId, { isActive: true, lowStock: true });

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      threshold: product.lowStockThreshold,
      severity: product.stockQuantity === 0 ? 'critical' : 'warning',
    }));
  }
}
