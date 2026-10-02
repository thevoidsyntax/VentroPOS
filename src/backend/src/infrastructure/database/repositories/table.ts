// Table Repository - PostgreSQL Implementation

import type { ITableRepository } from '../../../domain/repositories/index.js';
import type { Table } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

export class PostgresTableRepository extends BaseRepository implements ITableRepository {
  async create(tenantId: string, data: Omit<Table, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    const rows = await this.query<Table>(
      `INSERT INTO restaurant_tables (tenant_id, table_number, capacity, position_x, position_y, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.tableNumber, data.capacity, data.positionX, data.positionY, data.status]
    );
    return rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Table | null> {
    const rows = await this.query<Table>('SELECT * FROM restaurant_tables WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ?? null;
  }

  async findAll(tenantId: string): Promise<Table[]> {
    return this.query<Table>(
      'SELECT * FROM restaurant_tables WHERE tenant_id = $1 ORDER BY table_number ASC',
      [tenantId]
    );
  }

  async update(tenantId: string, id: string, data: Partial<Table>): Promise<Table> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.tableNumber !== undefined) { updates.push(`table_number = $${paramIndex++}`); values.push(data.tableNumber); }
    if (data.capacity !== undefined) { updates.push(`capacity = $${paramIndex++}`); values.push(data.capacity); }
    if (data.positionX !== undefined) { updates.push(`position_x = $${paramIndex++}`); values.push(data.positionX); }
    if (data.positionY !== undefined) { updates.push(`position_y = $${paramIndex++}`); values.push(data.positionY); }
    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Table>(
      `UPDATE restaurant_tables SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    return rows[0];
  }

  async updateStatus(tenantId: string, id: string, status: Table['status']): Promise<Table> {
    const rows = await this.query<Table>(
      `UPDATE restaurant_tables SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    if (!rows[0]) throw new DatabaseError('Table not found');
    return rows[0];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM restaurant_tables WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}
