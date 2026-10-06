// Modifier Schemas - API Input Validation
import { z } from 'zod';

// Modifier Group Schemas
export const createModifierGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).describe('Group name'),
    type: z.enum(['size', 'extras', 'topping', 'custom']).describe('Group type'),
    isRequired: z.boolean().optional().default(false).describe('Whether selection is required'),
    minSelections: z.number().int().min(0).optional().default(0).describe('Minimum selections'),
    maxSelections: z.number().int().min(1).optional().describe('Maximum selections'),
  }),
});

export const updateModifierGroupSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier Group ID') }),
  body: z.object({
    name: z.string().min(1).max(100).optional().describe('Group name'),
    type: z.enum(['size', 'extras', 'topping', 'custom']).optional().describe('Group type'),
    isRequired: z.boolean().optional().describe('Whether selection is required'),
    minSelections: z.number().int().min(0).optional().describe('Minimum selections'),
    maxSelections: z.number().int().min(1).optional().describe('Maximum selections'),
  }),
});

export const modifierGroupIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier Group ID') }),
});

// Modifier Schemas
export const createModifierSchema = z.object({
  params: z.object({ groupId: z.string().uuid().describe('Modifier Group ID') }),
  body: z.object({
    name: z.string().min(1).max(100).describe('Modifier name'),
    priceAdjustment: z.number().optional().default(0).describe('Price adjustment'),
    sortOrder: z.number().int().optional().describe('Sort order'),
  }),
});

export const updateModifierSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier ID') }),
  body: z.object({
    name: z.string().min(1).max(100).optional().describe('Modifier name'),
    priceAdjustment: z.number().optional().describe('Price adjustment'),
    isActive: z.boolean().optional().describe('Active status'),
    sortOrder: z.number().int().optional().describe('Sort order'),
  }),
});

export const modifierIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid().describe('Modifier ID') }),
});
