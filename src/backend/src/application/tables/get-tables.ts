// Get Tables Use Case
import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';

export class GetTablesUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string): Promise<Table[]> {
    return this.tableRepo.findAll(tenantId);
  }
}
