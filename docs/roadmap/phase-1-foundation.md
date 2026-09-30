# Phase 1: Foundation - Backend, Database & Authentication

> **Version:** 1.0.0  
> **Status:** 🔴 Not Started  
> **Start Date:** TBD  
> **Target Completion:** 2-3 weeks

---

## Overview

Phase 1 establishes the foundation for VentroPos - the backend infrastructure, database architecture with multi-tenant support, and authentication system. This is the most critical phase as all subsequent phases depend on it.

---

## Objectives

1. ✅ Setup PostgreSQL database with multi-tenant architecture
2. ✅ Implement Row-Level Security (RLS)
3. ✅ Create authentication system (JWT)
4. ✅ Build core API structure with versioning
5. ✅ Setup project scaffolding (backend)

---

## Technical Architecture

### Database Schema

```sql
-- =====================================================
-- MULTI-TENANT CORE TABLES
-- =====================================================

-- Tenant/Organization
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'starter',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User accounts (belongs to tenant)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'kasir', 'kitchen')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =====================================================
-- PRODUCT CATALOG
-- =====================================================

-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost DECIMAL(12, 2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    is_serialized BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, sku)
);

-- Product modifiers (size, extras, etc.)
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('size', 'extras', 'topping', 'custom')),
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product-Modifier relationship
CREATE TABLE product_modifiers (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_group_id)
);

-- =====================================================
-- TABLE MANAGEMENT
-- =====================================================

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 4,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, table_number)
);

-- =====================================================
-- ORDERS & TRANSACTIONS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    order_number VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'voided', 'held')),
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    customer_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,  -- denormalized for history
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item modifiers (selected for this order item)
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id UUID NOT NULL REFERENCES modifiers(id),
    modifier_name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL 
        CHECK (payment_method IN ('cash', 'qris', 'debit', 'credit', 'mixed')),
    payment_details JSONB DEFAULT '{}',
    reference_number VARCHAR(100),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For split payments
CREATE TABLE transaction_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return', 'void')),
    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_stock_logs_tenant ON stock_logs(tenant_id);
CREATE INDEX idx_stock_logs_product ON stock_logs(product_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
-- Each table will have policies based on current_setting('app.tenant_id')

-- Example: Products policy
CREATE POLICY tenant_isolation_products ON products
    USING (tenant_id::text = current_setting('app.tenant_id', true));
```

---

## API Structure

### Version 1 Endpoints

```
BASE URL: /api/v1

AUTHENTICATION
├── POST   /auth/register          - Register new tenant + admin user
├── POST   /auth/login             - Login
├── POST   /auth/logout            - Logout
├── POST   /auth/refresh           - Refresh access token
└── GET    /auth/me                - Get current user

USERS (Tenant-scoped)
├── GET    /users                  - List users
├── POST   /users                  - Create user
├── GET    /users/:id              - Get user
├── PUT    /users/:id              - Update user
├── DELETE /users/:id              - Deactivate user

CATEGORIES (Tenant-scoped)
├── GET    /categories             - List categories
├── POST   /categories             - Create category
├── GET    /categories/:id         - Get category
├── PUT    /categories/:id         - Update category
└── DELETE /categories/:id         - Delete category

PRODUCTS (Tenant-scoped)
├── GET    /products               - List products (with pagination)
├── POST   /products               - Create product
├── GET    /products/:id           - Get product
├── PUT    /products/:id           - Update product
├── DELETE /products/:id           - Delete product
└── GET    /products/barcode/:code - Lookup by barcode

TABLES (Tenant-scoped)
├── GET    /tables                 - List tables
├── POST   /tables                 - Create table
├── GET    /tables/:id             - Get table
├── PUT    /tables/:id             - Update table
├── DELETE /tables/:id             - Delete table
└── PUT    /tables/:id/status      - Update table status

MODIFIERS (Tenant-scoped)
├── GET    /modifiers              - List modifier groups
├── POST   /modifiers              - Create modifier group
├── GET    /modifiers/:id          - Get modifier group
├── PUT    /modifiers/:id          - Update modifier group
├── DELETE /modifiers/:id          - Delete modifier group
└── POST   /modifiers/:id/items    - Add modifier to group

SYSTEM
├── GET    /health                 - Health check
├── GET    /ready                  - Readiness check
└── GET    /version                - API version
```

### Response Format

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Fastify app setup
│   ├── server.ts                 # Server entry point
│   │
│   ├── config/
│   │   ├── index.ts              # Config loader
│   │   ├── database.ts           # DB config
│   │   └── jwt.ts                # JWT config
│   │
│   ├── plugins/
│   │   ├── database.ts           # Database plugin
│   │   ├── auth.ts               # Auth plugin
│   │   └── tenant.ts             # Tenant context plugin
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── schemas/
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── schemas/
│   │   │
│   │   ├── products/
│   │   │   ├── product.controller.ts
│   │   │   ├── product.service.ts
│   │   │   ├── product.repository.ts
│   │   │   └── schemas/
│   │   │
│   │   ├── categories/
│   │   │   ├── category.controller.ts
│   │   │   ├── category.service.ts
│   │   │   ├── category.repository.ts
│   │   │   └── schemas/
│   │   │
│   │   └── tables/
│   │       ├── table.controller.ts
│   │       ├── table.service.ts
│   │       ├── table.repository.ts
│   │       └── schemas/
│   │
│   ├── shared/
│   │   ├── repositories/
│   │   │   └── base.repository.ts
│   │   ├── services/
│   │   │   └── base.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── tenant.middleware.ts
│   │   ├── utils/
│   │   │   ├── errors.ts
│   │   │   └── helpers.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── docker/
│   └── Dockerfile
│
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Implementation Tasks

### Week 1: Project Setup & Database

- [ ] Initialize Node.js project with TypeScript
- [ ] Setup Fastify framework
- [ ] Configure PostgreSQL connection
- [ ] Create database migrations
- [ ] Implement RLS policies
- [ ] Setup Docker configuration

### Week 2: Authentication

- [ ] Implement JWT authentication
- [ ] Create register/login endpoints
- [ ] Implement password hashing (bcrypt)
- [ ] Create refresh token mechanism
- [ ] Add tenant context middleware
- [ ] Implement RBAC middleware

### Week 3: Core Modules

- [ ] Users CRUD with tenant isolation
- [ ] Categories CRUD
- [ ] Products CRUD
- [ ] Tables CRUD
- [ ] Unit tests for all modules
- [ ] Integration tests

---

## Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^8.x",
    "@fastify/jwt": "^7.x",
    "@fastify/rate-limit": "^8.x",
    "pg": "^8.x",
    "knex": "^3.x",
    "bcrypt": "^5.x",
    "zod": "^3.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "vitest": "^1.x",
    "supertest": "^6.x"
  }
}
```

---

## Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-01 | Database migrations run without errors | Run migrations, verify tables created |
| AC-02 | RLS prevents cross-tenant access | Test query with different tenant_id |
| AC-03 | User can register with tenant | POST /auth/register returns success |
| AC-04 | User can login and get JWT | POST /auth/login returns token |
| AC-05 | Protected routes reject invalid token | Request with invalid JWT returns 401 |
| AC-06 | Protected routes enforce tenant_id | Request returns only tenant's data |
| AC-07 | RBAC enforces role permissions | Kasir cannot access admin routes |
| AC-08 | CRUD operations work for all modules | All API endpoints return expected data |
| AC-09 | Validation errors return proper format | Invalid input returns 400 with details |
| AC-10 | Unit test coverage > 80% | Run coverage report |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RLS complexity underestimated | Medium | High | Study PostgreSQL RLS docs thoroughly |
| JWT token security issues | Low | High | Use proven @fastify/jwt, follow OWASP |
| Performance issues with RLS | Medium | Medium | Benchmark queries, add indexes |
| Data migration errors | Medium | High | Test on backup data first |

---

## Success Metrics

- All acceptance criteria met
- API response time < 200ms (P95)
- Unit test coverage > 80%
- No critical security vulnerabilities
- Documentation complete

---

➡️ **[Back to Roadmap](../README.md)**  
➡️ **[Next: Phase 2 - Core POS](./phase-2-core-pos.md)**

---

*Document maintained by: Project Lead*  
*Started: TBD*  
*Completed: TBD*
