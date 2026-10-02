// Idempotency Key Repository - PostgreSQL Implementation

import type { IIdempotencyKeyRepository, IdempotencyKey } from '../../../domain/repositories/index.js';
import { BaseRepository } from './base.js';

interface IdempotencyKeyRow {
  id: string;
  tenant_id: string;
  key_hash: string;
  order_id: string | null;
  response: string | null;
  created_at: Date;
  expires_at: Date;
}

export class PostgresIdempotencyKeyRepository extends BaseRepository implements IIdempotencyKeyRepository {
  private readonly TTL_HOURS = 24;

  async checkAndLock(tenantId: string, keyHash: string): Promise<IdempotencyKey | null> {
    const rows = await this.query<IdempotencyKeyRow>(
      `SELECT * FROM idempotency_keys
       WHERE tenant_id = $1 AND key_hash = $2 AND expires_at > NOW()`,
      [tenantId, keyHash]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      keyHash: row.key_hash,
      orderId: row.order_id ?? undefined,
      response: row.response ? JSON.parse(row.response) : undefined,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async storeResponse(tenantId: string, keyHash: string, orderId: string, response: unknown): Promise<void> {
    const expiresAt = new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000);

    await this.query(
      `INSERT INTO idempotency_keys (tenant_id, key_hash, order_id, response, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, key_hash) DO UPDATE
       SET order_id = $3, response = $4, expires_at = $5`,
      [tenantId, keyHash, orderId, JSON.stringify(response), expiresAt]
    );
  }

  async cleanupExpired(): Promise<void> {
    await this.query('DELETE FROM idempotency_keys WHERE expires_at < NOW()');
  }
}
