// User Schemas - API Input Validation
import { z } from 'zod';

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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().describe('Current password'),
    newPassword: z.string().min(8).max(128).describe('New password'),
  }),
});

export const adminResetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8).max(128).describe('New password'),
  }),
});
