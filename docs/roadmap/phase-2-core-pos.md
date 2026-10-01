# Phase 2: Core POS - Cart, Checkout & Orders

> **Version:** 1.0.0
> **Status:** ✅ Completed
> **Start Date:** TBD
> **Completed:** 2024

---

## Overview

Phase 2 implements the core POS functionality - shopping cart, order management, checkout flow with multiple payment methods, and modifier support.

---

## Objectives

1. ✅ Shopping cart & order creation with modifiers
2. ✅ Checkout flow with multiple payment methods
3. ✅ Split bill support
4. ✅ Idempotency key for checkout
5. ✅ Order status management
6. ✅ Modifier CRUD API
7. ✅ Unit tests

---

## New API Endpoints

### Orders
```
POST   /orders                    - Create order
GET    /orders                    - List orders (with filters)
GET    /orders/:id                - Get order
PUT    /orders/:id/status         - Update order status
POST   /orders/:id/void           - Void paid order
POST   /orders/:id/hold           - Hold order
POST   /orders/:id/resume         - Resume held order
POST   /orders/checkout           - Process checkout
```

### Modifiers
```
GET    /modifiers/groups                    - List modifier groups
POST   /modifiers/groups                    - Create modifier group
GET    /modifiers/groups/:id                - Get modifier group
PUT    /modifiers/groups/:id                - Update modifier group
DELETE /modifiers/groups/:id                - Delete modifier group
GET    /modifiers/groups/:groupId/modifiers - List modifiers in group
POST   /modifiers/groups/:groupId/modifiers - Create modifier
PUT    /modifiers/modifiers/:id             - Update modifier
DELETE /modifiers/modifiers/:id            - Delete modifier
```

---

## Order Status Flow

```
pending → confirmed → preparing → ready → served → paid
    ↓         ↓          ↓
  held    held       voided
    ↓         ↓
  pending  pending

paid → voided (requires manager)
```

---

## Payment Methods

| Method | Description |
|--------|-------------|
| cash | Cash payment with change calculation |
| qris | QRIS (Indonesian QR payment standard) |
| debit | Debit card |
| credit | Credit card |

### Split Bill

Multiple payment methods can be combined:
```json
{
  "orderId": "uuid",
  "paymentMethod": "cash",
  "splitPayments": [
    { "method": "cash", "amount": 50000 },
    { "method": "qris", "amount": 50000 }
  ]
}
```

---

## Idempotency

Checkout supports idempotency key to prevent duplicate transactions:

```json
{
  "orderId": "uuid",
  "paymentMethod": "cash",
  "cashReceived": 100000,
  "idempotencyKey": "unique-64-char-key-for-this-checkout"
}
```

If a request with the same idempotency key is retried, the cached response is returned.

---

## Database Changes

### New Table: idempotency_keys
```sql
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    order_id UUID,
    response JSONB,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    UNIQUE(tenant_id, key_hash)
);
```

### Order Item Modifiers Persistence

Order items now properly persist selected modifiers to `order_item_modifiers` table.

### Transaction Splits Persistence

Split payments are now persisted to `transaction_splits` table.

---

## Files Created/Modified

### Created
- `src/application/modifiers/index.ts` - Modifier use cases
- `src/api/routes/modifier.routes.ts` - Modifier API routes
- `src/infrastructure/database/migrations/002_idempotency_keys.sql`
- `tests/unit/orders.test.ts` - Order unit tests
- `tests/unit/modifiers.test.ts` - Modifier unit tests

### Modified
- `src/application/orders/index.ts` - Added idempotency support
- `src/infrastructure/database/repositories/index.ts` - Fixed modifier/split persistence
- `src/domain/entities/index.ts` - Added IdempotencyKey entity
- `src/domain/repositories/index.ts` - Added modifier repositories
- `src/api/schemas/index.ts` - Added modifier schemas

---

## Test Coverage

```
✅ 59 tests passing
  - 34 domain tests
  - 14 order tests
  - 11 modifier tests
```

---

## Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-01 | Can create order with items | ✅ |
| AC-02 | Order calculates tax correctly (11% PPN) | ✅ |
| AC-03 | Discounts apply correctly | ✅ |
| AC-04 | Modifiers persist with order | ✅ |
| AC-05 | Checkout with cash calculates change | ✅ |
| AC-06 | Split bill works correctly | ✅ |
| AC-07 | Idempotency prevents duplicates | ✅ |
| AC-08 | Order status transitions valid | ✅ |
| AC-09 | Void restores stock | ✅ |
| AC-10 | Modifiers CRUD works | ✅ |

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 3 - Inventory](./phase-3-inventory.md)**

---

*Document maintained by: Project Lead*
