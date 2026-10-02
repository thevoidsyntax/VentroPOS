// Get Product Use Case
import type { Product } from '../../domain/entities/index.js';
import type { IProductRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

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
