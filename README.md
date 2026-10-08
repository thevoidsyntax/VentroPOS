# VentroPos - Cloud POS for Small & Medium Business

> **Version:** 1.2.1
> **Status:** Development
> **License:** MIT
> **Last Updated:** 2026-10-08 (Audit Fixes & ESLint Configuration)

---

## Table of Contents

1. [Overview](#overview)
2. [Progress](#progress)
3. [Phase Specifications](#phase-specifications)
4. [API Reference](#api-reference)
5. [Database](#database)
6. [Tech Stack](#tech-stack)
7. [Development](#development)
8. [Changelog](#changelog)

---

## Overview

VentroPos is a cloud-based Point of Sale (POS) system designed for small to medium businesses. Built with multi-tenancy support, it enables single deployment to serve multiple outlets with robust data isolation.

**Core Features:**
- Shopping cart with customizable modifiers
- Multi-payment support (Cash, QRIS, Debit, Credit, Split Bill)
- Inventory management with real-time stock tracking
- Reporting dashboard with sales analytics
- Hardware integration (Printers, Scanners, EDC terminals)
- PWA-ready (Tablet, Mobile, Desktop)

**Target Market:**
- Retail & Food & Beverage businesses
- Single or multi-location operations
- Small to medium enterprises (SME)

---

## Progress

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Done | Foundation, Database, Auth |
| 2 | ✅ Done | Core POS, Cart, Checkout |
| 3 | ✅ Done | Inventory, Stock Management |
| 4 | ✅ Done | Reporting, Dashboard |
| 5 | ✅ Done | Hardware Integration |
| 6 | ✅ Done | Audit Fixes, Refactoring |
| 7 | ✅ Done | React Frontend Setup |
| 8 | ✅ Done | Orders Management |
| 9-13 | ⬜ Todo | Frontend Features |

---

## Phase Specifications

### Phase 1: Foundation ✅ Done

**Objectives:**
- [x] PostgreSQL with multi-tenant architecture
- [x] Row-Level Security (RLS) for data isolation
- [x] JWT authentication with refresh tokens
- [x] CRUD APIs for Users, Products, Categories, Tables
- [x] Security audit passed

**Deliverables:**
- Database schema with RLS policies
- Authentication endpoints (`/api/v1/auth/*`)
- User management CRUD
- Product catalog CRUD
- Table management CRUD

---

### Phase 2: Core POS ✅ Done

**Objectives:**
- [x] Shopping cart with modifiers
- [x] Checkout flow with multiple payment methods
- [x] Split bill support
- [x] Idempotency key for duplicate prevention
- [x] Order status management
- [x] Modifier CRUD API

**Deliverables:**
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/checkout` - Process payment
- `PUT /api/v1/orders/:id/status` - Update status
- `POST /api/v1/orders/:id/void` - Void order
- `GET/POST/PUT/DELETE /api/v1/modifiers/*` - Modifier management

**Test Coverage:** 142 unit tests passing

---

**Objectives:**
- [x] Stock level tracking per product
- [x] Low stock alerts (threshold-based)
- [x] Stock adjustment (manual correction)
- [x] Stock history/log
- [x] Stock overview API
- [x] Restock management
- [x] Stock opname support

**Deliverables:**
```
Stock APIs:
GET  /api/v1/stock/overview      - Stock overview ✅
GET  /api/v1/stock/alerts        - Low stock alerts ✅
POST /api/v1/stock/adjust        - Manual adjustment ✅
POST /api/v1/stock/receive       - Receive/restock ✅
GET  /api/v1/stock/history       - Stock history ✅

Stock Opname APIs:
GET  /api/v1/stock/opnames       - List stock opnames ✅
POST /api/v1/stock/opnames       - Create stock opname ✅
GET  /api/v1/stock/opnames/:id   - Get opname details ✅
POST /api/v1/stock/opnames/:id/counts         - Record count ✅
POST /api/v1/stock/opnames/:id/counts/batch   - Batch record ✅
POST /api/v1/stock/opnames/:id/submit          - Submit & apply ✅
POST /api/v1/stock/opnames/:id/cancel          - Cancel opname ✅
```

**Phase Gate:**
- [x] All tests passing
- [x] npm audit: 0 vulnerabilities
- [x] tsc --noEmit: no errors
- [x] Documentation updated

**Test Coverage:** 142 unit tests total

---

### Phase 3: Inventory ✅ Done

**Objectives:**
- [x] Sales summary (daily, weekly, monthly)
- [x] Product performance report
- [x] Staff performance report
- [x] Category breakdown
- [x] Export to CSV

**Deliverables:**
```
Report APIs:
GET  /api/v1/reports/sales        - Sales summary ✅
GET  /api/v1/reports/products     - Product performance ✅
GET  /api/v1/reports/staff       - Staff performance ✅
GET  /api/v1/reports/categories  - Category breakdown ✅
GET  /api/v1/reports/export      - CSV export ✅
```

**Date Presets:**
- `today` - Hari Ini
- `yesterday` - Kemarin
- `this_week` - Minggu Ini
- `last_week` - Minggu Lalu
- `this_month` - Bulan Ini
- `last_month` - Bulan Lalu

**Phase Gate:**
- [x] All tests passing (142 total)
- [x] tsc --noEmit: no errors
- [x] Documentation updated

**Test Coverage:** 25 unit tests for reports (reports.test.ts)

---

### Phase 5: Hardware Integration ✅ In Progress

**Objectives:**
- Receipt printer integration (ESC/POS over TCP/USB)
- Barcode scanner support (USB HID / Web Serial API)
- EDC terminal integration (Payment Gateway)
- Cash drawer control (POS Protocol via Relay)

**Deliverables:**

```
Hardware Device APIs:
GET    /api/v1/hardware/devices           - List registered devices
POST   /api/v1/hardware/devices           - Register new device
GET    /api/v1/hardware/devices/:id       - Get device details
PUT    /api/v1/hardware/devices/:id       - Update device config
DELETE /api/v1/hardware/devices/:id       - Remove device
POST   /api/v1/hardware/devices/:id/test  - Test device connection

Print Operations:
POST   /api/v1/hardware/print             - Print receipt
POST   /api/v1/hardware/print/kitchen     - Print kitchen ticket
POST   /api/v1/hardware/print/invoice     - Print invoice

EDC Operations:
POST   /api/v1/hardware/edc/payment        - Initiate EDC payment
POST   /api/v1/hardware/edc/cancel        - Cancel EDC transaction
POST   /api/v1/hardware/edc/settle        - Settlement (end of day)
GET    /api/v1/hardware/edc/status/:id   - Check payment status

Cash Drawer:
POST   /api/v1/hardware/drawer/open        - Open cash drawer

Scanner:
POST   /api/v1/hardware/scan              - Record barcode scan event

Logs:
GET    /api/v1/hardware/logs              - Hardware event logs
```

**Implementation Phases:**

```
Phase 5.1: Device Foundation ✅
├── Database schema (hardware_devices, hardware_logs) ✅
├── Device CRUD APIs ✅
└── Hardware logging infrastructure ✅

Phase 5.2: Receipt Printer ✅
├── ESC/POS driver implementation ✅
├── Print service ✅
└── Kitchen/Receipt/Invoice printing ✅

Phase 5.3: EDC Terminal ✅
├── EDC driver (TCP socket) ✅
├── EDC service ✅
├── Payment flow with idempotency ✅
├── Settlement API ✅
└── Transaction status check ✅

Phase 5.4: Scanner & Drawer ✅
├── Barcode scan handler ✅
├── Cash drawer control ✅
└── Integration tests ✅
```

**Database Schema:**

```sql
-- hardware_devices table
CREATE TABLE hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('printer', 'edc', 'scanner', 'drawer')),
    name VARCHAR(100) NOT NULL,
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('usb', 'serial', 'tcp', 'bluetooth')),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- hardware_logs table
CREATE TABLE hardware_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    device_id UUID REFERENCES hardware_devices(id),
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Phase Gate:**
- [x] All tests passing (142 + 17 hardware tests = 159 total)
- [x] npm audit: 0 vulnerabilities
- [x] tsc --noEmit: no errors
- [x] Documentation updated

---

## Phase 7: Frontend Setup (React + TypeScript)

### Skill Triggers

| Skill | Type | Trigger | Priority |
|-------|------|---------|----------|
| `/frontend` | Auto | File: `**/*.tsx`, `**/*.jsx` | Primary |
| `/ui-ux-pro-max` | **Auto** | File: `**/*.tsx`, `**/*.jsx` | **HIGH** |
| `/ui-ux-pro-max-styling` | Auto | Styling work | Medium |
| `/ui-ux-pro-max-design-system` | Manual | Design tokens setup | Initial |
| `/performance` | Auto | Keywords: "performance", "bundle" | As needed |
| `/testing` | Auto | File: `tests/**`, "test", "coverage" | As needed |
| `/diagnosing-bugs` | Auto | Keywords: "bug", "error", "fix" | As needed |

> **Note:** `/ui-ux-pro-max` sekarang auto-invoke untuk semua `.tsx/.jsx` files karena goal project adalah **human-like UI patterns** secara konsisten.

**Deliverables:**
- React + Vite + TypeScript setup
- shadcn/ui components
- Zustand stores (cart, auth, ui)
- TanStack Query hooks
- PWA configuration

### Phase 7.1: Project Foundation
- [ ] Vite project initialization
- [ ] Tailwind + shadcn/ui setup
- [ ] Zustand stores
- [ ] TanStack Query client
- [ ] React Router setup

### Phase 7.2: POS Interface
> **Skills:** `/frontend` (auto) + `/ui-ux-pro-max` (auto) + `/ui-ux-pro-max-styling` (auto)

- [ ] Product grid dengan category tabs
- [ ] Cart drawer dengan qty adjust
- [ ] Checkout flow
- [ ] Receipt modal

**UI/UX Priority:** Tablet-first, touch-friendly (min 44px tap targets), glanceable status

### Phase 7.3: Orders (Trigger: `/frontend`)
- [ ] Order list dengan filters
- [ ] Order detail page
- [ ] Void order flow

### Phase 7.4: Inventory UI
- [ ] Stock overview
- [ ] Stock alerts
- [ ] Stock opname wizard

### Phase 7.5: Reports Dashboard (Trigger: `/performance`)
- [ ] Sales charts (Recharts)
- [ ] Export CSV/PDF

### Phase 7.6: Tables & Settings
- [ ] Table layout
- [ ] User management
- [ ] Hardware config

### Phase 7.7: PWA
> **Skills:** `/frontend` (auto) + `/performance` (auto)

- [ ] Service worker (vite-plugin-pwa)
- [ ] Offline mode
- [ ] Install prompt

---

## Phase 8: Orders Management ✅ Done

**Objectives:**
- [x] Order list page with filters
- [x] Order detail page
- [x] Search orders by ID
- [x] Filter by status, date range, cashier
- [x] Void order flow
- [x] Print receipt functionality
- [x] Pagination

**Pages:**
- `/orders` - Order list with filters
- `/orders/:id` - Order detail

**Features Implemented:**
| Feature | Status |
|---------|--------|
| Order list | ✅ |
| Status filter dropdown | ✅ |
| Date range filter | ✅ |
| Cashier filter | ✅ |
| Search by order number | ✅ |
| Order status badge | ✅ |
| Void order modal | ✅ |
| Print receipt button | ✅ |
| Pagination | ✅ |
| Empty state | ✅ |

**New Frontend Components:**
```
components/ui/popover.tsx    - Radix Popover
components/ui/calendar.tsx    - Custom date picker
components/ui/textarea.tsx   - Textarea input
hooks/use-users.ts          - User list hook
pages/orders/OrdersPage.tsx - Full featured order list
pages/orders/$id.tsx        - Enhanced order detail
```

**Phase Gate:**
- [x] npm run build: Success
- [x] Documentation updated

---

## API Reference

### API Documentation (Swagger UI)

Interactive API documentation is available at:
```
http://localhost:3000/docs
```

**Features:**
- Interactive API explorer with "Try it out" functionality
- JWT authentication support (click "Authorize" to enter token)
- OpenAPI 3.0 specification
- All endpoints documented with request/response schemas

**Authentication:**
1. Register or login via `/api/v1/auth/*` endpoints
2. Copy the access token from the response
3. Click "Authorize" button in Swagger UI
4. Enter: `Bearer <your-access-token>`
5. Click "Authorize" to apply to all requests

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness probe - returns server status |
| `GET /ready` | Readiness probe - checks DB and Redis connectivity |

**Response Example:**
```json
// /health
{ "status": "ok", "timestamp": "...", "uptime": 12345 }

// /ready
{ "status": "ready", "checks": { "database": true, "redis": true }, "timestamp": "..." }
```

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/auth/register` | Register tenant + admin |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Logout |

### Resources

| Resource | Endpoints |
|----------|-----------|
| Users | CRUD `/users` |
| Products | CRUD `/products` |
| Categories | CRUD `/categories` |
| Tables | CRUD `/tables` |
| Orders | CRUD `/orders` + `/orders/checkout` |
| Modifiers | CRUD `/modifiers/*` |
| Stock | CRUD `/stock/*` |
| Stock Opname | CRUD `/stock/opnames/*` |
| Reports | GET `/reports/*` |
| Hardware | CRUD `/hardware/devices` + `/hardware/logs` |

### Rate Limiting

Rate limiting is applied globally to protect the API:

| Tier | Limit | Window |
|------|-------|--------|
| Global (authenticated) | 100 requests | 1 minute |
| Auth endpoints | 5 requests | 1 minute |

**Excluded from rate limiting:**
- `/health`
- `/ready`
- `/docs/*`

**Response when limit exceeded (HTTP 429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

### Response Format

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Database

### Core Tables

| Table | Description |
|-------|-------------|
| `tenants` | Multi-tenant organizations |
| `users` | Staff accounts per tenant |
| `categories` | Product categories |
| `products` | Menu items |
| `modifier_groups` | Modifier groups (size, extras) |
| `modifiers` | Individual modifiers |
| `restaurant_tables` | Table layout |
| `orders` | Customer orders |
| `order_items` | Items in order |
| `order_item_modifiers` | Selected modifiers |
| `transactions` | Payments |
| `transaction_splits` | Split payment details |
| `stock_logs` | Stock movement history |
| `audit_logs` | Activity audit trail |
| `idempotency_keys` | Duplicate request prevention |
| `hardware_devices` | POS hardware configuration |
| `hardware_logs` | Hardware operation logs |

### Security

- Row-Level Security (RLS) on all tenant-scoped tables
- JWT authentication with refresh token rotation
- bcrypt password hashing

---

## Architecture

### Project Structure

```
src/backend/           # Fastify API server
├── src/api/          # Routes, middleware, schemas (Delivery Layer)
├── src/application/   # Use cases, application services (Application Layer)
│   ├── orders/       # Order use cases (split into 5 files)
│   ├── stock/       # Stock use cases (split into 14 files)
│   ├── products/     # Product use cases (split into 5 files)
│   ├── users/       # User use cases (split into 7 files)
│   ├── tables/      # Table use cases (split into 8 files)
│   ├── categories/  # Category use cases (split into 4 files)
│   ├── modifiers/   # Modifier use cases
│   ├── reports/     # Report use cases (6 files + utils)
│   └── hardware/    # Hardware device service (Phase 5)
├── src/domain/       # Entities, repositories interfaces (Domain Layer)
├── src/infrastructure/ # DB, auth implementations (Infrastructure Layer)
│   └── database/
│       └── repositories/  # Split into 16 individual files
└── src/shared/       # Config, errors, utils (Shared Kernel)
```

### Design Patterns

- **DDD-lite**: Clean separation between Domain, Application, and Infrastructure layers
- **Repository Pattern**: Abstract data access through interfaces
- **Use Case Pattern**: Business logic encapsulated in application services
- **Multi-tenancy**: PostgreSQL Row-Level Security (RLS) for data isolation
- **Batch Operations**: `batchUpdateStock()` for efficient N+1 query prevention

### Code Organization

| Module | Files | Max Lines |
|--------|-------|-----------|
| Application (use cases) | 40+ | ~90 ln |
| Infrastructure (repos) | 15 | ~207 ln |

### Audit Logging

Audit logging for compliance and forensic tracking:

```
Audit Log Table: audit_logs
- tenant_id, user_id, action, entity_type, entity_id
- old_data, new_data (JSONB)
- ip_address, user_agent
- created_at
```

**Features:**
- ✅ DB persistence with PostgreSQL
- ✅ Structured logging to Pino
- ✅ Non-blocking (logs errors but doesn't fail requests)
- ✅ Multi-tenant isolation via RLS

---

## Code Quality

### Quality Gates

| Check | Status | Notes |
|-------|--------|-------|
| ESLint Backend | ✅ 0 errors | TypeScript + Prettier support |
| ESLint Frontend | ✅ 0 errors | ESLint 9 flat config (2 warnings) |
| TypeScript | ✅ Strict | No `any` types |
| Tests Backend | ✅ 187 passing | Vitest unit tests |
| Tests Frontend | ✅ 60 passing | Vitest unit tests |
| npm audit | ✅ 0 vulnerabilities | Regular dependency scanning |
| Max File Size | ✅ <250 ln | Fat class split complete |

### Code Complexity

| Metric | Before | After |
|--------|--------|-------|
| Largest Repository | 1441 ln | 207 ln |
| Largest Use Case | 489 ln | ~90 ln |
| Total Application LOC | 1884 ln | 419 ln |

### Performance Optimizations

- **Batch Inserts**: Order items and modifiers inserted in bulk
- **JOIN Queries**: Single query for order items + modifiers (no N+1)
- **Database Transactions**: Atomic order creation
- **Pagination**: LIMIT/OFFSET on all findAll queries

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20+, Fastify 5.x, TypeScript 5.x |
| Database | PostgreSQL 15+ (RLS) |
| Auth | JWT (@fastify/jwt 10.x) |
| Validation | Zod 3.x |
| Password | bcrypt 6.x |
| ORM/Query | Knex 3.x + pg 8.x |
| Logging | Pino 9.x |
| Testing | Vitest 2.x |
| Linting | ESLint 8.x + @typescript-eslint (Backend) / ESLint 9.x (Frontend) |
| Frontend | React 18 + Vite 6 |

### Dependencies Status

```
npm audit: 0 vulnerabilities ✅
TypeScript: 5.9.3 ✅
Backend Tests: 187 passing ✅
Frontend Tests: 42/60 (infrastructure issue) ⚠️
ESLint Backend: Configured ✅
ESLint Frontend: ESLint 9 flat config ✅
Architecture: Split complete ✅
Fastify: 5.x compatible ✅
Audit Logging: Implemented ✅
```

---

## Development

### Quick Start

```bash
cd src/backend
npm install
cp .env.example .env
npm run dev

# API: http://localhost:3000
# Docs: http://localhost:3000/docs
# Health: http://localhost:3000/health
```

### Scripts

```bash
npm run dev          # Development server
npm run build        # TypeScript build
npm start            # Production server
npm test             # Run tests (142 passing)
npm run lint         # ESLint check
npm run test:coverage # Test coverage report
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed demo data
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ventropos
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
TAX_RATE=0.11           # Indonesia PPN (default)
BCRYPT_ROUNDS=12      # Password hashing rounds
LOG_LEVEL=info         # Pino log level
```

---

## Changelog

### v1.2.1 - Audit Fixes & Code Quality (2026-10-08)

**Code Quality Improvements:**
- ✅ Added `eslint.config.js` for ESLint 9 flat config
- ✅ Fixed type imports in backend (`import type` syntax)
- ✅ Added eslint-disable for regex escape in password validator
- ✅ Removed 36+ unused imports across frontend codebase
- ✅ Fixed frontend test infrastructure (vitest config - `define` option)
- ✅ **All 60 frontend tests now passing**

**Backend Quality:**
- ✅ ESLint: 0 errors
- ✅ TypeScript: Compiles cleanly
- ✅ Tests: 187/187 passing

**Frontend Quality:**
- ✅ ESLint: 0 errors (2 acceptable Fast Refresh warnings)
- ✅ TypeScript: Compiles cleanly
- ✅ Tests: 60/60 passing

**Files Modified:**
- `src/frontend/eslint.config.js` (NEW)
- `src/frontend/vitest.config.ts` (fix: added `define` option)
- `src/backend/src/api/middleware/security.ts`
- `src/backend/src/infrastructure/database/repositories/base.ts`
- `src/backend/src/shared/utils/password.ts`
- 15+ frontend component and hook files (unused import cleanup)

---

### v1.2.0 - Phase 8: Orders Management (Complete)

**Phase 8 Features:**
- ✅ Order list page (`/orders`) with filters
- ✅ Order detail page (`/orders/:id`)
- ✅ Status filter dropdown
- ✅ Date range filter with calendar picker
- ✅ Cashier filter by user
- ✅ Search by order number
- ✅ Order status badge component
- ✅ Void order modal with reason presets
- ✅ Print receipt button
- ✅ Pagination support
- ✅ Empty state for no orders

**New Frontend Files:**
```
components/ui/popover.tsx      - Radix UI Popover
components/ui/calendar.tsx      - Custom Calendar date picker
components/ui/textarea.tsx       - Textarea input
hooks/use-users.ts              - User list hook
pages/orders/OrdersPage.tsx    - Full featured order list
pages/orders/$id.tsx           - Enhanced order detail with modifiers
```

**Frontend Dependencies Updated:**
- Added `@radix-ui/react-popover` for date filter

**Build:** `npm run build` passes ✅

---

### v1.0.2 - Phase 5: Hardware Integration (Complete)

**Phase 5 Phase Gate:**
- ✅ All tests passing (159 total: 142 + 17 hardware)
- ✅ npm audit: 0 vulnerabilities (updated @fastify/swagger-ui to 6.1.1)
- ✅ tsc --noEmit: no errors
- ✅ Documentation updated

**Phase 5 Specifications Added:**
- Device management APIs (CRUD) ✅
- Print operations (Receipt, Kitchen, Invoice) ✅
- EDC terminal integration APIs ✅
- Cash drawer control
- Barcode scanner support
- Hardware event logging ✅

**Phase 5.2 - Receipt Printer Complete:**
- ESC/POS driver with TCP socket support
- PrintService for receipt generation
- Kitchen ticket printing with priority
- Invoice printing
- QR code generation for QRIS payments

**Phase 5.3 - EDC Terminal Complete:**
- EDCDriver with TCP socket protocol
- EDCService for payment processing
- Idempotency key support for duplicate prevention
- Settlement (end-of-day batch) API
- Transaction status check endpoint

**Phase 5.4 - Scanner & Drawer Complete:**
- ScannerService for barcode scan event handling
- DrawerService for cash drawer control
- Support for direct drawer and printer-connected drawer
- Barcode format validation (EAN-13, UPC, Code 128, QR)
- Scan event logging

**Phase 5 Tests:**
- Hardware unit tests (17 test cases)
- Scanner barcode validation tests
- Device type validation tests
- EDC transaction status tests
- Cash drawer operations tests
- Kitchen ticket priority tests

**New Files Structure:**
```
Hardware Module (Phase 5.1+):
├── src/api/routes/
│   ├── hardware.routes.ts                  ✅
│   ├── print.routes.ts                     ✅ (Phase 5.2)
│   ├── edc.routes.ts                      ✅ (Phase 5.3)
│   └── hardware-misc.routes.ts             ✅ (Phase 5.4)
├── src/application/hardware/
│   ├── index.ts                           ✅
│   ├── device.service.ts                   ✅
│   ├── edc.service.ts                     ✅ (Phase 5.3)
│   ├── print.service.ts                   ✅ (Phase 5.2)
│   ├── scanner.service.ts                 ✅ (Phase 5.4)
│   └── drawer.service.ts                  ✅ (Phase 5.4)
├── src/domain/entities/hardware.ts         ✅
├── src/infrastructure/hardware/
│   └── drivers/
│       ├── escpos.driver.ts               ✅ (Phase 5.2)
│       └── edc.driver.ts                  ✅ (Phase 5.3)
├── src/infrastructure/database/repositories/hardware.ts ✅
└── migrations/006_hardware_tables.sql     ✅
```

### v1.0.1 - Audit Fixes (2026-01-18)

**Critical Fixes:**
- ✅ Categories API now at `/api/v1/categories` (dedicated route)
- ✅ JSON parse error handling in global error handler
- ✅ `refreshToken.ts` dead code removed

**New Test Coverage:**
- ✅ `tests/unit/auth.test.ts` - 13 test cases for Login, Register, Refresh, GetCurrentUser
- ✅ `tests/unit/checkout.test.ts` - 11 test cases for payment flows

**Database Performance:**
- ✅ `migrations/005_performance_indexes.sql` - 16 new indexes for:
  - Orders: status+date, tenant+user, table+status
  - Products: category, active products, SKU, low stock
  - Stock logs: product+date, type filtering
  - Users: email lookup, tenant+active
  - Categories: tenant+sort, parent hierarchy

**Documentation:**
- ✅ `.env.example` created with all required variables
- ✅ `package-lock.json` generated

**Test Results:** 142 unit tests passing ✅

### Phase 4: Reporting

**New Features:**
- Sales summary API with metrics, payment method breakdown, hourly sales, and period comparison
- Product performance report with rankings and percentages
- Staff performance report with transaction counts and AOV
- Category breakdown report with order counts
- CSV export for all report types

**Date Presets (Indonesian):**
- `today` - Hari Ini
- `yesterday` - Kemarin
- `this_week` - Minggu Ini
- `last_week` - Minggu Lalu
- `this_month` - Bulan Ini
- `last_month` - Bulan Lalu

**New Files:**
```
Domain:
- src/domain/entities/report.ts (Report entities)
- src/domain/repositories/report.ts (Report repository interface)

Infrastructure:
- src/infrastructure/database/repositories/report.ts (PostgreSQL implementation)

Application:
- src/application/reports/ (6 files: sales-summary, product-performance, staff-performance, category-breakdown, export-report, index)
- src/application/reports/utils/date-utils.ts

API:
- src/api/routes/report.routes.ts

Tests:
- tests/unit/reports.test.ts (25 unit tests)
```

**Test Coverage:** 142 total unit tests passing

### Audit Fixes - Code Quality Refactoring

**Critical Issues Fixed:**
- C9: God Class BaseRepository (1418 lines → 14 files) ✅
- C10: Feature Envy in CheckoutUseCase (extracted batch operations) ✅

**High Issues Fixed:**
- H1-3: N+1 queries in Checkout/VoidUseCase (batchUpdateStock) ✅
- H10-12: Fat classes split into individual use case files ✅

**Refactoring Summary:**
```
Application Layer:
- stock/index.ts: 489 ln → 17 ln (14 files)
- orders/index.ts: 329 ln → 8 ln (5 files)
- users/index.ts: 246 ln → 10 ln (7 files)
- tables/index.ts: 227 ln → 11 ln (8 files)
- products/index.ts: 234 ln → 8 ln (5 files)
- New categories module: 4 files

Infrastructure Layer:
- repositories/index.ts: 1441 ln → 207 ln max (14 files)
- Added batchUpdateStock() method for N+1 prevention
```

**Performance Improvements:**
- Batch stock updates in single DB transaction
- All use cases split into focused, single-responsibility files

### Security & Correctness Fixes
- JWT secret fail-fast in production (no fallback)
- Rate limit on refresh token endpoint (10/min)
- Discount percentage validation (0-100% range)
- Pagination safe guards (Math.max(1, ...) for page/limit)
- Null checks added to all repository update methods
- Variance calculation fix in stock opname
- JWT algorithm explicitly set to HS256
- Token store race condition fixes
- Auto token cleanup interval for memory management

### Phase 3: Inventory
- Stock overview API (`GET /stock/overview`)
- Low stock alerts API (`GET /stock/alerts`)
- Manual stock adjustment API (`POST /stock/adjust`)
- Restock/receive API (`POST /stock/receive`)
- Stock history API (`GET /stock/history`)
- Stock opname (stocktake) feature:
  - Create stock opname session
  - Record physical counts per item
  - Batch record counts
  - Submit and apply adjustments
  - Cancel stock opname
- **36 unit tests** for stock use cases (stock.test.ts)

### Audit Fixes Applied
- ESLint configuration with TypeScript support
- N+1 query fixes (batch inserts, JOIN queries)
- Database transaction wrapper for atomic operations
- Date validation in API endpoints
- Repository singleton container (DI pattern)
- Configurable TAX_RATE via environment variable
- Pagination added to repository findAll methods
- Startup logger with proper process.exit() guards

### Phase 2: Core POS
- Order item modifiers persistence
- Transaction splits persistence
- Idempotency key for checkout
- Modifier CRUD API
- 59 unit tests passing

### Phase 1: Foundation
- PostgreSQL with RLS
- JWT authentication
- CRUD APIs
- Security audit passed

### Dependencies Updated
- @fastify/jwt 10.2.2 (CVE fix)
- bcrypt 6.0.0 (vulnerability fix)
- fastify 5.12.5 (DoS fix)
- uuid 11.1.1 (buffer fix)

### Code Audit Fixes (2026-10-02)

**Performance Fixes:**
- N+1 query fix in `CreateStockOpnameUseCase`: Use `findByIds()` batch query instead of sequential `findById()` calls
- N+1 query fix in `GetStockOpnameUseCase`: Batch fetch products then map locally

**New Feature: Audit Logging**
- New table: `audit_logs` for compliance and forensic tracking
- New repository: `PostgresAuditLogRepository` with create/findByTenant methods
- Middleware integration: `createAuditLog()` persists to DB
- Migration: `004_audit_logs.sql`

**Bug Fixes:**
- UserRepository `mapRow()`: Fixed snake_case to camelCase conversion
- Fastify 5.x compatibility: Updated `@fastify/cors` to v10, `@fastify/swagger-ui` to v5

**New Scripts:**
- `npm run db:migrate` - Run all migrations
- `npm run db:seed` - Seed demo data (owner@demo.com / owner123)

**Test Updates:**
- Added `findByIds` and `batchUpdateStock` mocks to stock tests
- All 120 tests passing

---

## Links

- [GitHub](https://github.com/thevoidsyntax/VentroPOS)
- [Backend](./src/backend/)
- [PRD](./docs/prd/README.md)
- [Developer Instructions](./CLAUDE.md)
