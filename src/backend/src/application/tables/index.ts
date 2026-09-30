// Tables Application Service - Table Management Use Cases
/**
 * Table Management Use Cases
 * Handles restaurant table operations for POS system
 *
 * @module application/tables
 * @version 1.0.0
 */

import type { Table } from '../../domain/entities/index.js';
import type { ITableRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

/**
 * Create a new restaurant table
 * @param input - Table creation parameters
 * @returns Created table instance
 */
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

/**
 * Get all tables for a tenant
 * @returns Array of tables
 */
export class GetTablesUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string): Promise<Table[]> {
    return this.tableRepo.findAll(tenantId);
  }
}

/**
 * Get a specific table by ID
 * @param tableId - Table UUID
 * @returns Table instance
 * @throws NotFoundError if table doesn't exist
 */
export class GetTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<Table> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    return table;
  }
}

/**
 * Update table properties
 * @param tableId - Table UUID
 * @param input - Update parameters
 * @returns Updated table
 */
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

    return this.tableRepo.update(tenantId, tableId, {
      tableNumber: input.tableNumber,
      capacity: input.capacity,
      positionX: input.positionX,
      positionY: input.positionY,
      status: input.status,
    });
  }
}

/**
 * Delete a table
 * @param tableId - Table UUID
 * @throws BusinessRuleError if table is occupied
 */
export class DeleteTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<void> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    if (table.status === 'occupied') {
      throw new BusinessRuleError('Cannot delete occupied table');
    }

    await this.tableRepo.delete(tenantId, tableId);
  }
}

/**
 * Mark table as occupied (customer seated)
 * @param tableId - Table UUID
 * @returns Updated table
 */
export class OccupyTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<Table> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    if (table.status === 'occupied') {
      throw new BusinessRuleError('Table is already occupied');
    }

    return this.tableRepo.updateStatus(tenantId, tableId, 'occupied');
  }
}

/**
 * Release table back to available status
 * @param tableId - Table UUID
 * @returns Updated table
 */
export class ReleaseTableUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string, tableId: string): Promise<Table> {
    const table = await this.tableRepo.findById(tenantId, tableId);

    if (!table) {
      throw new NotFoundError(`Table with id '${tableId}'`);
    }

    if (table.status === 'available') {
      throw new BusinessRuleError('Table is already available');
    }

    return this.tableRepo.updateStatus(tenantId, tableId, 'available');
  }
}

/**
 * Get table layout for visual display
 * @returns Tables with position data and grid bounds
 */
export interface TableLayoutItem {
  table: Table;
  gridX: number;
  gridY: number;
}

export class GetTableLayoutUseCase {
  constructor(private tableRepo: ITableRepository) {}

  async execute(tenantId: string): Promise<{
    tables: TableLayoutItem[];
    bounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  }> {
    const tables = await this.tableRepo.findAll(tenantId);

    if (tables.length === 0) {
      return {
        tables: [],
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      };
    }

    const positions = tables.map(t => ({ x: t.positionX, y: t.positionY }));

    return {
      tables: tables.map(table => ({
        table,
        gridX: table.positionX,
        gridY: table.positionY,
      })),
      bounds: {
        minX: Math.min(...positions.map(p => p.x)),
        maxX: Math.max(...positions.map(p => p.x)),
        minY: Math.min(...positions.map(p => p.y)),
        maxY: Math.max(...positions.map(p => p.y)),
      },
    };
  }
}
