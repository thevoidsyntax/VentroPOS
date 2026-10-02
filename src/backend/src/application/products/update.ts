// Update Product Use Case
import type { Product } from '../../domain/entities/index.js';
import type { IProductRepository, ICategoryRepository } from '../../domain/repositories/index.js';
import { NotFoundError, DuplicateError } from '../../shared/errors/index.js';

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  categoryId?: string;
  description?: string;
  price?: number;
  cost?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  imageUrl?: string;
  modifierGroupIds?: string[];
}

export class UpdateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository
  ) {}

  async execute(tenantId: string, productId: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepo.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${productId}'`);
    }

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(tenantId, input.categoryId);
      if (!category) {
        throw new NotFoundError(`Category with id '${input.categoryId}'`);
      }
    }

    if (input.sku && input.sku !== product.sku) {
      const existing = await this.productRepo.findBySku(tenantId, input.sku);
      if (existing && existing.id !== productId) {
        throw new DuplicateError('Product', 'SKU', input.sku);
      }
    }

    return this.productRepo.update(tenantId, productId, input);
  }
}
