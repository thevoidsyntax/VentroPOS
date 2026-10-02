// Order Repository - PostgreSQL Implementation

import type { IOrderRepository, OrderFilters } from '../../../domain/repositories/index.js';
import type { Order } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';
import { DatabaseError } from '../../../shared/errors/index.js';

export class PostgresOrderRepository extends BaseRepository implements IOrderRepository {
  async create(tenantId: string, data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return this.transaction(async (client) => {
      const orderResult = await client.query<Order>(
        `INSERT INTO orders (tenant_id, table_id, user_id, order_number, status, subtotal, tax_amount, discount_amount, total_amount, notes, customer_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [tenantId, data.tableId, data.userId, data.orderNumber, data.status, data.subtotal, data.taxAmount, data.discountAmount, data.totalAmount, data.notes, data.customerName]
      );

      const order = orderResult.rows[0];

      if (data.items.length > 0) {
        const itemValues: string[] = [];
        const itemParams: unknown[] = [];
        let paramIndex = 1;

        for (const item of data.items) {
          itemValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          itemParams.push(order.id, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.notes ?? null);
        }

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, notes)
           VALUES ${itemValues.join(', ')}`,
          itemParams
        );

        const itemRows = await client.query<{ id: string; sort_order: number }>(
          `SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as sort_order FROM order_items WHERE order_id = $1`,
          [order.id]
        );

        const modifierValues: string[] = [];
        const modifierParams: unknown[] = [];
        let modParamIndex = 1;

        for (const item of data.items) {
          const itemRow = itemRows.rows.find(r => r.sort_order === data.items.indexOf(item) + 1);
          if (!itemRow || !item.modifiers?.length) continue;

          for (const modifier of item.modifiers) {
            modifierValues.push(`($${modParamIndex++}, $${modParamIndex++}, $${modParamIndex++}, $${modParamIndex++})`);
            modifierParams.push(itemRow.id, modifier.modifierId, modifier.modifierName, modifier.priceAdjustment);
          }
        }

        if (modifierValues.length > 0) {
          await client.query(
            `INSERT INTO order_item_modifiers (order_item_id, modifier_id, modifier_name, price_adjustment)
             VALUES ${modifierValues.join(', ')}`,
            modifierParams
          );
        }
      }

      return { ...order, items: data.items };
    });
  }

  async findById(tenantId: string, id: string): Promise<Order | null> {
    const rows = await this.query<Order>('SELECT * FROM orders WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!rows[0]) return null;

    const items = await this.query<{
      id: string;
      order_id: string;
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      notes: string | null;
      modifier_id: string | null;
      modifier_name: string | null;
      modifier_price_adjustment: number | null;
      modifier_row_id: string | null;
    }>(`
      SELECT
        oi.id, oi.order_id, oi.product_id, oi.product_name, oi.quantity,
        oi.unit_price, oi.total_price, oi.notes,
        oim.id as modifier_row_id, oim.modifier_id, oim.modifier_name, oim.price_adjustment as modifier_price_adjustment
      FROM order_items oi
      LEFT JOIN order_item_modifiers oim ON oi.id = oim.order_item_id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at, oim.created_at
    `, [id]);

    const itemMap = new Map<string, {
      id: string;
      orderId: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
      modifiers: { id: string; modifierId: string; modifierName: string; priceAdjustment: number }[];
    }>();

    for (const row of items) {
      if (!itemMap.has(row.id)) {
        itemMap.set(row.id, {
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          totalPrice: row.total_price,
          notes: row.notes ?? undefined,
          modifiers: [],
        });
      }
      if (row.modifier_row_id) {
        itemMap.get(row.id)!.modifiers.push({
          id: row.modifier_row_id,
          modifierId: row.modifier_id!,
          modifierName: row.modifier_name!,
          priceAdjustment: row.modifier_price_adjustment!,
        });
      }
    }

    return { ...rows[0], items: Array.from(itemMap.values()) };
  }

  async findByOrderNumber(tenantId: string, orderNumber: string): Promise<Order | null> {
    const rows = await this.query<Order>('SELECT * FROM orders WHERE order_number = $1 AND tenant_id = $2', [orderNumber, tenantId]);
    return rows[0] ?? null;
  }

  async findAll(tenantId: string, filters?: OrderFilters): Promise<Order[]> {
    let query = 'SELECT * FROM orders WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.status?.length) {
      query += ` AND status = ANY($${paramIndex++})`;
      params.push(filters.status);
    }
    if (filters?.tableId) {
      query += ` AND table_id = $${paramIndex++}`;
      params.push(filters.tableId);
    }
    if (filters?.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    query += ' ORDER BY created_at DESC';
    return this.query<Order>(query, params);
  }

  async findByTable(tenantId: string, tableId: string): Promise<Order[]> {
    return this.query<Order>(
      'SELECT * FROM orders WHERE table_id = $1 AND tenant_id = $2 AND status NOT IN ($3, $4) ORDER BY created_at DESC',
      [tableId, tenantId, 'paid', 'voided']
    );
  }

  async update(tenantId: string, id: string, data: Partial<Order>): Promise<Order> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }
    if (data.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(data.notes); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Order>(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Order not found');
    return rows[0];
  }

  async updateStatus(tenantId: string, id: string, status: Order['status']): Promise<Order> {
    const rows = await this.query<Order>(
      `UPDATE orders SET status = $1, updated_at = NOW(), paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    if (!rows[0]) throw new DatabaseError('Order not found');
    return rows[0];
  }

  async generateOrderNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rows = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND created_at >= CURRENT_DATE`,
      [tenantId]
    );
    const seq = (parseInt(rows[0]?.count ?? '0') + 1).toString().padStart(4, '0');
    return `ORD-${dateStr}-${seq}`;
  }
}
