-- Migration: 006_hardware_tables.sql
-- Description: Hardware devices and logs tables for Phase 5
-- Created: 2026-01-19
-- Author: thevoidsyntax

-- ============================================
-- HARDWARE_DEVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('printer', 'edc', 'scanner', 'drawer')),
    name VARCHAR(100) NOT NULL,
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('usb', 'serial', 'tcp', 'bluetooth')),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HARDWARE_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hardware_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES hardware_devices(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR HARDWARE_DEVICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hardware_devices_tenant_id ON hardware_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_type ON hardware_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_active ON hardware_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hardware_devices_default ON hardware_devices(is_default, tenant_id) WHERE is_default = true;

-- ============================================
-- INDEXES FOR HARDWARE_LOGS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hardware_logs_tenant_id ON hardware_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hardware_logs_device_id ON hardware_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_hardware_logs_event_type ON hardware_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_hardware_logs_status ON hardware_logs(status);
CREATE INDEX IF NOT EXISTS idx_hardware_logs_created_at ON hardware_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hardware_logs_tenant_created ON hardware_logs(tenant_id, created_at DESC);

-- ============================================
-- RLS POLICIES FOR HARDWARE_DEVICES
-- ============================================
ALTER TABLE hardware_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY hardware_devices_tenant_isolation ON hardware_devices
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================
-- RLS POLICIES FOR HARDWARE_LOGS
-- ============================================
ALTER TABLE hardware_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY hardware_logs_tenant_isolation ON hardware_logs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to hardware_devices
CREATE TRIGGER update_hardware_devices_updated_at
    BEFORE UPDATE ON hardware_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REVERSE MIGRATION (DOWN)
-- ============================================
-- DROP TRIGGER IF EXISTS update_hardware_devices_updated_at ON hardware_devices;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP POLICY IF EXISTS hardware_logs_tenant_isolation ON hardware_logs;
-- ALTER TABLE hardware_logs DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS hardware_devices_tenant_isolation ON hardware_devices;
-- ALTER TABLE hardware_devices DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS idx_hardware_logs_tenant_created;
-- DROP INDEX IF EXISTS idx_hardware_logs_created_at;
-- DROP INDEX IF EXISTS idx_hardware_logs_status;
-- DROP INDEX IF EXISTS idx_hardware_logs_event_type;
-- DROP INDEX IF EXISTS idx_hardware_logs_device_id;
-- DROP INDEX IF EXISTS idx_hardware_logs_tenant_id;
-- DROP INDEX IF EXISTS idx_hardware_devices_default;
-- DROP INDEX IF EXISTS idx_hardware_devices_active;
-- DROP INDEX IF EXISTS idx_hardware_devices_type;
-- DROP INDEX IF EXISTS idx_hardware_devices_tenant_id;
-- DROP TABLE IF EXISTS hardware_logs;
-- DROP TABLE IF EXISTS hardware_devices;
