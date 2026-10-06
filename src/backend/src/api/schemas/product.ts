// Product Schemas - API Input Validation
import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).describe('Product name'),
    sku: z.string().max(100).optional().describe('Stock keeping unit code'),
    categoryId: z.string().uuid().optional().describe('Category ID'),
    description: z.string().optional().describe('Product description'),
    price: z.number().positive().describe('Selling price'),
    cost: z.number().min(0).optional().describe('Cost price'),
    stockQuantity: z.number().int().min(0).optional().describe('Initial stock quantity'),
    lowStockThreshold: z.number().int().min(0).optional().describe('Low stock alert threshold'),
    imageUrl: z.string().url().optional().describe('Product image URL'),
    isActive: z.boolean().optional().describe('Product active status'),
    modifierGroupIds: z.array(z.string().uuid()).optional().describe('Modifier group IDs'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Product ID') }),
  body: z.object({
    name: z.string().min(1).max(255).optional().describe('Product name'),
    sku: z.string().max(100).optional().describe('Stock keeping unit code'),
    categoryId: z.string().uuid().optional().describe('Category ID'),
    description: z.string().optional().describe('Product description'),
    price: z.number().positive().optional().describe('Selling price'),
    cost: z.number().min(0).optional().describe('Cost price'),
    lowStockThreshold: z.number().int().min(0).optional().describe('Low stock alert threshold'),
    imageUrl: z.string().url().optional().describe('Product image URL'),
    isActive: z.boolean().optional().describe('Product active status'),
    modifierGroupIds: z.array(z.string().uuid()).optional().describe('Modifier group IDs'),
  }),
});

export const productIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Product ID') }),
});

export const productQuerySchema = z.object({
  querystring: z.object({
    categoryId: z.string().uuid().optional().describe('Filter by category'),
    isActive: z.boolean().optional().describe('Filter by active status'),
    search: z.string().optional().describe('Search by name or SKU'),
    page: z.string().optional().describe('Page number'),
    limit: z.string().optional().describe('Items per page'),
  }),
});
