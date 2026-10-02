// Product Repository - PostgreSQL Implementation

import type { IProductRepository, ProductFilters } from '../../../domain/repositories/index.js';
import type { Product } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

export class PostgresProductRepository extends BaseRepository implements IProductRepository {
  async create(tenantId: string, data: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const rows = await this.query<Product>(
      `INSERT INTO products (tenant_id, name, sku, category_id, description, price, cost, stock_quantity, low_stock_threshold, is_active, is_serialized, image_url, modifier_group_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [tenantId, data.name, data.sku, data.categoryId, data.description, data.price, data.cost, data.stockQuantity, data.lowStockThreshold, data.isActive, data.isSerialized, data.imageUrl, JSON.stringify(data.modifierGroupIds)]
    );
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const rows = await this.query<Product>(
      'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIds(tenantId: string, ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rows = await this.query<Product>(
      `SELECT * FROM products WHERE id = ANY($1) AND tenant_id = $2`,
      [ids, tenantId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async findBySku(tenantId: string, sku: string): Promise<Product | null> {
    const rows = await this.query<Product>(
      'SELECT * FROM products WHERE sku = $1 AND tenant_id = $2',
      [sku, tenantId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(tenantId: string, filters?: ProductFilters): Promise<Product[]> {
    let query = 'SELECT * FROM products WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.categoryId) {
      query += ` AND category_id = $${paramIndex++}`;
      params.push(filters.categoryId);
    }
    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }
    if (filters?.lowStock) {
      query += ` AND stock_quantity <= low_stock_threshold`;
    }
    if (filters?.search) {
      query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY name ASC';
    const rows = await this.query<Product>(query, params);
    return rows.map(r => this.mapRow(r));
  }

  async update(tenantId: string, id: string, data: Partial<Product>): Promise<Product> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.sku !== undefined) { updates.push(`sku = $${paramIndex++}`); values.push(data.sku); }
    if (data.categoryId !== undefined) { updates.push(`category_id = $${paramIndex++}`); values.push(data.categoryId); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.price !== undefined) { updates.push(`price = $${paramIndex++}`); values.push(data.price); }
    if (data.cost !== undefined) { updates.push(`cost = $${paramIndex++}`); values.push(data.cost); }
    if (data.lowStockThreshold !== undefined) { updates.push(`low_stock_threshold = $${paramIndex++}`); values.push(data.lowStockThreshold); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }
    if (data.imageUrl !== undefined) { updates.push(`image_url = $${paramIndex++}`); values.push(data.imageUrl); }
    if (data.modifierGroupIds !== undefined) { updates.push(`modifier_group_ids = $${paramIndex++}`); values.push(JSON.stringify(data.modifierGroupIds)); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Product>(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Product not found');
    return this.mapRow(rows[0]);
  }

  async updateStock(tenantId: string, id: string, quantity: number): Promise<Product> {
    const rows = await this.query<Product>(
      `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [quantity, id, tenantId]
    );
    if (!rows[0]) throw new DatabaseError('Product not found');
    return this.mapRow(rows[0]);
  }

  async batchUpdateStock(tenantId: string, updates: Array<{id: string; quantity: number}>): Promise<void> {
    if (updates.length === 0) return;
    const pool = await this.db();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, quantity } of updates) {
        await client.query(
          'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
          [quantity, id, tenantId]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM products WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  private mapRow(row: Product): Product {
    return {
      ...row,
      modifierGroupIds: typeof row.modifierGroupIds === 'string' ? JSON.parse(row.modifierGroupIds) : (row.modifierGroupIds ?? []),
      isActive: row.isActive ?? true,
    };
  }
}
