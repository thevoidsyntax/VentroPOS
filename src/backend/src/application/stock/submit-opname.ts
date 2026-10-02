// Submit Stock Opname Use Case
import type { StockOpname } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository, IStockOpnameRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export interface SubmitStockOpnameInput {
  applyAdjustments: boolean;
}

export class SubmitStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    opnameId: string,
    input: SubmitStockOpnameInput
  ): Promise<{ opname: StockOpname; adjustments: Array<{ productId: string; oldQty: number; newQty: number }> }> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    if (opname.status === 'completed') {
      throw new BusinessRuleError('Stock opname is already completed');
    }

    if (opname.status === 'cancelled') {
      throw new BusinessRuleError('Stock opname is cancelled');
    }

    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);
    const adjustments: Array<{ productId: string; oldQty: number; newQty: number }> = [];

    if (input.applyAdjustments) {
      for (const item of items) {
        if (item.actualQuantity !== item.systemQuantity) {
          await this.productRepo.updateStock(tenantId, item.productId, item.actualQuantity);

          await this.stockLogRepo.create(tenantId, {
            tenantId,
            productId: item.productId,
            type: 'adjustment',
            quantity: item.variance,
            balanceAfter: item.actualQuantity,
            referenceType: 'stock_opname',
            referenceId: opnameId,
            notes: `Stock opname adjustment: ${item.notes || 'Physical count differs from system'}`,
            userId,
          });

          adjustments.push({
            productId: item.productId,
            oldQty: item.systemQuantity,
            newQty: item.actualQuantity,
          });
        }
      }
    }

    const completedOpname = await this.stockOpnameRepo.update(tenantId, opnameId, {
      status: 'completed',
      completedAt: new Date(),
    });

    return { opname: completedOpname, adjustments };
  }
}
