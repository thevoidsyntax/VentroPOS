# Skill Improvement Proposal v1.0

> **Document Version:** 1.0.0  
> **Date:** 2026-10-05  
> **Author:** Claude Code Enhancement Team  
> **Status:** Draft — Ready for Implementation  
> **Project:** VentroPOS (Phase 5 Hardware Integration)

---

## Executive Summary

### Current State Assessment

The existing skill system suffers from several critical limitations that reduce developer productivity and increase cognitive load. Skills are invoked with generic, context-free descriptions that fail to leverage project-specific state, phase context, and skill dependencies.

| Aspect | Current State | Gap |
|--------|---------------|-----|
| **Skill Discovery** | Manual, static list | No adaptation to project context |
| **Phase Awareness** | None | Phase 1 skills shown equally with Phase 5 |
| **Context Awareness** | None | Generic descriptions regardless of tech stack |
| **Dependency Chains** | Unknown | Skills shown without prerequisites |
| **Redundancy Detection** | Manual | Already-implemented skills still suggested |
| **Invocation Order** | Arbitrary | No logical sequencing based on dependencies |

### Key Findings

1. **Context Blindness:** Skills don't read CLAUDE.md or project state before recommendations
2. **Phase Misalignment:** All skills equally weighted regardless of development phase
3. **Dependency Ignorance:** No visualization of skill prerequisites or unlock chains
4. **Redundancy Waste:** Skills for already-implemented features still suggested
5. **Static Descriptions:** Skill outputs identical across different project contexts
6. **Workflow Errors:** JavaScript mode lacks TypeScript support; no error handling patterns

---

## Detailed Improvements

### 1. /auto-router Improvements

#### Current State

The auto-router currently provides basic skill routing without context awareness, phase detection, or implementation status checking.

#### Proposed Enhancements

##### 1.1 Project Context Loading

**Priority Files (in order):**
```
1. ./CLAUDE.md           → Developer instructions, preferences, phase status
2. ./README.md           → Tech stack, architecture, progress tracker
3. ./package.json        → Dependencies, scripts (for tech detection)
4. ./tsconfig.json      → TypeScript config (for strictness level)
```

**Context Extraction:**
- Tech stack detection (Node.js, Python, Go, etc.)
- Framework detection (Fastify, Express, Next.js, React, etc.)
- Phase awareness (Phase 1-6, current status)
- Coding standards (strict mode, conventions)
- User preferences (commit style, co-authored by)

##### 1.2 Phase-Aware Skill Selection

| Phase | Primary Skills | Secondary Skills |
|-------|--------------|------------------|
| **P1: Foundation** | `/database`, `/security`, `/identity` | `/logging`, `/config` |
| **P2: Core POS** | `/api-design`, `/domain-modeling` | `/messaging`, `/testing` |
| **P3: Inventory** | `/database`, `/data-engineering` | `/observability` |
| **P4: Reporting** | `/dataviz`, `/data-engineering` | `/api-design` (aggregations) |
| **P5: Hardware** | `/api-design`, `/security`, `/deployment` | `/iot-edge`, `/serial` |
| **P6: Launch** | `/performance`, `/scalability`, `/deployment` | `/security`, `/frontend` |

##### 1.3 Implementation Detection

**File System Checks:**
```
Check: src/{domain,application,infrastructure}/
├── entities/      → Domain skills may be redundant
├── repositories/  → Repository pattern already in place
├── services/      → Service layer exists
└── *.routes.ts    → API routes exist
```

**Implementation Status Table:**

| Check | If Exists | Action |
|-------|-----------|--------|
| `src/domain/entities/` | Domain structure | Skip /domain-modeling |
| `src/infrastructure/database/` | DB layer | Skip /database |
| `src/api/routes/` | Routes exist | Skip /api-design basics |
| `tests/` | Tests exist | Skip /testing (recommend expansion) |
| `Dockerfile` | Docker exists | Skip /docker basics |

##### 1.4 Priority Classification

**CRITICAL (Always invoke when relevant):**
- `/security` → Auth, encryption, vulnerability prevention
- `/database` → Schema changes, migrations, query optimization
- `/architecture-patterns` → System design, DDD patterns

**RECOMMENDED (Invoke based on context):**
- `/api-design` → When building new APIs
- `/performance` → Before launch, for optimization
- `/testing` → When adding new features
- `/observability` → Before production deployment
- `/deployment` → When deploying new components

**OPTIONAL (Invoke only when explicitly needed):**
- `/documentation` → When writing docs
- `/dataviz` → When building dashboards
- `/devops` → CI/CD, automation
- `/ml-engineering` → Only for ML features

##### 1.5 Tech-to-Skill Dynamic Mapping

```
Backend Framework → Skills
────────────────────────────────────────
Fastify           → /api-design, /performance, /observability
Express           → /security, /api-design, /performance
NestJS            → /architecture-patterns, /testing
Next.js           → /frontend, /performance, /seo

Database → Skills
────────────────────────────────────────
PostgreSQL        → /database, /performance, /data-engineering
MySQL             → /database, /performance
Redis             → /caching, /performance, /observability
MongoDB           → /database, /data-engineering

Language → Skills
────────────────────────────────────────
TypeScript        → /testing, /code-quality, /frontend
Python            → /api-design, /data-engineering, /testing
Go                → /performance, /security, /observability
```

##### 1.6 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: PROJECT CONTEXT LOADING                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Read CLAUDE  │→ │ Read README   │→ │ Parse Tech Stack     │    │
│  │ .md          │  │ .md           │  │ & Dependencies       │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PHASE AWARENESS DETECTION                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Detect Phase │  │ Check Status │→ │ Identify Current    │    │
│  │ Keywords     │  │ (Done/Next)  │  │ Deliverables        │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: SKILL RELEVANCE SCORING                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Match Tech   │→ │ Match Phase  │→ │ Score & Rank        │    │
│  │ Stack        │  │ Requirements │  │ Skills              │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4: IMPLEMENTATION DETECTION                                   │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │ Check src/   │→ │ Flag Already  │                               │
│  │ directories  │  │ Implemented   │                               │
│  └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 5: PRIORITY CLASSIFICATION                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ CRITICAL:    │  │ RECOMMENDED: │  │ OPTIONAL:           │    │
│  │ Security,    │  │ Performance, │  │ Documentation,       │    │
│  │ Data, Auth   │  │ Best Pract.  │  │ Polish               │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: EXECUTION PLAN GENERATION                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Generate     │  │ Add Context │→ │ Output Execution     │    │
│  │ Skill List   │  │ Metadata    │  │ Instructions        │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

##### 1.7 Skill Invocation Output Example

```
## Auto-Router Analysis

**Project Context:**
- Tech Stack: Node.js + Fastify + TypeScript + PostgreSQL
- Phase: Phase 5 (Hardware Integration)
- Status: Active development

**Detected Needs:**
1. Hardware API design (Phase 5 deliverable)
2. Secure device communication (security critical)
3. TCP socket integration (infrastructure)

**Recommended Skills:**

| Priority | Skill | Reason | Status |
|----------|-------|--------|--------|
| CRITICAL | /security | Hardware comms require encryption | INVOKE |
| CRITICAL | /api-design | New hardware endpoints | INVOKE |
| RECOMMENDED | /deployment | Device deployment patterns | CONSIDER |
| SKIPPED | /database | Already implemented in Phase 1 | ✓ |

**Invocation Order:**
1. /security — Validate hardware communication patterns
2. /api-design — Design device management endpoints
3. /deployment — Optional: Deployment guide

**Already Implemented (skipping):**
- /database — Repository pattern exists in src/infrastructure/database/
- /domain-modeling — Domain entities exist in src/domain/entities/
```

---

### 2. /project-init Improvements

#### Current State

The project-init skill lacks sophisticated scaffolding patterns, phase-aware template selection, and integration with existing project conventions.

#### Proposed Enhancements

##### 2.1 Phase-Aware Scaffolding

**Template Selection Matrix:**

| Phase | Template Focus | Key Components |
|-------|---------------|----------------|
| P1 | Foundation | Auth, Database, Config, Logger |
| P2 | Core Features | API Routes, Services, DTOs |
| P3 | Inventory | Stock Models, Tracking Services |
| P4 | Reporting | Analytics, Aggregations, Exports |
| P5 | Hardware | Device Drivers, TCP/Serial Comm |
| P6 | Launch | Performance, Monitoring, PWA |

##### 2.2 Project Context Integration

**Auto-Detection Before Scaffolding:**
```yaml
Pre-Scaffold Checks:
  1. Check existing CLAUDE.md for tech preferences
  2. Analyze package.json for existing dependencies
  3. Detect project patterns (DDD, CQRS, Repository)
  4. Read .editorconfig for formatting rules
```

##### 2.3 Convention Respect System

**Pattern Detection:**
```yaml
Detected Patterns:
  - DDD: src/domain/, src/application/, src/infrastructure/
  - Repository: src/{domain}/repositories/, src/{infrastructure}/repositories/
  - Multi-Tenant: tenant_id in all models, RLS policies
```

**Convention Adaptation:**
- Match existing file naming conventions
- Respect established directory structures
- Follow current import ordering rules
- Adhere to existing error handling patterns

##### 2.4 Smart Scaffolding Output

```
## Project Init Analysis

**Detected Context:**
- Existing Project: VentroPOS
- Phase: P5 (Hardware Integration)
- Tech Stack: Fastify + TypeScript + PostgreSQL
- Patterns: DDD-lite, Multi-Tenant, Repository Pattern

**Scaffolding Recommendations:**

Phase 5 Hardware Module:
├── src/
│   ├── api/
│   │   ├── hardware/
│   │   │   ├── routes.ts          (device endpoints)
│   │   │   ├── schemas.ts         (Zod validation)
│   │   │   └── middleware/         (device auth)
│   ├── application/
│   │   └── hardware/
│   │       ├── commands/          (device operations)
│   │       └── queries/           (device status)
│   ├── domain/
│   │   └── hardware/
│   │       ├── entities/          (Device, Transaction)
│   │       ├── value-objects/     (DeviceStatus, PaymentResult)
│   │       └── events/            (DeviceConnected, PaymentCompleted)
│   └── infrastructure/
│       └── hardware/
│           ├── printers/           (ESC/POS implementation)
│           ├── edc/               (EDC terminal integration)
│           └── scanner/           (Barcode scanner driver)

**Conventions Applied:**
✓ DDD-lite structure from existing project
✓ Zod validation from existing schemas
✓ Multi-tenant isolation patterns
✓ Pino logging integration
```

---

### 3. /workflow-authoring Improvements

#### Current State

The workflow-authoring skill has TypeScript mode syntax errors, lacks comprehensive error handling patterns, and doesn't integrate with Claude Code's agent system.

#### Proposed Enhancements

##### 3.1 TypeScript Mode Fix

**Current Error (JavaScript mode with TypeScript syntax):**
```javascript
// WRONG - Causes parse errors
const result: AuditResult = await agent('Audit codebase', {schema: AUDIT_SCHEMA})
```

**Fix: Proper Mode Declaration:**
```javascript
// CORRECT - TypeScript mode enabled via meta
export const meta = {
  name: 'typed-audit',
  description: 'Type-safe audit workflow',
  mode: 'typescript',  // Enable TypeScript
}

// TypeScript features now available
interface Finding {
  severity: string
  message: string
}

const result: AuditResult = await agent('Audit codebase', {schema: AUDIT_SCHEMA})
const critical: Finding[] = result.findings.filter(f => f.severity === 'critical')
```

##### 3.2 Comprehensive Error Handling

**Structured Error Types:**
```javascript
class WorkflowError extends Error {
  constructor(message, code, context = {}) {
    super(message)
    this.name = 'WorkflowError'
    this.code = code
    this.context = context
  }
}

class AgentError extends WorkflowError {
  constructor(message, agentLabel, attempts, lastError) {
    super(message, 'AGENT_ERROR', { agentLabel, attempts, lastError })
    this.name = 'AgentError'
  }
}

class TimeoutError extends WorkflowError {
  constructor(agentLabel, timeoutMs) {
    super(`Agent "${agentLabel}" timed out after ${timeoutMs}ms`, 'TIMEOUT', { agentLabel, timeoutMs })
    this.name = 'TimeoutError'
  }
}

class CircuitOpenError extends WorkflowError {
  constructor(serviceName, lastFailure) {
    super(`Circuit breaker open for ${serviceName}`, 'CIRCUIT_OPEN', { serviceName, lastFailure })
    this.name = 'CircuitOpenError'
  }
}

class RetryExhaustedError extends WorkflowError {
  constructor(agentLabel, attempts, lastError) {
    super(`All ${attempts} retry attempts exhausted for "${agentLabel}"`, 'RETRY_EXHAUSTED', { agentLabel, attempts, lastError })
    this.name = 'RetryExhaustedError'
  }
}
```

**Error Handling Patterns:**
```javascript
// Try-catch with typed errors
try {
  const result = await agent('Risky operation', {
    retry: { maxAttempts: 3 },
    circuitBreaker: { enabled: true }
  })
  return result
} catch (error) {
  if (error instanceof TimeoutError) {
    return fallbackResult
  } else if (error instanceof CircuitOpenError) {
    log('External service unavailable, using cached data')
    return cachedResult
  } else if (error instanceof RetryExhaustedError) {
    log(`Failed after ${error.context.attempts} attempts`)
    throw error
  }
  throw error
}

// Null coalescing for optional agents
const optionalResult = await agent('Optional enhancement', {
  schema: ENHANCEMENT_SCHEMA,
  retry: { maxAttempts: 1 }
}).catch(() => null)

const final = optionalResult || defaultEnhancement
```

##### 3.3 Advanced Agent Configuration

**Retry with Backoff:**
```javascript
// Basic retry (3 attempts, exponential backoff)
const result = await agent('API call', {
  schema: API_SCHEMA,
  retry: { maxAttempts: 3 }
})

// Custom backoff
const result = await agent('API call', {
  retry: {
    maxAttempts: 5,
    backoff: {
      initial: 500,
      multiplier: 2,
      maxDelay: 60000,
      jitter: 0.2
    }
  }
})

// Selective retry (only on network errors)
const result = await agent('API call', {
  retry: {
    maxAttempts: 3,
    retryable: (err) => err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')
  }
})
```

**Circuit Breaker Pattern:**
```javascript
// Enable circuit breaker for unreliable service
const result = await agent('Call external API', {
  schema: API_SCHEMA,
  circuitBreaker: {
    enabled: true,
    errorThreshold: 50,      // Open after 50% errors
    windowMs: 10000,        // In 10 second window
    halfOpenAttempts: 3     // Try 3 requests half-open
  }
})
```

##### 3.4 Template Library Expansion

**Database Migration Template:**
```javascript
export const meta = {
  name: 'migrate',
  description: 'Safe database migration workflow',
  mode: 'typescript',
  phases: [
    { title: 'Backup', detail: 'Create database backup' },
    { title: 'Plan', detail: 'Generate migration plan' },
    { title: 'Execute', detail: 'Apply migrations in worktree' },
    { title: 'Verify', detail: 'Validate data integrity' },
  ],
}

interface MigrationPlan {
  migrations: string[]
  risks: string[]
}

phase('Backup')
const backup = await agent('Create database backup', {schema: BACKUP_SCHEMA})

phase('Plan')
const plan: MigrationPlan = await agent('Generate migration plan', {schema: PLAN_SCHEMA})

phase('Execute')
const results = await pipeline(
  plan.migrations,
  async (m) => agent(m.sql, {
    isolation: 'worktree',
    retry: { maxAttempts: 3, backoff: { initial: 1000, multiplier: 2 } }
  })
)

phase('Verify')
const integrity = await agent('Verify data integrity', {schema: INTEGRITY_SCHEMA})

return { backup, plan, results, integrity }
```

**Parallel Migration Template:**
```javascript
export const meta = {
  name: 'parallel-migrate',
  description: 'Migrate multiple entities in parallel with isolation',
  mode: 'typescript',
  phases: [
    { title: 'Discover', detail: 'Find migration targets' },
    { title: 'Migrate', detail: 'Parallel migration with worktree isolation' },
    { title: 'Verify', detail: 'Verify all migrations' },
  ],
}

interface MigrationTarget {
  name: string
  sql: string
}

phase('Discover')
const targets: MigrationTarget[] = await agent('List migration targets', {schema: TARGETS_SCHEMA})

phase('Migrate')
const results = await pipeline(
  targets,
  async (target) => agent(`Migrate ${target.name}`, {
    isolation: 'worktree',
    retry: {
      maxAttempts: 3,
      backoff: { initial: 500, multiplier: 2, maxDelay: 30000 }
    },
    timeout: 120000
  })
)

phase('Verify')
const verified = await parallel(
  results.filter(r => r.success).map(r => () =>
    agent(`Verify migration: ${r.name}`, {schema: VERIFY_SCHEMA})
  )
)

return { total: targets.length, successful: verified.filter(Boolean).length }
```

##### 3.5 Anti-Patterns Documentation

```yaml
Anti-Patterns to Avoid:
  1. "Don't use parallel() as a barrier for map/filter"
     → Use pipeline stage instead
  
  2. "Don't hardcode Date.now()"
     → Pass timestamps via args
  
  3. "Don't use TypeScript syntax in JavaScript mode"
     → Parse errors occur
  
  4. "Don't skip error handling on retries"
     → Handle terminal failures
  
  5. "Don't ignore circuit breaker state"
     → Log state changes
  
  6. "Don't leave timeouts unbounded"
     → Set reasonable defaults
  
  7. "Don't skip silent truncation logging"
     → Use log() to report dropped items
```

---

### 4. Domain Skills Improvements

#### Current State

Domain skills suffer from generic, context-free descriptions that fail to leverage project-specific state, phase context, and skill dependencies.

#### Proposed Enhancements

##### 4.1 Context-Aware Skill Descriptions

**Before (Generic):**
```markdown
## /api-design
API design best practices including REST, GraphQL, and gRPC patterns.
```

**After (Context-Aware):**
```markdown
## /api-design

**Current Context:** Phase 5.3 - EDC Terminal Integration
**Tech Stack Detected:** Fastify 5.x, TypeScript 5.x, PostgreSQL 15+

**Relevant For:**
- Hardware device APIs (Phase 5 hardware endpoints)
- EDC payment callback handling
- Receipt printer command protocols

**Recommended Patterns:**
- TCP socket integration (vs typical REST)
- Idempotency keys for EDC transactions
- Event-driven hardware responses

**Invoked Skills:** /security (hardware auth), /api-client (socket patterns)
```

##### 4.2 Skill Dependency Graph

```
/database
    │
    ├──▶ /scalability
    │        │
    │        └──▶ /performance
    │
    ├──▶ /api-design
    │        │
    │        ├──▶ /graphql (if GraphQL detected)
    │        │
    │        └──▶ /messaging (for async patterns)
    │
    └──▶ /security
             │
             ├──▶ /identity (for auth patterns)
             │
             └──▶ /observability (for audit trails)

/frontend
    │
    ├──▶ /dataviz (if dashboards needed)
    │
    └──▶ /performance (for CWV optimization)

/deployment
    │
    ├──▶ /docker
    │
    ├──▶ /kubernetes (if scaling needed)
    │
    └──▶ /ci-cd
```

##### 4.3 Phase-Gate Skill Triggers

| Phase Gate Check | Triggered Skills |
|------------------|------------------|
| `npm audit` failing | `/security`, `/dependency-audit` |
| `tsc --noEmit` failing | `/typescript` (if TS project) |
| Performance issues | `/performance`, `/database` (query optimization) |
| New API endpoint | `/api-design` (auto-suggest contract review) |
| Database migration | `/database`, `/data-engineering` |
| Security vulnerability | `/security`, `/identity` |

##### 4.4 Skill Selection Matrix

| User Intent | Detected Context | Recommended Skills |
|-------------|------------------|-------------------|
| "add new API" | Phase 2, Fastify | `/api-design`, `/validation` |
| "fix security issue" | Any phase | `/security`, `/dependency-audit` |
| "optimize queries" | Phase 3-4, PostgreSQL | `/database`, `/performance` |
| "add hardware support" | Phase 5 | `/api-design`, `/deployment`, `/security` |
| "prepare for launch" | Phase 6 | `/performance`, `/scalability`, `/deployment` |
| "improve tests" | Any phase | `/testing`, `/tdd` |

##### 4.5 Skill Metadata Schema

```yaml
skills:
  - name: /api-design
    category: architecture
    phaseRelevance:
      P1: low      # Foundation APIs
      P2: critical # Core business APIs
      P3: medium   # Stock APIs
      P4: medium   # Report APIs
      P5: critical # Hardware APIs
      P6: low      # Launch tweaks
    techStackRelevance:
      Fastify: high
      Express: medium
      NestJS: medium
    prerequisites: [/database]
    unlocks: [/graphql, /messaging]
    patterns:
      - REST
      - WebSocket
      - TCP Socket
    contextAware: true

  - name: /database
    category: infrastructure
    phaseRelevance:
      P1: critical # Foundation schema
      P2: medium   # Transaction handling
      P3: critical # Stock operations
      P4: medium   # Report aggregations
      P5: medium   # Hardware logs
      P6: medium   # Performance tuning
    prerequisites: []
    unlocks: [/scalability, /data-engineering]
    patterns:
      - RLS (Row-Level Security)
      - Connection Pooling
      - Query Optimization
      - Migrations
```

##### 4.6 Project State Detection Schema

```typescript
interface ProjectState {
  projectName: string;
  phase: number;
  phaseName: string;
  techStack: {
    backend: string[];
    frontend: string[];
    database: string[];
    infrastructure: string[];
  };
  currentDeliverables: string[];
  patterns: ('DDD' | 'CQRS' | 'EventSourcing' | 'MultiTenant')[];
  qualityGates: {
    testCount: number;
    auditStatus: 'pass' | 'fail' | 'pending';
    typeStatus: 'strict' | 'loose';
  };
}
```

##### 4.7 CLAUDE.md Skill Context Section

```markdown
## 🧠 Skill Context Configuration

### Project State (Auto-Detected)
```json
{
  "projectName": "VentroPos",
  "currentPhase": 5,
  "phaseName": "Hardware Integration",
  "techStack": {
    "backend": ["Node.js 20+", "Fastify 5.x", "TypeScript 5.x"],
    "database": ["PostgreSQL 15+", "RLS"],
    "auth": ["JWT", "bcrypt"]
  },
  "patterns": ["DDD-lite", "Multi-Tenant", "Repository Pattern"]
}
```

### Phase-Aware Skill Rules

| Phase | Auto-Include Skills | Gate-Triggered Skills |
|-------|--------------------|-----------------------|
| P1 | `/database`, `/security`, `/identity` | npm audit fail → `/security` |
| P2 | `/api-design`, `/domain-modeling` | New payment → `/messaging` |
| P3 | `/database`, `/data-engineering` | Performance → `/performance` |
| P4 | `/dataviz`, `/data-engineering` | CSV export → `/storage` |
| P5 | `/api-design`, `/security`, `/deployment` | Hardware API → `/iot-edge` |
| P6 | `/performance`, `/scalability`, `/deployment` | PWA → `/frontend` |

### Skill Dependencies
```yaml
/database:
  prerequisites: []
  unlocks: [/scalability, /api-design, /data-engineering]

/api-design:
  prerequisites: [/database]
  unlocks: [/graphql, /messaging]

/security:
  prerequisites: []
  unlocks: [/identity, /observability]

/performance:
  prerequisites: [/database, /api-design]
  unlocks: [/scalability]
```
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Weeks 1-2)

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 1.1 | Fix workflow-authoring TypeScript mode syntax | Low | Critical | Pending |
| 1.2 | Add error handling patterns to workflow-authoring | Medium | Critical | Pending |
| 1.3 | Implement basic project context loading in auto-router | Medium | Critical | Pending |
| 1.4 | Add phase detection to auto-router | Medium | High | Pending |

### Phase 2: Enhanced Features (Weeks 3-4)

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 2.1 | Implement implementation detection (already-exists checks) | Medium | High | Pending |
| 2.2 | Add skill dependency graph definition | Medium | High | Pending |
| 2.3 | Create phase-aware skill weighting system | Medium | High | Pending |
| 2.4 | Add priority classification (CRITICAL/RECOMMENDED/OPTIONAL) | Low | Medium | Pending |

### Phase 3: Advanced Features (Weeks 5-6)

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 3.1 | Implement dynamic skill descriptions based on context | High | Medium | Pending |
| 3.2 | Add tech-to-skill dynamic mapping | Medium | Medium | Pending |
| 3.3 | Create skill metadata schema for all domain skills | High | Medium | Pending |
| 3.4 | Implement phase-gate skill triggers | Medium | Medium | Pending |
| 3.5 | Add CLAUDE.md skill context section generation | Medium | Low | Pending |

---

## Migration Guide

### For Skill Authors

#### Before (Static Skill)
```markdown
# /api-design
API design best practices including REST, GraphQL, and gRPC patterns.
Covers resource naming, versioning, pagination, error handling, and authentication.
```

#### After (Context-Aware Skill)
```markdown
# /api-design

**Current Context:** [Auto-populated from project]
**Tech Stack Detected:** [Auto-detected]

## Context-Aware Description

**When Fastify detected:**
Use Fastify route schemas with Zod validation
Leverage @fastify/swagger for OpenAPI docs

**When Hardware Phase (P5):**
Focus on TCP socket patterns for EDC/printer
Idempotency key patterns for payment flows

**When Multi-Tenant:**
Tenant isolation in every route

## Metadata
```yaml
phaseRelevance:
  P1: low
  P2: critical
  P5: critical
techStackRelevance:
  Fastify: high
  Express: medium
prerequisites: [/database]
unlocks: [/graphql, /messaging]
```
```

### For Workflow Authors

#### Before (JavaScript with TypeScript)
```javascript
// ❌ CAUSES PARSE ERROR
export const meta = {
  name: 'audit',
}

const result: AuditResult = await agent('Audit', {schema: AUDIT_SCHEMA})
```

#### After (Proper TypeScript Mode)
```javascript
// ✅ CORRECT
export const meta = {
  name: 'typed-audit',
  description: 'Type-safe audit workflow',
  mode: 'typescript',
}

interface AuditResult {
  findings: Finding[]
}

const result: AuditResult = await agent('Audit', {schema: AUDIT_SCHEMA})
```

### For Project Maintainers

#### Adding Skill Context to CLAUDE.md

```markdown
## 🧠 Skill Context Configuration

### Project State
```json
{
  "projectName": "YourProject",
  "currentPhase": 2,
  "techStack": {
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL"]
  }
}
```

### Skill Dependencies
```yaml
/database:
  prerequisites: []
  unlocks: [/api-design, /scalability]

/api-design:
  prerequisites: [/database]
  unlocks: [/graphql]
```

---

## Expected Outcomes

### Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Skill Discovery | Manual, generic list | Auto-suggested based on phase |
| Context | None | Project-aware, tech-aware |
| Dependencies | Unknown | Visual dependency graph |
| Relevance | All skills equal | Phase-weighted priority |
| Recommendations | Static | Dynamic based on project state |
| Redundancy | Manual detection | Auto-detection of implemented features |
| Workflow Errors | TypeScript in JS mode | Proper mode declaration |
| Error Handling | Basic try-catch | Structured error types |

### Quantified Improvements

| Metric | Target |
|--------|--------|
| Skill mis-selection reduction | 30% |
| Faster skill discovery | 50% |
| Context alignment | 100% with current phase |
| Prerequisite violations | 0% (enforced) |
| Workflow parse errors | 0% (proper mode) |

---

## Appendix

### A. VentroPos Phase 5 Skill Context Example

```markdown
## Current Skill Context: Phase 5 Hardware Integration

**Project:** VentroPos v1.0.1
**Phase:** 5.3 (EDC Terminal Integration)
**Last Updated:** 2026-10-02

### Detected Skills

| Skill | Phase Weight | Tech Match | Priority |
|-------|--------------|------------|----------|
| `/api-design` | P5: critical | Fastify: high | 95/100 |
| `/security` | P5: critical | TLS: required | 95/100 |
| `/deployment` | P5: high | Docker: yes | 85/100 |
| `/iot-edge` | P5: medium | Serial: yes | 75/100 |
| `/messaging` | P2: high | Async: yes | 60/100 |
| `/performance` | P6: high | Latency: critical | 50/100 |

### Recently Completed
- Phase 5.1: Device Foundation
- Phase 5.2: Receipt Printer
- Phase 5.3: EDC Terminal

### Next Deliverables
- Phase 5.4: Scanner & Drawer integration
- Phase 5 Complete: Hardware module tests
- Phase 6: Launch preparation
```

### B. Skill Dependency Reference

```yaml
/database:
  description: "PostgreSQL optimization, RLS, migrations"
  prerequisites: []
  unlocks: [/scalability, /api-design, /data-engineering]
  phaseRelevance: {P1: critical, P2: medium, P3: critical, P4-P6: medium}

/api-design:
  description: "REST/GraphQL/WebSocket patterns, contract design"
  prerequisites: [/database]
  unlocks: [/graphql, /messaging]
  phaseRelevance: {P1: high, P2-P4: medium, P5: critical, P6: low}

/security:
  description: "Auth, encryption, vulnerability prevention"
  prerequisites: []
  unlocks: [/identity, /observability]
  phaseRelevance: {P1-P2: critical, P3: high, P4: medium, P5: critical, P6: high}

/performance:
  description: "Profiling, caching, optimization patterns"
  prerequisites: [/database, /api-design]
  unlocks: [/scalability]
  phaseRelevance: {P1: low, P2-P5: medium, P6: critical}

/deployment:
  description: "Docker, CI/CD, cloud infrastructure"
  prerequisites: [/docker (optional)]
  unlocks: [/kubernetes, /ci-cd]
  phaseRelevance: {P1-P4: low, P5: high, P6: critical}

/iot-edge:
  description: "Edge computing, device drivers, serial comm"
  prerequisites: [/deployment]
  unlocks: []
  phaseRelevance: {P1-P4: low, P5: critical, P6: low}
```

---

## Conclusion

This proposal outlines a comprehensive framework for transforming static, generic skills into a **Context-Aware, Phase-Aware, Dependency-Driven** skill selection system. The key innovations are:

1. **Project State Integration** — Skills read CLAUDE.md to understand current context
2. **Phase-Weighted Selection** — Skills ranked by relevance to current development phase
3. **Dependency Graph** — Prerequisites enforced, unlock chains visualized
4. **Dynamic Descriptions** — Skill output adapts to detected tech stack and patterns
5. **Quality Gate Triggers** — Skills auto-suggested based on audit/test results
6. **Workflow Error Fixes** — Proper TypeScript mode declaration and error handling

The implementation follows an incremental adoption path with backward compatibility, ensuring minimal disruption while maximizing the intelligence of skill recommendations.

---

*Document Version: 1.0.0*  
*Created: 2026-10-05*  
*Status: Ready for Implementation*  
*Project: VentroPOS*
