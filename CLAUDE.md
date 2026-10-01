# VentroPos - Developer Instructions

> **Project:** VentroPos - Point of Sale System for Cafe
> **Version:** 1.0.0
> **Last Updated:** 2024

---

## 📖 First Read

Ketika memulai chat baru, baca terlebih dahulu:

1. **`README.md`** — Progress tracker, overview, recent changes
2. Cek git status untuk state terbaru

---

## 🎯 Current Status

```
Phase 1: ✅ DONE (~95%)
Phase 2: ⬜ NEXT (Cart, Checkout, Orders)
```

**Last work:** Audit fix (security, bug, quality) - 34 tests passing

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
- Backend Phase 1 DONE, frontend belum ada
- Next: Phase 2 - Core POS (Cart, Checkout)

---

## 🔗 Links

- **GitHub:** https://github.com/thevoidsyntax/VentroPOS
- **Backend:** `src/backend/`

---

*Maintained by: thevoidsyntax*
