-- Friends Outreach CRM Database Schema
-- Creates all tables with proper relationships and constraints

-- Users table (authentication and roles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coordinator', 'volunteer')),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table (delivery routes)
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976d2', -- Material-UI primary color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table (stops that can be assigned to routes)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    type VARCHAR(50), -- 'Restaurant', 'Store', 'Public Space', etc.
    coordinates JSONB, -- {lat, lng}
    notes TEXT,
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL, -- NULL means no route assigned
    route_order INTEGER, -- Order within the route (1, 2, 3, etc.), NULL if no route
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friends table (people we deliver to)
-- Current location is determined by latest entry in friend_location_history
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    notes TEXT,
    clothing_sizes JSONB, -- {shirt: 'M', pants: '32x30', shoes: '10', etc}
    dietary_restrictions TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'moved')),
    last_contact TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friend location history (track where friends have been found over time)
CREATE TABLE IF NOT EXISTS friend_location_history (
    id SERIAL PRIMARY KEY,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Runs table (scheduled delivery runs)
-- A run is a scheduled instance of a route with a team delivering meals and requests
CREATE TABLE IF NOT EXISTS runs (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Auto-generated: "{route_name} {day_of_week} {YYYY-MM-DD}"
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    meal_count INTEGER DEFAULT 0, -- Total number of meals to deliver on this run
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    current_location_id INTEGER REFERENCES locations(id), -- Track current stop during active run
    current_stop_number INTEGER DEFAULT 0, -- Track position in route (0 = not started, 1 = first stop, etc.)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Run team members (many-to-many relationship)
-- First team member added (lowest created_at timestamp) is the run lead
CREATE TABLE IF NOT EXISTS run_team_members (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(run_id, user_id)
);

-- Run stop deliveries (track meals delivered at each location)
CREATE TABLE IF NOT EXISTS run_stop_deliveries (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    meals_delivered INTEGER DEFAULT 0,
    visited_at TIMESTAMP,
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(run_id, location_id)
);

-- Requests table (delivery requests from friends at specific locations)
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'ready_for_delivery', 'delivered', 'cancelled')),
    notes TEXT,
    taken_by INTEGER REFERENCES users(id), -- Who took/is handling this request
    delivered_by INTEGER REFERENCES users(id), -- Who delivered this request
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Request status history table (tracks all status changes and delivery attempts)
CREATE TABLE IF NOT EXISTS request_status_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'taken', 'ready_for_delivery', 'delivered', 'delivery_attempt_failed', 'cancelled')),
    notes TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_route_id ON locations(route_id);
CREATE INDEX IF NOT EXISTS idx_locations_route_order ON locations(route_id, route_order);
-- Removed idx_friends_current_location - no longer using current_location_id column
CREATE INDEX IF NOT EXISTS idx_friend_location_history_friend_id ON friend_location_history(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_location_history_location ON friend_location_history(location_id);
CREATE INDEX IF NOT EXISTS idx_friend_location_history_date ON friend_location_history(date_recorded);
CREATE INDEX IF NOT EXISTS idx_runs_route_id ON runs(route_id);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requests_friend_id ON requests(friend_id);
CREATE INDEX IF NOT EXISTS idx_requests_location_id ON requests(location_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_request_status_history_request ON request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_request_status_history_status ON request_status_history(status);
CREATE INDEX IF NOT EXISTS idx_request_status_history_user ON request_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_run_team_members_run_id ON run_team_members(run_id);
CREATE INDEX IF NOT EXISTS idx_run_team_members_user_id ON run_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_run_stop_deliveries_run_id ON run_stop_deliveries(run_id);
CREATE INDEX IF NOT EXISTS idx_run_stop_deliveries_location_id ON run_stop_deliveries(location_id);
CREATE INDEX IF NOT EXISTS idx_runs_current_location ON runs(current_location_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to tables that need them (use DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friends_updated_at ON friends;
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_runs_updated_at ON runs;
CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_run_stop_deliveries_updated_at ON run_stop_deliveries;
CREATE TRIGGER update_run_stop_deliveries_updated_at BEFORE UPDATE ON run_stop_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();