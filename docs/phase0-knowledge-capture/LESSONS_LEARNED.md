# Lessons Learned - What Broke and Why

## Critical Failures

### 1. The run_id Cascade (Week 2-3)
**What happened:**
- Added `run_id` column to `requests` table for direct FK relationship
- Seemed logical: "request belongs to a run"
- Caused cascading query failures across backend

**Why it broke:**
- Requests are tied to **locations**, not runs
- Run is a temporal execution of a route
- Same location can be on multiple runs
- Query patterns assumed `JOIN requests ON run_id` but data model was actually `Request → Location → Route → Run`

**The fix:**
- Removed `run_id` column entirely
- Updated all queries to use: `JOIN locations l ON req.location_id = l.id JOIN runs r ON l.route_id = r.route_id`
- Much cleaner conceptually

**Lesson:**
- **Model reality, not convenience**
- Denormalization for query performance should come AFTER proving the problem exists
- Direct FKs aren't always the answer

---

### 2. Authentication Middleware Gaps (Week 3)
**What happened:**
- Added V2 API endpoints for requests
- Status history endpoint failed with "user_id violates not-null constraint"
- req.user was undefined

**Why it broke:**
- Forgot to add `authenticateToken` middleware to new routes
- Some V1 routes had it, some didn't
- No consistent pattern to follow

**The fix:**
- Added middleware to all V2 request routes
- Added debug logging to verify req.user population

**Lesson:**
- **No pattern = guaranteed bugs**
- Middleware should be default-on, explicitly removed when needed
- Can't rely on memory across sessions

---

### 3. Inconsistent Run State (Week 3)
**What happened:**
- User couldn't navigate forward/backward on Run 3 active screen
- Navigation buttons completely broken
- Backend logs showed "No more stops" and "Already at first stop" simultaneously

**Why it broke:**
- `current_location_id` was NULL
- `current_stop_number` was 5
- Validation logic assumed both fields stay in sync
- Some operation updated one but not the other

**The fix:**
- Added auto-repair logic in `getExecutionContext()`:
  ```javascript
  if (!run.currentLocationId && run.currentStopNumber > 0) {
    // Query location by route_order offset
    // Update current_location_id
  }
  ```

**Lesson:**
- **State consistency is not optional**
- Database constraints should enforce invariants
- Defensive coding can't replace proper data integrity
- Auto-fix is a band-aid, not a solution

---

### 4. Offline Sync URL Hell (Week 3)
**What happened:**
- Active run screen showed 400 Bad Request errors
- Offline sync queue kept retrying same failures
- Network tab showed requests going to `http://localhost:5173/api/...`

**Why it broke:**
- Used relative URLs in fetch: `fetch('/api/v2/execution/...')`
- Browser resolved relative to current origin (frontend dev server on 5173)
- Backend actually on port 4000
- 400 errors because Vite dev server doesn't have these endpoints

**The fix:**
- Added `const API_BASE = 'http://localhost:4000'`
- Prefixed all fetch URLs: `fetch(\`\${API_BASE}/api/...\`)`
- Added 400 error handling to remove validation errors from retry queue

**Lesson:**
- **Never use relative URLs for cross-origin API calls**
- Environment variables for API base URL from day 1
- 400 vs 500 errors need different retry strategies

---

### 5. Form Duplication Disaster (Ongoing)
**What happened:**
- Friend form on FriendSection
- Friend form on ActiveRunScreen (quick-add)
- Same bug needed fixing in both places
- Different implementations, different validation

**Why it broke:**
- No shared component library
- Built forms inline wherever needed
- Copy-paste led to divergence

**The fix (incomplete):**
- Recognized the pattern but didn't refactor due to time pressure

**Lesson:**
- **Build shared components first, use them everywhere**
- DRY isn't just about code volume, it's about maintenance
- Every duplicate is a bug waiting to happen

---

### 6. V1/V2 API Coexistence (Weeks 2-4)
**What happened:**
- Started migrating to "Clean Architecture" V2 APIs
- Left V1 APIs running
- Frontend used mix of both
- Constant confusion about which endpoint does what

**Why it broke:**
- Incremental migration without deprecation plan
- No forcing function to complete migration
- Different patterns (some auth, some not, different response shapes)

**The fix (incomplete):**
- Migrated Requests, Friends, Locations, Routes to V2
- Runs partially migrated
- Still have V1 endpoints lurking

**Lesson:**
- **Big bang migrations or clear versioning, not both simultaneously**
- API contracts/schemas would have prevented response shape confusion
- Version in URL (/v1/, /v2/) helps but doesn't solve root issue

---

### 7. Auto-Reset Database Crutch (Weeks 1-4)
**What happened:**
- Added auto-reset on server startup: drop all tables, recreate schema, reseed data
- Masked data integrity issues
- Hid migration problems
- Made it impossible to test persistence

**Why we did it:**
- Fast iteration during prototyping
- Avoided manual DB resets
- "We'll remove it later"

**Why it's bad:**
- Can't reproduce user-reported bugs (data resets on server restart)
- Hides schema migration issues
- No real data accumulation for testing
- Encourages sloppy data management

**The fix (not done yet):**
- Should use proper migrations
- Seed data should be idempotent
- Production should never auto-reset

**Lesson:**
- **Development shortcuts become production liabilities**
- Database migrations are not optional
- Idempotent seed scripts > destructive resets

---

### 8. Meal Count Default to 0 (Week 3)
**What happened:**
- Delivery form defaulted meal count to 0
- Users could advance without noticing they needed to enter a value
- Data showed 0 meals delivered when actually meals were given

**Why we did it:**
- Seemed user-friendly to have a default
- Avoided null/undefined issues

**Why it was wrong:**
- 0 is a valid value (no meals at this stop)
- Default allowed users to skip conscious decision
- Data integrity suffered

**The fix:**
- Changed default to `null`
- Added validation: can't advance without entering value
- Forces user to make explicit choice

**Lesson:**
- **Nulls are meaningful**
- Defaults should indicate "no choice made" vs "chose zero"
- Forms should require explicit user action for critical data

---

### 9. No Test Coverage (Entire Project)
**What happened:**
- Every bug discovered in manual testing or production
- Regression testing = clicking through app
- Refactoring = pray and deploy

**Why we didn't:**
- "Move fast, add tests later"
- Vibe coding philosophy
- Unclear what to test in rapidly changing code

**Why it's catastrophic:**
- Can't refactor safely
- Bug fixes break other features
- No confidence in deployments
- Can't onboard new developers

**The fix (not done):**
- Need test suite before V2

**Lesson:**
- **Tests aren't optional for production apps**
- TDD slower upfront, massively faster long-term
- Test coverage = documentation + safety net
- "Move fast and break things" doesn't work for mission-critical apps

---

### 10. No Permission Model (Not Started)
**What happened (anticipated):**
- Built role-based gates (admin/coordinator/volunteer)
- User needs fine-grained permissions
- Current architecture can't support it

**Why it will break:**
- Composite screens touch multiple entities
- Need permission checks per action per resource
- Context-aware rules ("can edit runs on my team's routes")
- Current approach: `if (user.role === 'admin')` sprinkled everywhere

**The coming disaster:**
- Permission logic duplicated across services
- Frontend doesn't know what to show/hide
- Backend can't efficiently check complex rules
- Maintenance nightmare as permissions evolve

**Lesson:**
- **Permission model is foundational architecture**
- Can't bolt it on later
- Needs dedicated service, not inline checks
- Frontend needs permission context to render appropriately

---

## Patterns That Worked

### 1. Clean Architecture with Services
- Repository layer isolated DB access
- Service layer contained business logic
- Made V2 migration possible

### 2. Status History Pattern
- Immutable audit trail
- Answered "who changed what when"
- Essential for accountability

### 3. Offline-First with IndexedDB
- Sync queue allowed field work without connectivity
- Retry logic handled intermittent failures
- User experience remained smooth

### 4. Auto-Generated Run Names
- Removed cognitive load from users
- Consistent naming convention
- Easy to identify runs at a glance

### 5. Material-UI Component Library
- Rapid prototyping
- Mobile-responsive out of box
- Consistent look and feel

---

## Key Insights for V2

### Architecture
1. **Define permission model before writing code**
2. **Shared component library is not optional**
3. **API contracts/schemas before implementation**
4. **Database constraints enforce business rules**
5. **Orchestration layer for composite screens**

### Process
1. **Tests before features**
2. **Migrations, never auto-reset**
3. **Consistent patterns or guaranteed bugs**
4. **Documentation as you build, not after**
5. **Code review catches what tests miss**

### Technical Decisions
1. **Environment config from day 1** (API URLs, DB connection, etc.)
2. **TypeScript for type safety** (catches errors at compile time)
3. **OpenAPI specs for API contracts** (frontend/backend alignment)
4. **Storybook for component library** (visual testing + documentation)
5. **Vitest for backend, React Testing Library for frontend**

### Team Practices
1. **Definition of Done includes tests**
2. **Feature flags for gradual rollouts**
3. **Staging environment mirrors production**
4. **Rollback plan for every deployment**
5. **Postmortems without blame**

---

## What NOT to Repeat in V2

❌ Vibe coding without architecture  
❌ Incremental refactors that never complete  
❌ Copy-paste components instead of sharing  
❌ Mixed API versions without deprecation plan  
❌ Database shortcuts (auto-reset, no migrations)  
❌ Default values that hide user intent  
❌ Tests as afterthought  
❌ Permission logic sprinkled everywhere  
❌ Relative API URLs  
❌ Inconsistent state without constraints  

## What TO Do in V2

✅ Architecture and permission model first  
✅ Shared component library  
✅ API contracts before implementation  
✅ Tests before features  
✅ Database migrations and constraints  
✅ Explicit user actions for critical data  
✅ Permission service with centralized logic  
✅ Environment configuration  
✅ Consistent patterns enforced by tooling  
✅ State consistency via DB constraints  

---

**The Ultimate Lesson:**

> **Vibe coding gets you 80% there in 20% of the time.**  
> **But the last 20% takes 200% of the time if you don't have solid foundations.**  
>  
> **For production apps with complex requirements like permissions:**  
> **Architecture first. Then vibe within the guardrails.**
