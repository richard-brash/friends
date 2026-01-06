# Data Standards & Architecture

## Field Naming Convention

### Standard: Database `snake_case` → API `camelCase`

- **Database**: Use PostgreSQL native `snake_case` (e.g., `created_at`, `user_id`, `scheduled_date`)
- **API Layer**: Transform to JavaScript native `camelCase` (e.g., `createdAt`, `userId`, `scheduledDate`)
- **Frontend**: Consume `camelCase` from API

### Transformation Layer

**Single Point of Truth**: All data transformation happens at the service layer boundary, not in routes or components.

```javascript
// ❌ Bad: Multiple transformation points
// In route: response.data.created_at → createdAt
// In service: scheduled_date + 'T' + start_time
// In component: new Date(run.scheduledDate)

// ✅ Good: Single transformation in service
class RunService {
  transformRunData(dbRow) {
    return {
      id: dbRow.id,
      routeId: dbRow.route_id,
      name: dbRow.name,
      scheduledDate: new Date(`${dbRow.scheduled_date}T${dbRow.start_time || '09:00:00'}`).toISOString(),
      status: dbRow.status,
      createdAt: dbRow.created_at.toISOString(),
      // ... consistent transformation
    };
  }
}
```

## Data Type Standards

### Dates & Times
- **Database**: `DATE` for dates, `TIME` for times, `TIMESTAMP` for full datetime
- **API**: Always return ISO 8601 strings (`2025-10-16T14:30:00.000Z`)
- **Frontend**: Parse with `new Date()` or date-fns

### IDs
- **Database**: `SERIAL PRIMARY KEY` (integer auto-increment)
- **API**: Return as numbers, not strings
- **Frontend**: Handle as numbers

### Enums
- **Database**: `CHECK` constraints with string values
- **API**: Return exact enum strings
- **Frontend**: Use TypeScript enums or const objects

## Entity Relationships

### Core Entities
```
User (authentication, roles, permissions)
├── Run (scheduled delivery)
│   ├── Route (path with ordered locations)
│   ├── Team Members (users assigned to run)
│   └── Requests (delivery items)
├── Friend (delivery recipient)
│   ├── Current Location
│   └── Location History
├── Location (delivery stops)
└── Request (items to deliver)
    ├── Friend (who requested)
    ├── Location (where to deliver)
    └── Run (when to deliver)
```

### Foreign Key Standards
- Always use descriptive names: `user_id`, `route_id`, `location_id`
- Always include ON DELETE CASCADE/SET NULL appropriately
- Always add indexes for foreign keys

## API Response Standards

### Success Response Format
```javascript
{
  success: true,
  data: {}, // Single entity or array
  meta?: {  // Optional metadata
    total: 156,
    page: 1,
    limit: 50
  }
}
```

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR', // Machine readable
    message: 'User friendly message', // Human readable
    details?: {}, // Additional context
    field?: 'email' // For validation errors
  }
}
```

### Pagination Standards
- Query params: `?page=1&limit=50&sort=createdAt&order=desc`
- Always include total count in meta
- Default limit: 50, max limit: 200

## Service Layer Standards

### Service Class Structure
```javascript
class EntityService {
  // Constructor with dependency injection
  constructor(database, logger, validator) {
    this.db = database;
    this.logger = logger;
    this.validator = validator;
  }

  // Standard CRUD methods
  async getAll(filters = {}) { /* ... */ }
  async getById(id) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }

  // Business logic methods
  async customBusinessMethod() { /* ... */ }

  // Private transformation methods
  #transformFromDb(dbRow) { /* ... */ }
  #transformToDb(apiData) { /* ... */ }
}
```

### Error Handling
- Services throw descriptive errors
- Routes catch and format for HTTP
- Use custom error classes with codes

### Validation
- Input validation at service layer
- Use joi or zod for schema validation
- Return validation errors with field names

## Database Query Standards

### Query Organization
- Complex queries in dedicated query files
- Use meaningful aliases: `users u`, `runs r`, `routes rt`
- Always use parameterized queries ($1, $2, etc.)

### JOIN Standards
```sql
-- ✅ Good: Explicit JOINs with clear aliases
SELECT r.id, r.name, rt.name as route_name, u.name as created_by_name
FROM runs r
JOIN routes rt ON r.route_id = rt.id
LEFT JOIN users u ON r.created_by = u.id

-- ❌ Bad: Implicit joins, unclear aliases
SELECT * FROM runs, routes WHERE runs.route_id = routes.id
```

### Indexing Strategy
- Index all foreign keys
- Index commonly filtered fields
- Composite indexes for common query patterns
- Use EXPLAIN ANALYZE to verify performance