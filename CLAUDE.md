# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.1.0
> **Last Updated:** 2026-01-26

---

## 📖 First Read

**WAJIB** baca di setiap chat baru:

1. **`README.md`** — Single source of truth untuk:
   - Progress tracker (Phase 1-6)
   - Phase specifications (requirements, deliverables, user stories)
   - API reference
   - Database schema
   - Tech stack & dependencies
   - Development guidelines

---

## ⚠️ User Preferences

- **DO NOT** add `Co-Authored-By` in git commits
- **DO NOT** add "Generated with Claude Code" footer in PRs

---

## 🎯 Current Status

```
Phase 1-6: ✅ DONE  - Backend Complete (159 tests)
Phase 7:   ✅ DONE  - Frontend Setup Complete
Phase 8:   ⬜ NEXT  - Orders Management
Phase 9-13: ⬜ TODO - Frontend Features
```

**Last work:** Phase 7 completion - React + Vite + TypeScript frontend setup

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
- `README.md` — Requirements, specs, progress
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
| ORM/Query | Knex 3.x + pg 8.x |
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

---

## 📌 Phase Work

### Current: Phase 8 - Orders Management

**Requirements:** Lihat `README.md` Section "Phase 8" dan `docs/roadmap/phase-8-orders.md`

**Skills to invoke:**
| Skill | Type | Trigger |
|-------|------|---------|
| `/frontend` | Auto | File: `**/*.tsx`, `**/*.jsx` |
| `/ui-ux-pro-max` | Auto* | File: `**/*.tsx`, `**/*.jsx` (HIGH priority) |
| `/performance` | Auto | Keywords: "performance", "bundle" |

*Note: `/ui-ux-pro-max` sekarang auto-invoke untuk frontend files karena goal adalah human-like UI patterns

**Deliverables:**
- Order list with filters
- Order detail page
- Void order flow

### Phase 8-13 Overview

| Phase | Description | Pages | Priority |
|-------|-------------|-------|----------|
| 8 | Orders Management | Order list, Order detail, Void | P0 |
| 9 | Product Management | Products CRUD, Categories, Modifiers | P1 |
| 10 | Stock Management | Stock overview, Alerts, Opname | P1 |
| 11 | Reports & Dashboard | Sales charts, Export CSV/PDF | P1 |
| 12 | Settings & Config | Tables, Users, Hardware | P2 |
| 13 | PWA Polish | Offline mode, Install prompt | P2 |

### Completed Phases

| Phase | Status | Key Deliverables |
|-------|--------|-----------------|
| 4 | ✅ Done | Sales reports, Product reports, Staff reports, CSV export |
| 5 | ✅ Done | Hardware devices, Receipt printer, EDC, Scanner, Cash drawer |
| 6 | ✅ Done | Audit fixes, Refactoring, 159 tests passing |
| 7 | ✅ Done | React + Vite, shadcn/ui, Zustand, TanStack Query, PWA |
| 8 | ⬜ Next | Orders Management (in progress) |
| 9-13 | ⬜ Todo | Frontend Features |

---

## 💬 Prompt Templates

```
"lanjutkan phase 5"    → Phase 5 work (Hardware)
"lanjutkan phase N"    → Phase N work
```

---

## ⚙️ Development Rules

### Coding Standards
- TypeScript strict mode, no `any` types
- Explicit return types
- Repository pattern (DDD-lite)
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`

### Phase Gate
Setiap phase HARUS melewati:
- [ ] Full Audit (npm audit, npm test, tsc --noEmit)
- [ ] Fix all critical/high issues
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated (README.md)

### Phase Completion Workflow
```
1. Full Audit
   ├── npm audit (0 vulnerabilities)
   ├── npm test (all passing)
   └── tsc --noEmit (no errors)

2. Fix Issues
   └── Fix critical/high issues found

3. Update Documentation
   └── README.md (progress, specs, recent changes)

4. Git
   └── commit + push
```

### Multi-Tenancy
- Semua query HARUS filter by `tenant_id`
- RLS policies aktif di database

---

## 🔗 Links

- **GitHub:** https://github.com/thevoidsyntax/VentroPOS
- **Backend:** `src/backend/`
- **PRD:** `docs/prd/README.md`

---

*Maintained by: thevoidsyntax*
