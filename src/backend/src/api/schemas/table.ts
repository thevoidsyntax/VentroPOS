// Table Schemas - API Input Validation
import { z } from 'zod';

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

export const tableLayoutQuerySchema = z.object({
  querystring: z.object({
    status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional().describe('Filter by status'),
  }),
});
