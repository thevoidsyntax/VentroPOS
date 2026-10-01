-- Phase 2: Add Idempotency Keys for Checkout
-- Prevents duplicate checkout on network retry

-- Idempotency keys table
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL, -- SHA256 hash of the idempotency key
    order_id UUID REFERENCES orders(id),
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT idempotency_keys_tenant_key_unique UNIQUE(tenant_id, key_hash)
);

CREATE INDEX idx_idempotency_keys_tenant ON idempotency_keys(tenant_id);
CREATE INDEX idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- RLS for idempotency keys
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

ALTER TABLE idempotency_keys FORCE ROW LEVEL SECURITY;
