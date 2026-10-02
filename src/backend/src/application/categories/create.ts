// Create Category Use Case
import type { Category } from '../../domain/entities/index.js';
import type { ICategoryRepository } from '../../domain/repositories/index.js';

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
