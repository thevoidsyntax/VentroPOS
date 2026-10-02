// Stock Log Repository - PostgreSQL Implementation

import type { IStockLogRepository, StockLogFilters } from '../../../domain/repositories/index.js';
import type { StockLog } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';

export class PostgresStockLogRepository extends BaseRepository implements IStockLogRepository {
  async create(tenantId: string, data: Omit<StockLog, 'id' | 'createdAt'>): Promise<StockLog> {
    const rows = await this.query<StockLog>(
      `INSERT INTO stock_logs (tenant_id, product_id, type, quantity, balance_after, reference_type, reference_id, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, data.productId, data.type, data.quantity, data.balanceAfter, data.referenceType, data.referenceId, data.notes, data.userId]
    );
    return rows[0];
  }

  async findByProduct(tenantId: string, productId: string): Promise<StockLog[]> {
    return this.query<StockLog>(
      'SELECT * FROM stock_logs WHERE product_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [productId, tenantId]
    );
  }

  async findAll(tenantId: string, filters?: StockLogFilters): Promise<StockLog[]> {
    let query = 'SELECT * FROM stock_logs WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.productId) {
      query += ` AND product_id = $${paramIndex++}`;
      params.push(filters.productId);
    }
    if (filters?.type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
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
    return this.query<StockLog>(query, params);
  }
}
