// Zod Schemas - API Input Validation
// All API inputs are validated using Zod schemas

import { z } from 'zod';

// ============== AUTH SCHEMAS ==============
export const registerSchema = z.object({
  body: z.object({
    tenantName: z.string().min(2).max(255).describe('Name of the business/tenant'),
    email: z.string().email().describe('Owner email address'),
    password: z.string().min(8).max(128).describe('Password (min 8 characters)'),
    ownerName: z.string().min(2).max(255).describe('Business owner full name'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().describe('User email address'),
    password: z.string().min(1).describe('User password'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).describe('Valid refresh token'),
  }),
});

// ============== USER SCHEMAS ==============
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().describe('Staff email address'),
    password: z.string().min(8).max(128).describe('Staff account password'),
    name: z.string().min(2).max(255).describe('Staff full name'),
    role: z.enum(['owner', 'manager', 'kasir', 'kitchen']).describe('Staff role'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('User ID') }),
  body: z.object({
    email: z.string().email().optional().describe('Updated email address'),
    name: z.string().min(2).max(255).optional().describe('Updated name'),
    role: z.enum(['owner', 'manager', 'kasir', 'kitchen']).optional().describe('Updated role'),
    isActive: z.boolean().optional().describe('Account active status'),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('User ID') }),
});

// ============== PRODUCT SCHEMAS ==============
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).describe('Product name'),
    sku: z.string().max(100).optional().describe('Stock keeping unit code'),
    categoryId: z.string().uuid().optional().describe('Category ID'),
    description: z.string().optional().describe('Product description'),
    price: z.number().positive().describe('Selling price'),
    cost: z.number().nonnegative().optional().describe('Cost price'),
    stockQuantity: z.number().int().nonnegative().optional().describe('Initial stock quantity'),
    lowStockThreshold: z.number().int().nonnegative().optional().describe('Low stock alert threshold'),
    modifierGroupIds: z.array(z.string().uuid()).optional().describe('Available modifier groups'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Product ID') }),
  body: z.object({
    name: z.string().min(1).max(255).optional().describe('Updated product name'),
    sku: z.string().max(100).optional().describe('Updated SKU'),
    categoryId: z.string().uuid().nullable().optional().describe('Updated category ID'),
    description: z.string().optional().describe('Updated description'),
    price: z.number().positive().optional().describe('Updated price'),
    cost: z.number().nonnegative().optional().describe('Updated cost'),
    lowStockThreshold: z.number().int().nonnegative().optional().describe('Updated threshold'),
    isActive: z.boolean().optional().describe('Product availability'),
    imageUrl: z.string().url().optional().describe('Product image URL'),
    modifierGroupIds: z.array(z.string().uuid()).optional().describe('Updated modifier groups'),
  }),
});

export const productIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Product ID') }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional().describe('Filter by category'),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional().describe('Filter active products'),
    lowStock: z.enum(['true', 'false']).transform(v => v === 'true').optional().describe('Show low stock only'),
    search: z.string().optional().describe('Search by name or SKU'),
    page: z.coerce.number().int().positive().optional().describe('Page number'),
    limit: z.coerce.number().int().positive().max(100).optional().describe('Items per page'),
  }),
});

// ============== CATEGORY SCHEMAS ==============
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).describe('Category name'),
    description: z.string().optional().describe('Category description'),
    parentId: z.string().uuid().optional().describe('Parent category ID for nesting'),
    sortOrder: z.number().int().optional().describe('Display order'),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Category ID') }),
  body: z.object({
    name: z.string().min(1).max(255).optional().describe('Updated category name'),
    description: z.string().optional().describe('Updated description'),
    parentId: z.string().uuid().nullable().optional().describe('Updated parent category'),
    sortOrder: z.number().int().optional().describe('Updated sort order'),
    isActive: z.boolean().optional().describe('Category visibility'),
  }),
});

export const categoryIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Category ID') }),
});

// ============== TABLE SCHEMAS ==============
export const createTableSchema = z.object({
  body: z.object({
    tableNumber: z.string().min(1).max(50).describe('Table number or name'),
    capacity: z.number().int().positive().optional().describe('Maximum seating capacity'),
    positionX: z.number().int().optional().describe('X position for floor plan'),
    positionY: z.number().int().optional().describe('Y position for floor plan'),
  }),
});

export const updateTableSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Table ID') }),
  body: z.object({
    tableNumber: z.string().min(1).max(50).optional().describe('Updated table number'),
    capacity: z.number().int().positive().optional().describe('Updated capacity'),
    positionX: z.number().int().optional().describe('Updated X position'),
    positionY: z.number().int().optional().describe('Updated Y position'),
    status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional().describe('Table status'),
  }),
});

export const tableIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Table ID') }),
});

// ============== ORDER SCHEMAS ==============
export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid().optional().describe('Associated table ID'),
    items: z.array(z.object({
      productId: z.string().uuid().describe('Product ID'),
      quantity: z.number().int().positive().describe('Quantity'),
      modifiers: z.array(z.object({
        modifierId: z.string().uuid().describe('Modifier ID'),
        name: z.string().describe('Modifier name'),
        priceAdjustment: z.number().describe('Price adjustment'),
      })).optional().describe('Selected modifiers'),
      notes: z.string().optional().describe('Special instructions'),
    })).min(1).describe('Order items'),
    customerName: z.string().max(255).optional().describe('Customer name'),
    notes: z.string().optional().describe('Order notes'),
    applyDiscount: z.object({
      type: z.enum(['percentage', 'fixed']).describe('Discount type'),
      value: z.number().positive().max(100).optional().describe('Discount value'),
    }).optional().describe('Discount to apply'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Order ID') }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'voided', 'held']).describe('New order status'),
  }),
});

export const orderIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Order ID') }),
});

export const getOrdersQuerySchema = z.object({
  query: z.object({
    status: z.string().optional().describe('Filter by status (comma-separated)'),
    tableId: z.string().uuid().optional().describe('Filter by table'),
    fromDate: z.string().optional().describe('Start date (ISO 8601)'),
    toDate: z.string().optional().describe('End date (ISO 8601)'),
    page: z.coerce.number().int().positive().optional().describe('Page number'),
    limit: z.coerce.number().int().positive().max(100).optional().describe('Items per page'),
  }),
});

// ============== CHECKOUT SCHEMAS ==============
export const checkoutSchema = z.object({
  body: z.object({
    orderId: z.string().uuid().describe('Order ID to checkout'),
    paymentMethod: z.enum(['cash', 'qris', 'debit', 'credit']).describe('Primary payment method'),
    cashReceived: z.number().nonnegative().optional().describe('Cash received (for cash payments)'),
    referenceNumber: z.string().optional().describe('External reference number'),
    splitPayments: z.array(z.object({
      method: z.enum(['cash', 'qris', 'debit', 'credit']).describe('Split payment method'),
      amount: z.number().positive().describe('Split amount'),
    })).optional().describe('Split payment details'),
    idempotencyKey: z.string().min(32).max(128).optional().describe('Idempotency key for preventing duplicates'),
  }),
});

export const voidOrderSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Order ID to void') }),
  body: z.object({
    reason: z.string().optional().describe('Void reason'),
  }),
});

// ============== MODIFIER SCHEMAS ==============
export const createModifierGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).describe('Modifier group name (e.g., "Size", "Toppings")'),
    type: z.enum(['size', 'extras', 'topping', 'custom']).describe('Group type'),
    isRequired: z.boolean().optional().describe('Whether selection is required'),
    minSelections: z.number().int().min(0).optional().describe('Minimum selections required'),
    maxSelections: z.number().int().min(1).optional().describe('Maximum selections allowed'),
  }),
});

export const updateModifierGroupSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier group ID') }),
  body: z.object({
    name: z.string().min(1).max(255).optional().describe('Updated group name'),
    type: z.enum(['size', 'extras', 'topping', 'custom']).optional().describe('Updated type'),
    isRequired: z.boolean().optional().describe('Updated requirement status'),
    minSelections: z.number().int().min(0).optional().describe('Updated minimum'),
    maxSelections: z.number().int().min(1).optional().describe('Updated maximum'),
  }),
});

export const modifierGroupIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier group ID') }),
});

export const createModifierSchema = z.object({
  params: z.object({ groupId: z.string().uuid().describe('Modifier group ID') }),
  body: z.object({
    name: z.string().min(1).max(255).describe('Modifier name (e.g., "Large", "Extra Cheese")'),
    priceAdjustment: z.number().optional().describe('Additional price'),
    sortOrder: z.number().int().optional().describe('Display order'),
  }),
});

export const updateModifierSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier ID') }),
  body: z.object({
    name: z.string().min(1).max(255).optional().describe('Updated modifier name'),
    priceAdjustment: z.number().optional().describe('Updated price adjustment'),
    isActive: z.boolean().optional().describe('Modifier availability'),
    sortOrder: z.number().int().optional().describe('Updated sort order'),
  }),
});

export const modifierIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier ID') }),
});

// ============== COMMON SCHEMAS ==============
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});

export const uuidParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>['query'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>['body'];
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>['body'];
export type VoidOrderInput = z.infer<typeof voidOrderSchema>;
