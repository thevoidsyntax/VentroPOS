// Modifier Group Repository - PostgreSQL Implementation

import type { IModifierGroupRepository } from '../../../domain/repositories/index.js';
import type { ModifierGroup } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

interface ModifierGroupRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  created_at: Date;
  updated_at: Date;
}

export class PostgresModifierGroupRepository extends BaseRepository implements IModifierGroupRepository {
  async create(tenantId: string, data: Omit<ModifierGroup, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ModifierGroup> {
    const rows = await this.query<ModifierGroupRow>(
      `INSERT INTO modifier_groups (tenant_id, name, type, is_required, min_selections, max_selections)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.name, data.type, data.isRequired, data.minSelections, data.maxSelections]
    );
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<ModifierGroup | null> {
    const rows = await this.query<ModifierGroupRow>('SELECT * FROM modifier_groups WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!rows[0]) return null;
    return this.mapRow(rows[0]);
  }

  async findAll(tenantId: string): Promise<ModifierGroup[]> {
    const rows = await this.query<ModifierGroupRow>(
      'SELECT * FROM modifier_groups WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async update(tenantId: string, id: string, data: Partial<ModifierGroup>): Promise<ModifierGroup> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.type !== undefined) { updates.push(`type = $${paramIndex++}`); values.push(data.type); }
    if (data.isRequired !== undefined) { updates.push(`is_required = $${paramIndex++}`); values.push(data.isRequired); }
    if (data.minSelections !== undefined) { updates.push(`min_selections = $${paramIndex++}`); values.push(data.minSelections); }
    if (data.maxSelections !== undefined) { updates.push(`max_selections = $${paramIndex++}`); values.push(data.maxSelections); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<ModifierGroupRow>(
      `UPDATE modifier_groups SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Modifier group not found');
    return this.mapRow(rows[0]);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM modifier_groups WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  private mapRow(row: ModifierGroupRow): ModifierGroup {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type as ModifierGroup['type'],
      isRequired: row.is_required,
      minSelections: row.min_selections,
      maxSelections: row.max_selections,
      modifiers: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
