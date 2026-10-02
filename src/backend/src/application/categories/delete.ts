// Delete Category Use Case
import type { ICategoryRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

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
