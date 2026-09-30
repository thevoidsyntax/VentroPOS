// PostgreSQL Connection - Infrastructure Layer
// Handles connection pool, RLS context, and migrations

import pg from 'pg';
import { config } from '../../shared/config/index.js';

const { Pool } = pg;

export class PostgresConnection {
  private pool: pg.Pool;
  private static instance: PostgresConnection;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  static getInstance(): PostgresConnection {
    if (!PostgresConnection.instance) {
      PostgresConnection.instance = new PostgresConnection();
    }
    return PostgresConnection.instance;
  }

  getPool(): pg.Pool {
    return this.pool;
  }

  // Set tenant context for RLS
  async setTenantContext(tenantId: string): Promise<void> {
    const client = this.pool.connect();
    await (await client).query(`SET LOCAL app.tenant_id = '${tenantId}'`);
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async getClient(): Promise<pg.PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Helper to get connection
export const getDb = () => PostgresConnection.getInstance().getPool();
export const getClient = () => PostgresConnection.getInstance().getClient();
export const dbTransaction = <T>(callback: (client: pg.PoolClient) => Promise<T>) =>
  PostgresConnection.getInstance().transaction(callback);
