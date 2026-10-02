// Delete Table Use Case
import type { ITableRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

export class DeleteTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<void> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    if (table.status === 'occupied') {
      throw new BusinessRuleError('Cannot delete an occupied table');
    }

    await this.tableRepo.delete(tenantId, tableId);
  }
}
