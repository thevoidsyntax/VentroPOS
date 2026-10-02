// Complete Stock Opname Use Case
import type { StockOpname } from '../../domain/entities/index.js';
import type { IStockOpnameRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export interface CompleteStockOpnameInput {
  applyAdjustments: boolean;
}

export class CompleteStockOpnameUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    _input: CompleteStockOpnameInput
  ): Promise<StockOpname> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}'`);
    }

    if (opname.status !== 'in_progress') {
      throw new BusinessRuleError('Only in-progress stock opname can be completed');
    }

    return this.stockOpnameRepo.update(tenantId, opnameId, {
      status: 'completed',
      completedAt: new Date(),
    });
  }
}
