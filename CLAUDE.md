# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.0.1
> **Last Updated:** 2026-01-18

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
Phase 1: ✅ DONE  - Foundation, Auth, Database
Phase 2: ✅ DONE  - Core POS, Cart, Checkout
Phase 3: ✅ DONE  - Inventory, Stock Management
Phase 4: ✅ DONE  - Reporting, Dashboard
Phase 5: ⬜ NEXT   - Hardware Integration
Phase 6: ⬜ TODO  - Launch, Polish
```

**Last work:** Phase 4 completion - Reporting module + Audit fixes (142 tests passing)

---

## 📁 Project Structure

```
src/backend/           # Fastify API server
├── src/api/          # Routes, middleware, schemas
├── src/application/   # Use cases (DDD)
├── src/domain/        # Entities, repositories interfaces
├── src/infrastructure/ # DB, auth implementations
└── src/shared/        # Config, errors, utils
```

**Reference:**
- `README.md` — Requirements, specs, progress
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

---

## 📌 Phase Work

### Current: Phase 5 - Hardware Integration

**Requirements:** Lihat `README.md` Section "Phase 5: Hardware"

**Skills to invoke:**
- `/api-design` - Hardware API design
- `/deployment` - Hardware integration patterns
- `/security` - Secure hardware communication

**Deliverables:**
- Receipt printer integration
- EDC terminal integration
- Barcode scanner support
- Cash drawer control

### Completed Phases

| Phase | Status | Key Deliverables |
|-------|--------|-----------------|
| 4 | ✅ Done | Sales reports, Product reports, Staff reports, CSV export |
| 3 | ✅ Done | Stock overview, Alerts, Adjustments, History, Opname |
| 2 | ✅ Done | Orders, Checkout, Split payment, Idempotency |
| 1 | ✅ Done | Auth, Users, Products, Categories, Tables |

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
