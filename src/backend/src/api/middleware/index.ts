// API Middleware - Auth, Tenant Context, RBAC
// Handles JWT verification and tenant isolation

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '../../domain/entities/index.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';

// Extend FastifyRequest to include user context
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    userRole?: UserRole;
  }
}

// ============== AUTH MIDDLEWARE ==============
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    // Extract user info from JWT payload
    const payload = request.user as {
      sub: string;
      tenantId: string;
      email: string;
      role: string;
    };

    request.userId = payload.sub;
    request.tenantId = payload.tenantId;
    request.userEmail = payload.email;
    request.userRole = payload.role as UserRole;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

// ============== RBAC MIDDLEWARE ==============
type RoleHierarchy = Record<UserRole, number>;

const roleHierarchy: RoleHierarchy = {
  owner: 4,
  manager: 3,
  kasir: 2,
  kitchen: 1,
};

// Factory to create role-checking middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userRole = request.userRole;

    if (!userRole) {
      throw new UnauthorizedError('User role not found');
    }

    // Owner can do everything
    if (userRole === 'owner') {
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError(`Role '${userRole}' is not allowed to perform this action`);
    }
  };
}

// Shorthand middlewares
export const requireOwner = requireRole('owner');
export const requireManager = requireRole('owner', 'manager');
export const requireKasir = requireRole('owner', 'manager', 'kasir');
export const requireAnyRole = requireRole('owner', 'manager', 'kasir', 'kitchen');

// ============== TENANT CONTEXT ==============
export async function tenantContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Tenant context is already set from JWT
  // This middleware just validates it exists
  if (!request.tenantId) {
    throw new UnauthorizedError('Tenant context not found');
  }
}

// ============== AUDIT LOGGING ==============
export interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function createAuditLog(
  request: FastifyRequest,
  data: AuditLogData
): Promise<void> {
  // This would typically write to the audit_logs table
  // Implementation would use the IAuditLogRepository
  const log = {
    tenantId: request.tenantId,
    userId: request.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldData: data.oldData,
    newData: data.newData,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    createdAt: new Date(),
  };

  // TODO: Write to database via repository
  console.log('AUDIT:', JSON.stringify(log));
}
