// Adjust Stock (Manual Correction) Use Case
import type { Product, StockLog } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export interface AdjustStockInput {
  productId: string;
  newQuantity: number;
  reason: string;
  referenceNumber?: string;
}

export class AdjustStockUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: AdjustStockInput
  ): Promise<{ product: Product; stockLog: StockLog }> {
    const product = await this.productRepo.findById(tenantId, input.productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${input.productId}'`);
    }

    if (!product.isActive) {
      throw new BusinessRuleError('Cannot adjust stock for inactive product');
    }

    if (input.newQuantity < 0) {
      throw new BusinessRuleError('Stock quantity cannot be negative');
    }

    const adjustment = input.newQuantity - product.stockQuantity;
    const updatedProduct = await this.productRepo.updateStock(tenantId, input.productId, input.newQuantity);

    const stockLog = await this.stockLogRepo.create(tenantId, {
      tenantId,
      productId: input.productId,
      type: 'adjustment',
      quantity: adjustment,
      balanceAfter: input.newQuantity,
      referenceType: 'manual',
      notes: input.reason,
      userId,
    });

    return { product: updatedProduct, stockLog };
  }
}
