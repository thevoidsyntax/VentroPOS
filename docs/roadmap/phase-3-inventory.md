# Phase 3: Inventory Management

> **Version:** 1.0.0
> **Status:** ✅ Completed
> **Completed:** 2025

---

## Overview

Phase 3 implements comprehensive inventory management with stock tracking, low stock alerts, manual adjustments, stock history, and stock opname (audit) functionality.

---

## Objectives

1. ✅ Stock level tracking per product
2. ✅ Low stock alerts (threshold-based)
3. ✅ Stock adjustment (manual correction)
4. ✅ Stock history/log
5. ✅ Stock overview API
6. ✅ Restock management
7. ✅ Stock opname support

---

## New API Endpoints

### Stock Overview & Alerts
```
GET  /stock/overview      - Stock overview with pagination
GET  /stock/alerts        - Low stock alerts (stock < threshold)
```

### Stock Operations
```
POST /stock/adjust        - Manual stock adjustment
POST /stock/receive       - Receive/restock new inventory
GET  /stock/history       - Stock movement history
```

### Stock Opname (Audit)
```
GET  /stock/opnames                    - List stock opnames
POST /stock/opnames                    - Create stock opname session
GET  /stock/opnames/:id                - Get opname details
POST /stock/opnames/:id/counts         - Record physical count
POST /stock/opnames/:id/counts/batch   - Batch record counts
POST /stock/opnames/:id/submit         - Submit & apply adjustments
POST /stock/opnames/:id/cancel         - Cancel opname session
```

---

## Stock Operations

### Stock Adjustment
```json
{
  "productId": "uuid",
  "adjustment": -5,
  "reason": "damaged",
  "notes": "Items damaged during delivery"
}
```

### Restock (Receive)
```json
{
  "productId": "uuid",
  "quantity": 100,
  "supplierId": "uuid",
  "purchasePrice": 50000,
  "notes": "Monthly restock from supplier"
}
```

### Stock Opname Flow
```
1. Create opname session → SELECT products to audit
2. Physical counting → RECORD counts per product
3. Submit → CALCULATE variance (actual - system)
4. Confirm → APPLY adjustments to stock
```

---

## Database Changes

### New Tables

```sql
-- stock_logs table
CREATE TABLE stock_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'sale', 'adjustment', 'receive', 'opname', 'void'
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason VARCHAR(100),
    reference_id UUID, -- order_id, adjustment_id, etc.
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- stock_opnames table
CREATE TABLE stock_opnames (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- stock_opname_counts table
CREATE TABLE stock_opname_counts (
    id UUID PRIMARY KEY,
    opname_id UUID NOT NULL,
    product_id UUID NOT NULL,
    system_quantity INTEGER NOT NULL,
    counted_quantity INTEGER NOT NULL,
    variance INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    counted_by UUID NOT NULL,
    counted_at TIMESTAMPTZ NOT NULL,
    UNIQUE(opname_id, product_id)
);
```

---

## Files Created/Modified

### New Files
- `src/domain/entities/stock.ts` - Stock entities
- `src/domain/repositories/stock.ts` - Stock repository interface
- `src/infrastructure/database/repositories/stock.ts` - PostgreSQL implementation
- `src/application/stock/index.ts` - Stock use cases
- `src/application/stock/stock-overview.ts`
- `src/application/stock/stock-alerts.ts`
- `src/application/stock/stock-adjust.ts`
- `src/application/stock/stock-receive.ts`
- `src/application/stock/stock-history.ts`
- `src/application/stock/opname-*.ts` - Opname use cases
- `src/api/routes/stock.routes.ts`
- `tests/unit/stock.test.ts`
- `migrations/003_stock_tables.sql`

### Modified Files
- `src/domain/entities/product.ts` - Added stock_quantity field
- `src/application/products/product-update.ts` - Stock deduction on sale

---

## Test Coverage

```
✅ 36 tests passing (stock.test.ts)
  - Stock overview with pagination
  - Low stock alerts threshold
  - Stock adjustment validation
  - Stock receive (restock)
  - Stock history filtering
  - Stock opname workflow
```

---

## Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-01 | Stock auto-deducts on order checkout | ✅ |
| AC-02 | Stock restores on order void | ✅ |
| AC-03 | Low stock alert triggers when qty < threshold | ✅ |
| AC-04 | Manual adjustment changes stock correctly | ✅ |
| AC-05 | Stock history records all movements | ✅ |
| AC-06 | Stock opname calculates variance correctly | ✅ |
| AC-07 | Stock opname applies adjustments on submit | ✅ |

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 4 - Reporting](./phase-4-reporting.md)**

---

*Document maintained by: thevoidsyntax*
