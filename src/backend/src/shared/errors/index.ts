// Custom Application Errors

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DomainError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DOMAIN_ERROR', 400, details);
    this.name = 'DomainError';
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED', 401);
    this.name = 'TokenExpiredError';
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(resourceType: string, id: string) {
    super(`${resourceType} with id '${id}'`);
    this.name = 'ResourceNotFoundError';
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class DuplicateError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`);
    this.name = 'DuplicateError';
  }
}

// 422 Unprocessable Entity
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422, details);
    this.name = 'BusinessRuleError';
  }
}

// 429 Too Many Requests
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    if (retryAfter) {
      this.details = { retryAfter };
    }
  }
}

// 500 Internal Server Error
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_ERROR', 500);
    this.name = 'InternalError';
  }
}

export class DatabaseError extends InternalError {
  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.code = 'DATABASE_ERROR';
  }
}
