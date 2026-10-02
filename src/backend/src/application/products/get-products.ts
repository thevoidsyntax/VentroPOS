// Get Products Use Case
import type { IProductRepository, ProductFilters } from '../../domain/repositories/index.js';

export interface GetProductsInput {
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string, input: GetProductsInput = {}) {
    const filters: ProductFilters = {
      categoryId: input.categoryId,
      isActive: input.isActive,
      lowStock: input.lowStock,
      search: input.search,
    };

    const products = await this.productRepo.findAll(tenantId, filters);

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.max(1, input.limit ?? 50);
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return {
      data: paginatedProducts,
      meta: { page, limit, total: products.length, totalPages: Math.ceil(products.length / limit) },
    };
  }
}
