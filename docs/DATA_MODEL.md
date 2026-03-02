# Data Model - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 2 - Architecture Design

---

## Design Principles

1. **Data Integrity First** - All constraints enforced at database level
2. **Audit Everything** - Status history and soft deletes for traceability
3. **Explicit Over Implicit** - Required fields explicit, no magic defaults
4. **Fail Fast** - Invalid states prevented by constraints, not application logic
5. **Performance Aware** - Indexes on all frequently queried columns

---

## Entity Relationship Diagram

```
┌─────────────┐
│   User      │
│ ─────────── │
│ id          │◄────┐
│ email*      │     │
│ phone       │     │
│ password_   │     │
│   hash*     │     │
│ name*       │     │
│ is_active   │     │
│ created_at  │     │
│ updated_at  │     │
└─────────────┘     │
       │            │
       │            │
       ▼            │
┌─────────────────────┐
│ run_team_members    │
│ ─────────────────── │
│ run_id*         ──┐ │
│ user_id*        ──┼─┘
│ created_at*       │ │
└───────────────────┼─┘
                    │
                    ▼
┌─────────────┐
│   Run       │
│ ─────────── │
│ id          │
│ route_id*   │──┐
│ name*       │  │
│ scheduled_  │  │
│   date*     │  │
│ status*     │  │
│ current_    │  │
│   location_ │  │
│   id        │  │
│ meal_count  │  │
│ notes       │  │
│ created_at  │  │
│ updated_at  │  │
└─────────────┘  │
       │         │
       │         │
       ▼         │
┌──────────────────────┐
│ run_stop_deliveries  │
│ ──────────────────── │
│ id                   │
│ run_id*          ──┐ │
│ location_id*     ──┼─┼──┐
│ meals_delivered* │ │ │  │
│ weekly_items     │ │ │  │
│   (JSONB)        │ │ │  │
│ notes            │ │ │  │
│ delivered_by     │ │ │  │
│ delivered_at     │ │ │  │
│ created_at       │ │ │  │
│ updated_at       │ │ │  │
└──────────────────┼─┼─┘  │
                   └─┘    │
                          │
       ┌──────────────────┘
       │
       ▼
┌─────────────┐
│   Route     │
│ ─────────── │
│ id          │◄──┐
│ name*       │   │
│ description │   │
│ is_active   │   │
│ created_at  │   │
│ updated_at  │   │
└─────────────┘   │
                  │
                  │
┌─────────────┐   │
│  Location   │   │
│ ─────────── │   │
│ id          │◄──┼───┐
│ name*       │   │   │
│ address     │   │   │
│ city        │   │   │
│ state       │   │   │
│ zip_code    │   │   │
│ coordinates │   │   │
│ route_id*   │───┘   │
│ route_order*│       │
│ notes       │       │
│ created_at  │       │
│ updated_at  │       │
└─────────────┘       │
       │              │
       │              │
       ▼              │
┌─────────────┐       │
│  Request    │       │
│ ─────────── │       │
│ id          │       │
│ friend_id*  │──┐    │
│ location_id*│──┼────┘
│ item_desc*  │  │
│ quantity    │  │
│ priority    │  │
│ status*     │  │
│ notes       │  │
│ created_at  │  │
│ updated_at  │  │
└─────────────┘  │
       │         │
       │         │
       ▼         │
┌──────────────────────┐
│ request_status_      │
│   history            │
│ ──────────────────── │
│ id                   │
│ request_id*      ──┐ │
│ from_status      │ │ │
│ to_status*       │ │ │
│ user_id*         │ │ │
│ notes            │ │ │
│ created_at*      │ │ │
└──────────────────┼─┼─┘
                   └─┘
                   
       ┌───────────┘
       │
       ▼
┌─────────────┐
│   Friend    │
│ ─────────── │
│ id          │◄───┐
│ first_name  │    │
│ last_name   │    │
│ alias       │    │
│ phone       │    │
│ email       │    │
│ notes       │    │
│ status      │    │
│ created_at  │    │
│ updated_at  │    │
└─────────────┘    │
       │           │
       │           │
       ▼           │
┌───────────────────────┐
│ friend_location_      │
│   history             │
│ ───────────────────── │
│ id                    │
│ friend_id*        ──┐ │
│ location_id*      ──┼─┼───┐
│ spotted_by*       │ │ │   │
│ spotted_at*       │ │ │   │
│ notes             │ │ │   │
│ created_at        │ │ │   │
└───────────────────┼─┼─┘   │
                    └─┘     │
                            │
                            │
                   (back to Location)

Legend:
  * = NOT NULL constraint
  ──> = Foreign Key relationship
  ◄── = Referenced by
```

---

## Table Definitions

### users

**Purpose:** System users with authentication and role-based access

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT users_phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$' OR phone IS NULL)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

**Business Rules:**
- Must have email OR phone (can have both)
- Email must be unique across active users
- Phone must be E.164 format if provided
- is_active = soft delete (false = account disabled)
- **MVP Permissions:** Authenticated = full access (no role-based restrictions)

**Validation:**
- Email: RFC 5322 format
- Phone: E.164 international format
- Password: Min 8 chars, hashed with bcrypt (10 rounds)
- Name: Required, 1-100 characters

---

### friends

**Purpose:** Recipients of outreach services (homeless individuals)

```sql
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    alias VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'moved', 'deceased')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT friends_name_required CHECK (
        first_name IS NOT NULL OR 
        last_name IS NOT NULL OR 
        alias IS NOT NULL
    ),
    CONSTRAINT friends_phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$' OR phone IS NULL)
);

-- Indexes
CREATE INDEX idx_friends_first_name ON friends(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX idx_friends_last_name ON friends(last_name) WHERE last_name IS NOT NULL;
CREATE INDEX idx_friends_alias ON friends(alias) WHERE alias IS NOT NULL;
CREATE INDEX idx_friends_phone ON friends(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_friends_name_search ON friends USING gin(
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(alias, '')
    )
);
```

**Business Rules:**
- **Critical:** Must have at least one of: first_name, last_name, alias
- Phone and email optional (transient population)
- Status tracks engagement (active = currently served)
- Soft delete via status='inactive' (preserve history)
- Current location determined by latest friend_location_history entry

**Validation:**
- At least one name field required
- Phone: E.164 format if provided
- Email: RFC 5322 format if provided

---

### routes

**Purpose:** Ordered sequence of locations for service delivery

```sql
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_routes_name ON routes(name);
CREATE INDEX idx_routes_active ON routes(is_active) WHERE is_active = true;
```

**Business Rules:**
- Name must be unique (case-sensitive)
- is_active controls visibility in UI (soft delete)
- Deleting route requires zero active runs (FK constraint)

**Validation:**
- Name: Required, 1-100 characters, unique
- Description: Optional, max 1000 characters

---

### locations

**Purpose:** Physical stops on routes where services are delivered

```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    coordinates JSONB, -- {lat: number, lng: number}
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    route_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT locations_route_order_positive CHECK (route_order > 0),
    CONSTRAINT locations_coordinates_format CHECK (
        coordinates IS NULL OR (
            jsonb_typeof(coordinates->'lat') = 'number' AND
            jsonb_typeof(coordinates->'lng') = 'number' AND
            (coordinates->'lat')::numeric BETWEEN -90 AND 90 AND
            (coordinates->'lng')::numeric BETWEEN -180 AND 180
        )
    ),
    UNIQUE(route_id, route_order)
);

-- Indexes
CREATE INDEX idx_locations_route_id ON locations(route_id);
CREATE INDEX idx_locations_route_order ON locations(route_id, route_order);
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_coordinates ON locations USING gist(((coordinates->'lat')::numeric), ((coordinates->'lng')::numeric));
```

**Business Rules:**
- **Critical:** Must belong to exactly one route
- route_order defines stop sequence (1, 2, 3, ...)
- route_order must be unique within route
- Coordinates optional (lat/lng for map view in Phase 2)
- Deleting location with pending requests should warn (but allow with CASCADE)

**Validation:**
- Name: Required, 1-100 characters
- route_order: Positive integer, unique per route
- Coordinates: Valid lat/lng if provided

---

### runs

**Purpose:** Execution instance of a route on a specific date with a team

```sql
CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned' NOT NULL CHECK (
        status IN ('planned', 'prepared', 'in_progress', 'completed', 'cancelled')
    ),
    current_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    meal_count INTEGER CHECK (meal_count > 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT runs_current_location_matches_route CHECK (
        current_location_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM locations 
            WHERE id = current_location_id AND route_id = runs.route_id
        )
    )
);

-- Indexes
CREATE INDEX idx_runs_route_id ON runs(route_id);
CREATE INDEX idx_runs_scheduled_date ON runs(scheduled_date);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_current_location ON runs(current_location_id) WHERE current_location_id IS NOT NULL;
CREATE INDEX idx_runs_route_date ON runs(route_id, scheduled_date);
```

**Business Rules:**
- **Auto-generated name:** `"{route_name} {day_of_week} {YYYY-MM-DD}"`
  - Example: "Downtown Monday 2026-01-13"
- **Team lead:** First team member added (lowest created_at in run_team_members) - tracked for audit purposes, not displayed in MVP UI
- **current_location_id:** Tracks current stop during execution (nullable)
  - When NULL: run not started or completed
  - When set: points to current location being serviced
  - Stop number derived from location's route_order when needed
- **meal_count:** Nullable to force explicit entry during preparation
- **Status lifecycle:** planned → prepared → in_progress → completed
- Cannot delete run with status in_progress or completed

**State Consistency Rules:**
- Status = planned/prepared → current_location_id must be NULL
- Status = in_progress → current_location_id should be set (points to current stop)
- Status = completed → current_location_id set to last location or NULL

**Validation:**
- scheduled_date: Required, cannot be more than 1 year in past
- meal_count: Must be positive if provided
- status transitions enforced by application (not DB trigger)

---

### run_team_members

**Purpose:** Many-to-many relationship between runs and users

```sql
CREATE TABLE run_team_members (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    UNIQUE(run_id, user_id)
);

-- Indexes
CREATE INDEX idx_run_team_members_run_id ON run_team_members(run_id);
CREATE INDEX idx_run_team_members_user_id ON run_team_members(user_id);
CREATE INDEX idx_run_team_members_created_at ON run_team_members(run_id, created_at);
```

**Business Rules:**
- **Team lead identification:** User with lowest created_at for the run
- User can be on multiple runs simultaneously
- Deleting run removes all team members (CASCADE)
- Cannot remove user from completed run (application logic)

**Queries:**
- Get team lead: `SELECT user_id FROM run_team_members WHERE run_id = ? ORDER BY created_at LIMIT 1`
- Get team size: `SELECT COUNT(*) FROM run_team_members WHERE run_id = ?`

---

### run_stop_deliveries

**Purpose:** Track delivery activity at each location during run execution

```sql
CREATE TABLE run_stop_deliveries (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    meals_delivered INTEGER DEFAULT 0 NOT NULL CHECK (meals_delivered >= 0),
    weekly_items JSONB, -- [{type: 'weekend_bags', count: 10}, {type: 'blankets', count: 5}]
    notes TEXT,
    delivered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    UNIQUE(run_id, location_id),
    CONSTRAINT run_stop_deliveries_weekly_items_format CHECK (
        weekly_items IS NULL OR jsonb_typeof(weekly_items) = 'array'
    )
);

-- Indexes
CREATE INDEX idx_run_stop_deliveries_run_id ON run_stop_deliveries(run_id);
CREATE INDEX idx_run_stop_deliveries_location_id ON run_stop_deliveries(location_id);
CREATE INDEX idx_run_stop_deliveries_delivered_by ON run_stop_deliveries(delivered_by);
CREATE INDEX idx_run_stop_deliveries_delivered_at ON run_stop_deliveries(delivered_at);
```

**Business Rules:**
- One record per location per run (upsert pattern)
- meals_delivered required, default 0
- weekly_items structure: `[{type: string, count: number}, ...]`
- delivered_by and delivered_at set when stop completed
- Can be updated (user corrects count)

**weekly_items Example:**
```json
[
  {"type": "weekend_bags", "count": 10},
  {"type": "blankets", "count": 5},
  {"type": "gloves", "count": 12}
]
```

---

### requests

**Purpose:** Service requests from friends for delivery at locations

```sql
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    item_description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    priority VARCHAR(10) DEFAULT 'medium' NOT NULL CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (
        status IN ('pending', 'ready_for_delivery', 'taken', 'delivered', 'cancelled')
    ),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_requests_friend_id ON requests(friend_id);
CREATE INDEX idx_requests_location_id ON requests(location_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_status_location ON requests(status, location_id);
```

**Business Rules:**
- **Critical:** NO direct run_id column - run inferred through location→route
- **Status lifecycle:** pending → ready_for_delivery → taken → delivered
- Can be cancelled at any stage
- Priority drives sorting in prep checklist
- Quantity defaults to 1

**Status Definitions:**
- **pending:** Request taken in field, waiting for item to be pulled
- **ready_for_delivery:** Item pulled from inventory, ready to load on run
- **taken:** Item loaded on run, en route to friend
- **delivered:** Item delivered to friend
- **cancelled:** Request cancelled (reason in status history)

**Validation:**
- item_description: Required, 1-255 characters
- quantity: Positive integer
- Status transitions validated by application

---

### request_status_history

**Purpose:** Audit trail of all status changes for requests

```sql
CREATE TABLE request_status_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL CHECK (
        to_status IN ('pending', 'ready_for_delivery', 'taken', 'delivered', 'cancelled')
    ),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_request_status_history_request_id ON request_status_history(request_id, created_at DESC);
CREATE INDEX idx_request_status_history_user_id ON request_status_history(user_id);
CREATE INDEX idx_request_status_history_status ON request_status_history(to_status);
```

**Business Rules:**
- **Immutable:** No updates or deletes (audit trail)
- from_status NULL on creation (initial status = pending)
- Every status change creates new record
- Requires authenticated user context
- Notes optional but recommended

**Queries:**
- Get full history: `SELECT * FROM request_status_history WHERE request_id = ? ORDER BY created_at`
- Get current status: `SELECT to_status FROM request_status_history WHERE request_id = ? ORDER BY created_at DESC LIMIT 1`
- Who delivered: `SELECT user_id, created_at FROM request_status_history WHERE request_id = ? AND to_status = 'delivered'`

---

### friend_location_history

**Purpose:** Track where friends have been spotted over time

```sql
CREATE TABLE friend_location_history (
    id SERIAL PRIMARY KEY,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    spotted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    spotted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_friend_location_history_friend_id ON friend_location_history(friend_id, spotted_at DESC);
CREATE INDEX idx_friend_location_history_location_id ON friend_location_history(location_id, spotted_at DESC);
CREATE INDEX idx_friend_location_history_spotted_by ON friend_location_history(spotted_by);
CREATE INDEX idx_friend_location_history_spotted_at ON friend_location_history(spotted_at DESC);
```

**Business Rules:**
- Created when field worker "spots" friend during run execution
- spotted_at = when friend was seen (defaults to now)
- spotted_by = user who recorded sighting
- Used to determine "expected friends" at location
- Helps find transient individuals

**Queries:**
- Get friend's last known location: `SELECT location_id FROM friend_location_history WHERE friend_id = ? ORDER BY spotted_at DESC LIMIT 1`
- Get expected friends at location: `SELECT DISTINCT friend_id FROM friend_location_history WHERE location_id = ? ORDER BY spotted_at DESC`
- Get friend's location history: `SELECT * FROM friend_location_history WHERE friend_id = ? ORDER BY spotted_at DESC LIMIT 5`

---

## Database Constraints Summary

### Foreign Key Constraints
- All foreign keys defined with appropriate `ON DELETE` behavior:
  - **CASCADE:** Child records deleted when parent deleted (run_team_members, request_status_history)
  - **RESTRICT:** Prevent deletion if children exist (routes with runs, locations with routes)
  - **SET NULL:** Preserve child record but clear reference (run current_location_id)

### Unique Constraints
- `users.email` - Unique active emails
- `routes.name` - Unique route names
- `locations(route_id, route_order)` - Unique stop sequence per route
- `run_team_members(run_id, user_id)` - User assigned once per run
- `run_stop_deliveries(run_id, location_id)` - One delivery record per stop per run

### Check Constraints
- Enum validation (status, priority)
- Positive integers (route_order, meal_count, quantity)
- Coordinate ranges (lat -90 to 90, lng -180 to 180)
- Required name fields (friends must have first/last/alias)
- Email/phone format validation (E.164)

### Not Null Constraints
All primary business fields required:
- User: email (or phone), password_hash, name
- Friend: At least one name field (enforced via CHECK constraint)
- Location: name, route_id, route_order
- Request: friend_id, location_id, item_description, status
- Run: route_id, name, scheduled_date, status

---

## Indexes Strategy

### Performance Considerations
- **Primary keys:** Auto-indexed
- **Foreign keys:** Indexed for joins (all FKs)
- **Status columns:** Indexed for filtering (requests, runs, friends)
- **Date columns:** Indexed for range queries (scheduled_date, spotted_at)
- **Name columns:** Indexed for search (partial match supported)
- **Full-text search:** GIN index on friend names (combined)

### Query Patterns
1. **Get run details with team:** JOIN run_team_members ON run_id
2. **Get requests for route:** JOIN requests→locations→routes
3. **Get expected friends at location:** friend_location_history by location_id + spotted_at
4. **Get run preparation checklist:** requests WHERE status='ready_for_delivery' AND location_id IN (route locations)
5. **Get request history:** request_status_history by request_id

---

## Migration Strategy

### Phase 1: Core Schema
1. Create all tables in dependency order
2. Add foreign key constraints
3. Create indexes
4. Add triggers (updated_at)

### Phase 2: Seed Data
1. Create admin user
2. Create sample routes (3)
3. Create sample locations (8 per route)
4. Create sample friends (50)
5. Create sample requests (20)

### Phase 3: Data Validation
1. Run constraint checks
2. Verify referential integrity
3. Test cascade deletes
4. Verify trigger functions

---

## Data Integrity Rules

### Application-Enforced Rules
- Status transitions (request, run)
- Team lead calculation (first member added, tracked for audit only)
- Run name generation (route + date)
- Stop number derivation (from current_location_id → route_order)

### Database-Enforced Rules
- All foreign key relationships
- All unique constraints
- All check constraints (enums, ranges, formats)
- All not-null constraints

### Hybrid Rules
- Soft deletes (is_active flag + query filters)
- Cascade deletes (some preserve audit trail)
- Required field combinations (friend names)

---

## Performance Considerations

### Expected Load (MVP)
- Users: 5-10 concurrent
- Friends: 1000 records
- Locations: 30 records
- Runs: 12/month (3 routes × 4 weeks)
- Requests: 100/month

### Optimization
- Connection pooling (10 max connections)
- Pagination (50 items per page default)
- Compound indexes for common joins
- Partial indexes for filtered queries
- Query result caching (Phase 2)

### Bottlenecks to Monitor
- Request list queries (location→route joins)
- Friend search (full-text search on names)
- Run execution queries (current location + expected friends)

---

## Next Steps

1. ✅ Schema design complete
2. ⏳ Generate SQL migration script
3. ⏳ Create seed data script
4. ⏳ Design API endpoints (map to schema)
5. ⏳ Plan repository layer (data access patterns)

---

## Appendix: SQL Views (Future Enhancement)

### run_summary_view
Aggregate run data for dashboards:
```sql
CREATE VIEW run_summary_view AS
SELECT 
    r.id,
    r.name,
    r.scheduled_date,
    r.status,
    rt.name as route_name,
    COUNT(DISTINCT rtm.user_id) as team_size,
    (SELECT user_id FROM run_team_members 
     WHERE run_id = r.id 
     ORDER BY created_at LIMIT 1) as team_lead_id,
    SUM(rsd.meals_delivered) as total_meals_delivered,
    COUNT(DISTINCT rsd.location_id) as stops_completed
FROM runs r
JOIN routes rt ON r.route_id = rt.id
LEFT JOIN run_team_members rtm ON r.id = rtm.run_id
LEFT JOIN run_stop_deliveries rsd ON r.id = rsd.run_id
GROUP BY r.id, rt.name;
```

### request_summary_view
Request details with route info:
```sql
CREATE VIEW request_summary_view AS
SELECT 
    req.id,
    req.item_description,
    req.quantity,
    req.priority,
    req.status,
    f.first_name,
    f.last_name,
    f.alias,
    l.name as location_name,
    rt.name as route_name,
    req.created_at,
    (SELECT to_status FROM request_status_history 
     WHERE request_id = req.id 
     ORDER BY created_at DESC LIMIT 1) as current_status
FROM requests req
JOIN friends f ON req.friend_id = f.id
JOIN locations l ON req.location_id = l.id
JOIN routes rt ON l.route_id = rt.id;
```
