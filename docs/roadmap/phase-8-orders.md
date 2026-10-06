# Phase 8: Orders Management

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P0
> **Dependencies:** Phase 7 (Frontend Setup)

---

## Overview

Phase 8 implements order management features including order list, order details, order filtering, search, and void order functionality.

---

## Objectives

1. ⬜ Order list page with filters
2. ⬜ Order detail page
3. ⬜ Search orders by ID or customer
4. ⬜ Filter by status, date range
5. ⬜ Void order flow
6. ⬜ Reprint receipt

---

## Pages

### Order List Page (`/orders`)

```
┌─────────────────────────────────────────────────────────────┐
│  Orders                            [Search] [+ New Order]   │
├─────────────────────────────────────────────────────────────┤
│  Filters: [Status ▼] [Date ▼] [Cashier ▼] [Clear]          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TXN-2025-001  │ 09:45  │  Rp 125,000  │ [paid]    │   │
│  │ John Doe      │ Table 5│  3 items    │ ●●●○○     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TXN-2025-002  │ 09:30  │  Rp 85,000   │ [pending] │   │
│  │ Guest         │ -      │  2 items     │ ●○○○○     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Order Detail Page (`/orders/:id`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                    Order TXN-2025-001               │
├─────────────────────────────────────────────────────────────┤
│  Status: [paid ✓]    Date: Jan 15, 2025 09:45            │
│  Cashier: John Doe    Table: 5                            │
├─────────────────────────────────────────────────────────────┤
│  Items                                                   │
│  ─────────────────────────────────────────               │
│  2x Kopi Americano              Rp 50,000                 │
│     - Less sugar                                        │
│  1x Roti Bakar                 Rp 35,000                 │
├─────────────────────────────────────────────────────────────┤
│  Subtotal:                       Rp 85,000               │
│  Tax (11%):                      Rp 9,350                 │
│  Discount:                       -                        │
│  ─────────────────────────────────────────               │
│  Total:                          Rp 94,350               │
│  Paid: Cash                      Rp 100,000               │
│  Change:                         Rp 5,650                │
├─────────────────────────────────────────────────────────────┤
│  [Print Receipt]  [Void Order]  [Reprint]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## API Integration

| Endpoint | Method | Use |
|----------|--------|-----|
| `/orders` | GET | List orders with filters |
| `/orders/:id` | GET | Order details |
| `/orders/:id/status` | PUT | Update status |
| `/orders/:id/void` | POST | Void order |
| `/orders/:id/receipt` | POST | Reprint receipt |

### Query Parameters

```typescript
// GET /orders
{
  page?: number;        // Default: 1
  limit?: number;      // Default: 20
  status?: OrderStatus; // 'pending' | 'paid' | 'voided'
  start_date?: string;  // ISO date
  end_date?: string;    // ISO date
  user_id?: string;     // Filter by cashier
  search?: string;      // Search by order ID or customer
}
```

---

## Components

### OrderListItem
- Order ID, time, total
- Customer name (or "Guest")
- Table number
- Status badge
- Items count indicator
- Tap to view details

### OrderStatusBadge
| Status | Color | Use |
|--------|-------|-----|
| pending | Blue | Awaiting payment |
| paid | Green | Completed |
| voided | Red | Cancelled |
| held | Yellow | On hold |

### OrderDetailCard
- Full order information
- Items list with modifiers
- Payment breakdown
- Action buttons

---

## User Flows

### Void Order Flow
```
1. Tap order → Order Detail
2. Tap [Void Order]
3. Confirm modal: "Are you sure you want to void this order?"
4. Select reason: [Customer request | Wrong items | System error]
5. Enter manager PIN (if required)
6. Submit → Stock restored, order marked voided
7. Show success toast
```

### Reprint Receipt
```
1. Tap order → Order Detail
2. Tap [Print Receipt]
3. Select printer (if multiple)
4. Print → Show success toast
```

---

## State Management

### TanStack Query Hooks

```typescript
// Orders list
export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => api.orders.list(filters),
  });
}

// Order detail
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.orders.get(id),
    enabled: !!id,
  });
}

// Void order mutation
export function useVoidOrder() {
  return useMutation({
    mutationFn: ({ id, reason }) => api.orders.void(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order voided successfully');
    },
  });
}
```

---

## Deliverables Checklist

- [ ] Order list page (`/orders`)
- [ ] Order detail page (`/orders/:id`)
- [ ] Status filter dropdown
- [ ] Date range filter
- [ ] Search by order ID
- [ ] Order status badge component
- [ ] Void order modal with reason
- [ ] Reprint receipt functionality
- [ ] Pull-to-refresh on list
- [ ] Empty state for no orders

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 9 - Product Management](./phase-9-products.md)**

---

*Document maintained by: thevoidsyntax*
