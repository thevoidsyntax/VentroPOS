// Category Repository - PostgreSQL Implementation

import type { ICategoryRepository } from '../../../domain/repositories/index.js';
import type { Category } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

export class PostgresCategoryRepository extends BaseRepository implements ICategoryRepository {
  async create(tenantId: string, data: Omit<Category, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const rows = await this.query<Category>(
      `INSERT INTO categories (tenant_id, name, description, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.name, data.description, data.parentId, data.sortOrder, data.isActive]
    );
    return rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Category | null> {
    const rows = await this.query<Category>('SELECT * FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ?? null;
  }

  async findAll(tenantId: string): Promise<Category[]> {
    return this.query<Category>(
      'SELECT * FROM categories WHERE tenant_id = $1 ORDER BY sort_order ASC, name ASC',
      [tenantId]
    );
  }

  async update(tenantId: string, id: string, data: Partial<Category>): Promise<Category> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.parentId !== undefined) { updates.push(`parent_id = $${paramIndex++}`); values.push(data.parentId); }
    if (data.sortOrder !== undefined) { updates.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Category>(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Category not found');
    return rows[0];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}
