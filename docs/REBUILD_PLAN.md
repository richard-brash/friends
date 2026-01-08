# Friends Outreach CRM - V2 Rebuild Plan

**Start Date:** January 8, 2026  
**Status:** Phase 0 - Knowledge Capture (In Progress)

---

## Why Rebuild?

V1 was successful in discovering requirements and validating the domain model, but architectural limitations make it unsuitable for production:

1. **No permission model** - Fine-grained access control needed, not just roles
2. **Inconsistent patterns** - Mix of V1/V2 APIs, duplicated forms, no shared components
3. **Brittle architecture** - State inconsistencies, missing validation, no DB constraints
4. **No test coverage** - Can't refactor safely, bugs discovered in production
5. **Maintenance nightmare** - Each new feature breaks something else

**Decision:** Rebuild with proper architecture, preserving domain knowledge from V1.

---

## Project Phases

### ✅ Phase 0: Knowledge Capture (Complete)
**Goal:** Document everything learned from V1 before starting V2

**Deliverables:**
- ✅ [DOMAIN_MODEL.md](./phase0-knowledge-capture/DOMAIN_MODEL.md) - Entities, relationships, business rules
- ✅ [LESSONS_LEARNED.md](./phase0-knowledge-capture/LESSONS_LEARNED.md) - What broke and why
- ✅ [TECHNICAL_WINS.md](./phase0-knowledge-capture/TECHNICAL_WINS.md) - What worked, keep for V2
- ✅ [USER_WORKFLOWS.md](./phase0-knowledge-capture/USER_WORKFLOWS.md) - Real-world usage patterns

**Duration:** 2 hours  
**Status:** COMPLETE ✅

---

### 🔄 Phase 1: Business Analysis (Next - 1-2 days)
**Goal:** Define WHAT we're building and WHY

**Deliverables:**
- [ ] REQUIREMENTS.md - Functional and non-functional requirements
- [ ] USER_STORIES.md - "As a [persona], I want [action] so that [benefit]"
- [ ] SCREEN_INVENTORY.md - Every screen, purpose, data touched
- [ ] PERMISSIONS_SPEC.md - Who can do what, when, under what conditions
- [ ] SUCCESS_CRITERIA.md - Definition of "done" for MVP

**Activities:**
1. Review V1 workflows, identify gaps
2. Prioritize features (must-have vs should-have vs nice-to-have)
3. Define user personas in detail
4. Map permission requirements
5. Validate with stakeholders (if any)

**Duration:** 1-2 days  
**Status:** NOT STARTED

---

### ⏳ Phase 2: Architecture Design (2-3 days)
**Goal:** Define HOW we'll build it

**Deliverables:**
- [ ] ARCHITECTURE.md - System architecture, layers, patterns
- [ ] API_SPECIFICATION.yaml - OpenAPI spec for all endpoints
- [ ] DATA_MODEL.md - ER diagrams, constraints, migrations
- [ ] PERMISSIONS_MODEL.md - ABAC rules, permission service design
- [ ] COMPONENT_LIBRARY.md - Shared UI components, design system
- [ ] TESTING_STRATEGY.md - Unit, integration, E2E boundaries

**Activities:**
1. Design data model with constraints
2. Design permission service (ABAC)
3. Define API contracts (OpenAPI)
4. Plan orchestration layer for composite screens
5. Define component library structure
6. Set up testing strategy

**Duration:** 2-3 days  
**Status:** NOT STARTED

---

### ⏳ Phase 3: UI/UX Design (1-2 days)
**Goal:** Define visual design and user experience

**Deliverables:**
- [ ] UI_COMPONENTS.md - Design system documentation
- [ ] Wireframes - Each screen, mobile-first
- [ ] NAVIGATION_MAP.md - How users move through app
- [ ] FORM_DESIGNS.md - Canonical forms per entity
- [ ] ERROR_STATES.md - User feedback for failures

**Activities:**
1. Wireframe all screens (Figma or hand-drawn)
2. Define component inventory
3. Create design system tokens (colors, spacing, typography)
4. Map navigation flows
5. Design permission-aware UI patterns

**Duration:** 1-2 days  
**Status:** NOT STARTED

---

### ⏳ Phase 4: Engineering Setup (1 day)
**Goal:** Infrastructure and tooling before code

**Deliverables:**
- [ ] Repository structure (monorepo decision)
- [ ] Development environment (Docker Compose)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Code standards (ESLint, Prettier configs)
- [ ] CONTRIBUTING.md - Git workflow, PR process

**Activities:**
1. Scaffold project structure
2. Set up development database
3. Configure CI/CD (automated tests, deployments)
4. Set up code quality tools
5. Document developer onboarding

**Duration:** 1 day  
**Status:** NOT STARTED

---

### ⏳ Phase 5: Implementation (3-4 weeks)
**Goal:** Build in priority order, test-first

#### Sprint 1: Core Infrastructure (1 week)
- [ ] Database schema with migrations
- [ ] Shared component library (Storybook)
- [ ] Permission service
- [ ] Authentication endpoints
- [ ] Basic API scaffolding

#### Sprint 2: Basic CRUD (1 week)
- [ ] User management
- [ ] Friend CRUD
- [ ] Location CRUD
- [ ] Route CRUD with location ordering
- All using shared components, with permission checks

#### Sprint 3: Run Management (1 week)
- [ ] Run CRUD
- [ ] Team assignment
- [ ] Request CRUD
- [ ] Request-to-run inference

#### Sprint 4: Field Execution (1 week)
- [ ] Preparation screen
- [ ] Active execution screen
- [ ] Offline sync
- [ ] Delivery recording

**Duration:** 3-4 weeks  
**Status:** NOT STARTED

---

### ⏳ Phase 6: Testing & Deployment (Ongoing)
**Goal:** Quality assurance and production readiness

**Activities:**
- [ ] Integration test suite
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment with monitoring

**Duration:** Ongoing throughout implementation  
**Status:** NOT STARTED

---

## Technology Stack (V2)

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL 16+
- **ORM/Migrations:** Prisma or TypeORM
- **Validation:** Zod
- **Auth:** JWT + bcrypt
- **Testing:** Vitest
- **API Docs:** OpenAPI 3.0

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library:** Material-UI v5
- **State:** Context API + React Query
- **Forms:** React Hook Form + Zod
- **Testing:** React Testing Library
- **Component Docs:** Storybook

### DevOps
- **VCS:** GitHub
- **CI/CD:** GitHub Actions
- **Hosting:** Railway (MVP), AWS/GCP (scale)
- **Monitoring:** Sentry (errors), Railway metrics
- **Database:** Railway PostgreSQL

---

## Key Architectural Decisions

### 1. Permission Model: ABAC (Attribute-Based Access Control)
**Format:** `resource:action:scope`

**Examples:**
- `run:execute:own` - Can execute runs I'm assigned to
- `request:create:any` - Can create requests anywhere
- `user:manage:organization` - Can manage users in my org

**Implementation:**
- Permission service checks: `canUser(userId, 'run:execute', runId, context)`
- Frontend: `usePermission('request:create')` to show/hide UI
- Backend: Middleware enforces on every endpoint

### 2. Orchestration Layer for Composite Operations
**Pattern:**
```typescript
class RunOrchestrator {
  async prepareRun(runId: number, userId: number): Promise<PreparedRun> {
    // Coordinate multiple services in single transaction
    await this.permissionService.check(userId, 'run:prepare', runId);
    const run = await this.runService.getById(runId);
    const locations = await this.locationService.getByRoute(run.routeId);
    const requests = await this.requestService.getByLocations(locations.map(l => l.id));
    // ... return composite view
  }
}
```

### 3. Shared Component Library
**Pattern:**
- `<FriendForm />` - One canonical implementation
- Used everywhere: Friends screen, quick-add in field, admin tools
- Props control mode: `<FriendForm mode="create" />` vs `<FriendForm mode="quickAdd" />`
- Permission-aware: Auto-hides fields user can't edit

### 4. Test-First Development
**Pattern:**
- Write test for feature
- Implement feature until test passes
- Refactor
- No merging without tests

### 5. Database Constraints Enforce Business Rules
**Examples:**
```sql
-- Status transitions validated in DB
CHECK (status IN ('pending', 'ready_for_delivery', 'taken', 'delivered', 'cancelled'))

-- Run can't have null location if stop_number > 0
CHECK (current_location_id IS NOT NULL OR current_stop_number = 0)

-- Request must have friend and location
FOREIGN KEY (friend_id) REFERENCES friends(id) ON DELETE RESTRICT
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
```

---

## V1 Archive Strategy

### Archive Branch Approach
1. Tag current state: `v1-archive`
2. Create branch: `archive/v1-initial`
3. Move V1 code to `archive-v1/` folder on main
4. Clean main branch for V2 development

### Archive Structure
```
friends/
├── archive-v1/           # V1 code (read-only reference)
│   ├── backend/
│   ├── frontend/
│   └── docs/
├── docs/                 # V2 documentation
│   ├── phase0-knowledge-capture/
│   ├── phase1-requirements/
│   ├── phase2-architecture/
│   └── phase3-design/
├── backend/              # V2 backend (fresh start)
├── frontend/             # V2 frontend (fresh start)
└── README.md
```

---

## Success Metrics

### MVP Definition of Done
- [ ] All Phase 1 user stories implemented
- [ ] 80%+ test coverage (unit + integration)
- [ ] Permission model functional
- [ ] Field execution workflow tested by real users
- [ ] No critical bugs
- [ ] Performance: < 2s page load, < 500ms API response
- [ ] Mobile-responsive on iOS and Android
- [ ] Offline mode functional

### Post-MVP Goals
- [ ] Advanced reporting/analytics
- [ ] SMS/email notifications
- [ ] Inventory management
- [ ] Multi-organization support

---

## Risk Management

### Technical Risks
1. **Permission model too complex** - Mitigation: Start simple, iterate
2. **Performance issues with large datasets** - Mitigation: Pagination, indexes, caching
3. **Offline sync conflicts** - Mitigation: Last-write-wins, manual resolution UI

### Process Risks
1. **Scope creep** - Mitigation: Strict MVP definition, feature flags for experiments
2. **Timeline pressure** - Mitigation: Prioritize ruthlessly, defer nice-to-haves
3. **Knowledge loss** - Mitigation: Comprehensive documentation (this repo)

---

## Next Steps

1. ✅ Complete Phase 0 knowledge capture
2. 🔄 Archive V1 code (tag, branch, move to archive folder)
3. ⏳ Begin Phase 1: Business Analysis
   - Document requirements
   - Write user stories
   - Define permission model
   - Validate with stakeholders

---

## Project Tracking

**Current Phase:** Phase 0 - Knowledge Capture ✅  
**Next Phase:** V1 Archive, then Phase 1 - Business Analysis  
**Target MVP Date:** TBD after Phase 2 architecture complete  
**Last Updated:** January 8, 2026

---

## References

- [V1 Archive Tag](../../tree/v1-archive) - Tagged snapshot of V1 code
- [V1 Archive Branch](../../tree/archive/v1-initial) - Full V1 history preserved
- [Phase 0 Knowledge Capture](./phase0-knowledge-capture/) - Domain model, lessons learned, workflows
