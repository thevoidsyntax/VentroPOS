// Cancel Stock Opname Use Case
import type { StockOpname } from '../../domain/entities/index.js';
import type { IStockOpnameRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export class CancelStockOpnameUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(tenantId: string, opnameId: string): Promise<StockOpname> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    if (opname.status === 'completed') {
      throw new BusinessRuleError('Cannot cancel a completed stock opname');
    }

    return this.stockOpnameRepo.update(tenantId, opnameId, {
      status: 'cancelled',
    });
  }
}
