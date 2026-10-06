# VentroPOS Backend - Technical Specification

> **Version:** 1.0.0
> **Status:** ✅ Completed (Phase 1-6)
> **Last Updated:** 2026-01-26

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Project Structure](#2-project-structure)
3. [Domain Layer](#3-domain-layer)
4. [Application Layer](#4-application-layer)
5. [Infrastructure Layer](#5-infrastructure-layer)
6. [API Layer](#6-api-layer)
7. [Database](#7-database)
8. [Authentication](#8-authentication)
9. [Error Handling](#9-error-handling)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)

---

## 1. Architecture

### 1.1 Design Pattern

**DDD-lite** (Domain-Driven Design simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Delivery)                    │
│  Routes, Schemas, Middleware, Error Handling               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  Use Cases, Application Services, DTOs                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  Entities, Value Objects, Repository Interfaces            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  Repository Implementations, Database, External Services    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Principles

- **Layer Isolation**: Domain layer has no external dependencies
- **Repository Pattern**: Abstract data access through interfaces
- **Use Case Pattern**: Each business operation is a use case
- **Multi-tenancy**: PostgreSQL Row-Level Security (RLS)

---

## 2. Project Structure

```
src/backend/
├── src/
│   ├── api/                          # API Layer
│   │   ├── routes/                   # Route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── products.routes.ts
│   │   │   ├── categories.routes.ts
│   │   │   ├── tables.routes.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── modifiers.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── hardware.routes.ts
│   │   ├── middleware/               # Middleware
│   │   │   ├── auth.ts
│   │   │   ├── tenant.ts
│   │   │   └── audit.ts
│   │   ├── schemas/                  # Zod schemas
│   │   │   └── index.ts
│   │   └── index.ts                  # Route registration
│   │
│   ├── application/                   # Application Layer
│   │   ├── auth/
│   │   │   ├── register.ts
│   │   │   ├── login.ts
│   │   │   ├── refresh.ts
│   │   │   └── logout.ts
│   │   ├── users/
│   │   │   ├── user-create.ts
│   │   │   ├── user-update.ts
│   │   │   ├── user-delete.ts
│   │   │   └── user-get.ts
│   │   ├── products/
│   │   ├── categories/
│   │   ├── tables/
│   │   ├── orders/
│   │   │   ├── order-create.ts
│   │   │   ├── order-checkout.ts
│   │   │   ├── order-void.ts
│   │   │   ├── order-update-status.ts
│   │   │   └── order-hold.ts
│   │   ├── modifiers/
│   │   ├── stock/
│   │   │   ├── stock-overview.ts
│   │   │   ├── stock-adjust.ts
│   │   │   ├── stock-receive.ts
│   │   │   ├── stock-history.ts
│   │   │   ├── stock-alerts.ts
│   │   │   └── opname-*.ts
│   │   ├── reports/
│   │   │   ├── sales-summary.ts
│   │   │   ├── product-performance.ts
│   │   │   ├── staff-performance.ts
│   │   │   ├── category-breakdown.ts
│   │   │   └── export-report.ts
│   │   └── hardware/
│   │       ├── device.service.ts
│   │       ├── print.service.ts
│   │       ├── edc.service.ts
│   │       ├── scanner.service.ts
│   │       └── drawer.service.ts
│   │
│   ├── domain/                        # Domain Layer
│   │   ├── entities/
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   ├── category.ts
│   │   │   ├── table.ts
│   │   │   ├── order.ts
│   │   │   ├── modifier.ts
│   │   │   ├── stock.ts
│   │   │   ├── report.ts
│   │   │   └── hardware.ts
│   │   └── repositories/              # Interfaces
│   │       ├── user.repository.ts
│   │       ├── product.repository.ts
│   │       ├── category.repository.ts
│   │       ├── table.repository.ts
│   │       ├── order.repository.ts
│   │       ├── modifier.repository.ts
│   │       ├── stock.repository.ts
│   │       ├── report.repository.ts
│   │       └── hardware.repository.ts
│   │
│   ├── infrastructure/                 # Infrastructure Layer
│   │   ├── database/
│   │   │   ├── connection.ts          # Knex setup
│   │   │   └── repositories/          # Implementations
│   │   │       ├── user.repository.ts
│   │   │       ├── product.repository.ts
│   │   │       └── ...
│   │   ├── auth/
│   │   │   └── jwt.ts
│   │   └── hardware/
│   │       └── drivers/
│   │           ├── escpos.driver.ts
│   │           └── edc.driver.ts
│   │
│   └── shared/                        # Shared Kernel
│       ├── config.ts
│       ├── errors.ts
│       └── utils.ts
│
├── migrations/                         # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_idempotency_keys.sql
│   ├── 003_stock_tables.sql
│   ├── 004_audit_logs.sql
│   ├── 005_performance_indexes.sql
│   └── 006_hardware_tables.sql
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── checkout.test.ts
│   │   ├── stock.test.ts
│   │   ├── reports.test.ts
│   │   └── hardware.test.ts
│   └── setup.ts
│
├── package.json
├── tsconfig.json
├── knexfile.ts
└── .env.example
```

---

## 3. Domain Layer

### 3.1 Entities

```typescript
// src/domain/entities/user.ts
export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'owner' | 'manager' | 'kasir' | 'kitchen';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// src/domain/entities/product.ts
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  categoryId: string;
  price: number;
  cost?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Repository Interfaces

```typescript
// src/domain/repositories/user.repository.ts
export interface UserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByTenant(tenantId: string, filters?: PaginationFilters): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
```

---

## 4. Application Layer

### 4.1 Use Case Pattern

```typescript
// src/application/users/user-create.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService
  ) {}

  async execute(input: CreateUserInput): Promise<Result<User, UserErrors>> {
    // 1. Validate input
    const validation = CreateUserSchema.safeParse(input);
    if (!validation.success) {
      return Result.err(UserErrors.VALIDATION_ERROR);
    }

    // 2. Check duplicate email
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      return Result.err(UserErrors.EMAIL_EXISTS);
    }

    // 3. Hash password
    const passwordHash = await this.hashService.hash(input.password);

    // 4. Create user
    const user = await this.userRepository.create({
      ...input,
      passwordHash,
    });

    return Result.ok(user);
  }
}
```

### 4.2 Max File Size Rule

**Each use case file should be < 100 lines.**

If a use case exceeds this limit, split it into smaller, focused use cases.

---

## 5. Infrastructure Layer

### 5.1 Database Connection

```typescript
// src/infrastructure/database/connection.ts
import knex from 'knex';

export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 5,
    max: 20,
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await db.destroy();
  process.exit(0);
});
```

### 5.2 Repository Implementation

```typescript
// src/infrastructure/database/repositories/user.repository.ts
export class PostgresUserRepository implements UserRepository {
  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [row] = await db('users').insert(data).returning('*');
    return this.mapRow(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await db('users').where({ id }).first();
    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

---

## 6. API Layer

### 6.1 Route Definition

```typescript
// src/api/routes/users.routes.ts
export async function userRoutes(fastify: FastifyInstance) {
  // List users
  fastify.get('/users', {
    schema: {
      querystring: UserListQuerySchema,
      response: { 200: UserListResponseSchema },
    },
    preHandler: [fastify.authenticate, fastify.requireRole('owner', 'manager')],
  }, async (request, reply) => {
    const { tenantId } = request.user;
    const filters = request.query;
    const users = await getContainer().userRepository.findByTenant(tenantId, filters);
    return { success: true, data: users };
  });

  // Create user
  fastify.post('/users', {
    schema: {
      body: CreateUserSchema,
      response: { 201: UserResponseSchema },
    },
    preHandler: [fastify.authenticate, fastify.requireRole('owner')],
  }, async (request, reply) => {
    const result = await createUserUseCase.execute({
      ...request.body,
      tenantId: request.user.tenantId,
    });

    if (result.isErr()) {
      return reply.status(400).send({ success: false, error: result.error });
    }

    return reply.status(201).send({ success: true, data: result.value });
  });
}
```

### 6.2 Schema Validation

```typescript
// src/api/schemas/index.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  role: z.enum(['owner', 'manager', 'kasir', 'kitchen']),
});

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['owner', 'manager', 'kasir', 'kitchen']).optional(),
  isActive: z.coerce.boolean().optional(),
});
```

---

## 7. Database

### 7.1 Multi-Tenancy

All tables include `tenant_id` column and have RLS policies:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### 7.2 Key Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant organizations |
| `users` | Staff accounts |
| `products` | Product catalog |
| `categories` | Product categories |
| `restaurant_tables` | Table layout |
| `orders` | Customer orders |
| `order_items` | Items in order |
| `transactions` | Payments |
| `stock_logs` | Stock movements |
| `hardware_devices` | POS hardware |
| `audit_logs` | Activity audit |

### 7.3 Migrations

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

---

## 8. Authentication

### 8.1 JWT Flow

```
1. POST /auth/login
   └─ Validate credentials
   └─ Generate access token (15min) + refresh token (7 days)
   └─ Return tokens

2. Access Token in Authorization header
   └─ Middleware validates JWT
   └─ Attach user to request

3. POST /auth/refresh
   └─ Validate refresh token
   └─ Generate new access token
   └─ Rotate refresh token
```

### 8.2 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT secrets required in production
- Refresh token rotation
- Token cleanup interval

---

## 9. Error Handling

### 9.1 Error Codes

```typescript
// src/shared/errors.ts
export const ErrorCodes = {
  // 400 Bad Request
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // 401 Unauthorized
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 403 Forbidden
  FORBIDDEN: 'FORBIDDEN',

  // 404 Not Found
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',

  // 409 Conflict
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',

  // 429 Too Many Requests
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 500 Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};
```

### 9.2 Response Format

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID xyz not found"
  }
}
```

---

## 10. Testing

### 10.1 Test Structure

```
tests/
├── unit/
│   ├── auth.test.ts        # Authentication tests
│   ├── checkout.test.ts     # Checkout flow tests
│   ├── stock.test.ts       # Stock operations tests
│   ├── reports.test.ts     # Report generation tests
│   └── hardware.test.ts     # Hardware integration tests
└── setup.ts                # Test configuration
```

### 10.2 Running Tests

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### 10.3 Test Coverage

```
✅ 159 tests passing
  - Unit tests for all use cases
  - Repository mocks
  - Validation tests
```

---

## 11. Deployment

### 11.1 Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/ventropos
JWT_SECRET=your-32-char-secret-key
JWT_REFRESH_SECRET=another-32-char-secret

# Optional
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 11.2 Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # TypeScript compile
npm start            # Start production server

# Database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed demo data

# Quality
npm test            # Run tests
npm run lint        # ESLint check
npm run db:migrate
```

### 11.3 Docker

```dockerfile
# Dockerfile (multi-stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
```

---

## Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| TypeScript Errors | 0 | ✅ 0 |
| ESLint Errors | 0 | ✅ 0 |
| Test Coverage | > 80% | ✅ Pass |
| npm Vulnerabilities | 0 | ✅ 0 |
| Max Use Case Size | < 100 ln | ✅ ~90 ln |
| Max Repo Size | < 250 ln | ✅ 207 ln |

---

## References

- **API Docs:** `http://localhost:3000/docs` (Swagger UI)
- **Changelog:** `CHANGELOG.md`
- **PRD:** `docs/prd/README.md`

---

*Document maintained by: thevoidsyntax*
