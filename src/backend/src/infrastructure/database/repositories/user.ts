// User Repository - PostgreSQL Implementation

import type { IUserRepository } from '../../../domain/repositories/index.js';
import type { User } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError, DuplicateError } from '../../../shared/errors/index.js';

export class PostgresUserRepository extends BaseRepository implements IUserRepository {
  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const rows = await this.query<User>(
        `INSERT INTO users (tenant_id, email, password_hash, name, role, is_active, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [data.tenantId, data.email, data.passwordHash, data.name, data.role, data.isActive, data.lastLoginAt]
      );
      return this.mapRow(rows[0]);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new DuplicateError('User', 'email', data.email);
      }
      throw error;
    }
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    const rows = await this.query<User>(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const query = tenantId === 'system'
      ? 'SELECT * FROM users WHERE email = $1 LIMIT 1'
      : 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2 LIMIT 1';

    const params = tenantId === 'system' ? [email] : [email, tenantId];
    const rows = await this.query<User>(query, params);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(tenantId: string): Promise<User[]> {
    const rows = await this.query<User>(
      'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async update(tenantId: string, id: string, data: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(data.email); }
    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.role !== undefined) { updates.push(`role = $${paramIndex++}`); values.push(data.role); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }
    if (data.lastLoginAt !== undefined) { updates.push(`last_login_at = $${paramIndex++}`); values.push(data.lastLoginAt); }
    if (data.passwordHash !== undefined) { updates.push(`password_hash = $${paramIndex++}`); values.push(data.passwordHash); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('User not found');
    return this.mapRow(rows[0]);
  }

  async deactivate(tenantId: string, id: string): Promise<void> {
    await this.query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }

  private mapRow(row: User): User {
    return {
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role,
      isActive: row.isActive ?? true,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
