# Phase 10: Stock Management

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P1
> **Dependencies:** Phase 7 (Frontend Setup), Phase 9 (Products)

---

## Overview

Phase 10 implements stock management UI including stock overview, low stock alerts, manual adjustments, restock, and stock opname wizard.

---

## Objectives

1. ⬜ Stock overview page
2. ⬜ Low stock alerts
3. ⬜ Manual stock adjustment
4. ⬜ Restock receive
5. ⬜ Stock opname wizard
6. ⬜ Stock history log

---

## Pages

### Stock Overview (`/stock`)

```
┌─────────────────────────────────────────────────────────────┐
│  Stock                                      [Stock Opname] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Total Items│ │ Low Stock   │ │ Out of Stock│          │
│  │    156     │ │     12 ⚠    │ │      3      │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Search: [Product name...]   Category: [All ▼] [Search]   │
├─────────────────────────────────────────────────────────────┤
│  Product          │ Category │ Stock │ Threshold │ Status │
│  ─────────────────────────────────────────────────────────│
│  Americano       │ Coffee   │  45   │    10     │   ✓    │
│  Cappuccino      │ Coffee   │  32   │    10     │   ✓    │
│  Roti Bakar      │ Food     │  12   │    15     │   ⚠    │
│  Teh Manis       │ Beverage │   0   │    20     │   ✗    │
└─────────────────────────────────────────────────────────────┘
```

### Stock Alert Banner
When low stock exists:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ 12 products are running low on stock    [View Alerts]    │
└─────────────────────────────────────────────────────────────┘
```

### Stock Opname Wizard

**Step 1: Select Products**
```
┌─────────────────────────────────────────────────────────────┐
│  Stock Opname                              Step 1 of 3     │
├─────────────────────────────────────────────────────────────┤
│  Select products to count:                                 │
│  [ ] Select All  [ ] Coffee  [ ] Food  [ ] Beverage      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [x] Americano (45)                                 │   │
│  │ [x] Cappuccino (32)                                │   │
│  │ [ ] Latte (28)                                     │   │
│  │ [x] Roti Bakar (12)                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  Selected: 3 products                                     │
│  [Cancel]                                  [Next: Count →] │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Physical Count**
```
┌─────────────────────────────────────────────────────────────┐
│  Stock Opname                              Step 2 of 3     │
├─────────────────────────────────────────────────────────────┤
│  Count each product:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Americano                                           │   │
│  │ System: 45         Your Count: [    42    ]       │   │
│  │ Variance: -3 ⚠                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cappuccino                                         │   │
│  │ System: 32         Your Count: [    32    ]       │   │
│  │ Variance: 0 ✓                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Back]                                    [Next: Review →]│
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Review & Confirm**
```
┌─────────────────────────────────────────────────────────────┐
│  Stock Opname                              Step 3 of 3     │
├─────────────────────────────────────────────────────────────┤
│  Review adjustments:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Americano: 45 → 42  (-3)     [x] Apply adjustment │   │
│  │ Cappuccino: 32 → 32  (±0)    [ ] Apply adjustment │   │
│  │ Roti Bakar: 12 → 10  (-2)    [x] Apply adjustment │   │
│  └─────────────────────────────────────────────────────┘   │
│  Total adjustments: -5 items                              │
│  [Cancel]                              [Confirm & Apply →] │
└─────────────────────────────────────────────────────────────┘
```

---

## API Integration

| Endpoint | Method | Use |
|----------|--------|-----|
| `/stock/overview` | GET | Stock list with pagination |
| `/stock/alerts` | GET | Low stock products |
| `/stock/adjust` | POST | Manual adjustment |
| `/stock/receive` | POST | Restock receive |
| `/stock/history` | GET | Stock movement log |
| `/stock/opnames` | GET/POST | List/Create opnames |
| `/stock/opnames/:id` | GET | Opname details |
| `/stock/opnames/:id/counts/batch` | POST | Submit counts |
| `/stock/opnames/:id/submit` | POST | Apply adjustments |

---

## Components

### StockCard
- Total items count
- Low stock count (with alert color)
- Out of stock count
- Quick link to alerts

### StockRow
- Product name with image thumbnail
- Category badge
- Current stock quantity
- Threshold value
- Status icon (✓ good, ⚠ low, ✗ out)

### StockAdjustmentModal
- Product info
- Current quantity (read-only)
- Adjustment type (+/-)
- New quantity preview
- Reason dropdown
- Notes field

### StockOpnameWizard
- Multi-step wizard
- Progress indicator
- Product selection list
- Count input with numpad
- Variance calculation
- Review summary
- Confirm/cancel buttons

---

## TanStack Query Hooks

```typescript
// Stock overview
export function useStockOverview(filters?: StockFilters) {
  return useQuery({
    queryKey: ['stock', 'overview', filters],
    queryFn: () => api.stock.overview(filters),
  });
}

// Stock alerts
export function useStockAlerts() {
  return useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: api.stock.alerts,
    refetchInterval: 60000, // Check every minute
  });
}

// Stock adjustment
export function useStockAdjust() {
  return useMutation({
    mutationFn: api.stock.adjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Stock adjusted');
    },
  });
}

// Stock opname
export function useCreateOpname() {
  return useMutation({
    mutationFn: api.stock.opnames.create,
  });
}

export function useSubmitOpname(opnameId: string) {
  return useMutation({
    mutationFn: api.stock.opnames.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Stock opname completed');
    },
  });
}
```

---

## Deliverables Checklist

- [ ] Stock overview page (`/stock`)
- [ ] Stock summary cards
- [ ] Low stock alert banner
- [ ] Stock filter by category
- [ ] Stock search
- [ ] Manual adjustment modal
- [ ] Restock receive modal
- [ ] Stock history log (`/stock/history`)
- [ ] Stock opname wizard
- [ ] Opname product selection
- [ ] Physical count input
- [ ] Variance calculation
- [ ] Confirm & apply adjustments

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 11 - Reports & Dashboard](./phase-11-reports.md)**

---

*Document maintained by: thevoidsyntax*
