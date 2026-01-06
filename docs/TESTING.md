# Testing Strategy & Framework

## Testing Pyramid

```
    /\     E2E Tests (Playwright)
   /  \    - User flows
  /____\   - Cross-browser testing
 /      \  
/________\  Integration Tests (Jest + Supertest)
          \ - API endpoint testing
           \- Database interaction testing
            
Unit Tests (Jest + Mock dependencies)
- Service layer business logic
- Utility functions  
- Permission logic
```

## Test Framework Stack

### Backend Testing
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP endpoint testing
- **Test Containers**: Isolated database testing
- **MSW**: Mock external APIs

### Frontend Testing  
- **Jest**: Unit tests
- **React Testing Library**: Component testing
- **MSW**: Mock API responses
- **Playwright**: E2E testing

## Test Structure

### Directory Layout
```
/tests
├── unit/           # Pure unit tests
│   ├── services/   # Service layer tests
│   ├── utils/      # Utility function tests
│   └── components/ # React component tests
├── integration/    # API + Database tests
│   ├── auth/       # Authentication flows
│   ├── permissions/# Permission system tests
│   └── api/        # Endpoint tests
└── e2e/           # End-to-end tests
    ├── login/      # Login flows
    ├── delivery/   # Delivery workflows
    └── admin/      # Admin functions
```

### Naming Convention
- Unit tests: `*.test.js`
- Integration tests: `*.integration.test.js`  
- E2E tests: `*.e2e.test.js`

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.integration.test.js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {}
};
```

### Test Database Setup
```javascript
// tests/setup.js
import { testDb } from './utils/testDatabase.js';

beforeAll(async () => {
  await testDb.start();
});

afterAll(async () => {
  await testDb.stop();
});

beforeEach(async () => {
  await testDb.reset();
});
```

## Test Examples

### Unit Test Example
```javascript
// tests/unit/services/permissionService.test.js
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import PermissionService from '../../../services/permissionService.js';

describe('PermissionService', () => {
  let permissionService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };
    permissionService = new PermissionService(mockDb);
  });

  describe('hasPermission', () => {
    it('should return true when user has exact permission', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { resource: 'friends', action: 'read' },
          { resource: 'users', action: 'read' }
        ]
      });

      // Act
      const result = await permissionService.hasPermission(1, 'friends', 'read');

      // Assert
      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT p.resource, p.action'),
        [1]
      );
    });

    it('should return true when user has manage permission for resource', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({
        rows: [{ resource: 'friends', action: 'manage' }]
      });

      // Act
      const result = await permissionService.hasPermission(1, 'friends', 'read');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({
        rows: [{ resource: 'users', action: 'read' }]
      });

      // Act
      const result = await permissionService.hasPermission(1, 'friends', 'write');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('grantPermission', () => {
    it('should grant permission to user', async () => {
      // Arrange
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // permission lookup
        .mockResolvedValueOnce({ rows: [] }); // grant permission

      // Act
      await permissionService.grantPermission(1, 'friends', 'write', 2);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenLastCalledWith(
        expect.stringContaining('INSERT INTO user_permissions'),
        [1, 5, 2]
      );
    });

    it('should throw error for non-existent permission', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(
        permissionService.grantPermission(1, 'invalid', 'action', 2)
      ).rejects.toThrow('Permission invalid:action does not exist');
    });
  });
});
```

### Integration Test Example
```javascript
// tests/integration/api/friends.integration.test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../index.js';
import { testDb } from '../../utils/testDatabase.js';
import { createTestUser, getAuthToken } from '../../utils/testHelpers.js';

describe('Friends API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await testDb.seed('basic'); // Load basic test data
    testUser = await createTestUser('coordinator');
    authToken = await getAuthToken(testUser);
  });

  describe('GET /api/friends', () => {
    it('should return friends list for authenticated user with permission', async () => {
      const response = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify data structure
      const friend = response.body.data[0];
      expect(friend).toHaveProperty('id');
      expect(friend).toHaveProperty('name');
      expect(friend).toHaveProperty('currentLocationId');
      expect(friend).not.toHaveProperty('current_location_id'); // Ensure transformation
    });

    it('should return 403 for user without friends:read permission', async () => {
      const volunteerUser = await createTestUser('volunteer', { customPermissions: [] });
      const volunteerToken = await getAuthToken(volunteerUser);

      const response = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/friends')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /api/friends', () => {
    it('should create new friend with valid data', async () => {
      const friendData = {
        name: 'John Doe',
        email: 'john@example.com',
        currentLocationId: 1,
        notes: 'Prefers evening deliveries'
      };

      const response = await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${authToken}`)
        .send(friendData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(friendData.name);
      expect(response.body.data.email).toBe(friendData.email);
      expect(response.body.data.id).toBeDefined();

      // Verify friend was actually created in database
      const dbFriend = await testDb.query(
        'SELECT * FROM friends WHERE id = $1',
        [response.body.data.id]
      );
      expect(dbFriend.rows.length).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.field).toBe('name');
    });
  });
});
```

### E2E Test Example
```javascript
// tests/e2e/delivery-workflow.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('Delivery Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database and seed test data
    await page.goto('/test-utils/reset-db');
    await page.goto('/login');
  });

  test('coordinator can create and assign delivery run', async ({ page }) => {
    // Login as coordinator
    await page.fill('[data-testid="email-input"]', 'john@friendsoutreach.org');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Navigate to runs section
    await page.click('[data-testid="nav-runs"]');
    await expect(page.locator('[data-testid="runs-list"]')).toBeVisible();

    // Create new run
    await page.click('[data-testid="add-run-button"]');
    await page.fill('[data-testid="run-name"]', 'Downtown Delivery - Test');
    await page.selectOption('[data-testid="route-select"]', '1');
    await page.fill('[data-testid="scheduled-date"]', '2025-10-20');
    await page.click('[data-testid="save-run-button"]');

    // Verify run was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Downtown Delivery - Test')).toBeVisible();

    // Assign team member
    await page.click('[data-testid="run-item"]:has-text("Downtown Delivery - Test")');
    await page.click('[data-testid="add-team-member"]');
    await page.selectOption('[data-testid="user-select"]', 'sarah@friendsoutreach.org');
    await page.click('[data-testid="assign-user"]');

    // Verify team member was assigned
    await expect(page.locator('text=Sarah Wilson')).toBeVisible();
  });

  test('volunteer can update delivery status', async ({ page }) => {
    // Login as volunteer
    await page.fill('[data-testid="email-input"]', 'sarah@friendsoutreach.org');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Navigate to assigned run
    await page.click('[data-testid="nav-runs"]');
    await page.click('[data-testid="run-item"]:first-child');

    // Update delivery status
    await page.click('[data-testid="request-item"]:first-child [data-testid="status-button"]');
    await page.click('[data-testid="status-delivered"]');

    // Verify status update
    await expect(page.locator('[data-testid="request-item"]:first-child [data-testid="status-badge"]')).toHaveText('Delivered');
  });

  test('admin can view delivery reports', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@friendsoutreach.org');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Navigate to reports (only visible to admin)
    await page.click('[data-testid="nav-reports"]');
    await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible();

    // Verify report data
    await expect(page.locator('[data-testid="total-deliveries"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="active-volunteers"]')).toContainText(/\d+/);
  });
});
```

## Test Utilities

### Test Database Helper
```javascript
// tests/utils/testDatabase.js
import { Pool } from 'pg';
import fs from 'fs/promises';

class TestDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      ssl: false
    });
  }

  async start() {
    await this.pool.query('SELECT 1'); // Test connection
    console.log('Test database connected');
  }

  async stop() {
    await this.pool.end();
  }

  async reset() {
    // Drop and recreate schema
    const schema = await fs.readFile('./schema.sql', 'utf8');
    await this.pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await this.pool.query(schema);
  }

  async seed(seedType = 'basic') {
    const seedData = await fs.readFile(`./tests/fixtures/${seedType}.sql`, 'utf8');
    await this.pool.query(seedData);
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }
}

export const testDb = new TestDatabase();
```

### Test Helpers
```javascript
// tests/utils/testHelpers.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { testDb } from './testDatabase.js';

export async function createTestUser(role = 'volunteer', options = {}) {
  const userData = {
    username: `test-${role}-${Date.now()}`,
    email: `test-${role}-${Date.now()}@example.com`,
    name: `Test ${role}`,
    role,
    password_hash: await bcrypt.hash('password', 10),
    ...options.userData
  };

  const result = await testDb.query(`
    INSERT INTO users (username, email, name, role, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, name, role
  `, [userData.username, userData.email, userData.name, userData.role, userData.password_hash]);

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
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

export async function grantTestPermission(userId, resource, action) {
  const permissionResult = await testDb.query(
    'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
    [resource, action]
  );

  if (permissionResult.rows.length > 0) {
    await testDb.query(`
      INSERT INTO user_permissions (user_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `, [userId, permissionResult.rows[0].id]);
  }
}
```

## Running Tests

### NPM Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### GitHub Actions CI
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: friends_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
        env:
          TEST_DATABASE_URL: postgres://postgres:test@localhost:5432/friends_test
      - run: npm run test:e2e
```

## TDD Workflow

1. **Write failing test** describing expected behavior
2. **Write minimal code** to make test pass
3. **Refactor** while keeping tests green
4. **Add integration test** for API endpoint
5. **Add E2E test** for user workflow

This comprehensive testing setup will give you confidence during the AI-assisted refactoring process and ensure quality throughout the migration.