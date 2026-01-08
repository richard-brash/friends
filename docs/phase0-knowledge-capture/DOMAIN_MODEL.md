# Domain Model - Knowledge Captured from V1

## Core Entities

### User
**Purpose:** System users with authentication and role-based access

**Attributes:**
- id (PK)
- email (unique, required)
- password_hash (bcrypt)
- name
- role: 'admin' | 'coordinator' | 'volunteer'
- created_at, updated_at

**Business Rules:**
- Email must be unique
- Passwords hashed with bcrypt
- Role determines baseline permissions

---

### Friend
**Purpose:** Recipients of outreach services

**Attributes:**
- id (PK)
- name (required)
- alias
- phone
- notes
- status: 'active' | 'inactive'
- created_at, updated_at

**Relationships:**
- Has many Requests
- Seen at many Locations (through delivery records)

**Business Rules:**
- Can have multiple pending requests
- Status tracks active/inactive engagement
- May be spotted in field even without existing request

---

### Location
**Purpose:** Physical stops on routes where services are delivered

**Attributes:**
- id (PK)
- name (required)
- address
- city
- state
- zip_code
- coordinates (lat/lng)
- route_id (FK to Route)
- route_order (position in route sequence)
- notes
- created_at, updated_at

**Relationships:**
- Belongs to one Route
- Has many Requests
- Has many Run Stop Deliveries

**Business Rules:**
- Must belong to exactly one route
- route_order defines stop sequence
- Multiple requests can be assigned to same location

---

### Route
**Purpose:** Ordered sequence of locations for service delivery

**Attributes:**
- id (PK)
- name (required, e.g., "Baltimore City West")
- description
- is_active (boolean)
- created_at, updated_at

**Relationships:**
- Has many Locations (ordered by route_order)
- Has many Runs

**Business Rules:**
- Locations ordered by route_order field
- Active/inactive flag controls visibility
- Can have multiple runs scheduled

---

### Request
**Purpose:** Service requests from friends for delivery at locations

**Attributes:**
- id (PK)
- friend_id (FK to Friend)
- location_id (FK to Location)
- item_description
- quantity
- priority: 'low' | 'medium' | 'high' | 'urgent'
- status: 'pending' | 'ready_for_delivery' | 'taken' | 'delivered' | 'cancelled'
- notes
- requested_date
- created_at, updated_at

**Relationships:**
- Belongs to one Friend
- Belongs to one Location
- **Inferred relationship to Run**: Request → Location → Route → Run
- Has many Status History entries

**Business Rules:**
- **Critical:** NO direct run_id column - run inferred through location→route
- Status transitions: pending → ready_for_delivery → taken → delivered
- Can be cancelled at any stage
- Priority drives delivery order
- Status history tracks all state changes with user and timestamp

**Key Learning:**
- Original design had run_id column, caused cascading issues
- Removing run_id and using inference pattern proved cleaner

---

### Run
**Purpose:** Execution instance of a route on a specific date with a team

**Attributes:**
- id (PK)
- route_id (FK to Route)
- scheduled_date (required)
- status: 'planned' | 'prepared' | 'in_progress' | 'completed' | 'cancelled'
- current_location_id (FK to Location, nullable)
- current_stop_number (integer, 0 = not started)
- meal_count (integer, nullable - total meals distributed)
- notes
- created_at, updated_at

**Auto-generated name:** `"{route_name} {day_of_week} {YYYY-MM-DD}"`
Example: "Baltimore City West Wednesday 2026-01-08"

**Relationships:**
- Belongs to one Route
- Has many Team Members (through run_team_members join table)
- Has many Run Stop Deliveries
- **Inferred:** Has many Requests (through route→locations)

**Business Rules:**
- Name auto-generated from route + date
- Team lead = first team member added (lowest created_at timestamp)
- current_location_id + current_stop_number track execution progress
- Status lifecycle: planned → prepared → in_progress → completed
- meal_count nullable to force explicit user input
- Can't start without preparation checklist complete

**Key Learning:**
- Inconsistent state (null current_location_id but non-zero current_stop_number) breaks navigation
- Auto-fix pattern: query location by route_id + offset to repair state

---

### Run Team Members (Join Table)
**Purpose:** Many-to-many relationship between runs and users

**Attributes:**
- run_id (FK to Run)
- user_id (FK to User)
- created_at

**Business Rules:**
- Team lead identified by earliest created_at timestamp
- No explicit "role" column - lead determined by time

---

### Run Stop Deliveries
**Purpose:** Track delivery activity at each location during run execution

**Attributes:**
- id (PK)
- run_id (FK to Run)
- location_id (FK to Location)
- meals_delivered (integer, required)
- notes
- delivered_by (FK to User)
- delivered_at (timestamp)

**Business Rules:**
- One record per location per run (can be updated)
- Tracks who delivered, when, and how many meals
- Notes capture field observations

---

### Request Status History
**Purpose:** Audit trail of all status changes for requests

**Attributes:**
- id (PK)
- request_id (FK to Request)
- from_status (nullable for initial creation)
- to_status (required)
- user_id (FK to User, who made the change)
- notes
- created_at (timestamp of change)

**Business Rules:**
- Immutable record (no updates/deletes)
- Captures every state transition
- Requires authenticated user context

---

## Domain Relationships Summary

```
User ─┬─> Requests (created_by implied)
      ├─> Run Team Members
      └─> Request Status History

Friend ──> Requests

Route ─┬─> Locations (ordered)
       └─> Runs

Location ─┬─> Requests
          └─> Run Stop Deliveries

Request ─┬─> Friend
         ├─> Location
         └─> Request Status History

Run ─┬─> Route
     ├─> Run Team Members
     ├─> Run Stop Deliveries
     └─> (implied) Requests via Route→Locations
```

---

## State Machines

### Request Lifecycle
```
pending → ready_for_delivery → taken → delivered
   ↓              ↓              ↓
   └──────────> cancelled <──────┘
```

### Run Lifecycle
```
planned → prepared → in_progress → completed
   ↓          ↓           ↓
   └──────> cancelled <───┘
```

---

## Key Architectural Lessons

### What Worked
1. **Clean Architecture** - Repository pattern, Service layer separation
2. **Inferred relationships** - Request→Run via Location→Route cleaner than direct FK
3. **Audit trails** - Status history provides transparency
4. **Offline-first** - IndexedDB sync queue for field work
5. **Auto-generated names** - Run names from route + date reduce cognitive load

### What Broke
1. **Direct run_id FK** - Caused cascading query issues, removed
2. **Inconsistent state** - null location_id + non-zero stop_number broke navigation
3. **Form duplication** - Same entity forms rebuilt on different screens
4. **Mixed V1/V2 APIs** - Inconsistent patterns, auth middleware gaps
5. **Auto-reset crutch** - Masked data integrity issues

### Critical Insights
1. **Field screens are composite** - Touch multiple entities, need orchestration
2. **Permissions will be complex** - Need fine-grained ABAC, not just RBAC
3. **State consistency is critical** - Database constraints + validation essential
4. **Shared components required** - One form per entity, reused everywhere
5. **Test coverage mandatory** - Can't vibe-code production apps

---

## Next Steps for V2
1. Design permission model FIRST
2. Define orchestration patterns for composite screens
3. Build shared component library
4. Add comprehensive test coverage
5. Enforce data integrity with DB constraints
