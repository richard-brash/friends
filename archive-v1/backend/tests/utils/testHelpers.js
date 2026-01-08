import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { testDb } from './testDatabase.js';

export async function createTestUser(role = 'volunteer', options = {}) {
  const timestamp = Date.now();
  const userData = {
    username: `test-${role}-${timestamp}`,
    email: `test-${role}-${timestamp}@example.com`,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    role,
    password_hash: await bcrypt.hash('password', 10),
    phone: '+1234567890',
    ...options.userData
  };

  const result = await testDb.query(`
    INSERT INTO users (username, email, name, role, password_hash, phone)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, name, role, phone, created_at
  `, [userData.username, userData.email, userData.name, userData.role, userData.password_hash, userData.phone]);

  const user = result.rows[0];

  // Add custom permissions if specified
  if (options.customPermissions) {
    for (const permission of options.customPermissions) {
      const [resource, action] = permission.split(':');
      await grantTestPermission(user.id, resource, action);
    }
  }

  return user;
}

export async function getAuthToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

export async function grantTestPermission(userId, resource, action) {
  // First, ensure the permission exists
  let permissionResult = await testDb.query(
    'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
    [resource, action]
  );

  // If permission doesn't exist, create it
  if (permissionResult.rows.length === 0) {
    permissionResult = await testDb.query(`
      INSERT INTO permissions (resource, action, description)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [resource, action, `Test permission for ${resource}:${action}`]);
  }

  const permissionId = permissionResult.rows[0].id;

  // Grant the permission to the user
  await testDb.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, permission_id) DO NOTHING
  `, [userId, permissionId]);
}

export async function revokeTestPermission(userId, resource, action) {
  await testDb.query(`
    DELETE FROM user_permissions up
    USING permissions p
    WHERE up.permission_id = p.id
      AND up.user_id = $1
      AND p.resource = $2
      AND p.action = $3
  `, [userId, resource, action]);
}

export async function createTestFriend(friendData = {}) {
  const defaultData = {
    name: `Test Friend ${Date.now()}`,
    nickname: 'TF',
    email: `testfriend${Date.now()}@example.com`,
    phone: '+1234567890',
    notes: 'Test friend for automated testing',
    clothing_sizes: JSON.stringify({ shirt: 'M', pants: '32x30', shoes: '10' }),
    dietary_restrictions: 'None',
    status: 'active'
  };

  const data = { ...defaultData, ...friendData };

  const result = await testDb.query(`
    INSERT INTO friends (name, nickname, email, phone, notes, clothing_sizes, dietary_restrictions, status, current_location_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [data.name, data.nickname, data.email, data.phone, data.notes, data.clothing_sizes, data.dietary_restrictions, data.status, data.current_location_id]);

  return result.rows[0];
}

export async function createTestLocation(locationData = {}) {
  const defaultData = {
    name: `Test Location ${Date.now()}`,
    address: '123 Test Street, Test City, TC 12345',
    type: 'Restaurant',
    coordinates: JSON.stringify({ lat: 40.7128, lng: -74.0060 }),
    notes: 'Test location for automated testing'
  };

  const data = { ...defaultData, ...locationData };

  const result = await testDb.query(`
    INSERT INTO locations (name, address, type, coordinates, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [data.name, data.address, data.type, data.coordinates, data.notes]);

  return result.rows[0];
}

export async function createTestRoute(routeData = {}) {
  const defaultData = {
    name: `Test Route ${Date.now()}`,
    description: 'Test route for automated testing',
    color: '#1976d2'
  };

  const data = { ...defaultData, ...routeData };

  const result = await testDb.query(`
    INSERT INTO routes (name, description, color)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [data.name, data.description, data.color]);

  return result.rows[0];
}

export async function createTestRun(runData = {}) {
  // Create a test route if none provided
  if (!runData.route_id) {
    const route = await createTestRoute();
    runData.route_id = route.id;
  }

  const defaultData = {
    name: `Test Run ${Date.now()}`,
    scheduled_date: '2025-10-20',
    start_time: '09:00:00',
    end_time: '17:00:00',
    status: 'scheduled',
    notes: 'Test run for automated testing'
  };

  const data = { ...defaultData, ...runData };

  const result = await testDb.query(`
    INSERT INTO runs (route_id, name, scheduled_date, start_time, end_time, status, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [data.route_id, data.name, data.scheduled_date, data.start_time, data.end_time, data.status, data.notes, data.created_by]);

  return result.rows[0];
}

export async function createTestRequest(requestData = {}) {
  // Create dependencies if not provided
  if (!requestData.friend_id) {
    const friend = await createTestFriend();
    requestData.friend_id = friend.id;
  }

  if (!requestData.location_id) {
    const location = await createTestLocation();
    requestData.location_id = location.id;
  }

  const defaultData = {
    category: 'Food',
    item_name: 'Test Item',
    description: 'Test request item',
    quantity: 1,
    priority: 'medium',
    status: 'pending',
    notes: 'Test request for automated testing'
  };

  const data = { ...defaultData, ...requestData };

  const result = await testDb.query(`
    INSERT INTO requests (friend_id, location_id, run_id, category, item_name, description, quantity, priority, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [data.friend_id, data.location_id, data.run_id, data.category, data.item_name, data.description, data.quantity, data.priority, data.status, data.notes]);

  return result.rows[0];
}