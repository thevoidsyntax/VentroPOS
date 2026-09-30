# VentroPos - Project Instructions

> **Project:** VentroPos - Point of Sale System for Cafe  
> **Version:** 1.0.0  
> **Last Updated:** 2024

---

## 📋 Project Overview

VentroPos adalah sistem Point of Sale berbasis cloud untuk cafe dan restoran kecil-menengah di Indonesia. Sistem ini mendukung multi-tenant dengan isolasi data menggunakan PostgreSQL Row-Level Security (RLS).

### Key Characteristics

| Aspect | Value |
|--------|-------|
| Type | Full-Stack Web Application (PWA) |
| Architecture | Multi-tenant SaaS |
| Team | Solo Developer |
| Priority | Maintainability > Scalability > Security |

---

## 🎯 Development Phases

Project dibagi menjadi 6 fase:

```
Phase 1: Foundation      → Backend, DB, Auth (Current)
Phase 2: Core POS        → Cart, Checkout, Orders
Phase 3: Inventory       → Stock Management
Phase 4: Reporting       → Dashboard & Reports
Phase 5: Hardware        → Printer, Scanner, EDC
Phase 6: Polish & Launch → PWA, Security Audit, Deploy
```

### Phase Gate Process

Setiap fase HARUS melewati gate ini sebelum lanjut:

```
[Development] → [Code Review] → [Testing] → [Documentation] → [Next Phase]
```

**Code Review Gate:**
- Unit tests passing (>80% coverage)
- No critical/high security findings
- Linting passes
- TypeScript compiles without errors
- Architecture patterns followed

---

## 📁 Project Structure

```
VentroPos/
├── docs/
│   ├── prd/                    # Product Requirements Document
│   │   └── README.md
│   ├── roadmap/                # Phase roadmaps
│   │   ├── README.md
│   │   └── phase-*.md
│   └── adr/                    # Architecture Decision Records
│
├── src/
│   ├── backend/                # Node.js + Fastify backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── config/         # Configuration
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── frontend/               # React PWA frontend
│       ├── src/
│       │   ├── components/    # UI components
│       │   ├── pages/         # Page components
│       │   ├── hooks/         # Custom hooks
│       │   └── services/      # API services
│       ├── public/
│       └── package.json
│
├── docker/
├── CHANGELOG.md                # Auto-updated changelog
├── README.md                   # Public overview
└── CLAUDE.md                   # This file
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Fastify |
| Database | PostgreSQL 15+ |
| ORM/Query | Knex.js |
| Auth | JWT + Refresh Tokens |
| Validation | Zod |
| Cache | Redis (future) |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | React 18+ |
| Language | TypeScript |
| Styling | TailwindCSS |
| State | Zustand / TanStack Query |
| PWA | Vite PWA Plugin |
| Forms | React Hook Form + Zod |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Container | Docker |
| Database | PostgreSQL |
| Deploy | VPS (DigitalOcean/Railway) |

---

## 🔐 Security Architecture

### Multi-Tenancy
- **Isolation Method:** PostgreSQL Row-Level Security (RLS)
- **Every table** has `tenant_id` column
- **RLS policies** enforce isolation at database level
- **Tenant context** set via `current_setting('app.tenant_id')`

### Authentication
- JWT access tokens (short-lived: 15 minutes)
- Refresh tokens (long-lived: 7 days)
- Password hashing: bcrypt (cost factor 12)

### Authorization
- Role-Based Access Control (RBAC)
- Roles: `owner`, `manager`, `kasir`, `kitchen`
- Permissions enforced at API layer

---

## 🧪 Testing Strategy

### Coverage Target
| Layer | Target |
|-------|--------|
| Unit Tests | >80% |
| Integration Tests | Critical paths |
| E2E Tests | Core user flows |

### Test Commands
```bash
# Backend
npm run test           # Run tests
npm run test:coverage  # Coverage report
npm run test:e2e       # E2E tests

# Frontend
npm run test          # Vitest
npm run test:e2e      # Playwright
```

---

## 📝 Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types on functions
- Interface-first for data structures

### Commit Messages
Format: `<type>(<scope>): <description>`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Example:
```
feat(auth): add JWT refresh token rotation

- Implements refresh token rotation for enhanced security
- Old refresh tokens are invalidated after use
- Implements sliding window expiration
```

### API Design
- RESTful conventions
- Version prefix: `/api/v1/`
- Response format: `{ success, data, meta?, error? }`
- Proper HTTP status codes
- Input validation with Zod schemas

---

## 🔄 Workflow Guidelines

### Before Starting Work
1. Check current phase status
2. Review any blocking issues
3. Pull latest changes

### During Development
1. Write tests first (TDD)
2. Implement minimal code to pass tests
3. Refactor for cleanliness
4. Run linter and type checker

### Before Committing
1. All tests pass
2. Coverage maintained/increased
3. No linting errors
4. TypeScript compiles
5. Documentation updated if needed

### After Completing Phase
1. Update CHANGELOG.md
2. Update relevant phase document
3. Create ADR for significant decisions
4. Request code review
5. Merge to main branch

---

## 📊 Documentation Standards

### Required Documentation

| Document | Location | Update Frequency |
|----------|----------|------------------|
| Changelog | `CHANGELOG.md` | Every commit |
| PRD | `docs/prd/README.md` | Phase start/end |
| Phase Docs | `docs/roadmap/phase-*.md` | Phase progress |
| ADRs | `docs/adr/*.md` | On decision |
| README | `README.md` | Major milestones |

### Changelog Format

```markdown
## [Version] - YYYY-MM-DD

### Added
- Feature A description

### Changed
- Change B description

### Fixed
- Bug fix description
```

---

## 🚀 Deployment

### Environments
| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local dev |
| Staging | staging.ventropos.app | Pre-production |
| Production | ventropos.app | Live system |

### Deployment Process
1. Push to `develop` branch
2. CI/CD runs tests
3. Auto-deploy to staging
4. Manual approval for production
5. Deploy to production

---

## 📞 Communication

### Issue Tracking
- Use GitHub Issues for bugs and features
- Labels: `bug`, `enhancement`, `documentation`, `question`
- Link issues to current phase

### Code Review
- All changes require review
- Reviewer checks: correctness, security, performance, maintainability
- Address all comments before merge

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify connection string
cat .env | grep DATABASE_URL
```

**TypeScript Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run build
```

**Test Failures:**
```bash
# Run specific test
npm run test -- --grep "test name"

# Update snapshots
npm run test -- --update-snapshots
```

---

## 📚 Additional Resources

- [PRD Documentation](./docs/prd/README.md)
- [Project Roadmap](./docs/roadmap/README.md)
- [Phase 1 Details](./docs/roadmap/phase-1-foundation.md)
- [Changelog](./CHANGELOG.md)

---

## 🤖 AI Instructions

When working with this project, Claude should:

1. **Follow the phase gate process** - Don't skip review/testing
2. **Update documentation** - Changelog, phase docs on changes
3. **Write tests first** - TDD approach for new features
4. **Respect tech stack** - Don't introduce new tech without discussion
5. **Consider multi-tenancy** - All queries must filter by tenant_id
6. **Security first** - Validate all inputs, hash passwords, use parameterized queries
7. **Performance aware** - Avoid N+1 queries, use proper indexes

### Git Commit Rules (CRITICAL)

**DO NOT ADD Co-Authored-By IN ANY COMMIT!**

When creating commits, use this format ONLY:
```
<type>(<scope>): <description>

[Optional body with details]
```

Example:
```
feat(auth): add JWT authentication

- Implement JWT access and refresh tokens
- Add password hashing with bcrypt
```

**NEVER include:**
- `Co-Authored-By:` lines
- Any attribution footer beyond the git author

The git author is set to your GitHub identity - no additional attribution needed.

---

*Maintained by: thevoidsyntax*  
*Last updated: 2024*
