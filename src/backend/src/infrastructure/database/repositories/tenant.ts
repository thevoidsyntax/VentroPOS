// Tenant Repository - PostgreSQL Implementation

import type { ITenantRepository } from '../../../domain/repositories/index.js';
import type { Tenant } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

export class PostgresTenantRepository extends BaseRepository implements ITenantRepository {
  async create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const rows = await this.query<Tenant>(
      `INSERT INTO tenants (name, domain, settings, plan, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.domain, JSON.stringify(data.settings), data.plan, data.isActive]
    );
    return this.mapRow(rows[0]);
  }

  async findById(id: string): Promise<Tenant | null> {
    const rows = await this.query<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const rows = await this.query<Tenant>('SELECT * FROM tenants WHERE domain = $1', [domain]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.domain !== undefined) { updates.push(`domain = $${paramIndex++}`); values.push(data.domain); }
    if (data.settings !== undefined) { updates.push(`settings = $${paramIndex++}`); values.push(JSON.stringify(data.settings)); }
    if (data.plan !== undefined) { updates.push(`plan = $${paramIndex++}`); values.push(data.plan); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const rows = await this.query<Tenant>(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Tenant not found');
    return this.mapRow(rows[0]);
  }

  private mapRow(row: Tenant): Tenant {
    return {
      ...row,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      isActive: row.isActive ?? true,
    };
  }
}
