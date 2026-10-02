-- Migration: 004_audit_logs
-- Description: Add audit_logs table for compliance and forensic tracking

-- UP Migration
-- Create audit_logs table for tracking all entity changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity ON audit_logs(tenant_id, entity_type, created_at DESC);

-- Add RLS policies for multi-tenant isolation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see audit logs for their tenant
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and forensic tracking';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: create, update, delete, login, logout, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected: user, product, order, etc.';
COMMENT ON COLUMN audit_logs.old_data IS 'Previous state of the entity (for updates/deletes)';
COMMENT ON COLUMN audit_logs.new_data IS 'New state of the entity (for creates/updates)';

-- DOWN Migration
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS audit_logs;
