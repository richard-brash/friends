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

-- Locations table (specific stops along routes)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    coordinates JSONB, -- {lat, lng}
    order_in_route INTEGER NOT NULL, -- Order of this location in the route
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, order_in_route)
);

-- Friends table (people we deliver to)
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    notes TEXT,
    clothing_sizes JSONB, -- {shirt: 'M', pants: '32x30', shoes: '10', etc}
    dietary_restrictions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Runs table (scheduled delivery runs)
CREATE TABLE IF NOT EXISTS runs (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Run team members (many-to-many relationship)
CREATE TABLE IF NOT EXISTS run_team_members (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'volunteer' CHECK (role IN ('coordinator', 'volunteer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(run_id, user_id)
);

-- Requests table (delivery requests from friends)
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE, -- NULL if not assigned to a run yet
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_route_id ON locations(route_id);
CREATE INDEX IF NOT EXISTS idx_friends_location_id ON friends(location_id);
CREATE INDEX IF NOT EXISTS idx_runs_route_id ON runs(route_id);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requests_friend_id ON requests(friend_id);
CREATE INDEX IF NOT EXISTS idx_requests_run_id ON requests(run_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_run_team_members_run_id ON run_team_members(run_id);
CREATE INDEX IF NOT EXISTS idx_run_team_members_user_id ON run_team_members(user_id);

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