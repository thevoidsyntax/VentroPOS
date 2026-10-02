// Transaction Repository - PostgreSQL Implementation

import type { ITransactionRepository, TransactionFilters } from '../../../domain/repositories/index.js';
import type { Transaction, PaymentMethod } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';

export class PostgresTransactionRepository extends BaseRepository implements ITransactionRepository {
  async create(tenantId: string, data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    return this.transaction(async (client) => {
      const rows = await client.query<{
        id: string;
        tenant_id: string;
        order_id: string;
        amount: number;
        change_amount: number;
        payment_method: string;
        payment_details: string;
        reference_number: string | null;
        user_id: string;
        created_at: Date;
      }>(
        `INSERT INTO transactions (tenant_id, order_id, amount, change_amount, payment_method, payment_details, reference_number, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, tenant_id, order_id, amount, change_amount, payment_method, payment_details, reference_number, user_id, created_at`,
        [tenantId, data.orderId, data.amount, data.changeAmount, data.paymentMethod, JSON.stringify(data.paymentDetails), data.referenceNumber, data.userId]
      );

      const transactionId = rows.rows[0].id;

      if (data.splits && data.splits.length > 0) {
        const splitValues: string[] = [];
        const splitParams: unknown[] = [];
        let paramIndex = 1;

        for (const split of data.splits) {
          splitValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          splitParams.push(transactionId, split.paymentMethod, split.amount, split.referenceNumber);
        }

        await client.query(
          `INSERT INTO transaction_splits (transaction_id, payment_method, amount, reference_number)
           VALUES ${splitValues.join(', ')}`,
          splitParams
        );
      }

      return {
        id: rows.rows[0].id,
        tenantId: rows.rows[0].tenant_id,
        orderId: rows.rows[0].order_id,
        amount: rows.rows[0].amount,
        changeAmount: rows.rows[0].change_amount,
        paymentMethod: rows.rows[0].payment_method as PaymentMethod,
        paymentDetails: JSON.parse(rows.rows[0].payment_details),
        referenceNumber: rows.rows[0].reference_number ?? undefined,
        userId: rows.rows[0].user_id,
        splits: data.splits,
        createdAt: rows.rows[0].created_at,
      };
    });
  }

  async findById(tenantId: string, id: string): Promise<Transaction | null> {
    const rows = await this.query<{
      id: string;
      tenant_id: string;
      order_id: string;
      amount: number;
      change_amount: number;
      payment_method: string;
      payment_details: string;
      reference_number: string | null;
      user_id: string;
      created_at: Date;
      split_id: string | null;
      split_payment_method: string | null;
      split_amount: number | null;
      split_reference_number: string | null;
    }>(
      `SELECT
        t.id, t.tenant_id, t.order_id, t.amount, t.change_amount, t.payment_method,
        t.payment_details, t.reference_number, t.user_id, t.created_at,
        s.id as split_id, s.payment_method as split_payment_method,
        s.amount as split_amount, s.reference_number as split_reference_number
       FROM transactions t
       LEFT JOIN transaction_splits s ON s.transaction_id = t.id
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [id, tenantId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    const splits: Transaction['splits'] = [];

    for (const r of rows) {
      if (r.split_id) {
        splits.push({
          id: r.split_id,
          transactionId: id,
          paymentMethod: r.split_payment_method as PaymentMethod,
          amount: r.split_amount!,
          referenceNumber: r.split_reference_number ?? undefined,
        });
      }
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      orderId: row.order_id,
      amount: row.amount,
      changeAmount: row.change_amount,
      paymentMethod: row.payment_method as PaymentMethod,
      paymentDetails: JSON.parse(row.payment_details),
      referenceNumber: row.reference_number ?? undefined,
      userId: row.user_id,
      splits,
      createdAt: row.created_at,
    };
  }

  async findByOrderId(tenantId: string, orderId: string): Promise<Transaction | null> {
    const rows = await this.query<{
      id: string;
      tenant_id: string;
      order_id: string;
      amount: number;
      change_amount: number;
      payment_method: string;
      payment_details: string;
      reference_number: string | null;
      user_id: string;
      created_at: Date;
      split_id: string | null;
      split_payment_method: string | null;
      split_amount: number | null;
      split_reference_number: string | null;
    }>(
      `SELECT
        t.id, t.tenant_id, t.order_id, t.amount, t.change_amount, t.payment_method,
        t.payment_details, t.reference_number, t.user_id, t.created_at,
        s.id as split_id, s.payment_method as split_payment_method,
        s.amount as split_amount, s.reference_number as split_reference_number
       FROM transactions t
       LEFT JOIN transaction_splits s ON s.transaction_id = t.id
       WHERE t.order_id = $1 AND t.tenant_id = $2`,
      [orderId, tenantId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    const splits: Transaction['splits'] = [];

    for (const r of rows) {
      if (r.split_id) {
        splits.push({
          id: r.split_id,
          transactionId: row.id,
          paymentMethod: r.split_payment_method as PaymentMethod,
          amount: r.split_amount!,
          referenceNumber: r.split_reference_number ?? undefined,
        });
      }
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      orderId: row.order_id,
      amount: row.amount,
      changeAmount: row.change_amount,
      paymentMethod: row.payment_method as PaymentMethod,
      paymentDetails: JSON.parse(row.payment_details),
      referenceNumber: row.reference_number ?? undefined,
      userId: row.user_id,
      splits,
      createdAt: row.created_at,
    };
  }

  async findAll(tenantId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.fromDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }
    if (filters?.paymentMethod) {
      query += ` AND payment_method = $${paramIndex++}`;
      params.push(filters.paymentMethod);
    }

    query += ' ORDER BY created_at DESC';
    return this.query<Transaction>(query, params);
  }
}
