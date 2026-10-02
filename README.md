# VentroPos - Cloud POS for Small & Medium Business

> **Version:** 1.0.0
> **Status:** Development
> **License:** MIT
> **Last Updated:** 2024-10-02

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
| 4 | ⬜ Todo | Reporting, Dashboard |
| 5 | ⬜ Todo | Hardware Integration |
| 6 | ⬜ Todo | Launch, Polish |

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

**Test Coverage:** 83 unit tests passing

---

### Phase 3: Inventory ✅ Done

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

---

### Phase 4: Reporting (Todo)

**Objectives:**
- Sales report (daily, weekly, monthly)
- Product performance report
- Staff performance report
- Category breakdown
- Export to PDF/Excel

---

### Phase 5: Hardware (Todo)

**Objectives:**
- Receipt printer integration
- Barcode scanner support
- EDC terminal integration
- Cash drawer control

---

### Phase 6: Launch (Todo)

**Objectives:**
- Performance optimization
- Security hardening
- PWA implementation
- Documentation completion
- Deployment setup

---

## API Reference

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
│   └── modifiers/   # Modifier use cases
├── src/domain/       # Entities, repositories interfaces (Domain Layer)
├── src/infrastructure/ # DB, auth implementations (Infrastructure Layer)
│   └── database/
│       └── repositories/  # Split into 14 individual files
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
| Infrastructure (repos) | 14 | ~207 ln |

---

## Code Quality

### Quality Gates

| Check | Status | Notes |
|-------|--------|-------|
| ESLint | ✅ Configured | TypeScript + Prettier support |
| TypeScript | ✅ Strict | No `any` types |
| Tests | ✅ 83 passing | Vitest unit tests |
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
| Linting | ESLint 8.x + @typescript-eslint |
| Frontend | React 18 (Phase 4+) |

### Dependencies Status

```
npm audit: 0 vulnerabilities ✅
TypeScript: 5.9.3 ✅
Tests: 83 passing ✅
ESLint: Configured ✅
Architecture: Split complete ✅
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
npm test             # Run tests (83 passing)
npm run lint         # ESLint check
npm run test:coverage # Test coverage report
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
- 24 new unit tests for stock use cases
- 83 total unit tests passing

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

---

## Links

- [GitHub](https://github.com/thevoidsyntax/VentroPOS)
- [Backend](./src/backend/)
- [PRD](./docs/prd/README.md)
- [Developer Instructions](./CLAUDE.md)
