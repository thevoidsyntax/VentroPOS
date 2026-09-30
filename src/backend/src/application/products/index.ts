// Products Application Service - CRUD Use Cases
// Simplified DDD: Keeping use cases focused

import type { Product, Category } from '../../domain/entities/index.js';
import type { IProductRepository, ICategoryRepository } from '../../domain/repositories/index.js';
import { NotFoundError, DuplicateError } from '../../shared/errors/index.js';

// Use Case: Create Product
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
    // Validate category exists if provided
    if (input.categoryId) {
      const category = await this.categoryRepo.findById(tenantId, input.categoryId);
      if (!category) {
        throw new NotFoundError(`Category with id '${input.categoryId}'`);
      }
    }

    // Check SKU uniqueness if provided
    if (input.sku) {
      const existing = await this.productRepo.findBySku(tenantId, input.sku);
      if (existing) {
        throw new DuplicateError('Product', 'SKU', input.sku);
      }
    }

    const product = await this.productRepo.create(tenantId, {
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

    return product;
  }
}

// Use Case: Get Products
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
    const products = await this.productRepo.findAll(tenantId, {
      categoryId: input.categoryId,
      isActive: input.isActive,
      lowStock: input.lowStock,
      search: input.search,
    });

    // Simple pagination
    const page = input.page ?? 1;
    const limit = input.limit ?? 50;
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return {
      data: paginatedProducts,
      meta: {
        page,
        limit,
        total: products.length,
        totalPages: Math.ceil(products.length / limit),
      },
    };
  }
}

// Use Case: Get Product by ID
export class GetProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string, productId: string): Promise<Product> {
    const product = await this.productRepo.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${productId}'`);
    }

    return product;
  }
}

// Use Case: Update Product
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
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string, productId: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepo.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${productId}'`);
    }

    // Check SKU uniqueness if changing
    if (input.sku && input.sku !== product.sku) {
      const existing = await this.productRepo.findBySku(tenantId, input.sku);
      if (existing) {
        throw new DuplicateError('Product', 'SKU', input.sku);
      }
    }

    const updated = await this.productRepo.update(tenantId, productId, input);
    return updated;
  }
}

// Use Case: Delete Product (Soft Delete)
export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string, productId: string): Promise<void> {
    const product = await this.productRepo.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${productId}'`);
    }

    // Soft delete - just set isActive to false
    await this.productRepo.update(tenantId, productId, { isActive: false });
  }
}

// ============== CATEGORY USE CASES ==============

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export class CreateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(tenantId: string, input: CreateCategoryInput): Promise<Category> {
    return this.categoryRepo.create(tenantId, {
      name: input.name,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });
  }
}

export class GetCategoriesUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.findAll(tenantId);
  }
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(tenantId: string, categoryId: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryRepo.findById(tenantId, categoryId);

    if (!category) {
      throw new NotFoundError(`Category with id '${categoryId}'`);
    }

    return this.categoryRepo.update(tenantId, categoryId, input);
  }
}

export class DeleteCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(tenantId: string, categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findById(tenantId, categoryId);

    if (!category) {
      throw new NotFoundError(`Category with id '${categoryId}'`);
    }

    await this.categoryRepo.delete(tenantId, categoryId);
  }
}
