# Phase 9: Product Management

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P1
> **Dependencies:** Phase 7 (Frontend Setup)

---

## Overview

Phase 9 implements product management features including product CRUD, category management, and modifier configuration.

---

## Objectives

1. ⬜ Product list with search & filter
2. ⬜ Product create/edit form
3. ⬜ Category management
4. ⬜ Modifier groups & modifiers
5. ⬜ Image upload
6. ⬜ Bulk actions

---

## Pages

### Products Page (`/products`)

```
┌─────────────────────────────────────────────────────────────┐
│  Products                    [Search...] [Add Product]     │
├─────────────────────────────────────────────────────────────┤
│  Category: [All ▼]  [Coffee] [Food] [+Category]           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┬──────────────────────────────────┬─────────┐ │
│  │ [img]   │ Americano                         │ Rp 25K │ │
│  │         │ Coffee • Stock: 45                │ [Edit] │ │
│  ├─────────┼──────────────────────────────────┼─────────┤ │
│  │ [img]   │ Cappuccino                        │ Rp 30K │ │
│  │         │ Coffee • Stock: 32                │ [Edit] │ │
│  ├─────────┼──────────────────────────────────┼─────────┤ │
│  │ [img]   │ Roti Bakar                        │ Rp 35K │ │
│  │         │ Food • Stock: 12 ⚠                │ [Edit] │ │
│  └─────────┴──────────────────────────────────┴─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Product Form (`/products/new` or `/products/:id/edit`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back              Add Product                            │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Upload Image]                                        │ │
│  │ Drag & drop or click to upload                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Name *          [Americano                              ] │
│  SKU             [PROD-001                               ] │
│  Category *      [Coffee ▼                               ] │
│  Price *         [Rp 25,000                              ] │
│  Cost            [Rp 12,000                              ] │
│  Stock Qty       [45                                     ] │
│  Low Stock       [10]                                     │
│  Description     [Rich espresso shot...                  ] │
│                                                             │
│  Modifiers                                                │
│  ─────────────────────────────────────────────────────── │
│  [+ Add Modifier Group]                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Size                    [Edit] [Delete]            │   │
│  │ • Regular (+0)                                     │   │
│  │ • Large (+5K)                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]                               [Save Product]    │
└─────────────────────────────────────────────────────────────┘
```

---

## API Integration

| Endpoint | Method | Use |
|----------|--------|-----|
| `/products` | GET | List products |
| `/products` | POST | Create product |
| `/products/:id` | GET | Get product |
| `/products/:id` | PUT | Update product |
| `/products/:id` | DELETE | Delete product |
| `/categories` | GET/POST | List/Create categories |
| `/categories/:id` | PUT/DELETE | Update/Delete category |
| `/modifiers/groups` | GET/POST | List/Create modifier groups |
| `/modifiers/groups/:id` | PUT/DELETE | Update/Delete group |

---

## Components

### ProductCard (List View)
- Product image (or placeholder)
- Product name
- Category badge
- Price (formatted IDR)
- Stock level with low stock warning
- Edit button

### ProductForm
- Image upload with preview
- Form validation (required fields)
- Category dropdown
- Price input with currency formatting
- Modifier group selector

### CategoryBadge
- Category color dot
- Category name
- Product count

### ModifierGroupEditor
- Group name input
- Modifier options list (name, price adjustment)
- Add/remove modifier option
- Drag to reorder

---

## Form Validation

```typescript
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().optional(),
  categoryId: z.string().uuid('Invalid category'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const modifierGroupSchema = z.object({
  name: z.string().min(1, 'Group name required'),
  required: z.boolean().default(false),
  minSelections: z.number().int().min(0).default(0),
  maxSelections: z.number().int().min(1).optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1),
    priceAdjustment: z.number().default(0),
  })).min(1, 'At least one modifier required'),
});
```

---

## TanStack Query Hooks

```typescript
// Products
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.products.list(filters),
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
    },
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    staleTime: Infinity, // Categories rarely change
  });
}

// Modifiers
export function useModifierGroups() {
  return useQuery({
    queryKey: ['modifier-groups'],
    queryFn: api.modifiers.listGroups,
  });
}
```

---

## Deliverables Checklist

- [ ] Products list page (`/products`)
- [ ] Add product page (`/products/new`)
- [ ] Edit product page (`/products/:id/edit`)
- [ ] Category management modal
- [ ] Modifier group editor
- [ ] Image upload component
- [ ] Stock quantity editor
- [ ] Search products by name
- [ ] Filter by category
- [ ] Delete product confirmation
- [ ] Duplicate product action

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 10 - Stock Management](./phase-10-stock.md)**

---

*Document maintained by: thevoidsyntax*
