// Delete Product Use Case
import type { IProductRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string, productId: string): Promise<void> {
    const product = await this.productRepo.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${productId}'`);
    }

    await this.productRepo.delete(tenantId, productId);
  }
}
