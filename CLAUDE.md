# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.0.0
> **Last Updated:** 2024

---

## 📖 First Read

Ketika memulai chat baru, baca terlebih dahulu:

1. **`README.md`** — Progress tracker, overview, recent changes

---

## 🎯 Current Status

```
Phase 1: ✅ DONE (~95%)
Phase 2: ✅ DONE (95% - Core POS)
Phase 3: ⬜ NEXT (Inventory)
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

---

## 🛠️ Tech Stack

- **Backend:** Node.js 20+, Fastify, TypeScript
- **Database:** PostgreSQL 15+ (RLS)
- **Auth:** JWT + Refresh Tokens
- **Validation:** Zod
- **Frontend:** React 18 (future - Phase 2+)

---

## 📌 Phase-Specific Skills

### Core Skills (7) — Always Invoke

Selalu auto-invoke untuk semua phase:

| Skill | Fungsi |
|-------|--------|
| `/git` | Version control |
| `/docker` | Containerization |
| `/ci-cd` | Pipeline automation |
| `/code-quality` | Code review & standards |
| `/deployment` | Deployment strategies |
| `/logging` | Structured logging |
| `/config` | Configuration management |

### Phase-Specific Skills

Invoke skills berdasarkan **pekerjaan** yang akan dilakukan:

#### Phase 2: Core POS (Cart + Checkout + Backend) - DONE ✅
```
Skills: /api-design, /testing
Work: Shopping cart, checkout flow, modifiers, idempotency
```

#### Phase 3: Inventory Module - NEXT
```
Skills: /database, /observability, /api-design
Work: Stock management, reporting
```

#### Phase 4: Dashboard & Reporting
```
Skills: /frontend, /performance, /database
Work: Dashboard UI, charts, data aggregation
```

#### Phase 5: Hardware Integration
```
Skills: /api-design, /deployment, /observability
Work: Printer integration, EDC, scanner
```

#### Phase 6: Polish & Launch
```
Skills: /performance, /observability, /deployment, /security
Work: Optimize, monitoring, security audit, deploy
```

---

## 💬 Prompt Templates

Gunakan prompt ini di chat baru:

```
"lanjutkan phase 2"              → Phase 2 work
"lanjutkan phase 3"              → Phase 3 work
"lanjutkan phase [N]"           → Phase N work
```

---

## ⚙️ Development Rules

### Coding Standards
- TypeScript strict mode
- No `any` types
- Explicit return types
- Use repository pattern (DDD-lite)

### Git Commits
Format: `<type>(<scope>): <description>`

Types: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### Phase Gate
Setiap phase harus melewati:
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No critical security issues
- [ ] Documentation updated

### Multi-Tenancy
- Semua query HARUS filter by `tenant_id`
- RLS policies aktif di database

---

## 📝 Important Notes

- Solo developer project
- Priority: Maintainability > Scalability > Security
- Backend Phase 1 & 2 DONE, frontend belum ada
- Next: Phase 3 - Inventory (Stock Management)

---

## 🔗 Links

- **GitHub:** https://github.com/thevoidsyntax/VentroPOS
- **Backend:** `src/backend/`

---

*Maintained by: thevoidsyntax*
