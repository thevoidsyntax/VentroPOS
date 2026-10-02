// Audit Log Repository - PostgreSQL Implementation

import type { IAuditLogRepository, AuditLogFilters } from '../../../domain/repositories/index.js';
import type { AuditLog } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';

export class PostgresAuditLogRepository extends BaseRepository implements IAuditLogRepository {
  async create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const rows = await this.query<Record<string, unknown>>(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.tenantId,
        data.userId || null,
        data.action,
        data.entityType,
        data.entityId || null,
        data.oldData ? JSON.stringify(data.oldData) : null,
        data.newData ? JSON.stringify(data.newData) : null,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
    return this.mapRow(rows[0]);
  }

  async findByTenant(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.entityType) {
      query += ` AND entity_type = $${paramIndex++}`;
      params.push(filters.entityType);
    }

    if (filters?.entityId) {
      query += ` AND entity_id = $${paramIndex++}`;
      params.push(filters.entityId);
    }

    if (filters?.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters?.action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }

    if (filters?.fromDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters?.toDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const rows = await this.query<Record<string, unknown>>(query, params);
    return rows.map(r => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): AuditLog {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      userId: row.user_id ? String(row.user_id) : undefined,
      action: String(row.action),
      entityType: String(row.entity_type),
      entityId: row.entity_id ? String(row.entity_id) : undefined,
      oldData: row.old_data ? JSON.parse(String(row.old_data)) : undefined,
      newData: row.new_data ? JSON.parse(String(row.new_data)) : undefined,
      ipAddress: row.ip_address ? String(row.ip_address) : undefined,
      userAgent: row.user_agent ? String(row.user_agent) : undefined,
      createdAt: new Date(String(row.created_at)),
    };
  }
}
