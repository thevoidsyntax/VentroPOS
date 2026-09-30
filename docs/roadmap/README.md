# VentroPos - Project Roadmap

> **Version:** 1.0.0  
> **Status:** Active  
> **Last Updated:** 2024

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENTROPOS DEVELOPMENT PHASES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1 ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  Foundation (Backend + DB + Auth)                              │
│  Est: 2-3 weeks | Status: 🔴 Not Started                      │
│                                                                  │
│  PHASE 2 ░░░░░░░░░░░░░░░██████████████████░░░░░░░░░░░░░░░░░░░   │
│  Core POS (Cart + Checkout)                                    │
│  Est: 2-3 weeks | Status: ⬜ Pending                          │
│                                                                  │
│  PHASE 3 ░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░   │
│  Inventory Module                                              │
│  Est: 1-2 weeks | Status: ⬜ Pending                          │
│                                                                  │
│  PHASE 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████░░   │
│  Reporting & Dashboard                                         │
│  Est: 1-2 weeks | Status: ⬜ Pending                          │
│                                                                  │
│  PHASE 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████   │
│  Hardware Integration                                          │
│  Est: 1-2 weeks | Status: ⬜ Pending                          │
│                                                                  │
│  PHASE 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  Polish & Launch                                              │
│  Est: 1 week | Status: ⬜ Pending                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  TOTAL ESTIMATED: 8-13 weeks (Solo Developer)                 │
│  Mode: Part-time (assuming 4-6 hours/day)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Backend + Database + Auth)

### Timeline
- **Estimated Duration:** 2-3 weeks
- **Complexity:** ⭐⭐⭐ Medium-High
- **Prerequisites:** None

### Objectives

1. Setup PostgreSQL database with multi-tenant architecture
2. Implement Row-Level Security (RLS)
3. Create authentication system (JWT)
4. Build core API structure with versioning
5. Setup project scaffolding

### Deliverables

#### Database Schema
```
Tables:
├── tenants (id, name, domain, settings, plan, created_at)
├── users (id, tenant_id, email, password_hash, role, is_active)
├── categories (id, tenant_id, name, parent_id, sort_order)
├── products (id, tenant_id, name, sku, category_id, price, ...)
├── tables (id, tenant_id, number, capacity, position_x, position_y)
├── orders (id, tenant_id, table_id, user_id, status, ...)
├── order_items (id, order_id, product_id, qty, price, modifiers)
├── transactions (id, tenant_id, order_id, amount, method, ...)
├── stock_logs (id, tenant_id, product_id, type, qty, ...)
└── audit_logs (id, tenant_id, user_id, action, entity, ...)
```

#### API Endpoints
```
POST   /api/v1/auth/register     - Register new tenant
POST   /api/v1/auth/login        - Login
POST   /api/v1/auth/refresh     - Refresh token
GET    /api/v1/auth/me           - Current user info

GET    /api/v1/users            - List users (admin)
POST   /api/v1/users            - Create user
GET    /api/v1/users/:id         - Get user
PUT    /api/v1/users/:id         - Update user
DELETE /api/v1/users/:id         - Deactivate user

GET    /api/v1/categories       - List categories
POST   /api/v1/categories        - Create category
PUT    /api/v1/categories/:id    - Update category
DELETE /api/v1/categories/:id    - Delete category

GET    /api/v1/products          - List products
POST   /api/v1/products          - Create product
GET    /api/v1/products/:id      - Get product
PUT    /api/v1/products/:id      - Update product
DELETE /api/v1/products/:id      - Delete product

GET    /api/v1/tables           - List tables
POST   /api/v1/tables           - Create table
PUT    /api/v1/tables/:id       - Update table
DELETE /api/v1/tables/:id       - Delete table
```

### Acceptance Criteria

- [ ] Database migrations run successfully
- [ ] RLS policies prevent cross-tenant data access
- [ ] User can register new tenant
- [ ] User can login and receive JWT
- [ ] All CRUD operations work for categories, products, tables
- [ ] Role-based access control enforced
- [ ] API returns proper error responses
- [ ] Unit tests for core services (>80% coverage)

### Dependencies
- None (Starting phase)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS complexity underestimated | Medium | Research PostgreSQL RLS thoroughly first |
| JWT security issues | High | Follow OWASP guidelines, use proven library |

---

## Phase 2: Core POS (Cart + Checkout)

### Timeline
- **Estimated Duration:** 2-3 weeks
- **Complexity:** ⭐⭐⭐⭐ High
- **Prerequisites:** Phase 1 Complete

### Objectives

1. Build shopping cart functionality
2. Implement checkout flow
3. Support multiple payment methods
4. Create order management
5. Implement table order workflow

### Deliverables

#### Shopping Cart API
```
POST   /api/v1/cart/items         - Add item to cart
PUT    /api/v1/cart/items/:id    - Update item qty/modifiers
DELETE /api/v1/cart/items/:id    - Remove item
DELETE /api/v1/cart             - Clear cart
GET    /api/v1/cart              - Get current cart

POST   /api/v1/cart/discount     - Apply discount
```

#### Order API
```
POST   /api/v1/orders           - Create order from cart
GET    /api/v1/orders           - List orders
GET    /api/v1/orders/:id       - Get order details
PUT    /api/v1/orders/:id/status - Update order status
POST   /api/v1/orders/:id/void  - Void order
POST   /api/v1/orders/:id/hold  - Hold order
POST   /api/v1/orders/:id/resume - Resume held order
```

#### Checkout API
```
POST   /api/v1/checkout          - Process payment
POST   /api/v1/checkout/split     - Split bill
GET    /api/v1/transactions       - List transactions
GET    /api/v1/transactions/:id   - Transaction details
```

### Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   CART   │────▶│ CHECKOUT │────▶│ PAYMENT  │
└──────────┘     └──────────┘     └──────────┘
                     │                   │
                     │                   ▼
               [validate]         ┌──────────┐
                     │            │ PROCESS  │
                     ▼            │ PAYMENT  │
              ┌──────────┐        └──────────┘
              │ STOCK    │              │
              │ DEDUCT   │              ▼
              └──────────┘        ┌──────────┐
                                   │ RECEIPT │
                                   │ GENERATE│
                                   └──────────┘
```

### Acceptance Criteria

- [ ] Cart operations (add, update, remove) work correctly
- [ ] Order created from cart
- [ ] Stock auto-deducts on successful order
- [ ] All payment methods process correctly
- [ ] Split bill divides correctly
- [ ] Order status transitions work
- [ ] Receipt generated with correct data
- [ ] Void order restores stock

---

## Phase 3: Inventory Module

### Timeline
- **Estimated Duration:** 1-2 weeks
- **Complexity:** ⭐⭐⭐ Medium
- **Prerequisites:** Phase 1 & 2 Complete

### Objectives

1. Stock management dashboard
2. Low stock alerts
3. Stock adjustment
4. Stock history/audit
5. Product modifiers

### Deliverables

#### Stock API
```
GET    /api/v1/stock              - Stock overview
GET    /api/v1/stock/:product_id  - Stock detail
POST   /api/v1/stock/receive      - Receive stock (restock)
POST   /api/v1/stock/adjust       - Manual adjustment
GET    /api/v1/stock/history      - Stock change history
GET    /api/v1/stock/alerts       - Low stock alerts
```

#### Modifier API
```
GET    /api/v1/modifiers          - List modifier groups
POST   /api/v1/modifiers          - Create modifier group
PUT    /api/v1/modifiers/:id      - Update modifier
DELETE /api/v1/modifiers/:id      - Delete modifier
```

### Stock Flow

```
                    ┌──────────────┐
                    │   PRODUCT    │
                    │   CREATED   │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  SALE    │  │ RESTOCK  │  │ADJUSTMENT│
     │  (-)     │  │   (+)    │  │  (+/-)   │
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                 ┌──────────────┐
                 │  STOCK LOG   │
                 │  (Audit)     │
                 └──────────────┘
```

### Acceptance Criteria

- [ ] Stock levels accurate after each sale
- [ ] Low stock alerts trigger correctly
- [ ] Stock adjustments create audit trail
- [ ] Product modifiers apply in cart
- [ ] Stock history shows all changes

---

## Phase 4: Reporting & Dashboard

### Timeline
- **Estimated Duration:** 1-2 weeks
- **Complexity:** ⭐⭐⭐ Medium
- **Prerequisites:** Phase 1-3 Complete

### Objectives

1. Dashboard with key metrics
2. Sales reports (daily, weekly, monthly)
3. Product performance report
4. Staff performance report
5. Export capabilities

### Deliverables

#### Dashboard API
```
GET    /api/v1/dashboard/summary   - Today's summary
GET    /api/v1/reports/sales       - Sales report
GET    /api/v1/reports/products    - Product performance
GET    /api/v1/reports/staff       - Staff performance
GET    /api/v1/reports/inventory   - Inventory report
GET    /api/v1/reports/export      - Export to PDF/Excel
```

### Dashboard Metrics

```
┌─────────────────────────────────────────────────────┐
│  TODAY'S SUMMARY                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Rp 2.5M  │  │   127    │  │  3.2 min │         │
│  │ Revenue  │  │ Orders   │  │ Avg Time │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│  TOP PRODUCTS          │  SALES TREND               │
│  1. Americano (45)    │  ▓▓▓▓▓░░ (today)         │
│  2. Latte (38)        │  ▓▓▓▓▓▓▓░ (yesterday)     │
│  3. Nasi Goreng (32)  │  ▓▓▓▓▓▓▓▓ (last week avg)  │
└─────────────────────────────────────────────────────┘
```

### Acceptance Criteria

- [ ] Dashboard loads < 2s
- [ ] All report filters work
- [ ] Data accurate with source data
- [ ] Export generates valid PDF/Excel
- [ ] Charts render correctly

---

## Phase 5: Hardware Integration

### Timeline
- **Estimated Duration:** 1-2 weeks
- **Complexity:** ⭐⭐⭐⭐ High
- **Prerequisites:** Phase 2 Complete

### Objectives

1. Receipt printer integration (ESC/POS)
2. Barcode scanner support
3. Cash drawer control
4. EDC/POS terminal integration
5. Print queue management

### Deliverables

#### Printer API
```
POST   /api/v1/print/receipt     - Print receipt
POST   /api/v1/print/kitchen     - Print kitchen order
GET    /api/v1/print/queue       - Print queue status
DELETE /api/v1/print/queue/:id   - Cancel print job
```

#### Hardware Service
```
ReceiptPrinter:
  - ESC/POS protocol support
  - QR code printing
  - Logo printing
  - Custom formatting

CashDrawer:
  - RJ-11 trigger
  - Open via command

Scanner:
  - USB HID mode
  - Barcode detection in input

EDC:
  - Integration with midtrans
  - Payment confirmation webhook
```

### Hardware Architecture

```
┌─────────────────────────────────────────────────────┐
│                   POS APPLICATION                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  UI Layer    │  │ Hardware     │                │
│  │  (React)    │  │ Service      │                │
│  └──────────────┘  └──────────────┘                │
│         │                  │                        │
│         │            ┌─────┴─────┐                  │
│         │            │           │                  │
│         │      ┌─────▼───┐ ┌────▼────┐             │
│         │      │ Receipt │ │  EDC    │             │
│         │      │Printer  │ │ Terminal│             │
│         │      └─────────┘ └─────────┘             │
│         │            │                            │
│         │      ┌─────▼───┐                        │
│         │      │ Cash    │                        │
│         │      │ Drawer  │                        │
│         │      └─────────┘                        │
└─────────────────────────────────────────────────────┘
```

### Acceptance Criteria

- [ ] Receipt prints with all required data
- [ ] QR code scannable
- [ ] Cash drawer opens on payment
- [ ] EDC payment completes successfully
- [ ] Print queue handles errors gracefully

---

## Phase 6: Polish & Launch

### Timeline
- **Estimated Duration:** 1 week
- **Complexity:** ⭐⭐ Medium
- **Prerequisites:** Phase 1-5 Complete

### Objectives

1. PWA optimization
2. Performance optimization
3. Security audit
4. Documentation finalization
5. Deployment setup

### Deliverables

#### PWA Setup
```
Service Worker:
  - Offline shell
  - Cache strategies
  - Background sync

Manifest:
  - App icons
  - Theme colors
  - Standalone display

Install Prompt:
  - Custom install UI
  - Defer until engaged
```

#### Performance Optimization
- Lighthouse score > 90
- Core Web Vitals optimized
- Bundle size optimized
- Image optimization

#### Final Documentation
- API documentation (Swagger)
- User manual
- Deployment guide
- Troubleshooting guide

### Launch Checklist

```
PRE-LAUNCH:
[ ] All acceptance criteria met
[ ] Security audit passed
[ ] Performance benchmarks met
[ ] Documentation complete
[ ] Test account created

LAUNCH DAY:
[ ] DNS configured
[ ] SSL certificate active
[ ] Monitoring active
[ ] Backup verified
[ ] Support channels ready

POST-LAUNCH:
[ ] Monitor error rates
[ ] Collect user feedback
[ ] Plan next iteration
```

---

## Timeline Summary

```
Week  │ Phase 1 │ Phase 2 │ Phase 3 │ Phase 4 │ Phase 5 │ Phase 6 │
──────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
1     │ ████    │         │         │         │         │         │
2     │ ████    │ ████    │         │         │         │         │
3     │         │ ████    │ ████    │         │         │         │
4     │         │          │ ████    │ ████    │         │         │
5     │         │          │         │ ████    │ ████    │         │
6     │         │          │         │         │ ████    │ ████    │
7     │         │          │         │         │         │ ████    │
8     │         │          │         │         │         │         │
──────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Legend: ████ = Active Development

Note: Timeline assumes 4-6 hours/day part-time development.
Full-time development may reduce timeline by 40-50%.
```

---

## Phase Gate Criteria

Each phase must pass these gates before moving to next:

```
┌─────────────────────────────────────────────────────┐
│  PHASE GATE CHECKLIST                               │
│                                                      │
│  CODE GATE:                                         │
│  [ ] All unit tests passing                        │
│  [ ] Code coverage > 80%                           │
│  [ ] No critical/high security findings            │
│  [ ] Linting passes                               │
│  [ ] TypeScript compiles without errors            │
│                                                      │
│  REVIEW GATE:                                      │
│  [ ] Code review completed                         │
│  [ ] All comments addressed                        │
│  [ ] Architecture patterns followed                │
│                                                      │
│  DOCUMENTATION GATE:                               │
│  [ ] Changelog updated                            │
│  [ ] API docs updated                             │
│  [ ] README updated if needed                     │
│                                                      │
│  DEPLOYMENT GATE:                                 │
│  [ ] Runs on staging environment                  │
│  [ ] Smoke tests pass                             │
│  [ ] Rollback plan documented                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

➡️ **[Go to Phase 1: Foundation](./phase-1-foundation.md)**

---

*Maintained by: thevoidsyntax*  
*Last updated: 2024*
