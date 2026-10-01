// Zod Schemas - API Input Validation
// All API inputs are validated using Zod schemas

import { z } from 'zod';

// ============== AUTH SCHEMAS ==============
export const registerSchema = z.object({
  body: z.object({
    tenantName: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    ownerName: z.string().min(2).max(255),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

// ============== USER SCHEMAS ==============
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(255),
    role: z.enum(['owner', 'manager', 'kasir', 'kitchen']),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).max(255).optional(),
    role: z.enum(['owner', 'manager', 'kasir', 'kitchen']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ============== PRODUCT SCHEMAS ==============
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    sku: z.string().max(100).optional(),
    categoryId: z.string().uuid().optional(),
    description: z.string().optional(),
    price: z.number().positive(),
    cost: z.number().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    modifierGroupIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    sku: z.string().max(100).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    cost: z.number().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    modifierGroupIds: z.array(z.string().uuid()).optional(),
  }),
});

export const productIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    lowStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

// ============== CATEGORY SCHEMAS ==============
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    parentId: z.string().uuid().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ============== TABLE SCHEMAS ==============
export const createTableSchema = z.object({
  body: z.object({
    tableNumber: z.string().min(1).max(50),
    capacity: z.number().int().positive().optional(),
    positionX: z.number().int().optional(),
    positionY: z.number().int().optional(),
  }),
});

export const updateTableSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    tableNumber: z.string().min(1).max(50).optional(),
    capacity: z.number().int().positive().optional(),
    positionX: z.number().int().optional(),
    positionY: z.number().int().optional(),
    status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
  }),
});

export const tableIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ============== ORDER SCHEMAS ==============
export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid().optional(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      modifiers: z.array(z.object({
        modifierId: z.string().uuid(),
        name: z.string(),
        priceAdjustment: z.number(),
      })).optional(),
      notes: z.string().optional(),
    })).min(1),
    customerName: z.string().max(255).optional(),
    notes: z.string().optional(),
    applyDiscount: z.object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number().positive().max(100).optional(),
    }).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'voided', 'held']),
  }),
});

export const orderIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const getOrdersQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(), // comma-separated
    tableId: z.string().uuid().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

// ============== CHECKOUT SCHEMAS ==============
export const checkoutSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    paymentMethod: z.enum(['cash', 'qris', 'debit', 'credit']),
    cashReceived: z.number().nonnegative().optional(),
    referenceNumber: z.string().optional(),
    splitPayments: z.array(z.object({
      method: z.enum(['cash', 'qris', 'debit', 'credit']),
      amount: z.number().positive(),
    })).optional(),
    idempotencyKey: z.string().min(32).max(128).optional(),
  }),
});

export const voidOrderSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

// ============== MODIFIER SCHEMAS ==============
export const createModifierGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['size', 'extras', 'topping', 'custom']),
    isRequired: z.boolean().optional(),
    minSelections: z.number().int().min(0).optional(),
    maxSelections: z.number().int().min(1).optional(),
  }),
});

export const updateModifierGroupSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['size', 'extras', 'topping', 'custom']).optional(),
    isRequired: z.boolean().optional(),
    minSelections: z.number().int().min(0).optional(),
    maxSelections: z.number().int().min(1).optional(),
  }),
});

export const modifierGroupIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createModifierSchema = z.object({
  params: z.object({ groupId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255),
    priceAdjustment: z.number().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const updateModifierSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    priceAdjustment: z.number().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const modifierIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
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
