// Create Table Use Case
import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';

export interface CreateTableInput {
  tableNumber: string;
  capacity?: number;
  positionX?: number;
  positionY?: number;
}

export class CreateTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, input: CreateTableInput): Promise<Table> {
    return this.tableRepo.create(tenantId, {
      tableNumber: input.tableNumber,
      capacity: input.capacity ?? 4,
      positionX: input.positionX ?? 0,
      positionY: input.positionY ?? 0,
      status: 'available',
    });
  }
}
