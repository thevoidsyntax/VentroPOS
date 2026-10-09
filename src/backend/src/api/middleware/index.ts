// API Middleware - Auth, Tenant Context, RBAC, Security, Correlation
// Handles JWT verification, tenant isolation, correlation IDs, and security

import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '../../domain/entities/index.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';

// Re-export security utilities
export {
  registerSecurityHeaders,
  rateLimitKeyGenerator,
  rateLimitErrorResponse,
  rateLimitHeaders,
} from './security.js';

// Extend FastifyRequest to include user context and correlation ID
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    userRole?: UserRole;
    correlationId?: string;
  }
}

// ============== CORRELATION ID MIDDLEWARE ==============
export function correlationMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    const correlationId = (request.headers['x-request-id'] as string) || randomUUID();
    request.correlationId = correlationId;
    reply.header('X-Request-ID', correlationId);

    // Add to logger context for structured logging
    request.log = request.log.child({ correlationId });
  });
}

// ============== AUTH MIDDLEWARE ==============
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
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
// Role hierarchy for future use (currently using include check)
// tier levels: owner(4) > manager(3) > kasir(2) > kitchen(1)

// Factory to create role-checking middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
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
  _reply: FastifyReply
): Promise<void> {
  // Tenant context is already set from JWT
  // This middleware just validates it exists
  if (!request.tenantId) {
    throw new UnauthorizedError('Tenant context not found');
  }
}

// ============== AUDIT LOGGING ==============
import { auditLogRepository } from '../../infrastructure/database/repositories/container.js';

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
  const auditEntry = {
    tenantId: request.tenantId!,
    userId: request.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldData: data.oldData,
    newData: data.newData,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };

  try {
    // Persist audit log to database
    await auditLogRepository.create(auditEntry);
  } catch (error) {
    // Log but don't fail the request if audit persistence fails
    request.log.error({ err: error, audit: auditEntry }, 'Failed to persist audit log');
  }

  // Also log to structured logger for real-time monitoring
  request.log.info({ audit: auditEntry }, `AUDIT: ${data.action} on ${data.entityType}`);
}
