// Release Table Use Case
import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class ReleaseTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<Table> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    return this.tableRepo.updateStatus(tenantId, tableId, 'available');
  }
}
