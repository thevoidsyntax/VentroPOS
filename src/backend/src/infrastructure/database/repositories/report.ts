// Report Repository - PostgreSQL Implementation
// Analytics and reporting queries

import type {
  IReportRepository,
  SalesMetrics,
  PaymentMethodBreakdown,
  HourlySales,
  ProductSalesData,
  StaffSalesData,
  CategorySalesData
} from '../../../domain/repositories/report.js';
import type { ReportFilters } from '../../../domain/entities/report.js';
import { BaseRepository } from './base.js';

export class PostgresReportRepository extends BaseRepository implements IReportRepository {

  async getSalesMetrics(tenantId: string, filters: ReportFilters): Promise<SalesMetrics> {
    const rows = await this.query<{
      total_revenue: string;
      gross_revenue: string;
      total_discount: string;
      total_tax: string;
      transaction_count: string;
      total_items_sold: string;
    }>(`
      SELECT
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COALESCE(SUM(o.total_amount), 0) as gross_revenue,
        COALESCE(SUM(o.discount_amount), 0) as total_discount,
        COALESCE(SUM(o.tax_amount), 0) as total_tax,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(oi.quantity), 0) as total_items_sold
      FROM transactions t
      JOIN orders o ON t.order_id = o.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE t.tenant_id = $1
        AND t.created_at >= $2
        AND t.created_at < $3
        AND o.status NOT IN ('voided')
    `, [tenantId, filters.fromDate, filters.toDate]);

    const row = rows[0] ?? {
      total_revenue: '0',
      gross_revenue: '0',
      total_discount: '0',
      total_tax: '0',
      transaction_count: '0',
      total_items_sold: '0'
    };

    return {
      totalRevenue: parseFloat(row.total_revenue),
      grossRevenue: parseFloat(row.gross_revenue),
      totalDiscount: parseFloat(row.total_discount),
      totalTax: parseFloat(row.total_tax),
      transactionCount: parseInt(row.transaction_count, 10),
      totalItemsSold: parseInt(row.total_items_sold, 10)
    };
  }

  async getPaymentMethodBreakdown(tenantId: string, filters: ReportFilters): Promise<PaymentMethodBreakdown[]> {
    const rows = await this.query<{
      payment_method: string;
      count: string;
      amount: string;
    }>(`
      SELECT
        t.payment_method,
        COUNT(*) as count,
        COALESCE(SUM(t.amount), 0) as amount
      FROM transactions t
      JOIN orders o ON t.order_id = o.id
      WHERE t.tenant_id = $1
        AND t.created_at >= $2
        AND t.created_at < $3
        AND o.status NOT IN ('voided')
      GROUP BY t.payment_method
      ORDER BY amount DESC
    `, [tenantId, filters.fromDate, filters.toDate]);

    return rows.map(row => ({
      method: row.payment_method,
      count: parseInt(row.count, 10),
      amount: parseFloat(row.amount)
    }));
  }

  async getHourlySales(tenantId: string, filters: ReportFilters): Promise<HourlySales[]> {
    const rows = await this.query<{
      hour: string;
      count: string;
      amount: string;
    }>(`
      SELECT
        EXTRACT(HOUR FROM t.created_at) as hour,
        COUNT(DISTINCT t.id) as count,
        COALESCE(SUM(t.amount), 0) as amount
      FROM transactions t
      JOIN orders o ON t.order_id = o.id
      WHERE t.tenant_id = $1
        AND t.created_at >= $2
        AND t.created_at < $3
        AND o.status NOT IN ('voided')
      GROUP BY EXTRACT(HOUR FROM t.created_at)
      ORDER BY hour
    `, [tenantId, filters.fromDate, filters.toDate]);

    return rows.map(row => ({
      hour: parseInt(row.hour, 10),
      count: parseInt(row.count, 10),
      amount: parseFloat(row.amount)
    }));
  }

  async getPreviousPeriodRevenue(tenantId: string, filters: ReportFilters): Promise<number> {
    const periodMs = filters.toDate.getTime() - filters.fromDate.getTime();
    const prevToDate = new Date(filters.fromDate.getTime() - 1);
    const prevFromDate = new Date(prevToDate.getTime() - periodMs);

    const rows = await this.query<{ total: string }>(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN orders o ON t.order_id = o.id
      WHERE t.tenant_id = $1
        AND t.created_at >= $2
        AND t.created_at < $3
        AND o.status NOT IN ('voided')
    `, [tenantId, prevFromDate, prevToDate]);

    return parseFloat(rows[0]?.total ?? '0');
  }

  async getProductSales(tenantId: string, filters: ReportFilters, limit = 50): Promise<ProductSalesData[]> {
    const rows = await this.query<{
      product_id: string;
      product_name: string;
      category_id: string | null;
      category_name: string | null;
      quantity_sold: string;
      revenue: string;
    }>(`
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.category_id,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as quantity_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN transactions t ON o.id = t.order_id
      WHERE p.tenant_id = $1
        AND (t.created_at >= $2 AND t.created_at < $3 OR t.id IS NULL)
        AND o.status NOT IN ('voided')
        AND p.is_active = true
      GROUP BY p.id, p.name, p.category_id, c.name
      HAVING COALESCE(SUM(oi.quantity), 0) > 0
      ORDER BY revenue DESC
      LIMIT $4
    `, [tenantId, filters.fromDate, filters.toDate, limit]);

    return rows.map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      quantitySold: parseInt(row.quantity_sold, 10),
      revenue: parseFloat(row.revenue)
    }));
  }

  async getProductSalesTotal(tenantId: string, filters: ReportFilters): Promise<{ quantity: number; revenue: number }> {
    const rows = await this.query<{ quantity: string; revenue: string }>(`
      SELECT
        COALESCE(SUM(oi.quantity), 0) as quantity,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN transactions t ON o.id = t.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.tenant_id = $1
        AND t.created_at >= $2
        AND t.created_at < $3
        AND o.status NOT IN ('voided')
    `, [tenantId, filters.fromDate, filters.toDate]);

    const row = rows[0] ?? { quantity: '0', revenue: '0' };
    return {
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue)
    };
  }

  async getStaffSales(tenantId: string, filters: ReportFilters): Promise<StaffSalesData[]> {
    const rows = await this.query<{
      user_id: string;
      user_name: string;
      role: string;
      transaction_count: string;
      total_sales: string;
    }>(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.role,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_sales
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE u.tenant_id = $1
        AND (t.created_at >= $2 AND t.created_at < $3 OR t.id IS NULL)
        AND o.status NOT IN ('voided')
        AND u.role IN ('owner', 'manager', 'kasir')
      GROUP BY u.id, u.name, u.role
      HAVING COUNT(DISTINCT t.id) > 0
      ORDER BY total_sales DESC
    `, [tenantId, filters.fromDate, filters.toDate]);

    return rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      role: row.role,
      transactionCount: parseInt(row.transaction_count, 10),
      totalSales: parseFloat(row.total_sales)
    }));
  }

  async getCategorySales(tenantId: string, filters: ReportFilters): Promise<CategorySalesData[]> {
    const rows = await this.query<{
      category_id: string;
      category_name: string;
      parent_id: string | null;
      quantity_sold: string;
      revenue: string;
      order_count: string;
    }>(`
      SELECT
        COALESCE(c.id, 'uncategorized') as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        c.parent_id,
        COALESCE(SUM(oi.quantity), 0) as quantity_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN transactions t ON o.id = t.order_id
      WHERE c.tenant_id = $1
        AND (t.created_at >= $2 AND t.created_at < $3 OR t.id IS NULL)
        AND o.status NOT IN ('voided')
      GROUP BY c.id, c.name, c.parent_id
      HAVING COALESCE(SUM(oi.quantity), 0) > 0 OR c.id IS NOT NULL
      ORDER BY revenue DESC
    `, [tenantId, filters.fromDate, filters.toDate]);

    return rows.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      parentId: row.parent_id,
      quantitySold: parseInt(row.quantity_sold, 10),
      revenue: parseFloat(row.revenue),
      orderCount: parseInt(row.order_count, 10)
    }));
  }
}
