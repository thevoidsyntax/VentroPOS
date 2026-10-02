// Receive Stock (Restock) Use Case
import type { Product, StockLog } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export interface ReceiveStockInput {
  productId: string;
  quantity: number;
  notes?: string;
  referenceNumber?: string;
}

export class ReceiveStockUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: ReceiveStockInput
  ): Promise<{ product: Product; stockLog: StockLog }> {
    const product = await this.productRepo.findById(tenantId, input.productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${input.productId}'`);
    }

    if (!product.isActive) {
      throw new BusinessRuleError('Cannot receive stock for inactive product');
    }

    if (input.quantity <= 0) {
      throw new BusinessRuleError('Quantity must be positive');
    }

    const newQuantity = product.stockQuantity + input.quantity;
    const updatedProduct = await this.productRepo.updateStock(tenantId, input.productId, newQuantity);

    const stockLog = await this.stockLogRepo.create(tenantId, {
      tenantId,
      productId: input.productId,
      type: 'restock',
      quantity: input.quantity,
      balanceAfter: newQuantity,
      referenceType: 'manual',
      notes: input.notes,
      userId,
    });

    return { product: updatedProduct, stockLog };
  }
}
