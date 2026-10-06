# Phase 4: Reporting & Analytics

> **Version:** 1.0.0
> **Status:** ✅ Completed
> **Completed:** 2025

---

## Overview

Phase 4 implements comprehensive reporting and analytics dashboard with sales summaries, product performance, staff performance, category breakdown, and CSV export functionality.

---

## Objectives

1. ✅ Sales summary (daily, weekly, monthly)
2. ✅ Product performance report
3. ✅ Staff performance report
4. ✅ Category breakdown
5. ✅ Export to CSV

---

## New API Endpoints

### Reports
```
GET  /reports/sales        - Sales summary with metrics
GET  /reports/products      - Product performance report
GET  /reports/staff        - Staff performance report
GET  /reports/categories   - Category breakdown
GET  /reports/export       - Export to CSV
```

### Query Parameters

All reports support:
```
?start_date=2025-01-01      - Start of date range
?end_date=2025-01-31        - End of date range
?preset=today|yesterday|this_week|last_week|this_month|last_month
```

---

## Sales Summary Report

### Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "metrics": {
      "totalRevenue": 15000000,
      "totalTransactions": 450,
      "averageOrderValue": 33333,
      "grossProfit": 8500000,
      "netProfit": 8166666
    },
    "paymentBreakdown": [
      { "method": "cash", "count": 200, "amount": 6000000 },
      { "method": "qris", "count": 150, "amount": 5000000 },
      { "method": "card", "count": 100, "amount": 4000000 }
    ],
    "hourlySales": [
      { "hour": 9, "count": 15, "amount": 500000 },
      { "hour": 10, "count": 25, "amount": 850000 }
    ],
    "comparison": {
      "previousPeriod": {
        "totalRevenue": 12000000,
        "totalTransactions": 380
      },
      "growth": {
        "revenueChange": 25,
        "transactionChange": 18.4
      }
    }
  }
}
```

---

## Product Performance Report

### Response Format
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "uuid",
        "name": "Kopi Americano",
        "category": "Coffee",
        "quantitySold": 150,
        "revenue": 2250000,
        "percentage": 15.0,
        "rank": 1
      }
    ],
    "totalProducts": 50,
    "totalQuantity": 1000,
    "totalRevenue": 15000000
  }
}
```

---

## Staff Performance Report

### Response Format
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "userId": "uuid",
        "name": "John Doe",
        "role": "kasir",
        "transactionCount": 120,
        "totalSales": 4000000,
        "averageOrderValue": 33333
      }
    ],
    "totalTransactions": 450,
    "totalSales": 15000000
  }
}
```

---

## Category Breakdown

### Response Format
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "categoryId": "uuid",
        "name": "Coffee",
        "orderCount": 200,
        "quantitySold": 350,
        "revenue": 5500000,
        "percentage": 36.7
      }
    ],
    "totalOrders": 450,
    "totalRevenue": 15000000
  }
}
```

---

## CSV Export

### Endpoint
```
GET /reports/export?type=sales&start_date=2025-01-01&end_date=2025-01-31
```

### Response
Returns CSV file with headers:
```
Date,Transaction ID,Items,Subtotal,Tax,Discount,Total,Payment Method,Cashier
2025-01-01,TXN-001,"2x Kopi Americano, 1x Roti",95000,10450,0,105450,cash,John
```

---

## Date Presets (Indonesian)

| Preset | Description |
|--------|-------------|
| `today` | Hari Ini |
| `yesterday` | Kemarin |
| `this_week` | Minggu Ini |
| `last_week` | Minggu Lalu |
| `this_month` | Bulan Ini |
| `last_month` | Bulan Lalu |

---

## Database Changes

### New Tables
```sql
-- No new tables required
-- Reports are derived from existing orders, order_items, transactions tables
```

### New Indexes
```sql
-- Performance indexes for report queries
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
CREATE INDEX idx_orders_tenant_user ON orders(tenant_id, user_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

## Files Created/Modified

### New Files
- `src/domain/entities/report.ts` - Report entities
- `src/domain/repositories/report.ts` - Report repository interface
- `src/infrastructure/database/repositories/report.ts` - PostgreSQL implementation
- `src/application/reports/index.ts` - Reports module entry
- `src/application/reports/sales-summary.ts`
- `src/application/reports/product-performance.ts`
- `src/application/reports/staff-performance.ts`
- `src/application/reports/category-breakdown.ts`
- `src/application/reports/export-report.ts`
- `src/application/reports/utils/date-utils.ts`
- `src/api/routes/report.routes.ts`
- `tests/unit/reports.test.ts`

### Modified Files
- `src/api/routes/index.ts` - Added report routes
- `package.json` - No new dependencies

---

## Test Coverage

```
✅ 25 tests passing (reports.test.ts)
  - Sales summary calculations
  - Date preset parsing
  - Product ranking
  - Staff metrics
  - Category breakdown
  - CSV export format
```

---

## Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-01 | Sales summary shows correct totals | ✅ |
| AC-02 | Payment breakdown is accurate | ✅ |
| AC-03 | Period comparison calculates growth % | ✅ |
| AC-04 | Product ranking by quantity sold | ✅ |
| AC-05 | Staff metrics include transaction count | ✅ |
| AC-06 | CSV export contains all required columns | ✅ |
| AC-07 | Date presets work correctly | ✅ |

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 5 - Hardware Integration](./phase-5-hardware.md)**

---

*Document maintained by: thevoidsyntax*
