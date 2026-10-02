// Create Product Use Case
import type { Product } from '../../domain/entities/index.js';
import type { IProductRepository, ICategoryRepository } from '../../domain/repositories/index.js';
import { NotFoundError, DuplicateError } from '../../shared/errors/index.js';

export interface CreateProductInput {
  name: string;
  sku?: string;
  categoryId?: string;
  description?: string;
  price: number;
  cost?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  modifierGroupIds?: string[];
}

export class CreateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository
  ) {}

  async execute(tenantId: string, input: CreateProductInput): Promise<Product> {
    if (input.categoryId) {
      const category = await this.categoryRepo.findById(tenantId, input.categoryId);
      if (!category) {
        throw new NotFoundError(`Category with id '${input.categoryId}'`);
      }
    }

    if (input.sku) {
      const existing = await this.productRepo.findBySku(tenantId, input.sku);
      if (existing) {
        throw new DuplicateError('Product', 'SKU', input.sku);
      }
    }

    return this.productRepo.create(tenantId, {
      name: input.name,
      sku: input.sku,
      categoryId: input.categoryId,
      description: input.description,
      price: input.price,
      cost: input.cost ?? 0,
      stockQuantity: input.stockQuantity ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 10,
      isActive: true,
      isSerialized: false,
      modifierGroupIds: input.modifierGroupIds ?? [],
    });
  }
}
