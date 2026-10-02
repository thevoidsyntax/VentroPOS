// Get Categories Use Case
import type { Category } from '../../domain/entities/index.js';
import type { ICategoryRepository } from '../../domain/repositories/index.js';

export class GetCategoriesUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.findAll(tenantId);
  }
}
