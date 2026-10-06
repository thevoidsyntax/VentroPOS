# VentroPos - Product Requirements Document

> **Version:** 1.1.0
> **Status:** Draft
> **Last Updated:** 2026-01-26

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [User Stories](#2-user-stories)
3. [Feature Specifications](#3-feature-specifications)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Success Metrics](#5-success-metrics)
6. [Frontend / UI-UX](#6-frontend--uiux)
7. [Glossary](#7-glossary)

---

## 1. Vision & Goals

### 1.1 Product Vision

VentroPos adalah **Point of Sale system berbasis cloud** yang dirancang khusus untuk cafe dan restoran kecil-menengah di Indonesia. Sistem ini menggabungkan kemudahan penggunaan dengan kemampuan multi-tenant yang robust, memungkinkan satu deployment melayani multiple outlet dengan isolasi data yang ketat.

**Tagline:** *"POS Cerdas untuk Cafe Nusantara"*

### 1.2 Problem Statement

| Pain Point | Solution |
|------------|----------|
| Kasir harus input manual saat internet down | Offline-capable architecture |
| Setup POS mahal untuk cafe kecil | Affordable SaaS model |
| sulit scale saat punya cabang baru | Multi-tenant architecture |
| Hardware integration rumit | Plug-and-play hardware support |
| Reporting manual dengan Excel | Real-time dashboard & reports |

### 1.3 Goals

#### Primary Goals (MVP)
1. **Core POS Operations** - Cart, checkout, multi-payment
2. **Table Management** - Track orders per meja
3. **Inventory Control** - Stock tracking & alerts
4. **Basic Reporting** - Daily sales summary
5. **Multi-Tenant Security** - Data isolation antar tenant

#### Secondary Goals (Post-MVP)
1. Kitchen Display System (KDS)
2. Customer Loyalty Program
3. Online Ordering Integration
4. Advanced Analytics
5. API for third-party integrations

### 1.4 Target Users

| User Role | Description | Access Level |
|-----------|-------------|--------------|
| **Owner** | Pemilik cafe | Full access, all reports |
| **Manager** | Pengelola harian | Full POS + reports |
| **Kasir** | Petugas kasir | POS operations only |
| **Kitchen Staff** | Staff dapur | Order queue view only |

### 1.5 Target Market

- **Primary:** Cafe & coffee shop (< 50 seats)
- **Secondary:** Quick service restaurants, bakeries
- **Geography:** Indonesia
- **Scale per tenant:** 1-50 staff, 1-10 terminal kasir

---

## 2. User Stories

### 2.1 Epic: POS Operations

```
AS A kasir
I WANT TO process customer orders quickly
SO THAT customers don't have to wait in long queues
```

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-001 | Kasir dapat add item ke cart | Item muncul di cart dengan qty correct |
| US-002 | Kasir dapat modify quantity | Qty update realtime, price recalculate |
| US-003 | Kasir dapat apply discount | Discount % atau nominal, reflected di total |
| US-004 | Kasir dapat split bill | Bill dibagi per item atau equally |
| US-005 | Kasir dapat process payment | Payment recorded, receipt printed |
| US-006 | Kasir dapat void item | Item removed, stock restored |
| US-007 | Kasir dapat hold order | Order saved for later, not yet paid |

### 2.2 Epic: Table Management

```
AS A manager
I WANT TO track table status
SO THAT I can optimize seating and service
```

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-010 | Manager dapat view table layout | Visual grid showing all tables |
| US-011 | Kasir dapat assign order ke meja | Order linked to specific table |
| US-012 | Kasir dapat update order status | Status: pending → cooking → served → paid |
| US-013 | Manager dapat merge tables | Combined orders into single bill |

### 2.3 Epic: Inventory Management

```
AS A owner
I WANT TO track stock levels
SO THAT I never run out of popular items
```

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-020 | Owner dapat add/edit product | Product catalog updated |
| US-021 | Owner dapat set stock levels | Stock qty recorded per product |
| US-022 | System auto-deduct stock | Stock reduced on successful sale |
| US-023 | System alert low stock | Notification when stock < threshold |
| US-024 | Owner dapat set product modifiers | Size (S/M/L), extras (less sugar, extra shot) |

### 2.4 Epic: Reporting

```
AS A owner
I WANT TO see sales performance
SO THAT I can make data-driven decisions
```

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-030 | Owner dapat view daily sales | Total revenue, transaction count |
| US-031 | Owner dapat view sales by category | Breakdown per product category |
| US-032 | Owner dapat view top selling items | Ranked list by quantity sold |
| US-033 | Owner dapat view staff performance | Sales per kasir |
| US-034 | Owner dapat export report | Export to PDF/Excel |

### 2.5 Epic: Security & Multi-Tenancy

```
AS A system
I WANT TO isolate data per tenant
SO THAT Cafe A cannot see Cafe B's data
```

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-040 | System enforce tenant isolation | All queries filtered by tenant_id |
| US-041 | Owner dapat manage staff accounts | CRUD user accounts |
| US-042 | Owner dapat set role permissions | Role-based access control |
| US-043 | All actions are audited | Activity log maintained |

---

## 3. Feature Specifications

### 3.1 Core POS Features

#### F-001: Product Catalog
```
Description: Master data untuk semua produk yang dijual
Fields:
  - id (UUID)
  - tenant_id (UUID)
  - name (string, required)
  - sku (string, unique per tenant)
  - category_id (FK)
  - price (decimal)
  - cost (decimal, internal)
  - stock_quantity (integer)
  - low_stock_threshold (integer)
  - is_active (boolean)
  - image_url (string, optional)
  - modifiers (JSON)
  - created_at, updated_at
```

#### F-002: Shopping Cart
```
Description: Temporary cart untuk order yang sedang dibuat
Features:
  - Add item dengan qty
  - Update qty
  - Remove item
  - Apply discount (% atau fixed)
  - Add notes per item
  - Calculate subtotal, tax, total
```

#### F-003: Checkout Flow
```
Steps:
  1. Review cart
  2. Select payment method
  3. Process payment
  4. Generate receipt
  5. Print receipt
  6. Update inventory
  7. Record transaction
```

#### F-004: Payment Methods
```
Supported:
  - Cash (with change calculation)
  - QRIS (GoPay, OVO, Dana, etc.)
  - Debit/Credit Card (EDC integration)
  - Split payment (multiple methods)
```

### 3.2 Table Management

#### F-010: Table Setup
```
Description: Konfigurasi layout meja
Fields:
  - id (UUID)
  - tenant_id (UUID)
  - table_number (string)
  - capacity (integer)
  - status (available/occupied/reserved)
  - position_x, position_y (for visual layout)
```

#### F-011: Order Status
```
States:
  [pending] → [confirmed] → [preparing] → [ready] → [served] → [paid]
  
Transitions:
  - pending: Created, awaiting confirmation
  - confirmed: Customer confirmed, sent to kitchen
  - preparing: Kitchen is working on it
  - ready: Food ready to serve
  - served: Delivered to customer
  - paid: Transaction completed
```

### 3.3 Inventory Management

#### F-020: Stock Operations
```
Operations:
  - Receive stock (restock)
  - Deduct stock (sale)
  - Adjust stock (manual correction)
  - Stock opname (audit)
```

#### F-021: Low Stock Alert
```
Trigger: stock_quantity < low_stock_threshold
Action: Send notification to owner
Channels: In-app notification, Email (future)
```

### 3.4 Reporting

#### F-030: Sales Report
```
Metrics:
  - Total sales (gross & net)
  - Transaction count
  - Average order value
  - Payment method breakdown
  
Filters:
  - Date range
  - Category
  - Staff
  - Terminal
```

#### F-031: Product Performance
```
Metrics:
  - Quantity sold per product
  - Revenue per product
  - Stock turnover rate
```

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | P75 |
| API Response Time | < 200ms | P95 |
| Transaction Processing | < 1s | End-to-end |
| Concurrent Users | 50 per tenant | Load test |
| Offline Mode Recovery | < 5s | After connectivity restored |

### 4.2 Scalability

| Dimension | MVP Target | Max (Post-MVP) |
|-----------|------------|----------------|
| Tenants | 1-10 | 100+ |
| Staff per tenant | 1-50 | 500+ |
| Transactions per day | 500 | 50,000+ |
| Products per tenant | 500 | 10,000+ |

### 4.3 Security

| Requirement | Implementation |
|-------------|----------------|
| Data Isolation | PostgreSQL Row-Level Security (RLS) |
| Authentication | JWT with refresh tokens |
| Authorization | Role-Based Access Control (RBAC) |
| Audit Trail | All mutations logged with user_id, timestamp |
| Data Encryption | HTTPS (TLS 1.3), at-rest encryption |
| Input Validation | All inputs sanitized and validated |

### 4.4 Reliability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% |
| Max downtime per incident | < 30 minutes |
| Data backup frequency | Every 6 hours |
| Recovery Point Objective (RPO) | < 1 hour |
| Recovery Time Objective (RTO) | < 30 minutes |

### 4.5 Compatibility

| Platform | Browser | Version |
|----------|---------|---------|
| Desktop | Chrome | 90+ |
| Desktop | Firefox | 88+ |
| Desktop | Edge | 90+ |
| Tablet | Safari (iPad) | 14+ |
| Tablet | Chrome (Android) | 90+ |
| Mobile | Safari (iPhone) | 14+ |
| Mobile | Chrome (Android) | 90+ |

### 4.6 Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support

---

## 5. Success Metrics

### 5.1 Technical Metrics

| Metric | Baseline | Target | Current |
|--------|----------|--------|---------|
| API Error Rate | - | < 0.1% | - |
| Page Performance Score | - | > 90 (Lighthouse) | - |
| Test Coverage | - | > 80% | - |
| Security Vulnerabilities | - | 0 Critical/High | - |

### 5.2 Business Metrics

| Metric | Definition | Target (6 months) |
|--------|------------|------------------|
| Active Tenants | Tenants with >1 transaction/week | 10 |
| Retention Rate | Tenants still active after 3 months | 80% |
| NPS Score | Net Promoter Score from survey | > 50 |
| Support Tickets | Avg tickets per tenant per month | < 5 |

### 5.3 Product Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Transaction Success Rate | % orders completed without error | 99.9% |
| Time to First Order | Time from signup to first sale | < 1 day |
| Daily Active Users | Unique users with >1 transaction/day | 50 |
| Feature Adoption | % tenants using reporting module | 70% |

---

## 6. Frontend / UI-UX

### 6.1 Tech Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | React 18 + Vite | Fast dev, great DX |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS + shadcn/ui | Beautiful, accessible |
| State | Zustand | Lightweight, simple API |
| Data Fetching | TanStack Query | Caching, offline support |
| Routing | React Router 6 | Standard, stable |
| Charts | Recharts | React-native |
| PWA | vite-plugin-pwa | Easy offline setup |
| Icons | Lucide React | Consistent, beautiful |

### 6.2 Responsive Strategy

**Primary: Tablet (768px - 1024px)**

Kasir menggunakan tablet di counter kasir.

| Breakpoint | Device | Priority |
|------------|--------|----------|
| `< 768px` | Mobile | Secondary |
| `768px - 1024px` | Tablet | **Primary** |
| `> 1024px` | Desktop | Backoffice only |

**Layout Principles:**
- Touch-first: Large tap targets (min 44x44px)
- Minimal typing: Barcode scanner, dropdowns
- Glanceable: Clear status indicators
- Offline-capable: Queue actions when disconnected

### 6.3 Design System

#### Color Palette

```
Primary:     #2563EB (Blue-600)
Secondary:   #7C3AED (Violet-600)
Success:     #16A34A (Green-600)
Warning:     #CA8A04 (Yellow-600)
Danger:      #DC2626 (Red-600)
Background:  #F8FAFC (Slate-50)
Surface:     #FFFFFF
Text:        #1E293B (Slate-800)
Text-muted:  #64748B (Slate-500)
```

#### Typography

```
Font:        Inter (system-ui fallback)
Heading 1:   24px / Bold
Heading 2:   20px / Semibold
Heading 3:   16px / Semibold
Body:        14px / Regular
Caption:     12px / Regular
```

#### Spacing

```
Base unit: 4px
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
Card padding: 16px
Section gap: 24px
Page margin: 16px (mobile), 24px (tablet), 32px (desktop)
```

#### Components

| Component | States | Notes |
|-----------|---------|-------|
| Button | default, hover, active, disabled, loading | Min height 44px |
| Input | default, focus, error, disabled | Clear visual feedback |
| Card | default, hover (if clickable) | Elevation for hierarchy |
| Badge | success, warning, danger, neutral | For status indicators |
| Modal | - | Backdrop blur, centered |
| Toast | success, error, info | Auto-dismiss 3s |

### 6.4 Page Structure

#### Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Logo, User Menu, Notifications          │
├────────────┬──────────────────────────────────────┤
│            │                                      │
│  Sidebar  │  Main Content                        │
│  (collapsible)  │                              │
│            │                                      │
│            │                                      │
│            │                                      │
└────────────┴────────────────────────────────────┘
```

**Header (56px height):**
- Logo (left)
- Quick actions (center) - New Order, Search
- User menu + notifications (right)

**Sidebar (240px width, collapsible to 64px icons):**
- Navigation items with icons
- Active state indicator
- Role-based visibility

#### POS Grid Layout (Tablet Primary)

```
┌─────────────────────────────────────────────────┐
│  Category Tabs (horizontal scroll)              │
├───────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │     │ │     │ │     │ │     │  Product    │
│  │ [img] │ │[img] │ │[img] │ │[img] │  Grid      │
│  │       │ │       │ │       │ │       │  (3-4 col) │
│  │ Name  │ │ Name  │ │ Name  │ │ Name  │           │
│  │ Rp XX │ │ Rp XX │ │ Rp XX │ │ Rp XX │           │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────────────────┘
│  Current Order Summary (sticky bottom)         │
│  [View Cart (X items)] ──────────── [PAY]   │
└─────────────────────────────────────────────────┘
```

### 6.5 Page Specifications

#### P0 - Critical (Kasir Flow)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + password, remember me |
| POS Grid | `/pos` | Product catalog, category tabs, cart trigger |
| Cart Drawer | Slide-in panel | Current items, qty adjust, notes |
| Checkout | `/checkout` | Payment method, amount, change |
| Receipt | Modal/Print | Transaction summary |

#### P1 - Important (Manager Flow)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Sales overview, today's metrics |
| Orders | `/orders` | Order history, filters, search |
| Order Detail | `/orders/:id` | Full order info, actions (void, reprint) |
| Products | `/products` | CRUD products, categories |
| Stock | `/stock` | Stock overview, alerts, opname |

#### P2 - Nice to Have (Owner Flow)

| Page | Route | Description |
|------|-------|-------------|
| Reports | `/reports` | Sales, products, staff analytics |
| Reports Export | `/reports/export` | CSV/PDF download |
| Tables | `/tables` | Visual table layout, status |
| Users | `/users` | Staff management, roles |
| Settings | `/settings` | Store config, hardware, taxes |

### 6.6 User Flows

#### Flow 1: Checkout (Kasir)

```
[POS Grid]
    │
    ├─[Tap Product]─→ [Cart Drawer slides in]
    │                         │
    │                   [Adjust qty/notes]
    │                         │
    │                         ▼
    │                   [Tap "Bayar"]
    │                         │
    ▼                         ▼
[Badge update]          [Checkout Page]
                              │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              [Cash]      [QRIS]    [Card/EDC]
                    │           │           │
                    ▼           ▼           ▼
              [Enter amount]  [QR Code   [EDC process]
                    │    displayed]        │
                    ▼           ▼           ▼
               [Change shown] [Wait confirm] [Success]
                    │           │           │
                    └───────────┴───────────┘
                                  │
                                  ▼
                           [Receipt Modal]
                                  │
                                  ▼
                           [Print + Return to POS]
```

#### Flow 2: Stock Opname (Manager)

```
[Stock Page] → [Tap "Stock Opname"] → [Create Session]
                                              │
                                              ▼
                                    [Select products to count]
                                              │
                                              ▼
                                    [Physical counting mode]
                                              │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              [Count A]              [Count B]
                                    │                       │
                                    ▼                       ▼
                              [Enter qty]            [Enter qty]
                                    │                       │
                                    └───────────┬───────────┘
                                                ▼
                                        [Submit Count]
                                                │
                                                ▼
                                        [Review Variance]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              [Confirm Adjust]        [Cancel]
                                    │                       │
                                    ▼                       ▼
                              [Stock Updated]      [Session Cancelled]
                                    │
                                    ▼
                              [Back to Stock Page]
```

### 6.7 Component Specifications

#### Product Card (POS Grid)

```
┌──────────────────┐
│                  │
│    [Product     │
│      Image       │
│     80x80px     │
│                  │
├──────────────────┤
│ Product Name      │  ← 14px, truncate if >2 lines
│ Rp 25.000       │  ← 16px bold, price formatting
│                  │
│ [Stock: 12]     │  ← 12px, danger color if < threshold
└──────────────────┘
  Min size: 100x140px
  Tap area: Full card
  States: default, low-stock (danger border), out-of-stock (grayed)
```

#### Cart Item Row

```
┌─────────────────────────────────────────────┐
│ [img] Product Name              [Qty: - 2 +] │
│        Modifier 1, Modifier 2        Rp 50.000 │
│        [Edit] [Delete]                    │
└─────────────────────────────────────────────┘
  Swipe left to delete (mobile)
  Inline edit for qty (tablet)
```

#### Order Status Badge

| Status | Color | Background | Text |
|--------|-------|------------|------|
| pending | Blue | Blue-50 | Blue-600 |
| confirmed | Violet | Violet-50 | Violet-600 |
| preparing | Orange | Orange-50 | Orange-600 |
| ready | Green | Green-50 | Green-600 |
| served | Slate | Slate-100 | Slate-600 |
| paid | Green | Green-100 | Green-700 |
| voided | Red | Red-50 | Red-600 |

### 6.8 API-UI Mapping

| Backend Endpoint | Frontend Page/Component | Data Fetching |
|-----------------|-------------------------|---------------|
| `GET /products` | POS Grid, Product List | TanStack Query + cache |
| `POST /orders` | Cart → Order | Mutation + optimistic update |
| `POST /orders/checkout` | Checkout | Mutation + redirect |
| `GET /reports/sales` | Dashboard | TanStack Query + date filter |
| `POST /stock/opnames` | Stock Opname | Mutation + wizard state |
| `GET /hardware/devices` | Settings → Hardware | TanStack Query |
| `POST /hardware/print` | Receipt print | Mutation + printer queue |

### 6.9 Offline Strategy

**TanStack Query + IndexedDB**

```
┌─────────────────────────────────────────────────┐
│  Online Mode (default)                         │
│  ├─ Fetch from API                            │
│  ├─ Update cache on mutation                 │
│  └─ Show stale data briefly on reconnect      │
├─────────────────────────────────────────────┤
│  Offline Mode (detected via navigator.onLine)  │
│  ├─ Show offline banner                      │
│  ├─ Queue mutations in IndexedDB              │
│  ├─ Show cached products (TanStack Query)     │
│  └─ "Sync pending" badge on synced actions   │
├─────────────────────────────────────────────┤
│  Reconnect                                  │
│  ├─ Flush mutation queue                    │
│  ├─ Refresh critical queries                │
│  └─ Toast: "Back online, data synced"      │
└─────────────────────────────────────────────┘
```

### 6.10 Frontend Phases & Skills

| Phase | Pages | Priority | Duration | Skills |
|-------|-------|----------|----------|--------|
| **Phase 7** | Setup, Login, POS Grid, Cart, Checkout | P0 | 1-2 weeks | `/frontend` (auto), `/ui-ux-pro-max` (manual) |
| **Phase 8** | Orders, Order Detail, Void | P0 | 3-5 days | `/frontend` (auto) |
| **Phase 9** | Products, Categories, Modifiers | P1 | 3-5 days | `/frontend` (auto), `/ui-ux-pro-max-styling` (manual) |
| **Phase 10** | Stock, Alerts, Opname | P1 | 3-5 days | `/frontend` (auto) |
| **Phase 11** | Dashboard, Reports, Export | P1 | 3-5 days | `/frontend` (auto), `/performance` (auto) |
| **Phase 12** | Tables, Users, Settings | P2 | 3-5 days | `/frontend` (auto) |
| **Phase 13** | PWA: Offline, Install, Notifications | P2 | 2-3 days | `/frontend` (auto), `/performance` (auto) |

#### Skill Integration Guide

**Auto-invoke skills** (triggered by file patterns or keywords):
```
/frontend      → File: **/*.tsx, **/*.jsx
/testing       → File: tests/**, "test", "coverage"
/performance   → Keywords: "performance", "bundle", "core web vitals"
/diagnosing-bugs → Keywords: "bug", "error", "fix"
```

**Manual-invoke skills** (call explicitly when needed):
```
/ui-ux-pro-max              → Before UI work: "What makes this look human?"
/ui-ux-pro-max-styling     → Styling components with Tailwind + shadcn
/ui-ux-pro-max-design-system → Setup design tokens (colors, typography, spacing)
```

#### Recommended Skill Workflow

```
1. Start feature: /frontend (auto triggers)
2. UI assessment: /ui-ux-pro-max (manual)
3. Design tokens: /ui-ux-pro-max-design-system (manual)
4. Component styling: /ui-ux-pro-max-styling (manual per component)
5. Performance: /performance (auto when keywords detected)
6. Testing: /testing (auto when keywords detected)
```

---

## 7. Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A single cafe/outlet in the multi-tenant system |
| **Terminal** | A POS device (tablet/desktop) used for transactions |
| **Order** | A customer order containing one or more items |
| **Transaction** | A completed payment (one or more orders) |
| **Modifier** | Customization options for a product (e.g., size, extras) |
| **KDS** | Kitchen Display System - screen for kitchen staff |
| **EDC** | Electronic Data Capture - card payment terminal |
| **QRIS** | QR Code Indonesian Standard -统一QR payment |
| **RLS** | Row-Level Security - PostgreSQL feature for data isolation |
| **RBAC** | Role-Based Access Control |

---

## Appendix

### A. Technical Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + TailwindCSS + PWA |
| Backend | Node.js + TypeScript + Fastify |
| Database | PostgreSQL with RLS |
| Cache | Redis |
| Auth | JWT + Refresh Tokens |
| Deployment | Docker + VPS |

### B. API Versioning

- Base URL: `/api/v1`
- Version header: `X-API-Version: 1.0.0`
- Deprecation policy: 90 days notice

### C. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | thevoidsyntax | Initial draft |
| 1.1.0 | 2026-01-26 | Claude | Added Frontend/UI-UX section (Phase 7-13) |

---

*Maintained by: thevoidsyntax*
