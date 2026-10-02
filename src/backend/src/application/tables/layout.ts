// Get Table Layout Use Case
import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';

export interface TableLayoutItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: Table['status'];
  positionX: number;
  positionY: number;
}

export class GetTableLayoutUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string): Promise<TableLayoutItem[]> {
    const tables = await this.tableRepo.findAll(tenantId);

    return tables.map(table => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      positionX: table.positionX,
      positionY: table.positionY,
    }));
  }
}
