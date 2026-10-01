// Repository Implementations - PostgreSQL
// Infrastructure Layer: Implements Domain Repository Interfaces

import pg from 'pg';
import type {
  ITenantRepository,
  IUserRepository,
  ICategoryRepository,
  IProductRepository,
  ITableRepository,
  IOrderRepository,
  ITransactionRepository,
  IStockLogRepository,
  ProductFilters,
  OrderFilters,
  TransactionFilters,
} from '../../../domain/repositories/index.js';
import type {
  Tenant,
  User,
  Category,
  Product,
  Table,
  Order,
  OrderItem,
  Transaction,
  StockLog,
} from '../../../domain/entities/index.js';
import { DatabaseError, DuplicateError } from '../../../shared/errors/index.js';

// ============== BASE REPOSITORY ==============
abstract class BaseRepository {
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
}

// ============== TENANT REPOSITORY ==============
export class PostgresTenantRepository extends BaseRepository implements ITenantRepository {
  async create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const rows = await this.query<Tenant>(
      `INSERT INTO tenants (name, domain, settings, plan, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.domain, JSON.stringify(data.settings), data.plan, data.isActive]
    );
    return this.mapRow(rows[0]);
  }

  async findById(id: string): Promise<Tenant | null> {
    const rows = await this.query<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const rows = await this.query<Tenant>('SELECT * FROM tenants WHERE domain = $1', [domain]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.domain !== undefined) { updates.push(`domain = $${paramIndex++}`); values.push(data.domain); }
    if (data.settings !== undefined) { updates.push(`settings = $${paramIndex++}`); values.push(JSON.stringify(data.settings)); }
    if (data.plan !== undefined) { updates.push(`plan = $${paramIndex++}`); values.push(data.plan); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const rows = await this.query<Tenant>(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!rows[0]) throw new DatabaseError('Tenant not found');
    return this.mapRow(rows[0]);
  }

  private mapRow(row: Tenant): Tenant {
    return {
      ...row,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      isActive: row.isActive ?? true,
    };
  }
}

// ============== USER REPOSITORY ==============
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
    // For global search, use 'system' as tenantId placeholder
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

// ============== PRODUCT REPOSITORY ==============
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

// Placeholder for other repositories - will be implemented in full
export class PostgresCategoryRepository extends BaseRepository implements ICategoryRepository {
  async create(tenantId: string, data: Omit<Category, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const rows = await this.query<Category>(
      `INSERT INTO categories (tenant_id, name, description, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.name, data.description, data.parentId, data.sortOrder, data.isActive]
    );
    return rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Category | null> {
    const rows = await this.query<Category>('SELECT * FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ?? null;
  }

  async findAll(tenantId: string): Promise<Category[]> {
    return this.query<Category>('SELECT * FROM categories WHERE tenant_id = $1 ORDER BY sort_order ASC, name ASC', [tenantId]);
  }

  async update(tenantId: string, id: string, data: Partial<Category>): Promise<Category> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.parentId !== undefined) { updates.push(`parent_id = $${paramIndex++}`); values.push(data.parentId); }
    if (data.sortOrder !== undefined) { updates.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Category>(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    return rows[0];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}

export class PostgresTableRepository extends BaseRepository implements ITableRepository {
  async create(tenantId: string, data: Omit<Table, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    const rows = await this.query<Table>(
      `INSERT INTO tables (tenant_id, table_number, capacity, position_x, position_y, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, data.tableNumber, data.capacity, data.positionX, data.positionY, data.status]
    );
    return rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Table | null> {
    const rows = await this.query<Table>('SELECT * FROM tables WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ?? null;
  }

  async findAll(tenantId: string): Promise<Table[]> {
    return this.query<Table>('SELECT * FROM tables WHERE tenant_id = $1 ORDER BY table_number ASC', [tenantId]);
  }

  async update(tenantId: string, id: string, data: Partial<Table>): Promise<Table> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.tableNumber !== undefined) { updates.push(`table_number = $${paramIndex++}`); values.push(data.tableNumber); }
    if (data.capacity !== undefined) { updates.push(`capacity = $${paramIndex++}`); values.push(data.capacity); }
    if (data.positionX !== undefined) { updates.push(`position_x = $${paramIndex++}`); values.push(data.positionX); }
    if (data.positionY !== undefined) { updates.push(`position_y = $${paramIndex++}`); values.push(data.positionY); }
    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }

    updates.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const rows = await this.query<Table>(
      `UPDATE tables SET ${updates.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    return rows[0];
  }

  async updateStatus(tenantId: string, id: string, status: Table['status']): Promise<Table> {
    const rows = await this.query<Table>(
      `UPDATE tables SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    return rows[0];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.query('DELETE FROM tables WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}

export class PostgresOrderRepository extends BaseRepository implements IOrderRepository {
  async create(tenantId: string, data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const rows = await this.query<Order>(
      `INSERT INTO orders (tenant_id, table_id, user_id, order_number, status, subtotal, tax_amount, discount_amount, total_amount, notes, customer_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, data.tableId, data.userId, data.orderNumber, data.status, data.subtotal, data.taxAmount, data.discountAmount, data.totalAmount, data.notes, data.customerName]
    );

    const order = rows[0];
    // Insert order items
    for (const item of data.items) {
      await this.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.notes]
      );
    }

    return { ...order, items: data.items };
  }

  async findById(tenantId: string, id: string): Promise<Order | null> {
    const rows = await this.query<Order>('SELECT * FROM orders WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!rows[0]) return null;

    const items = await this.query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    return { ...rows[0], items };
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

    return rows[0];
  }

  async updateStatus(tenantId: string, id: string, status: Order['status']): Promise<Order> {
    const rows = await this.query<Order>(
      `UPDATE orders SET status = $1, updated_at = NOW(), paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
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

export class PostgresTransactionRepository extends BaseRepository implements ITransactionRepository {
  async create(tenantId: string, data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const rows = await this.query<Transaction>(
      `INSERT INTO transactions (tenant_id, order_id, amount, change_amount, payment_method, payment_details, reference_number, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.orderId, data.amount, data.changeAmount, data.paymentMethod, JSON.stringify(data.paymentDetails), data.referenceNumber, data.userId]
    );
    return rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Transaction | null> {
    const rows = await this.query<Transaction>('SELECT * FROM transactions WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return rows[0] ?? null;
  }

  async findByOrderId(tenantId: string, orderId: string): Promise<Transaction | null> {
    const rows = await this.query<Transaction>('SELECT * FROM transactions WHERE order_id = $1 AND tenant_id = $2', [orderId, tenantId]);
    return rows[0] ?? null;
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

  async findAll(tenantId: string): Promise<StockLog[]> {
    return this.query<StockLog>('SELECT * FROM stock_logs WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  }
}
