# VentroPos - POS Cerdas untuk Cafe Nusantara

> **Version:** 1.0.0  
> **Status:** Development  
> **License:** MIT  
> **Last Updated:** 2024

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Progress Tracker](#-progress-tracker)
3. [Phase Specifications](#-phase-specifications)
4. [API Reference](#-api-reference)
5. [Database Schema](#-database-schema)
6. [Tech Stack](#-tech-stack)
7. [Development](#-development)
8. [Recent Changes](#-recent-changes)

---

## 🎯 Overview

VentroPos adalah sistem Point of Sale (POS) berbasis cloud untuk cafe dan restoran kecil-menengah di Indonesia. Sistem ini menggabungkan kemudahan penggunaan dengan kemampuan multi-tenant yang robust.

**Key Features:**
- 🛒 Shopping Cart dengan modifiers
- 💳 Multi-Payment (Cash, QRIS, Debit, Credit, Split Bill)
- 📦 Inventory Management dengan real-time stock tracking
- 📊 Reporting Dashboard
- 🖨️ Hardware Integration (Printer, Scanner, EDC)
- 📱 PWA-ready (Tablet, Mobile, Desktop)

---

## 📊 Progress Tracker

```
✅ Phase 1: Foundation     DONE    (Backend, DB, Auth)
✅ Phase 2: Core POS       DONE    (Cart, Checkout, Orders)
⬜ Phase 3: Inventory     0%     (Stock Management)
⬜ Phase 4: Reporting     0%     (Dashboard & Reports)
⬜ Phase 5: Hardware      0%     (Printer, Scanner, EDC)
⬜ Phase 6: Launch        0%     (Polish & Deploy)
```

---

## 📦 Phase Specifications

### Phase 1: Foundation ✅ DONE

**Objectives:**
- [x] PostgreSQL database dengan multi-tenant architecture
- [x] Row-Level Security (RLS) untuk data isolation
- [x] JWT authentication dengan refresh tokens
- [x] CRUD API untuk Users, Products, Categories, Tables
- [x] Security audit passed

**Deliverables:**
- Database schema dengan RLS policies
- Authentication endpoints (`/api/v1/auth/*`)
- User management CRUD
- Product catalog CRUD
- Table management CRUD

**Test Coverage:** All security vulnerabilities fixed

---

### Phase 2: Core POS ✅ DONE

**Objectives:**
- [x] Shopping cart dengan modifiers
- [x] Checkout flow dengan multiple payment methods
- [x] Split bill support
- [x] Idempotency key untuk prevent duplicate checkout
- [x] Order status management
- [x] Modifier CRUD API

**Deliverables:**
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/checkout` - Process payment
- `PUT /api/v1/orders/:id/status` - Update status
- `POST /api/v1/orders/:id/void` - Void order
- `GET/POST/PUT/DELETE /api/v1/modifiers/*` - Modifier management

**User Stories Implemented:**
- US-001: Kasir dapat add item ke cart
- US-002: Kasir dapat modify quantity
- US-003: Kasir dapat apply discount
- US-004: Kasir dapat split bill
- US-005: Kasir dapat process payment
- US-006: Kasir dapat void item
- US-007: Kasir dapat hold order

**Test Coverage:** 59 unit tests passing

---

### Phase 3: Inventory ⬜ NEXT

**Objectives:**
- [ ] Stock level tracking per product
- [ ] Low stock alerts (threshold-based)
- [ ] Stock adjustment (manual correction)
- [ ] Stock history/log
- [ ] Restock management
- [ ] Stock opname support

**Deliverables:**
```
Stock APIs:
- GET /api/v1/stock                    - Stock overview
- GET /api/v1/stock/alerts             - Low stock alerts
- POST /api/v1/stock/adjust            - Manual adjustment
- POST /api/v1/stock/restock           - Restock items
- GET /api/v1/stock/:productId/history - Stock history
```

**User Stories:**
- US-020: Owner dapat add/edit product
- US-021: Owner dapat set stock levels
- US-022: System auto-deduct stock (on checkout)
- US-023: System alert low stock
- US-024: Owner dapat set product modifiers

**Technical Requirements:**
- Stock deduction on successful checkout (already in Phase 2)
- Low stock threshold per product
- Stock log table for audit trail
- Notification system for low stock alerts

**Phase Gate:**
- [ ] All tests passing
- [ ] npm audit: 0 vulnerabilities
- [ ] tsc --noEmit: no errors
- [ ] Documentation updated

---

### Phase 4: Reporting ⬜ TODO

**Objectives:**
- [ ] Sales report (daily, weekly, monthly)
- [ ] Product performance report
- [ ] Staff performance report
- [ ] Category breakdown
- [ ] Export to PDF/Excel

**Deliverables:**
```
Reporting APIs:
- GET /api/v1/reports/sales           - Sales summary
- GET /api/v1/reports/products        - Product performance
- GET /api/v1/reports/staff          - Staff metrics
- GET /api/v1/reports/categories      - Category breakdown
- GET /api/v1/reports/export          - Export data
```

**User Stories:**
- US-030: Owner dapat view daily sales
- US-031: Owner dapat view sales by category
- US-032: Owner dapat view top selling items
- US-033: Owner dapat view staff performance
- US-034: Owner dapat export report

---

### Phase 5: Hardware ⬜ TODO

**Objectives:**
- [ ] Receipt printer integration
- [ ] Barcode scanner support
- [ ] EDC (card terminal) integration
- [ ] Cash drawer control

**Deliverables:**
```
Hardware APIs:
- POST /api/v1/hardware/print          - Print receipt
- POST /api/v1/hardware/cash-drawer   - Open cash drawer
- GET /api/v1/hardware/status          - Device status
```

---

### Phase 6: Launch ⬜ TODO

**Objectives:**
- [ ] Performance optimization
- [ ] Security hardening
- [ ] PWA implementation
- [ ] Documentation completion
- [ ] Deployment setup

---

## 🌐 API Reference

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
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
| Stock | CRUD `/stock/*` (Phase 3) |
| Reports | GET `/reports/*` (Phase 4) |

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

## 💾 Database Schema

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
- bcrypt password hashing (cost 12)

---

## 🛠️ Tech Stack

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
| Frontend | React 18 (future - Phase 4+) |

### Dependencies Status
```
npm audit: 0 vulnerabilities ✅
TypeScript: 5.9.3 ✅
Tests: 59 passing ✅
```

---

## 🚀 Development

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
npm test             # Run tests
npm test:coverage    # Test with coverage
npm run lint         # ESLint
npm run db:migrate   # Run migrations
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ventropos

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 📝 Recent Changes

### Phase 2: Core POS - Completed
- Order item modifiers storage to `order_item_modifiers` table
- Transaction splits storage to `transaction_splits` table
- Idempotency key for checkout (prevents duplicate)
- Modifier CRUD API (`/api/v1/modifiers/*`)
- 59 unit tests passing

### Phase 1: Foundation - Completed
- PostgreSQL database dengan RLS
- JWT authentication dengan refresh tokens
- CRUD API untuk Users, Products, Categories, Tables
- Security audit passed

### Audit Fixes
- @fastify/jwt updated to 10.2.2 (fast-jwt CVE fix)
- bcrypt updated to 6.0.0 (tar vulnerability fix)
- fastify updated to 5.12.5 (DoS/validation bypass fix)
- uuid updated to 11.1.1 (buffer overflow fix)
- Table name fix: `tables` → `restaurant_tables`
- StockLogRepository.findAll() now respects filters

---

## 🔗 Links

- **GitHub:** https://github.com/thevoidsyntax/VentroPOS
- **Backend:** `src/backend/`
- **PRD:** `docs/prd/README.md`
- **CLAUDE.md:** Developer instructions

---

*Built with ☕ for the Indonesian cafe community*
