-- Basic test data for automated testing
-- This file is loaded before each test to provide consistent test data

-- Create permissions for testing
INSERT INTO permissions (resource, action, description) VALUES
-- User permissions
('users', 'read', 'View user profiles and names'),
('users', 'write', 'Create and update user accounts'),
('users', 'delete', 'Remove user accounts'),
('users', 'manage', 'Full user management'),

-- Friend permissions
('friends', 'read', 'View friend profiles'),
('friends', 'write', 'Create and update friend profiles'),
('friends', 'delete', 'Remove friend profiles'),
('friends', 'manage', 'Full friend management'),

-- Location permissions
('locations', 'read', 'View location details'),
('locations', 'write', 'Create and update locations'),
('locations', 'delete', 'Remove locations'),
('locations', 'manage', 'Full location management'),

-- Route permissions
('routes', 'read', 'View route details'),
('routes', 'write', 'Create and update routes'),
('routes', 'delete', 'Remove routes'),
('routes', 'manage', 'Full route management'),

-- Run permissions
('runs', 'read', 'View run details'),
('runs', 'write', 'Create and update runs'),
('runs', 'delete', 'Cancel/remove runs'),
('runs', 'manage', 'Full run management'),

-- Request permissions
('requests', 'read', 'View delivery requests'),
('requests', 'write', 'Update delivery status'),
('requests', 'delete', 'Cancel delivery requests'),
('requests', 'manage', 'Full request management'),

-- Report permissions
('reports', 'read', 'View analytics and reports');

-- Set up default role permissions
INSERT INTO role_permissions (role, permission_id) 
SELECT 'admin', id FROM permissions; -- Admin gets all permissions

INSERT INTO role_permissions (role, permission_id)
SELECT 'coordinator', id FROM permissions 
WHERE (resource, action) IN (
  ('users', 'read'),
  ('friends', 'read'), ('friends', 'write'), ('friends', 'delete'), ('friends', 'manage'),
  ('locations', 'read'), ('locations', 'write'), ('locations', 'delete'), ('locations', 'manage'),
  ('routes', 'read'), ('routes', 'write'), ('routes', 'delete'), ('routes', 'manage'),
  ('runs', 'read'), ('runs', 'write'), ('runs', 'delete'), ('runs', 'manage'),
  ('requests', 'read'), ('requests', 'write'), ('requests', 'delete'), ('requests', 'manage'),
  ('reports', 'read')
);

INSERT INTO role_permissions (role, permission_id)
SELECT 'volunteer', id FROM permissions 
WHERE (resource, action) IN (
  ('users', 'read'),
  ('friends', 'read'),
  ('locations', 'read'),
  ('routes', 'read'),
  ('runs', 'read'),
  ('requests', 'read'), ('requests', 'write')
);

-- Create test users with proper password hashes
INSERT INTO users (username, email, name, role, password_hash, phone) VALUES
('testadmin', 'testadmin@friendsoutreach.org', 'Test Admin', 'admin', '$2b$10$test.hash.for.password', '+1234567890'),
('testcoordinator', 'testcoord@friendsoutreach.org', 'Test Coordinator', 'coordinator', '$2b$10$test.hash.for.password', '+1234567891'),
('testvolunteer', 'testvol@friendsoutreach.org', 'Test Volunteer', 'volunteer', '$2b$10$test.hash.for.password', '+1234567892');

-- Create test locations
INSERT INTO locations (name, address, type, coordinates, notes) VALUES
('Test Downtown Park', '100 Main St, Downtown', 'Public Space', '{"lat": 40.7128, "lng": -74.0060}', 'Central park location'),
('Test Community Center', '200 Center Ave, Midtown', 'Community Center', '{"lat": 40.7589, "lng": -73.9851}', 'Indoor facility'),
('Test Food Bank', '300 Service Rd, Uptown', 'Service Center', '{"lat": 40.7831, "lng": -73.9712}', 'Food distribution point');

-- Create test routes
INSERT INTO routes (name, description, color) VALUES
('Test Downtown Route', 'Test route covering downtown area', '#1976d2'),
('Test Uptown Route', 'Test route covering uptown area', '#388e3c');

-- Link locations to routes
INSERT INTO route_locations (route_id, location_id, order_in_route) VALUES
(1, 1, 1), (1, 2, 2), -- Downtown route: park -> community center
(2, 2, 1), (2, 3, 2); -- Uptown route: community center -> food bank

-- Create test friends
INSERT INTO friends (name, nickname, email, phone, current_location_id, notes, clothing_sizes, dietary_restrictions, status) VALUES
('Test Friend One', 'TF1', 'testfriend1@example.com', '+1234567893', 1, 'Regular visitor to downtown park', '{"shirt": "M", "pants": "32x30", "shoes": "10"}', 'Vegetarian', 'active'),
('Test Friend Two', 'TF2', 'testfriend2@example.com', '+1234567894', 2, 'Frequent community center visitor', '{"shirt": "L", "pants": "34x32", "shoes": "11"}', 'None', 'active'),
('Test Friend Three', 'TF3', 'testfriend3@example.com', '+1234567895', 3, 'Often at food bank', '{"shirt": "S", "pants": "30x28", "shoes": "9"}', 'Gluten-free', 'active');

-- Create test runs
INSERT INTO runs (route_id, name, scheduled_date, start_time, end_time, status, notes, created_by) VALUES
(1, 'Test Downtown Run', '2025-10-20', '09:00:00', '12:00:00', 'scheduled', 'Morning downtown delivery', 1),
(2, 'Test Uptown Run', '2025-10-21', '14:00:00', '17:00:00', 'scheduled', 'Afternoon uptown delivery', 2);

-- Create test team assignments
INSERT INTO run_team_members (run_id, user_id, role) VALUES
(1, 2, 'coordinator'), (1, 3, 'volunteer'), -- Downtown run team
(2, 1, 'coordinator'), (2, 3, 'volunteer');  -- Uptown run team

-- Create test requests
INSERT INTO requests (friend_id, location_id, run_id, category, item_name, description, quantity, priority, status, notes) VALUES
(1, 1, 1, 'Food', 'Sandwiches', 'Turkey and ham sandwiches', 2, 'medium', 'pending', 'No mustard'),
(2, 2, 1, 'Clothing', 'Winter Jacket', 'Warm winter coat', 1, 'high', 'pending', 'Size large preferred'),
(3, 3, 2, 'Food', 'Groceries', 'Basic grocery items', 1, 'medium', 'pending', 'Non-perishable items'),
(1, 1, NULL, 'Personal Care', 'Toiletries', 'Basic hygiene items', 1, 'low', 'pending', 'Travel size preferred');

-- Record some location history
INSERT INTO friend_location_history (friend_id, location_id, notes, recorded_by) VALUES
(1, 1, 'Regular morning visits', 2),
(2, 2, 'Attends evening programs', 2),
(3, 3, 'Weekly food pickup', 1),
(1, 2, 'Occasional community center visits', 3);