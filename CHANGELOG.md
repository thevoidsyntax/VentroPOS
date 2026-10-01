# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Simplified DDD project structure
- Backend scaffolding (Fastify + TypeScript)

### Security
- Fix SQL injection in tenant context (parameterized query)
- Enforce CORS wildcard rejection in production
- Add JWT secret weak pattern validation
- Add stock validation to prevent overselling

### Fixed
- Missing requireManager import causing runtime error in order void endpoint
- Missing CreateTableInput/UpdateTableInput types causing compilation errors
- OrderItem modifiers mapping (missing id and modifierName)
- tenantId missing in repository create operations
- Discount percentage cap validation (max 100%)
- TypeScript compilation errors (0 errors now)
- ESLint peer dependency conflicts (eslint v8)
- Password validation duplicated in tests (now uses shared function)

### Architecture
- Add idempotency key support for checkout endpoint
- Create shared validation utilities module
- Improve audit log documentation (TODO for DB persistence)

### Tests
- Fix price calculation test assertion
- Fix order number generation timezone test
- All 34 unit tests passing
- Database migrations with RLS policies
- Stock use cases implementation
- User use cases implementation
- Table use cases implementation
- All missing routes (User, Table, Stock)
- Unit tests for domain logic

### Security
- Password strength validation
- Common password detection
- Rate limiting on auth endpoints

---

## [1.0.0] - TBD

### Added

#### Documentation
- `docs/prd/README.md` - Product Requirements Document
- `docs/roadmap/README.md` - Project Roadmap with 6 phases
- `docs/roadmap/phase-1-foundation.md` - Phase 1 detailed specification
- `CHANGELOG.md` - This changelog file

#### Project Structure
- Git repository initialized
- `docs/` directory structure
- `docs/prd/` - PRD documents
- `docs/roadmap/` - Phase roadmaps
- `docs/adr/` - Architecture Decision Records

#### Configuration
- Git attribution configured
- commit-msg hook for clean commits
- .gitattributes for line endings
- CLAUDE.md with project instructions

### Planned

#### Phase 1: Foundation (Next)
- [ ] PostgreSQL database setup with multi-tenant schema
- [ ] Row-Level Security (RLS) implementation
- [ ] JWT authentication system
- [ ] Core API structure with versioning
- [ ] User management (CRUD + RBAC)
- [ ] Categories management
- [ ] Products management
- [ ] Tables management
- [ ] Unit tests (>80% coverage)

#### Phase 2: Core POS
- [ ] Shopping cart functionality
- [ ] Checkout flow
- [ ] Multiple payment methods
- [ ] Order management
- [ ] Table order workflow
- [ ] Stock auto-deduction

#### Phase 3: Inventory Module
- [ ] Stock management dashboard
- [ ] Low stock alerts
- [ ] Stock adjustments
- [ ] Stock audit trail
- [ ] Product modifiers

#### Phase 4: Reporting & Dashboard
- [ ] Dashboard with key metrics
- [ ] Sales reports
- [ ] Product performance report
- [ ] Staff performance report
- [ ] Export capabilities

#### Phase 5: Hardware Integration
- [ ] Receipt printer (ESC/POS)
- [ ] Barcode scanner support
- [ ] Cash drawer control
- [ ] EDC/POS terminal integration

#### Phase 6: Polish & Launch
- [ ] PWA optimization
- [ ] Performance optimization
- [ ] Security audit
- [ ] Final documentation
- [ ] Production deployment

---

## Versioning

Given version format: `MAJOR.MINOR.PATCH`

| Version | Description |
|---------|-------------|
| MAJOR | Breaking changes (e.g., API v1 → v2) |
| MINOR | New features, backward compatible |
| PATCH | Bug fixes, backward compatible |

### Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | TBD | Planned | MVP release target |

---

## How to Update

When making changes, add entries in this format:

```markdown
### [Category] - YYYY-MM-DD

#### Added
- New feature description

#### Changed
- What changed

#### Deprecated
- What will be removed

#### Removed
- What was removed

#### Fixed
- Bug fix description

#### Security
- Security improvement
```

---

*Maintained by: thevoidsyntax*  
*Last updated: 2024*
