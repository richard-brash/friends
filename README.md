# Friends Outreach CRM

**Version:** 2.0 (Rebuild)  
**Status:** Phase 0 Complete - Knowledge Captured  
**Last Updated:** January 8, 2026

---

## Project Overview

Friends Outreach CRM is a mobile-first application for managing street outreach operations. It coordinates volunteers, tracks service requests, manages delivery routes, and records field interactions—all with offline-first capabilities for reliable field use.

**Key Features:**
- Run planning and team coordination
- Field execution with offline support
- Request lifecycle management
- Fine-grained permission control
- Real-time multi-device coordination
- Comprehensive audit trails

---

## Current Status: V2 Rebuild

We're rebuilding from the ground up based on lessons learned from V1 prototype. V1 successfully validated the domain model and workflows but lacked the architecture needed for production.

**Why Rebuild?**
- Need fine-grained permission model (ABAC, not just RBAC)
- Inconsistent patterns (duplicated forms, mixed API versions)
- No test coverage (can't refactor safely)
- State consistency issues (missing DB constraints)
- Maintenance becoming increasingly difficult

**V1 Archive:**
- Tag: [`v1-archive`](https://github.com/richard-brash/friends/tree/v1-archive)
- Branch: [`archive/v1-initial`](https://github.com/richard-brash/friends/tree/archive/v1-initial)
- Code: [`archive-v1/`](./archive-v1/) folder

---

## Documentation

### Phase 0: Knowledge Capture ✅
Comprehensive documentation of what we learned from V1:

- **[REBUILD_PLAN.md](./docs/REBUILD_PLAN.md)** - Complete roadmap for V2
- **[DOMAIN_MODEL.md](./docs/phase0-knowledge-capture/DOMAIN_MODEL.md)** - Entities, relationships, business rules
- **[LESSONS_LEARNED.md](./docs/phase0-knowledge-capture/LESSONS_LEARNED.md)** - What broke and why
- **[TECHNICAL_WINS.md](./docs/phase0-knowledge-capture/TECHNICAL_WINS.md)** - Patterns to keep
- **[USER_WORKFLOWS.md](./docs/phase0-knowledge-capture/USER_WORKFLOWS.md)** - Real-world usage patterns

### Next Phases (Upcoming)
- Phase 1: Business Analysis (Requirements, User Stories, Permissions Spec)
- Phase 2: Architecture Design (Data Model, API Spec, Component Library)
- Phase 3: UI/UX Design (Wireframes, Design System, Navigation)
- Phase 4: Engineering Setup (DevOps, CI/CD, Code Standards)
- Phase 5: Implementation (4 weekly sprints)

---

## Technology Stack (V2)

### Backend
- Node.js 20+ with Express
- PostgreSQL 16+ with Prisma/TypeORM
- JWT authentication + bcrypt
- Zod validation
- Vitest testing

### Frontend
- React 18+ with TypeScript
- Vite build tool
- Material-UI v5
- React Query for state
- React Testing Library

### DevOps
- GitHub + GitHub Actions CI/CD
- Railway hosting (MVP)
- Sentry error monitoring

---

## Core Architecture Principles (V2)

1. **Permission-First Design** - ABAC (Attribute-Based Access Control) from day 1
2. **Test-Driven Development** - Write tests before features
3. **Shared Component Library** - One implementation per entity, reused everywhere
4. **API Contracts** - OpenAPI specs before coding
5. **Database Constraints** - Enforce business rules at DB level
6. **Orchestration Layer** - Composite operations in single service
7. **Offline-First** - Field reliability is non-negotiable

---

## Project Structure (V2 - Coming Soon)

```
friends/
├── archive-v1/              # V1 code (reference only)
├── docs/                    # Project documentation
│   ├── phase0-knowledge-capture/
│   ├── phase1-requirements/
│   ├── phase2-architecture/
│   └── phase3-design/
├── backend/                 # V2 backend (to be created)
├── frontend/                # V2 frontend (to be created)
└── shared/                  # Shared types/models
```

---

## Getting Started (V2 - Coming Soon)

Development environment setup will be documented after Phase 4 (Engineering Setup).

For now, refer to V1 archive if you need to run the prototype:
```bash
cd archive-v1/backend
npm install
npm start

cd archive-v1/frontend
npm install
npm run dev
```

---

## Roadmap

### Phase 0: Knowledge Capture ✅ (Complete)
Document everything learned from V1

### Phase 1: Business Analysis (Next - 1-2 days)
Define requirements, user stories, permission model

### Phase 2: Architecture Design (2-3 days)
Data model, API contracts, component library, testing strategy

### Phase 3: UI/UX Design (1-2 days)
Wireframes, design system, navigation flows

### Phase 4: Engineering Setup (1 day)
DevOps, CI/CD, development environment

### Phase 5: Implementation (3-4 weeks)
- Sprint 1: Core infrastructure
- Sprint 2: Basic CRUD
- Sprint 3: Run management
- Sprint 4: Field execution

### Phase 6: Testing & Deployment (Ongoing)
QA, UAT, production deployment

**Target MVP:** TBD after architecture phase complete

---

## Key Domain Concepts

### Core Entities
- **User** - System users with authentication and permissions
- **Friend** - Service recipients
- **Location** - Physical stops on routes
- **Route** - Ordered sequences of locations
- **Request** - Service requests from friends
- **Run** - Execution instances of routes with teams

### Critical Relationships
- `Request → Location → Route → Run` (inference, not direct FK)
- `Run → Team Members` (many-to-many)
- `Run → Deliveries at Locations`
- All state changes recorded in audit trails

See [DOMAIN_MODEL.md](./docs/phase0-knowledge-capture/DOMAIN_MODEL.md) for complete details.

---

## Acknowledgments

Thanks to everyone who contributed to V1 prototype. The lessons learned are invaluable for building a production-ready V2.
