// Category Schemas - API Input Validation
import { z } from 'zod';

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
