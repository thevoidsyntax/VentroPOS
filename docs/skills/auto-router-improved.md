# Auto-Router Skill — Intelligent Skill Invocation System

## Overview

The auto-router is a smart skill orchestration system that analyzes project context, determines what skills are relevant, and invokes them in the optimal order. Unlike a simple router, it provides execution guidance and contextual awareness.

---

## Flow Diagram

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

---

## Core Intelligence Features

### 1. Project Context Loading

The auto-router MUST read and parse project metadata before skill invocation:

```
Priority Files (in order):
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

### 2. Phase Awareness System

Detect which development phase is active based on:

| Pattern | Interpretation | Skill Focus |
|---------|---------------|-------------|
| "lanjutkan phase 5" | Continue Phase 5 | Phase-specific skills only |
| "Phase 5" in context | Target phase | Skills for Phase 5 deliverables |
| "Phase 1-4 ✅" | Completed phases | Skip already-implemented skills |
| "Phase 5 ⬜" | Current phase | Prioritize Phase 5 skills |

**Phase-Aware Skill Selection:**

```
Phase 1 (Foundation):
  → /security, /database, /architecture-patterns

Phase 2 (Core Features):
  → /api-design, /validation, /testing

Phase 3 (Inventory):
  → /database, /reporting, /testing

Phase 4 (Reporting):
  → /dataviz, /reporting, /testing

Phase 5 (Hardware):
  → /api-design, /deployment, /security

Phase 6 (Launch):
  → /security, /deployment, /performance, /observability
```

### 3. Already Implemented Detection

Prevent redundant skill invocations by checking:

**File System Checks:**
```
Check: src/{domain,application,infrastructure}/
       ├── entities/      → Domain skills may be redundant
       ├── repositories/  → Repository pattern already in place
       ├── services/      → Service layer exists
       └── *.routes.ts    → API routes exist
```

**Pattern Matching:**
- Scan for existing skill implementations in codebase
- Check `src/` directory structure matches skill's expected patterns
- Verify files match the skill's deliverable structure

**Implementation Status Table:**

| Check | If Exists | Action |
|-------|-----------|--------|
| `src/domain/entities/` | Domain structure | Skip /domain-modeling |
| `src/infrastructure/database/` | DB layer | Skip /database |
| `src/api/routes/` | Routes exist | Skip /api-design basics |
| `tests/` | Tests exist | Skip /testing (recommend expansion) |
| `Dockerfile` | Docker exists | Skip /docker basics |
| `kubernetes/` | K8s exists | Skip /kubernetes basics |

### 4. Priority Classification

Skills are classified into three tiers:

**CRITICAL (Always invoke when relevant):**
```
/security         → Auth, encryption, vulnerability prevention
/database         → Schema changes, migrations, query optimization
/architecture-patterns → System design, DDD patterns
```

**RECOMMENDED (Invoke based on context):**
```
/api-design       → When building new APIs
/performance      → Before launch, for optimization
/testing          → When adding new features
/observability    → Before production deployment
/deployment       → When deploying new components
```

**OPTIONAL (Invoke only when explicitly needed):**
```
/documentation    → When writing docs
/dataviz          → When building dashboards
/devops           → CI/CD, automation
/ml-engineering   → Only for ML features
```

### 5. Tech-to-Skill Dynamic Mapping

**Mapping Matrix (Context-Aware):**

```
Backend Framework → Skills
────────────────────────────────────────
Fastify           → /api-design, /performance, /observability
Express           → /security, /api-design, /performance
NestJS            → /architecture-patterns, /testing
Next.js           → /frontend, /performance, /seo
Django            → /api-design, /database, /security

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
Rust              → /performance, /security, /memory-management
```

---

## Skill Invocation Output

When the auto-router identifies relevant skills, it outputs:

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

## Implementation Instructions for Claude Code

### When to Trigger Auto-Router

The auto-router should activate when:

1. **New chat session starts** — Read CLAUDE.md and README.md first
2. **Feature request detected** — Analyze requirements for skill needs
3. **Phase transition** — When user says "lanjutkan phase X"
4. **New file/module creation** — Recommend skills for the new component

### Skill Invocation Pattern

```typescript
// Pseudo-code for auto-router decision logic
function shouldInvokeSkill(skill: Skill, context: ProjectContext): InvocationDecision {
  // 1. Check if skill is relevant to tech stack
  if (!matchesTechStack(skill, context.techStack)) {
    return { invoke: false, reason: 'Not relevant to tech stack' };
  }

  // 2. Check if skill matches current phase
  if (skill.phase && skill.phase !== context.currentPhase) {
    return { invoke: false, reason: `Skill is for Phase ${skill.phase}` };
  }

  // 3. Check if already implemented
  if (isAlreadyImplemented(skill, context.projectStructure)) {
    return { invoke: false, reason: 'Already exists in codebase' };
  }

  // 4. Determine priority
  const priority = classifyPriority(skill, context);

  return {
    invoke: priority !== 'SKIP',
    priority,
    reason: `Priority: ${priority}`
  };
}
```

### Context Metadata Schema

```typescript
interface ProjectContext {
  projectName: string;
  techStack: {
    backend: string[];
    frontend: string[];
    database: string[];
    tools: string[];
  };
  phase: {
    current: number;
    status: 'done' | 'in_progress' | 'todo';
    completed: number[];
  };
  projectStructure: {
    hasDomain: boolean;
    hasInfrastructure: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasK8s: boolean;
  };
  conventions: {
    commitStyle: 'conventional' | 'standard';
    testFramework: string;
    apiStyle: 'rest' | 'graphql';
  };
  preferences: {
    coAuthoredBy: boolean;
    claudefooter: boolean;
  };
}
```

---

## Example: VentroPos Phase 5 Invocation

**User Input:** "lanjutkan phase 5"

**Auto-Router Analysis:**

1. **Read CLAUDE.md:**
   - Current Phase: 5 (Hardware Integration)
   - Deliverables: Receipt printer, EDC, Scanner, Cash drawer
   - Tech Stack: Node.js, Fastify, TypeScript, PostgreSQL

2. **Read README.md:**
   - Phase 5 specifications with API endpoints
   - Database schema for hardware_devices

3. **Skill Matching:**
   - /security → CRITICAL (hardware comms need secure protocols)
   - /api-design → CRITICAL (new hardware endpoints)
   - /deployment → RECOMMENDED (device deployment)
   - /database → SKIPPED (already implemented in Phase 1)

4. **Output:**
   ```
   ## Phase 5 Skill Recommendations

   **Context:** Hardware Integration phase active

   | Skill | Priority | Reason |
   |-------|----------|--------|
   | /security | CRITICAL | Hardware comms require encryption, input validation |
   | /api-design | CRITICAL | New /hardware/* endpoints to design |
   | /deployment | RECOMMENDED | Device deployment patterns |
   | /database | SKIPPED | Schema already exists in Phase 5.1 |

   **Invocation Order:**
   1. /security — Secure TCP/USB device communication
   2. /api-design — Hardware device APIs
   3. /deployment — Optional for device rollout
   ```

---

## Skill Definition Schema

Each skill should declare its metadata:

```yaml
skill:
  name: api-design
  description: REST/GraphQL API design best practices
  tech_stack:
    - fastify
    - express
    - next.js
    - nestjs
  phase_relevance:
    - 2  # Core features
    - 5  # Hardware APIs
  priority: recommended
  required_for:
    - new_api_endpoint
    - rest_resource
  files_created:
    - src/api/routes/
    - src/application/*/index.ts
  patterns:
    - repository
    - use_case
    - dto
  skip_if_exists:
    - src/api/routes/
```

---

## Integration with Claude Code

### Activation Triggers

1. **On chat start:** Auto-load CLAUDE.md and README.md
2. **On skill mention:** Check if skill is relevant before invoking
3. **On phase mention:** Auto-suggest phase-appropriate skills
4. **On new module:** Recommend architecture skills

### Skill Invocation Flow

```
1. Parse user request
2. Extract phase/feature keywords
3. Load project context (CLAUDE.md, README.md)
4. Score available skills against context
5. Filter out already-implemented features
6. Generate prioritized skill list
7. Output recommendations with reasoning
8. User confirms → Invoke skills in order
```

---

## Future Enhancements

1. **Learning from history:** Track which skills were invoked successfully
2. **Dependency graph:** Skills that depend on other skills
3. **Complexity scoring:** Estimate effort based on skill combination
4. **Conflict detection:** Warn when skills have overlapping concerns
5. **Custom rules:** Allow project-specific skill mappings

---

## Summary

The improved auto-router provides:

| Feature | Benefit |
|---------|---------|
| Context awareness | Reads CLAUDE.md, README.md before decisions |
| Phase awareness | Matches skills to current development phase |
| Implementation detection | Skips redundant skill invocations |
| Priority system | CRITICAL vs RECOMMENDED vs OPTIONAL tiers |
| Dynamic mapping | Tech stack → skill relevance scoring |
| Execution guidance | Ordered skill invocation with reasoning |

This makes the auto-router not just a router, but an intelligent orchestrator that reduces redundant work and ensures the right skills are invoked at the right time.
