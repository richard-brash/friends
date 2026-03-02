-- Friends Outreach CRM V2 Database Schema
-- Migration: 001_v2_schema
-- Created: January 9, 2026
-- Based on: /docs/DATA_MODEL.md

-- ============================================================================
-- TABLE DEFINITIONS (in dependency order)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- users
-- Purpose: System users with authentication
-- MVP: Authenticated = full access (no role-based restrictions)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
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

COMMENT ON TABLE users IS 'System users with authentication credentials';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag (false = account disabled)';
COMMENT ON CONSTRAINT users_email_or_phone ON users IS 'Must have email OR phone (can have both)';

-- -----------------------------------------------------------------------------
-- friends
-- Purpose: Recipients of outreach services (homeless individuals)
-- Critical: Must have at least one name field (first_name, last_name, or alias)
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE friends IS 'Recipients of outreach services';
COMMENT ON COLUMN friends.status IS 'Engagement status: active (currently served), inactive (soft delete), moved, deceased';
COMMENT ON CONSTRAINT friends_name_required ON friends IS 'At least one name field (first_name, last_name, alias) required';

-- -----------------------------------------------------------------------------
-- routes
-- Purpose: Ordered sequence of locations for service delivery
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE routes IS 'Ordered sequence of locations for service delivery';
COMMENT ON COLUMN routes.is_active IS 'Soft delete flag (controls visibility in UI)';

-- -----------------------------------------------------------------------------
-- locations
-- Purpose: Physical stops on routes where services are delivered
-- Critical: route_order must be unique within route
-- -----------------------------------------------------------------------------
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
-- Spatial index for coordinates (requires btree_gist extension for composite types)
-- CREATE INDEX idx_locations_coordinates ON locations USING gist(
--     ((coordinates->'lat')::numeric), 
--     ((coordinates->'lng')::numeric)
-- ) WHERE coordinates IS NOT NULL;

COMMENT ON TABLE locations IS 'Physical stops on routes where services are delivered';
COMMENT ON COLUMN locations.route_order IS 'Defines stop sequence (1, 2, 3, ...), must be unique per route';
COMMENT ON COLUMN locations.coordinates IS 'Optional lat/lng for map view: {lat: number, lng: number}';

-- -----------------------------------------------------------------------------
-- runs
-- Purpose: Execution instance of a route on a specific date with a team
-- Auto-generated name: "{route_name} {day_of_week} {YYYY-MM-DD}"
-- -----------------------------------------------------------------------------
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_runs_route_id ON runs(route_id);
CREATE INDEX idx_runs_scheduled_date ON runs(scheduled_date);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_current_location ON runs(current_location_id) WHERE current_location_id IS NOT NULL;
CREATE INDEX idx_runs_route_date ON runs(route_id, scheduled_date);

COMMENT ON TABLE runs IS 'Execution instance of a route on a specific date with a team';
COMMENT ON COLUMN runs.name IS 'Auto-generated: "{route_name} {day_of_week} {YYYY-MM-DD}" (e.g., "Downtown Monday 2026-01-13")';
COMMENT ON COLUMN runs.current_location_id IS 'Tracks current stop during execution (NULL = not started/completed)';
COMMENT ON COLUMN runs.meal_count IS 'Total meals to deliver (nullable to force explicit entry during preparation)';
COMMENT ON COLUMN runs.status IS 'Lifecycle: planned → prepared → in_progress → completed';

-- -----------------------------------------------------------------------------
-- run_team_members
-- Purpose: Many-to-many relationship between runs and users
-- Team lead: User with lowest created_at for the run (tracked for audit only)
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE run_team_members IS 'Many-to-many: runs ↔ users (team assignments)';
COMMENT ON COLUMN run_team_members.created_at IS 'Team lead = user with lowest created_at for run (audit purposes only)';

-- -----------------------------------------------------------------------------
-- run_stop_deliveries
-- Purpose: Track delivery activity at each location during run execution
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE run_stop_deliveries IS 'Track delivery activity at each location during run execution';
COMMENT ON COLUMN run_stop_deliveries.weekly_items IS 'Array of items: [{type: string, count: number}, ...]';
COMMENT ON CONSTRAINT run_stop_deliveries_weekly_items_format ON run_stop_deliveries IS 'weekly_items must be JSON array if provided';

-- -----------------------------------------------------------------------------
-- requests
-- Purpose: Service requests from friends for delivery at locations
-- Critical: NO direct run_id column - run inferred through location→route
-- Status lifecycle: pending → ready_for_delivery → taken → delivered
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE requests IS 'Service requests from friends for delivery at locations';
COMMENT ON COLUMN requests.status IS 'Lifecycle: pending (taken in field) → ready_for_delivery (item pulled) → taken (loaded on run) → delivered';
COMMENT ON COLUMN requests.priority IS 'Drives sorting in preparation checklist';

-- -----------------------------------------------------------------------------
-- request_status_history
-- Purpose: Audit trail of all status changes for requests
-- IMMUTABLE: No updates or deletes allowed
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE request_status_history IS 'Immutable audit trail of all status changes';
COMMENT ON COLUMN request_status_history.from_status IS 'NULL on creation (initial status = pending)';

-- -----------------------------------------------------------------------------
-- friend_location_history
-- Purpose: Track where friends have been spotted over time
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE friend_location_history IS 'Track where friends have been spotted over time';
COMMENT ON COLUMN friend_location_history.spotted_at IS 'When friend was seen (defaults to now)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_run_stop_deliveries_updated_at BEFORE UPDATE ON run_stop_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Verify all tables created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'users', 'friends', 'routes', 'locations', 'runs', 
        'run_team_members', 'run_stop_deliveries', 'requests', 
        'request_status_history', 'friend_location_history'
    );
    
    IF table_count != 10 THEN
        RAISE EXCEPTION 'Schema validation failed: Expected 10 tables, found %', table_count;
    END IF;
    
    RAISE NOTICE 'Schema validation passed: All 10 tables created successfully';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run seed data script (002_seed_data.sql)
-- 2. Verify constraints with test data
-- 3. Create repository layer
-- ============================================================================
