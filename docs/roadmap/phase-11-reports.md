# Phase 11: Reports & Dashboard

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P1
> **Dependencies:** Phase 7 (Frontend Setup)

---

## Overview

Phase 11 implements the reporting dashboard with sales analytics, charts, and export functionality.

---

## Objectives

1. ⬜ Dashboard home with today's metrics
2. ⬜ Sales chart (line/bar)
3. ⬜ Product performance chart
4. ⬜ Staff performance view
5. ⬜ Category breakdown
6. ⬜ CSV export
7. ⬜ PDF export (optional)

---

## Pages

### Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                    Today: Jan 15, 2025          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Revenue     │ │ Orders      │ │ Avg Order   │          │
│  │ Rp 1.5M ↑25%│ │    45  ↑18%│ │ Rp 33,333   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Sales Today (Line Chart)                     │  │
│  │  300K ┤      ╭──╮                                   │  │
│  │  200K ┤  ╭──╯  ╰──╮╭──╮                            │  │
│  │  100K ┤──╯        ╰─╯  ╰──╮                          │  │
│  │     0 └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬  │  │
│  │        9  10 11 12 13 14 15 16 17 18 19 20 21 22    │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Recent Orders                    Quick Actions            │
│  ─────────────────               ──────────────            │
│  TXN-2025-001  Rp 125,000       [New Order]             │
│  TXN-2025-002  Rp 85,000        [Stock Alert (3)]         │
│  TXN-2025-003  Rp 65,000        [View Reports]           │
└─────────────────────────────────────────────────────────────┘
```

### Reports Page (`/reports`)

```
┌─────────────────────────────────────────────────────────────┐
│  Reports                      Date: [Today ▼] [📅 Range]   │
├─────────────────────────────────────────────────────────────┤
│  [Sales] [Products] [Staff] [Categories] [Export]        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Sales Trend (Bar Chart)                   │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │  │
│  │  │   │ │   │ │   │ │   │ │   │ │   │ │   │       │  │
│  │  │   │ │   │ │   │ │   │ │   │ │   │ │   │       │  │
│  │  │   │ │   │ │   │ │   │ │   │ │   │ │   │       │  │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘       │  │
│  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Payment Breakdown                                   │  │
│  │  Cash ████████████░░░░░░░░  55%  Rp 825,000       │  │
│  │  QRIS ██████░░░░░░░░░░░░░  30%  Rp 450,000       │  │
│  │  Card ███░░░░░░░░░░░░░░░░  15%  Rp 225,000       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Integration

| Endpoint | Method | Use |
|----------|--------|-----|
| `/reports/sales` | GET | Sales summary with metrics |
| `/reports/products` | GET | Product performance |
| `/reports/staff` | GET | Staff performance |
| `/reports/categories` | GET | Category breakdown |
| `/reports/export` | GET | CSV export |

### Query Parameters

```typescript
// Date presets
?preset=today|yesterday|this_week|last_week|this_month|last_month

// Custom range
?start_date=2025-01-01&end_date=2025-01-31
```

---

## Components

### MetricCard
- Label text
- Value (formatted)
- Comparison with previous period
- Trend indicator (↑↓)
- Tap to see details

### SalesChart (Recharts)
- Line chart for trends
- Bar chart for comparisons
- Tooltip with exact values
- Responsive sizing

### DataTable
- Sortable columns
- Pagination
- Row click for details

### DateRangePicker
- Preset buttons (Today, This Week, etc.)
- Custom date range
- Compare to previous period

---

## TanStack Query Hooks

```typescript
// Sales summary
export function useSalesReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reports', 'sales', dateRange],
    queryFn: () => api.reports.sales(dateRange),
  });
}

// Product performance
export function useProductReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reports', 'products', dateRange],
    queryFn: () => api.reports.products(dateRange),
  });
}

// Staff performance
export function useStaffReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reports', 'staff', dateRange],
    queryFn: () => api.reports.staff(dateRange),
  });
}

// Export
export function useExportReport(type: string, dateRange: DateRange) {
  return useMutation({
    mutationFn: () => api.reports.export(type, dateRange),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}-${dateRange.start}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
```

---

## Deliverables Checklist

- [ ] Dashboard page (`/dashboard`)
- [ ] Today's metrics cards
- [ ] Sales trend chart
- [ ] Recent orders list
- [ ] Reports page (`/reports`)
- [ ] Sales report tab
- [ ] Product performance tab
- [ ] Staff performance tab
- [ ] Category breakdown tab
- [ ] Date range picker
- [ ] CSV export functionality
- [ ] Print-friendly report view

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 12 - Settings & Config](./phase-12-settings.md)**

---

*Document maintained by: thevoidsyntax*
