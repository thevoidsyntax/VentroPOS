// Stock Opname Repository - PostgreSQL Implementation

import type { IStockOpnameRepository, StockOpnameFilters } from '../../../domain/repositories/index.js';
import type { StockOpname, StockOpnameItem } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

interface StockOpnameRow {
  id: string;
  tenant_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  created_at: Date;
  completed_at: Date | null;
}

interface StockOpnameItemRow {
  id: string;
  opname_id: string;
  product_id: string;
  system_quantity: number;
  actual_quantity: number;
  variance: number;
  notes: string | null;
}

export class PostgresStockOpnameRepository extends BaseRepository implements IStockOpnameRepository {
  async create(tenantId: string, data: Omit<StockOpname, 'id' | 'createdAt'>): Promise<StockOpname> {
    const rows = await this.query<StockOpnameRow>(
      `INSERT INTO stock_opnames (tenant_id, user_id, status, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenantId, data.userId, data.status, data.notes]
    );

    return this.mapRow(rows[0]);
  }

  async createItem(_tenantId: string, data: Omit<StockOpnameItem, 'id'>): Promise<StockOpnameItem> {
    const variance = data.actualQuantity - data.systemQuantity;
    const rows = await this.query<StockOpnameItemRow>(
      `INSERT INTO stock_opname_items (opname_id, product_id, system_quantity, actual_quantity, variance, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.opnameId, data.productId, data.systemQuantity, data.actualQuantity, variance, data.notes]
    );

    return this.mapItemRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<StockOpname | null> {
    const rows = await this.query<StockOpnameRow>(
      'SELECT * FROM stock_opnames WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!rows[0]) return null;
    return this.mapRow(rows[0]);
  }

  async findAll(tenantId: string, filters?: StockOpnameFilters): Promise<StockOpname[]> {
    let query = 'SELECT * FROM stock_opnames WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.fromDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ' ORDER BY created_at DESC';
    const rows = await this.query<StockOpnameRow>(query, params);

    return rows.map(r => this.mapRow(r));
  }

  async update(tenantId: string, id: string, data: Partial<StockOpname>): Promise<StockOpname> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }
    if (data.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(data.notes); }
    if (data.completedAt !== undefined) { updates.push(`completed_at = $${paramIndex++}`); values.push(data.completedAt); }

    values.push(id, tenantId);

    const rows = await this.query<StockOpnameRow>(
      `UPDATE stock_opnames SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Stock opname not found');
    return this.mapRow(rows[0]);
  }

  async updateItem(_tenantId: string, id: string, data: Partial<StockOpnameItem>): Promise<StockOpnameItem> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.actualQuantity !== undefined) { updates.push(`actual_quantity = $${paramIndex++}`); values.push(data.actualQuantity); }
    if (data.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(data.notes); }
    if (data.variance !== undefined) { updates.push(`variance = $${paramIndex++}`); values.push(data.variance); }

    values.push(id);

    const rows = await this.query<StockOpnameItemRow>(
      `UPDATE stock_opname_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Stock opname item not found');
    return this.mapItemRow(rows[0]);
  }

  async getItems(tenantId: string, opnameId: string): Promise<StockOpnameItem[]> {
    const rows = await this.query<StockOpnameItemRow>(
      `SELECT soi.* FROM stock_opname_items soi
       JOIN stock_opnames so ON soi.opname_id = so.id
       WHERE soi.opname_id = $1 AND so.tenant_id = $2
       ORDER BY soi.id`,
      [opnameId, tenantId]
    );

    return rows.map(r => this.mapItemRow(r));
  }

  async updateItemBatch(
    _tenantId: string,
    opnameId: string,
    items: Array<{ productId: string; actualQuantity: number; notes?: string }>
  ): Promise<StockOpnameItem[]> {
    if (items.length === 0) return [];

    // Optimized: Single query using UNNEST to fetch all system quantities at once
    const productIds = items.map(i => i.productId);
    const existing = await this.query<{ product_id: string; system_quantity: number }>(
      `SELECT product_id, system_quantity FROM stock_opname_items WHERE opname_id = $1 AND product_id = ANY($2)`,
      [opnameId, productIds]
    );

    // Build a map of product_id -> system_quantity
    const systemQtyMap = new Map(existing.map(r => [r.product_id, r.system_quantity ?? 0]));

    // Build the batch UPDATE query using UNNEST
    const productIdList = items.map(i => i.productId);
    const actualQtyList = items.map(i => i.actualQuantity);
    const notesList = items.map(i => i.notes ?? null);
    const varianceList = items.map(i => {
      const sysQty = systemQtyMap.get(i.productId) ?? 0;
      return i.actualQuantity - sysQty;
    });

    const rows = await this.query<StockOpnameItemRow>(
      `UPDATE stock_opname_items AS soi
       SET actual_quantity = u.actual_qty,
           variance = u.variance,
           notes = u.notes
       FROM UNNEST($1::uuid[], $2::numeric[], $3::numeric[], $4::text[]) AS u(product_id, actual_qty, variance, notes)
       WHERE soi.opname_id = $5 AND soi.product_id = u.product_id
       RETURNING *`,
      [productIdList, actualQtyList, varianceList, notesList, opnameId]
    );

    return rows.map(r => this.mapItemRow(r));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM stock_opnames WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  private mapRow(row: StockOpnameRow): StockOpname {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      status: row.status as StockOpname['status'],
      items: [],
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined,
    };
  }

  private mapItemRow(row: StockOpnameItemRow): StockOpnameItem {
    return {
      id: row.id,
      opnameId: row.opname_id,
      productId: row.product_id,
      systemQuantity: row.system_quantity,
      actualQuantity: row.actual_quantity,
      variance: row.variance,
      notes: row.notes ?? undefined,
    };
  }
}
