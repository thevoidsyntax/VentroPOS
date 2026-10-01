# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.0.0
> **Last Updated:** 2024

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
Phase 1: ✅ DONE
Phase 2: ✅ DONE
Phase 3: ⬜ NEXT (Inventory)
Phase 4-6: ⬜ TODO
```

**Last work:** Phase 2 completion - Core POS with cart, checkout, modifiers (59 tests passing)

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

### Current: Phase 3 - Inventory

**Requirements:** Lihat `README.md` Section "Phase 3: Inventory"

**Skills to invoke:**
- `/database` - Stock management
- `/api-design` - Stock APIs

**Deliverables:**
- Stock overview API
- Low stock alerts
- Manual adjustment
- Stock history

### Future Phases

| Phase | Focus | Skills |
|-------|-------|--------|
| 4 | Reporting | `/frontend`, `/database` |
| 5 | Hardware | `/api-design`, `/deployment` |
| 6 | Launch | `/security`, `/performance` |

---

## 💬 Prompt Templates

```
"lanjutkan phase 3"    → Phase 3 work (Inventory)
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
