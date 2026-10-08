// Base Repository - Shared database utilities
import type pg from 'pg';

export abstract class BaseRepository {
  protected db = () => import('../../../infrastructure/database/postgres/index.js').then(m => m.getDb());

  protected async query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
    const pool = await this.db();
    const result = await pool.query<T>(text, params);
    return result.rows;
  }

  protected async queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  }

  protected async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const pool = await this.db();
    const client = await pool.connect();
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
}
