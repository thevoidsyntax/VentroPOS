# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.3.1
> **Last Updated:** 2026-10-09

---

## 📖 First Read

**WAJIB** baca di setiap chat baru:

1. **`README.md`** — Single source of truth untuk:
   - Progress tracker (Phase 1-13)
   - Phase specifications (requirements, deliverables, user stories)
   - API reference
   - Database schema
   - Tech stack & dependencies
   - Development guidelines

---

## ⚠️ User Preferences

- **DO NOT** add `Co-Authored-By` in git commits
- **DO NOT** add "Generated with Claude Code" footer in PRs
- **GitHub Email Privacy:** Use noreply email or disable email privacy protection in GitHub settings

---

## 🎯 Current Status

```
Phase 1-9:   ✅ DONE  - Backend + Frontend + Product Management
Phase 10-13:  ⬜ TODO - Remaining Frontend Features
```

**Last work:** v1.3.1 - Audit Fixes, Pagination, Correlation ID, React Refresh Warnings

**Code Quality Status:**
- ✅ Backend ESLint: 0 errors
- ✅ Frontend ESLint: 0 errors, 0 warnings
- ✅ TypeScript: No compilation errors
- ✅ Backend Tests: 187/187 passing
- ✅ Frontend Tests: 60/60 passing
- ✅ Pagination: DEFAULT_LIMIT/MAX_LIMIT implemented
- ✅ Correlation ID: X-Request-ID middleware added
- ✅ Order Number Race Fix: Advisory lock implemented

---

## 📁 Project Structure

```
src/
├── backend/           # Fastify API server (Phase 1-6)
│   ├── src/api/          # Routes, middleware, schemas
│   ├── src/application/  # Use cases (DDD)
│   ├── src/domain/       # Entities, repositories interfaces
│   ├── src/infrastructure/ # DB, auth implementations
│   └── src/shared/       # Config, errors, utils

├── frontend/          # React + Vite frontend (Phase 7+)
│   ├── tests/          # E2E tests (Playwright)
│   └── src/
│       ├── components/   # UI components, POS components
│       ├── hooks/        # TanStack Query hooks
│       ├── lib/          # API client, utils
│       ├── pages/        # Route pages
│       ├── routes/       # React Router config
│       └── stores/        # Zustand stores

docs/
├── roadmap/          # Phase specifications (phase-1-foundation.md, etc.)
├── frontend/          # Frontend specs (SPEC.md)
├── prd/              # Product Requirements Document
├── audit/            # Code audit reports
├── flowchart/        # Architecture flowcharts
└── skills/           # Skill specifications
```

**Reference:**
- `README.md` — Requirements, specs, progress, changelog
- `docs/roadmap/` — Detailed phase specifications
- `docs/frontend/SPEC.md` — Frontend setup spec
- `docs/prd/README.md` — Full business requirements (PRD)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20+, Fastify 5.x, TypeScript 5.x |
| Database | PostgreSQL 15+ (RLS) |
| Auth | JWT (@fastify/jwt 10.x) |
| Validation | Zod 3.x |
| Password | bcrypt 6.x |
| ORM/Query | pg 8.x (raw queries with parameterized statements) |
| Logging | Pino 9.x |
| Testing | Vitest 2.x |

### Frontend (Phase 7+)
| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 6 |
| Language | TypeScript 5 (strict) |
| Styling | TailwindCSS 3 + shadcn/ui |
| State | Zustand 5 (global) + TanStack Query 5 (server) |
| Routing | React Router 6 |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |
| E2E Testing | Playwright |

---

## 📌 Phase Work

### Current: Phase 10 - Stock Management UI

**Requirements:** Lihat `README.md` Section "Phase 10" dan `docs/roadmap/`

**Skills to invoke:**
| Skill | Type | Trigger |
|-------|------|---------|
| `/frontend` | Auto | File: `**/*.tsx`, `**/*.jsx` |
| `/ui-ux-pro-max` | Auto* | File: `**/*.tsx`, `**/*.jsx` (HIGH priority) |
| `/performance` | Auto | Keywords: "performance", "bundle" |

*Note: `/frontend` = `ui-ux-pro-max` skill untuk UI/UX decisions

### Phase 9-13 Overview

| Phase | Status | Description | Pages |
|-------|--------|-------------|-------|
| 9 | ✅ Done | Product Management | Products CRUD, Categories, Modifiers |
| 10 | ⬜ Next | Stock Management | Stock overview, Alerts, Opname UI |
| 11 | ⬜ Todo | Reports & Dashboard | Sales charts, Export CSV/PDF |
| 12 | ⬜ Todo | Settings & Config | Tables, Users, Hardware config |
| 13 | ⬜ Todo | PWA Polish | Offline mode, Install prompt |

### Completed Phases

| Phase | Status | Key Deliverables |
|-------|--------|-----------------|
| 1-6 | ✅ Done | Backend API (187 tests) |
| 7 | ✅ Done | React + Vite + shadcn/ui setup |
| 8 | ✅ Done | Orders Management (list, detail, filters, void) |
| 9 | ✅ Done | Product Management (grid, CRUD, categories, modifiers) |

---

## 💬 Prompt Templates

```
"lanjutkan phase 10"   → Phase 10 work (Stock Management)
"lanjutkan phase N"    → Phase N work
"audit"                → Run codebase audit
```

---

## ⚙️ Development Rules

### Coding Standards
- TypeScript strict mode, no `any` types
- Explicit return types
- Repository pattern (DDD-lite)
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- All database queries MUST use parameterized queries (no string concatenation)

### Phase Gate
Setiap phase HARUS melewati:
- [ ] Full Audit (`npm run lint`, `tsc --noEmit`, `npm test`)
- [ ] Fix all critical/high issues
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated (README.md)

### Phase Completion Workflow
```
1. Full Audit
   ├── npm run lint (0 errors)
   ├── tsc --noEmit (no errors)
   └── npm test (all passing)

2. Fix Issues
   └── Fix critical/high issues found

3. Update Documentation
   └── README.md (progress, specs, recent changes)

4. Git
   └── commit + push (use noreply email if configured)
```

### Multi-Tenancy
- Semua query HARUS filter by `tenant_id`
- RLS policies aktif di database

### Security Requirements
- JWT_SECRET wajib di-set di production (akan throw error jika missing)
- Correlation ID untuk request tracing (X-Request-ID header)
- Rate limiting pada auth endpoints

---

## 🔗 Links

- **GitHub:** https://github.com/thevoidsyntax/VentroPOS
- **Backend:** `src/backend/`
- **Frontend:** `src/frontend/`
- **PRD:** `docs/prd/README.md`

---

*Maintained by: thevoidsyntax*
