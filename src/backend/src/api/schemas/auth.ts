// Auth Schemas - API Input Validation
import { z } from 'zod';

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
