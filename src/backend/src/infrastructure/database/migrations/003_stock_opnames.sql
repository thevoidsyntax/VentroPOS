-- Migration: 003_stock_opnames
-- Description: Add stock opname tables for inventory audit/stocktake functionality

-- UP Migration
-- Create stock_opnames table (stocktake sessions)
CREATE TABLE IF NOT EXISTS stock_opnames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled'))
);

-- Create stock_opname_items table (individual item counts)
CREATE TABLE IF NOT EXISTS stock_opname_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opname_id UUID NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    system_quantity INTEGER NOT NULL DEFAULT 0,
    actual_quantity INTEGER NOT NULL DEFAULT 0,
    variance INTEGER NOT NULL DEFAULT 0,
    notes TEXT,

    -- Constraints
    CONSTRAINT non_negative_system_qty CHECK (system_quantity >= 0),
    CONSTRAINT non_negative_actual_qty CHECK (actual_quantity >= 0)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_stock_opnames_tenant_id ON stock_opnames(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_status ON stock_opnames(status);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_created_at ON stock_opnames(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_items_opname_id ON stock_opname_items(opname_id);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_items_product_id ON stock_opname_items(product_id);

-- Add comment for documentation
COMMENT ON TABLE stock_opnames IS 'Stock opname (stocktake) sessions for physical inventory counting';
COMMENT ON TABLE stock_opname_items IS 'Individual item counts in a stock opname session';
COMMENT ON COLUMN stock_opnames.status IS 'Status: draft, in_progress, completed, cancelled';
COMMENT ON COLUMN stock_opnames.completed_at IS 'Timestamp when opname was completed';
COMMENT ON COLUMN stock_opname_items.system_quantity IS 'Quantity in system before opname';
COMMENT ON COLUMN stock_opname_items.actual_quantity IS 'Physical count during opname';
COMMENT ON COLUMN stock_opname_items.variance IS 'Difference: actual - system (positive = surplus, negative = shortage)';

-- DOWN Migration
DROP TABLE IF EXISTS stock_opname_items;
DROP TABLE IF EXISTS stock_opnames;
