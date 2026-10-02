// Update Table Use Case
import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export interface UpdateTableInput {
  tableNumber?: string;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  status?: Table['status'];
}

export class UpdateTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string, input: UpdateTableInput): Promise<Table> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    if (input.tableNumber && table.status === 'occupied') {
      throw new BusinessRuleError('Cannot change number of occupied table');
    }

    return this.tableRepo.update(tenantId, tableId, input);
  }
}
