// Modifier Repository - PostgreSQL Implementation

import type { IModifierRepository } from '../../../domain/repositories/index.js';
import type { Modifier } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

interface ModifierRow {
  id: string;
  group_id: string;
  tenant_id: string;
  name: string;
  price_adjustment: number;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export class PostgresModifierRepository extends BaseRepository implements IModifierRepository {
  async create(tenantId: string, groupId: string, data: Omit<Modifier, 'id' | 'groupId' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Modifier> {
    const rows = await this.query<ModifierRow>(
      `INSERT INTO modifiers (group_id, tenant_id, name, price_adjustment, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [groupId, tenantId, data.name, data.priceAdjustment, data.isActive, data.sortOrder]
    );
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Modifier | null> {
    const rows = await this.query<ModifierRow>('SELECT * FROM modifiers WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByGroup(tenantId: string, groupId: string): Promise<Modifier[]> {
    const rows = await this.query<ModifierRow>(
      'SELECT * FROM modifiers WHERE group_id = $1 AND tenant_id = $2 ORDER BY sort_order ASC, name ASC',
      [groupId, tenantId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async update(tenantId: string, id: string, data: Partial<Modifier>): Promise<Modifier> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.priceAdjustment !== undefined) { updates.push(`price_adjustment = $${paramIndex++}`); values.push(data.priceAdjustment); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }
    if (data.sortOrder !== undefined) { updates.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<ModifierRow>(
      `UPDATE modifiers SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Modifier not found');
    return this.mapRow(rows[0]);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM modifiers WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  private mapRow(row: ModifierRow): Modifier {
    return {
      id: row.id,
      groupId: row.group_id,
      tenantId: row.tenant_id,
      name: row.name,
      priceAdjustment: row.price_adjustment,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
