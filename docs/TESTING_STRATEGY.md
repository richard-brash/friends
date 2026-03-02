# Testing Strategy - Friends Outreach CRM V2

**Last Updated:** January 9, 2026  
**Status:** Phase 2 - Architecture Design

---

## Testing Philosophy

1. **Test Pyramid** - More unit tests, fewer integration tests, minimal e2e tests
2. **Test Behavior, Not Implementation** - Focus on user-facing behavior
3. **Fail Fast** - Tests should run quickly and catch issues early
4. **Maintainable Tests** - Tests are code, keep them DRY and readable
5. **Coverage Goals** - 70% minimum, 80% target for business logic

---

## Testing Levels

### Unit Tests (70% of test suite)

**Purpose:** Test individual functions, components, and modules in isolation

**Scope:**
- Service functions (business logic)
- Repository functions (data access)
- Utility functions
- React components (rendering, props, events)
- Validation functions
- State management

**Tools:**
- **Framework:** Vitest
- **React Testing:** @testing-library/react
- **Assertions:** Vitest assertions + @testing-library/jest-dom
- **Mocking:** Vitest mocks

**Coverage Target:** 80% for business logic, 70% overall

---

### Integration Tests (25% of test suite)

**Purpose:** Test interactions between components and APIs

**Scope:**
- API endpoints (request/response)
- Database operations (queries, constraints)
- Service + repository integration
- Component + API integration
- Form submission workflows
- Authentication flow

**Tools:**
- **Backend:** Vitest + Supertest
- **Database:** Test database (PostgreSQL)
- **Frontend:** @testing-library/react + MSW (Mock Service Worker)

**Coverage Target:** 70% for critical paths

---

### End-to-End Tests (5% of test suite)

**Purpose:** Test complete user workflows in real environment

**Scope:**
- Critical user journeys
- Authentication flow
- Request lifecycle (create → deliver)
- Run execution (prepare → complete)
- Cross-browser compatibility

**Tools:**
- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit (Safari)
- **Test Database:** Separate e2e database

**Coverage Target:** All critical paths, 1-2 tests per persona workflow

---

## Backend Testing

### Unit Tests - Services

**Test File:** `services/cleanRunService.test.js`

**Test Cases:**
```javascript
describe('CleanRunService', () => {
  describe('create', () => {
    it('generates auto name from route and date', async () => {
      const mockRoute = { id: 1, name: 'Downtown' };
      const mockRepo = {
        getRouteById: vi.fn().resolves(mockRoute),
        create: vi.fn().resolves({ id: 1, name: 'Downtown Monday 2026-01-13' })
      };
      
      const service = new CleanRunService(mockRepo);
      const result = await service.create({
        routeId: 1,
        scheduledDate: '2026-01-13'
      });
      
      expect(result.name).toBe('Downtown Monday 2026-01-13');
    });
    
    it('throws ValidationError if route not found', async () => {
      const mockRepo = {
        getRouteById: vi.fn().resolves(null)
      };
      
      const service = new CleanRunService(mockRepo);
      
      await expect(
        service.create({ routeId: 999, scheduledDate: '2026-01-13' })
      ).rejects.toThrow('Route not found');
    });
    
    it('validates meal count is positive', async () => {
      const service = new CleanRunService(mockRepo);
      
      await expect(
        service.create({ routeId: 1, scheduledDate: '2026-01-13', mealCount: -5 })
      ).rejects.toThrow('Meal count must be positive');
    });
  });
  
  describe('startRun', () => {
    it('changes status to in_progress', async () => {
      const mockRun = { id: 1, status: 'planned', routeId: 1 };
      const mockLocations = [{ id: 1, routeOrder: 1 }];
      const mockRepo = {
        getById: vi.fn().resolves(mockRun),
        getLocationsByRoute: vi.fn().resolves(mockLocations),
        update: vi.fn().resolves({ ...mockRun, status: 'in_progress' })
      };
      
      const service = new CleanRunService(mockRepo);
      const result = await service.startRun(1);
      
      expect(result.status).toBe('in_progress');
      expect(mockRepo.update).toHaveBeenCalledWith(1, {
        status: 'in_progress',
        currentLocationId: 1
      });
    });
    
    it('throws if run not in planned status', async () => {
      const mockRepo = {
        getById: vi.fn().resolves({ id: 1, status: 'completed' })
      };
      
      const service = new CleanRunService(mockRepo);
      
      await expect(service.startRun(1)).rejects.toThrow('Run cannot be started');
    });
  });
});
```

---

### Unit Tests - Repositories

**Test File:** `repositories/runRepository.test.js`

**Test Cases:**
```javascript
describe('RunRepository', () => {
  let db;
  
  beforeEach(async () => {
    // Setup test database with clean state
    db = await setupTestDatabase();
    await db.migrate.latest();
  });
  
  afterEach(async () => {
    await db.destroy();
  });
  
  describe('create', () => {
    it('inserts run with generated name', async () => {
      const repo = new RunRepository(db);
      
      const run = await repo.create({
        routeId: 1,
        name: 'Downtown Monday 2026-01-13',
        scheduledDate: '2026-01-13',
        status: 'planned'
      });
      
      expect(run.id).toBeDefined();
      expect(run.name).toBe('Downtown Monday 2026-01-13');
      expect(run.status).toBe('planned');
    });
    
    it('enforces foreign key constraint on routeId', async () => {
      const repo = new RunRepository(db);
      
      await expect(
        repo.create({ routeId: 999, name: 'Test', scheduledDate: '2026-01-13' })
      ).rejects.toThrow(/foreign key constraint/);
    });
  });
  
  describe('getById', () => {
    it('returns run with team members', async () => {
      const repo = new RunRepository(db);
      
      // Setup: create run with team
      const run = await repo.create({ routeId: 1, name: 'Test Run' });
      await repo.addTeamMember(run.id, 1);
      await repo.addTeamMember(run.id, 2);
      
      const result = await repo.getById(run.id);
      
      expect(result.team).toHaveLength(2);
      expect(result.team[0].userId).toBe(1);
    });
    
    it('returns null if run not found', async () => {
      const repo = new RunRepository(db);
      const result = await repo.getById(999);
      expect(result).toBeNull();
    });
  });
});
```

---

### Integration Tests - API Endpoints

**Test File:** `routes/v2/runs.test.js`

**Test Cases:**
```javascript
describe('POST /api/v2/runs', () => {
  let app;
  let authToken;
  
  beforeEach(async () => {
    app = await setupTestApp();
    authToken = await getTestAuthToken(app);
  });
  
  it('creates run with auto-generated name', async () => {
    const response = await request(app)
      .post('/api/v2/runs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        routeId: 1,
        scheduledDate: '2026-01-20',
        mealCount: 30
      })
      .expect(201);
    
    expect(response.body.name).toMatch(/Downtown (Monday|Tuesday|Wednesday)/);
    expect(response.body.status).toBe('planned');
    expect(response.body.mealCount).toBe(30);
  });
  
  it('returns 400 if routeId missing', async () => {
    const response = await request(app)
      .post('/api/v2/runs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scheduledDate: '2026-01-20'
      })
      .expect(400);
    
    expect(response.body.error.details).toContainEqual({
      field: 'routeId',
      message: 'Route ID is required'
    });
  });
  
  it('returns 401 if not authenticated', async () => {
    await request(app)
      .post('/api/v2/runs')
      .send({ routeId: 1, scheduledDate: '2026-01-20' })
      .expect(401);
  });
  
  it('returns 404 if route does not exist', async () => {
    await request(app)
      .post('/api/v2/runs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ routeId: 999, scheduledDate: '2026-01-20' })
      .expect(404);
  });
});

describe('POST /api/v2/runs/:id/start', () => {
  it('starts run and sets current location', async () => {
    // Setup: create run
    const createResponse = await request(app)
      .post('/api/v2/runs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ routeId: 1, scheduledDate: '2026-01-20', mealCount: 25 })
      .expect(201);
    
    const runId = createResponse.body.id;
    
    // Action: start run
    const response = await request(app)
      .post(`/api/v2/runs/${runId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.status).toBe('in_progress');
    expect(response.body.currentLocation).toBeDefined();
    expect(response.body.currentLocation.routeOrder).toBe(1);
  });
  
  it('returns 400 if run already started', async () => {
    const runId = await createAndStartRun();
    
    await request(app)
      .post(`/api/v2/runs/${runId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
  });
});
```

---

### Integration Tests - Database Constraints

**Test File:** `tests/integration/database-constraints.test.js`

**Test Cases:**
```javascript
describe('Database Constraints', () => {
  let db;
  
  beforeEach(async () => {
    db = await setupTestDatabase();
  });
  
  describe('friends table', () => {
    it('enforces at least one name field', async () => {
      await expect(
        db('friends').insert({
          phone: '+15555550001',
          status: 'active'
        })
      ).rejects.toThrow(/friends_name_required/);
    });
    
    it('accepts friend with only firstName', async () => {
      const [id] = await db('friends')
        .insert({ firstName: 'John', status: 'active' })
        .returning('id');
      
      expect(id).toBeDefined();
    });
    
    it('validates phone format', async () => {
      await expect(
        db('friends').insert({
          firstName: 'John',
          phone: 'invalid-phone',
          status: 'active'
        })
      ).rejects.toThrow(/friends_phone_format/);
    });
  });
  
  describe('locations table', () => {
    it('enforces unique route_order per route', async () => {
      await db('locations').insert({
        name: 'Location 1',
        routeId: 1,
        routeOrder: 1
      });
      
      await expect(
        db('locations').insert({
          name: 'Location 2',
          routeId: 1,
          routeOrder: 1
        })
      ).rejects.toThrow(/unique constraint/);
    });
    
    it('allows same route_order on different routes', async () => {
      await db('locations').insert({
        name: 'Location 1',
        routeId: 1,
        routeOrder: 1
      });
      
      const [id] = await db('locations')
        .insert({
          name: 'Location 2',
          routeId: 2,
          routeOrder: 1
        })
        .returning('id');
      
      expect(id).toBeDefined();
    });
  });
  
  describe('requests table', () => {
    it('prevents deletion of location with requests', async () => {
      await db('requests').insert({
        friendId: 1,
        locationId: 1,
        itemDescription: 'Test item',
        status: 'pending'
      });
      
      await expect(
        db('locations').where({ id: 1 }).delete()
      ).rejects.toThrow(/foreign key constraint/);
    });
  });
});
```

---

## Frontend Testing

### Unit Tests - Components

**Test File:** `components/shared/StatusBadge.test.tsx`

**Test Cases:**
```typescript
describe('StatusBadge', () => {
  it('renders pending status with orange color', () => {
    render(<StatusBadge status="pending" />);
    
    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-pending');
  });
  
  it('renders delivered status with green color', () => {
    render(<StatusBadge status="delivered" />);
    
    const badge = screen.getByText('Delivered');
    expect(badge).toHaveClass('status-delivered');
  });
  
  it('shows icon when showIcon is true', () => {
    render(<StatusBadge status="delivered" showIcon />);
    
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
  });
  
  it('applies correct size class', () => {
    const { container } = render(<StatusBadge status="pending" size="small" />);
    
    expect(container.firstChild).toHaveClass('size-small');
  });
});
```

**Test File:** `components/shared/CounterControl.test.tsx`

**Test Cases:**
```typescript
describe('CounterControl', () => {
  it('renders initial value', () => {
    render(<CounterControl value={5} onChange={vi.fn()} label="Meals" />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Meals')).toBeInTheDocument();
  });
  
  it('calls onChange with incremented value when + clicked', () => {
    const handleChange = vi.fn();
    render(<CounterControl value={5} onChange={handleChange} />);
    
    const incrementButton = screen.getByLabelText('Increment');
    fireEvent.click(incrementButton);
    
    expect(handleChange).toHaveBeenCalledWith(6);
  });
  
  it('calls onChange with decremented value when - clicked', () => {
    const handleChange = vi.fn();
    render(<CounterControl value={5} onChange={handleChange} />);
    
    const decrementButton = screen.getByLabelText('Decrement');
    fireEvent.click(decrementButton);
    
    expect(handleChange).toHaveBeenCalledWith(4);
  });
  
  it('disables decrement button at min value', () => {
    render(<CounterControl value={0} onChange={vi.fn()} min={0} />);
    
    const decrementButton = screen.getByLabelText('Decrement');
    expect(decrementButton).toBeDisabled();
  });
  
  it('disables increment button at max value', () => {
    render(<CounterControl value={10} onChange={vi.fn()} max={10} />);
    
    const incrementButton = screen.getByLabelText('Increment');
    expect(incrementButton).toBeDisabled();
  });
});
```

---

### Integration Tests - Forms with API

**Test File:** `components/forms/CreateRequestForm.test.tsx`

**Test Cases:**
```typescript
describe('CreateRequestForm', () => {
  beforeEach(() => {
    // Mock API responses
    server.use(
      rest.get('/api/v2/friends', (req, res, ctx) => {
        return res(ctx.json({
          data: [
            { id: 1, firstName: 'John', lastName: 'Smith' }
          ]
        }));
      }),
      rest.get('/api/v2/locations', (req, res, ctx) => {
        return res(ctx.json({
          data: [
            { id: 1, name: 'Park & Lexington', routeId: 1 }
          ]
        }));
      }),
      rest.post('/api/v2/requests', (req, res, ctx) => {
        return res(ctx.status(201), ctx.json({
          id: 1,
          friendId: 1,
          locationId: 1,
          itemDescription: 'Winter coat',
          status: 'pending'
        }));
      })
    );
  });
  
  it('submits form with valid data', async () => {
    const handleSuccess = vi.fn();
    render(<CreateRequestForm onSuccess={handleSuccess} />);
    
    // Select friend
    const friendSelect = screen.getByLabelText('Friend');
    await userEvent.click(friendSelect);
    await userEvent.click(screen.getByText('John Smith'));
    
    // Select location
    const locationSelect = screen.getByLabelText('Location');
    await userEvent.click(locationSelect);
    await userEvent.click(screen.getByText('Park & Lexington'));
    
    // Enter item description
    const itemInput = screen.getByLabelText('Item Description');
    await userEvent.type(itemInput, 'Winter coat');
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
  
  it('shows validation error if required fields missing', async () => {
    render(<CreateRequestForm onSuccess={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);
    
    expect(await screen.findByText('Friend is required')).toBeInTheDocument();
    expect(await screen.findByText('Location is required')).toBeInTheDocument();
  });
  
  it('shows API error message on failure', async () => {
    server.use(
      rest.post('/api/v2/requests', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: { message: 'Friend not found' } })
        );
      })
    );
    
    render(<CreateRequestForm onSuccess={vi.fn()} />);
    
    // Fill and submit form
    await fillFormWithValidData();
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);
    
    expect(await screen.findByText('Friend not found')).toBeInTheDocument();
  });
});
```

---

### Integration Tests - Authentication Flow

**Test File:** `tests/integration/auth-flow.test.tsx`

**Test Cases:**
```typescript
describe('Authentication Flow', () => {
  it('redirects to login if not authenticated', async () => {
    render(
      <Router>
        <App />
      </Router>
    );
    
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });
  
  it('allows login with valid credentials', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(ctx.json({
          token: 'test-token',
          user: { id: 1, name: 'Jane Doe', email: 'jane@example.com' }
        }));
      })
    );
    
    render(<LoginScreen />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('test-token');
      expect(window.location.pathname).toBe('/');
    });
  });
  
  it('shows error message for invalid credentials', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ error: { message: 'Invalid credentials' } })
        );
      })
    );
    
    render(<LoginScreen />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
  
  it('includes auth token in subsequent API requests', async () => {
    const mockToken = 'test-token-123';
    localStorage.setItem('authToken', mockToken);
    
    let capturedHeaders;
    server.use(
      rest.get('/api/v2/runs', (req, res, ctx) => {
        capturedHeaders = req.headers;
        return res(ctx.json({ data: [] }));
      })
    );
    
    render(<RunsListScreen />);
    
    await waitFor(() => {
      expect(capturedHeaders.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });
  });
});
```

---

## End-to-End Tests

### E2E Test Setup

**File:** `e2e/setup.ts`

```typescript
import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    await use(page);
  },
});

export { expect };
```

---

### E2E Tests - Request Lifecycle

**File:** `e2e/request-lifecycle.spec.ts`

**Test Cases:**
```typescript
import { test, expect } from './setup';

test.describe('Request Lifecycle', () => {
  test('complete request workflow from creation to delivery', async ({ authenticatedPage: page }) => {
    // 1. Create request
    await page.goto('/requests');
    await page.click('button:has-text("New Request")');
    
    await page.fill('input[name="friend"]', 'Maria');
    await page.click('li:has-text("Maria Garcia")');
    
    await page.fill('input[name="location"]', 'Park');
    await page.click('li:has-text("Park & Lexington")');
    
    await page.fill('input[name="itemDescription"]', 'Winter coat size L');
    await page.selectOption('select[name="priority"]', 'high');
    
    await page.click('button:has-text("Create Request")');
    
    // Verify request appears in list
    await expect(page.locator('text=Winter coat size L')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    
    // 2. Mark ready for delivery
    await page.click('text=Winter coat size L');
    await page.click('button:has-text("Mark Ready")');
    await page.fill('textarea[name="notes"]', 'Item pulled from warehouse');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Ready for Delivery')).toBeVisible();
    
    // 3. Create and prepare run
    await page.goto('/runs');
    await page.click('button:has-text("New Run")');
    
    await page.selectOption('select[name="routeId"]', '1'); // Downtown
    await page.fill('input[name="scheduledDate"]', '2026-01-20');
    await page.fill('input[name="mealCount"]', '25');
    
    await page.click('button:has-text("Create Run")');
    
    // Open preparation screen
    await page.click('text=Downtown Monday 2026-01-20');
    await page.click('button:has-text("Prepare Run")');
    
    // Verify request appears in checklist
    await expect(page.locator('text=Winter coat size L')).toBeVisible();
    
    // Check off the request
    await page.click('input[type="checkbox"]:near(:text("Winter coat size L"))');
    
    // Verify status changed to "taken"
    await page.goto('/requests');
    await page.click('text=Winter coat size L');
    await expect(page.locator('text=Taken')).toBeVisible();
    
    // 4. Start run and deliver
    await page.goto('/runs');
    await page.click('text=Downtown Monday 2026-01-20');
    await page.click('button:has-text("Start Run")');
    await page.click('button:has-text("Confirm")');
    
    // Navigate to location with request
    while (!(await page.locator('text=Park & Lexington').isVisible())) {
      await page.click('button:has-text("Next Stop")');
    }
    
    // Deliver request
    await page.click('text=Winter coat size L');
    await page.click('button:has-text("Delivered")');
    
    // 5. Verify final status
    await page.goto('/requests');
    await page.click('text=Winter coat size L');
    
    await expect(page.locator('text=Delivered')).toBeVisible();
    
    // Verify history shows all transitions
    const historyItems = page.locator('.timeline-item');
    await expect(historyItems).toHaveCount(4); // pending → ready → taken → delivered
  });
});
```

---

### E2E Tests - Run Execution

**File:** `e2e/run-execution.spec.ts`

**Test Cases:**
```typescript
import { test, expect } from './setup';

test.describe('Run Execution', () => {
  test('complete run from start to finish', async ({ authenticatedPage: page }) => {
    // Setup: Create run
    await page.goto('/runs');
    await page.click('button:has-text("New Run")');
    await page.selectOption('select[name="routeId"]', '1');
    await page.fill('input[name="scheduledDate"]', '2026-01-20');
    await page.fill('input[name="mealCount"]', '25');
    await page.click('button:has-text("Create Run")');
    
    // Start run
    await page.click('text=Downtown Monday 2026-01-20');
    await page.click('button:has-text("Start Run")');
    await page.click('button:has-text("Confirm")');
    
    // Verify on first stop
    await expect(page.locator('text=Stop 1 of 8')).toBeVisible();
    
    // Record meals delivered
    await page.click('button[aria-label="Increment"]');
    await page.click('button[aria-label="Increment"]');
    await page.click('button[aria-label="Increment"]');
    
    await expect(page.locator('text=3 Meals')).toBeVisible();
    
    // Spot a friend
    await page.click('text=John Smith');
    await page.click('button:has-text("Spot")');
    
    await expect(page.locator('text=Spotted')).toBeVisible();
    
    // Move to next stop
    await page.click('button:has-text("Next Stop")');
    
    // Verify on second stop
    await expect(page.locator('text=Stop 2 of 8')).toBeVisible();
    
    // Navigate through all stops
    for (let i = 2; i < 8; i++) {
      await page.click('button[aria-label="Increment"]'); // Add 1 meal
      await page.click('button:has-text("Next Stop")');
    }
    
    // At last stop
    await expect(page.locator('text=Stop 8 of 8')).toBeVisible();
    
    // Complete run
    await page.click('button:has-text("Complete Run")');
    
    // Verify summary
    await expect(page.locator('text=8 stops completed')).toBeVisible();
    await expect(page.locator('text=11 meals delivered')).toBeVisible(); // 3 + 1*7
    
    await page.click('button:has-text("Finish")');
    
    // Verify run status
    await expect(page.locator('text=Completed')).toBeVisible();
  });
  
  test('can go back to previous stop', async ({ authenticatedPage: page }) => {
    // Setup and start run
    await createAndStartRun(page);
    
    // Move forward
    await page.click('button:has-text("Next Stop")');
    await expect(page.locator('text=Stop 2 of 8')).toBeVisible();
    
    // Go back
    await page.click('button:has-text("Previous Stop")');
    await expect(page.locator('text=Stop 1 of 8')).toBeVisible();
  });
});
```

---

### E2E Tests - Cross-Browser

**File:** `e2e/cross-browser.spec.ts`

**Test Cases:**
```typescript
import { test, expect, devices } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browserName => {
  test.describe(`${browserName} compatibility`, () => {
    test.use({ 
      browserName,
      ...devices['iPhone 12'] // Test mobile view
    });
    
    test('login and basic navigation works', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/');
      
      // Test bottom navigation
      await page.click('text=Requests');
      await expect(page).toHaveURL(/\/requests/);
      
      await page.click('text=Friends');
      await expect(page).toHaveURL(/\/friends/);
      
      await page.click('text=Runs');
      await expect(page).toHaveURL(/\/runs/);
    });
  });
});
```

---

## Test Data Management

### Test Database Setup

**File:** `tests/setup/database.js`

```javascript
export async function setupTestDatabase() {
  const config = {
    client: 'postgresql',
    connection: process.env.TEST_DATABASE_URL,
    pool: { min: 0, max: 5 }
  };
  
  const db = knex(config);
  
  // Clean database
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');
  
  // Run migrations
  await db.migrate.latest();
  
  // Seed test data
  await seedTestData(db);
  
  return db;
}

export async function seedTestData(db) {
  // Create test users
  await db('users').insert([
    {
      id: 1,
      email: 'test@example.com',
      password_hash: await bcrypt.hash('testpass123', 10),
      name: 'Test User',
      is_active: true
    },
    {
      id: 2,
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('adminpass', 10),
      name: 'Admin User',
      is_active: true
    }
  ]);
  
  // Create test routes
  await db('routes').insert([
    { id: 1, name: 'Downtown', is_active: true },
    { id: 2, name: 'Westside', is_active: true }
  ]);
  
  // Create test locations
  await db('locations').insert([
    { id: 1, name: 'City Hall Plaza', route_id: 1, route_order: 1 },
    { id: 2, name: 'Park & Lexington', route_id: 1, route_order: 2 },
    // ... more locations
  ]);
  
  // Create test friends
  await db('friends').insert([
    { id: 1, first_name: 'John', last_name: 'Smith', status: 'active' },
    { id: 2, first_name: 'Maria', last_name: 'Garcia', status: 'active' },
    // ... more friends
  ]);
}
```

---

### Test Fixtures

**File:** `tests/fixtures/runs.js`

```javascript
export const createTestRun = async (db, overrides = {}) => {
  const [run] = await db('runs')
    .insert({
      route_id: 1,
      name: 'Test Run Monday 2026-01-20',
      scheduled_date: '2026-01-20',
      status: 'planned',
      meal_count: 25,
      ...overrides
    })
    .returning('*');
  
  return run;
};

export const createRunWithTeam = async (db, userIds) => {
  const run = await createTestRun(db);
  
  for (const userId of userIds) {
    await db('run_team_members').insert({
      run_id: run.id,
      user_id: userId
    });
  }
  
  return run;
};

export const createInProgressRun = async (db) => {
  const run = await createTestRun(db, {
    status: 'in_progress',
    current_location_id: 1
  });
  
  return run;
};
```

---

## Continuous Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Run migrations
        run: npm run migrate:test
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
      
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend
      
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Run tests
        run: npm run test
        working-directory: ./frontend
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: e2e_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Start backend
        run: npm run start:test &
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/e2e_db
      
      - name: Start frontend
        run: npm run dev &
        working-directory: ./frontend
      
      - name: Wait for services
        run: npx wait-on http://localhost:3000 http://localhost:5000
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Code Coverage

### Coverage Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
});
```

### Coverage Reports

**Generate reports:**
```bash
# Backend
npm run test:coverage

# Frontend
npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## Performance Testing

### Load Testing

**File:** `tests/load/run-execution.js` (using k6)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const authToken = 'test-token';
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // Get runs list
  let res = http.get('http://localhost:3000/api/v2/runs', { headers });
  check(res, { 'runs list status 200': (r) => r.status === 200 });
  
  // Get run details
  res = http.get('http://localhost:3000/api/v2/runs/1', { headers });
  check(res, { 'run details status 200': (r) => r.status === 200 });
  
  sleep(1);
}
```

---

## Testing Best Practices

### 1. Test Naming

**Pattern:** `it('should [expected behavior] when [condition]')`

**Examples:**
```javascript
it('should return 400 when route ID is missing')
it('should create run with auto-generated name when valid data provided')
it('should disable decrement button when value is at minimum')
```

### 2. Arrange-Act-Assert (AAA)

```javascript
it('marks request as delivered', async () => {
  // Arrange
  const request = await createTestRequest({ status: 'taken' });
  
  // Act
  const result = await service.updateStatus(request.id, 'delivered');
  
  // Assert
  expect(result.status).toBe('delivered');
  expect(result.deliveredAt).toBeDefined();
});
```

### 3. Test Independence

- Each test should be independent
- Don't rely on test execution order
- Clean up after each test

```javascript
afterEach(async () => {
  await db('runs').delete();
  await db('requests').delete();
});
```

### 4. Avoid Implementation Details

**Bad:**
```javascript
it('calls setState with new value', () => {
  // Testing implementation
});
```

**Good:**
```javascript
it('displays updated meal count after increment', () => {
  // Testing behavior
});
```

---

## Phase 2 Complete! ✅

All Phase 2 deliverables complete:
- ✅ [DATA_MODEL.md](docs/DATA_MODEL.md) - Database schema with constraints
- ✅ [API_SPECIFICATION.md](docs/API_SPECIFICATION.md) - REST API endpoints
- ✅ [COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) - UI component design
- ✅ [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Comprehensive testing approach

**Ready to begin Phase 3: Implementation**
