# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Simplified DDD project structure
- Backend scaffolding (Fastify + TypeScript)

### Fixed
- Database migrations with RLS policies
- Stock use cases implementation
- User use cases implementation
- Table use cases implementation
- All missing routes (User, Table, Stock)
- Unit tests for domain logic

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
