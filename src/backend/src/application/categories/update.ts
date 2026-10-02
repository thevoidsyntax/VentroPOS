// Update Category Use Case
import type { Category } from '../../domain/entities/index.js';
import type { ICategoryRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

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
