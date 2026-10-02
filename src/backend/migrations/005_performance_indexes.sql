-- Performance Indexes Migration
-- Created: 2026-01-18
-- Purpose: Optimize slow API endpoints identified in audit

-- ================================================
-- ORDERS TABLE INDEXES
-- ================================================

-- Composite index for order listing by status and date (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_status_created
ON orders(tenant_id, status, created_at DESC);

-- Index for date range queries (reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_created
ON orders(tenant_id, created_at DESC);

-- Index for user-specific orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_user
ON orders(tenant_id, user_id, created_at DESC);

-- Index for table lookup in active orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_status
ON orders(table_id, tenant_id) WHERE status NOT IN ('paid', 'voided');

-- ================================================
-- PRODUCTS TABLE INDEXES
-- ================================================

-- Index for category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category
ON products(category_id) WHERE category_id IS NOT NULL;

-- Composite index for active products by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_category_active
ON products(tenant_id, category_id, is_active)
WHERE is_active = true;

-- Index for SKU uniqueness within tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_sku
ON products(tenant_id, sku) WHERE sku IS NOT NULL;

-- Index for low stock alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
ON products(tenant_id, stock_quantity, low_stock_threshold)
WHERE is_active = true AND stock_quantity IS NOT NULL;

-- ================================================
-- STOCK LOGS TABLE INDEXES
-- ================================================

-- Index for stock history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_logs_product_created
ON stock_logs(product_id, created_at DESC);

-- Index for tenant-level stock queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_logs_tenant_created
ON stock_logs(tenant_id, created_at DESC);

-- Index for adjustment type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_logs_type
ON stock_logs(product_id, adjustment_type, created_at DESC);

-- ================================================
-- ORDER ITEMS TABLE INDEXES
-- ================================================

-- Index for order items lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order
ON order_items(order_id);

-- Index for product performance reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product
ON order_items(product_id, created_at DESC);

-- ================================================
-- USERS TABLE INDEXES
-- ================================================

-- Index for email lookup (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON users(email);

-- Index for tenant users listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_active
ON users(tenant_id, is_active) WHERE is_active = true;

-- ================================================
-- CATEGORIES TABLE INDEXES
-- ================================================

-- Index for tenant categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_tenant
ON categories(tenant_id, sort_order, name);

-- Index for parent-child hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent
ON categories(tenant_id, parent_id) WHERE parent_id IS NOT NULL;

-- ================================================
-- TABLES TABLE INDEXES
-- ================================================

-- Index for tenant tables status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_tenant_status
ON tables(tenant_id, status);

-- ================================================
-- REPORTS HELPER VIEWS (Optional - for pre-aggregation)
-- ================================================

-- Materialized view for daily sales summary (optional, for heavy reporting)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales AS
-- SELECT
--   tenant_id,
--   DATE(created_at) as sale_date,
--   COUNT(*) as order_count,
--   SUM(total_amount) as total_sales,
--   SUM(subtotal) as total_subtotal,
--   SUM(tax_amount) as total_tax,
--   SUM(discount_amount) as total_discount
-- FROM orders
-- WHERE status = 'paid'
-- GROUP BY tenant_id, DATE(created_at);

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_tenant_date
-- ON mv_daily_sales(tenant_id, sale_date);

-- ================================================
-- ANALYZE TABLES AFTER INDEX CREATION
-- ================================================

ANALYZE orders;
ANALYZE products;
ANALYZE stock_logs;
ANALYZE order_items;
ANALYZE users;
ANALYZE categories;
ANALYZE tables;

-- ================================================
-- ROLLBACK (if needed)
-- ================================================

-- DROP INDEX IF EXISTS idx_orders_tenant_status_created;
-- DROP INDEX IF EXISTS idx_orders_tenant_created;
-- DROP INDEX IF EXISTS idx_orders_tenant_user;
-- DROP INDEX IF EXISTS idx_orders_table_status;
-- DROP INDEX IF EXISTS idx_products_category;
-- DROP INDEX IF EXISTS idx_products_tenant_category_active;
-- DROP INDEX IF EXISTS idx_products_tenant_sku;
-- DROP INDEX IF EXISTS idx_products_low_stock;
-- DROP INDEX IF EXISTS idx_stock_logs_product_created;
-- DROP INDEX IF EXISTS idx_stock_logs_tenant_created;
-- DROP INDEX IF EXISTS idx_stock_logs_type;
-- DROP INDEX IF EXISTS idx_order_items_order;
-- DROP INDEX IF EXISTS idx_order_items_product;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_tenant_active;
-- DROP INDEX IF EXISTS idx_categories_tenant;
-- DROP INDEX IF EXISTS idx_categories_parent;
-- DROP INDEX IF EXISTS idx_tables_tenant_status;
