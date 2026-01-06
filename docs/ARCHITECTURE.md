# Architectural Principles

## Service Layer Architecture

### Core Principles

1. **Single Responsibility**: Each service handles one domain entity
2. **Dependency Injection**: Services receive dependencies (database, logger, etc.) in constructor
3. **Data Transformation**: Services transform between database and API formats consistently
4. **Error Handling**: Services throw typed errors, routes handle HTTP responses
5. **Validation**: Input validation at service layer using schema validation
6. **Testability**: All dependencies mockable, pure business logic

### Service Class Template

```javascript
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';

class EntityService {
  constructor(database, logger = console, validator = null) {
    this.db = database;
    this.logger = logger;
    this.validator = validator;
  }

  // CRUD Operations
  async getAll(filters = {}) {
    try {
      this.logger.debug('EntityService.getAll', { filters });
      
      // Build query with filters
      const query = this.#buildGetAllQuery(filters);
      const result = await this.db.query(query.text, query.params);
      
      return result.rows.map(row => this.#transformFromDb(row));
    } catch (error) {
      this.logger.error('EntityService.getAll failed', { error, filters });
      throw new DatabaseError('Failed to retrieve entities', error);
    }
  }

  async getById(id) {
    try {
      this.logger.debug('EntityService.getById', { id });
      
      if (!id || isNaN(parseInt(id))) {
        throw new ValidationError('Valid ID is required');
      }

      const result = await this.db.query(
        'SELECT * FROM entities WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('EntityService.getById failed', { error, id });
      throw new DatabaseError('Failed to retrieve entity', error);
    }
  }

  async create(data) {
    try {
      this.logger.debug('EntityService.create', { data });
      
      // Validate input
      const validatedData = await this.#validateCreateInput(data);
      
      // Transform for database
      const dbData = this.#transformToDb(validatedData);
      
      // Insert and return transformed result
      const result = await this.db.query(
        this.#buildCreateQuery(dbData),
        Object.values(dbData)
      );

      const created = this.#transformFromDb(result.rows[0]);
      this.logger.info('Entity created successfully', { id: created.id });
      
      return created;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('EntityService.create failed', { error, data });
      throw new DatabaseError('Failed to create entity', error);
    }
  }

  async update(id, data) {
    try {
      this.logger.debug('EntityService.update', { id, data });
      
      // Verify entity exists
      await this.getById(id);
      
      // Validate input
      const validatedData = await this.#validateUpdateInput(data);
      
      // Transform for database
      const dbData = this.#transformToDb(validatedData);
      
      // Update and return transformed result
      const result = await this.db.query(
        this.#buildUpdateQuery(dbData),
        [...Object.values(dbData), id]
      );

      const updated = this.#transformFromDb(result.rows[0]);
      this.logger.info('Entity updated successfully', { id });
      
      return updated;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('EntityService.update failed', { error, id, data });
      throw new DatabaseError('Failed to update entity', error);
    }
  }

  async delete(id) {
    try {
      this.logger.debug('EntityService.delete', { id });
      
      // Verify entity exists
      const entity = await this.getById(id);
      
      // Delete from database
      await this.db.query('DELETE FROM entities WHERE id = $1', [id]);
      
      this.logger.info('Entity deleted successfully', { id });
      return entity;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('EntityService.delete failed', { error, id });
      throw new DatabaseError('Failed to delete entity', error);
    }
  }

  // Private Methods (prefixed with #)
  
  #transformFromDb(dbRow) {
    // Convert snake_case to camelCase
    // Transform dates to ISO strings
    // Parse JSON fields
    return {
      id: dbRow.id,
      name: dbRow.name,
      createdAt: dbRow.created_at?.toISOString(),
      updatedAt: dbRow.updated_at?.toISOString(),
      // ... entity-specific fields
    };
  }

  #transformToDb(apiData) {
    // Convert camelCase to snake_case
    // Transform dates to appropriate format
    // Stringify JSON fields
    return {
      name: apiData.name,
      // ... entity-specific fields
      // Don't include id, createdAt, updatedAt (managed by DB)
    };
  }

  #buildGetAllQuery(filters) {
    let text = 'SELECT * FROM entities WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.name) {
      paramCount++;
      text += ` AND name ILIKE $${paramCount}`;
      params.push(`%${filters.name}%`);
    }

    if (filters.status) {
      paramCount++;
      text += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    text += ' ORDER BY created_at DESC';

    return { text, params };
  }

  #buildCreateQuery(dbData) {
    const fields = Object.keys(dbData);
    const placeholders = fields.map((_, i) => `$${i + 1}`);
    
    return `
      INSERT INTO entities (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
  }

  #buildUpdateQuery(dbData) {
    const fields = Object.keys(dbData);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`);
    
    return `
      UPDATE entities 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
  }

  async #validateCreateInput(data) {
    if (!this.validator) {
      return data;
    }
    
    // Use joi, zod, or custom validation
    const { error, value } = this.validator.create.validate(data);
    if (error) {
      throw new ValidationError(error.details[0].message, error.details[0].path[0]);
    }
    
    return value;
  }

  async #validateUpdateInput(data) {
    if (!this.validator) {
      return data;
    }
    
    const { error, value } = this.validator.update.validate(data);
    if (error) {
      throw new ValidationError(error.details[0].message, error.details[0].path[0]);
    }
    
    return value;
  }
}

export default EntityService;
```

## Error Handling Strategy

### Custom Error Classes
```javascript
// utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, 500);
    this.originalError = originalError;
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message, required = null) {
    super(message, 403);
    this.required = required;
  }
}
```

### Route Error Handling
```javascript
// middleware/errorHandler.js
export const errorHandler = (error, req, res, next) => {
  // Log error
  console.error('Error:', error);

  // Handle known error types
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field
      }
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }

  if (error instanceof AuthorizationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: error.message,
        required: error.required
      }
    });
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

## Route Layer Patterns

### Route Template
```javascript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import EntityService from '../services/entityService.js';
import { database } from '../database.js';

const router = Router();
const entityService = new EntityService(database);

// GET /entities - List all entities
router.get('/', 
  authenticateToken,
  requirePermission('entities', 'read'),
  async (req, res, next) => {
    try {
      const filters = {
        name: req.query.name,
        status: req.query.status,
        // ... other filters
      };

      const entities = await entityService.getAll(filters);
      
      res.json({
        success: true,
        data: entities,
        meta: {
          total: entities.length,
          filters: filters
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /entities/:id - Get single entity
router.get('/:id',
  authenticateToken,
  requirePermission('entities', 'read'),
  async (req, res, next) => {
    try {
      const entity = await entityService.getById(req.params.id);
      
      res.json({
        success: true,
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /entities - Create new entity
router.post('/',
  authenticateToken,
  requirePermission('entities', 'write'),
  async (req, res, next) => {
    try {
      const entity = await entityService.create(req.body);
      
      res.status(201).json({
        success: true,
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /entities/:id - Update entity
router.put('/:id',
  authenticateToken,
  requirePermission('entities', 'write'),
  async (req, res, next) => {
    try {
      const entity = await entityService.update(req.params.id, req.body);
      
      res.json({
        success: true,
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /entities/:id - Delete entity
router.delete('/:id',
  authenticateToken,
  requirePermission('entities', 'delete'),
  async (req, res, next) => {
    try {
      const entity = await entityService.delete(req.params.id);
      
      res.json({
        success: true,
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

## Validation Strategy

### Schema-based Validation (Joi)
```javascript
import Joi from 'joi';

export const entityValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().optional(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }).min(1) // At least one field required for update
};
```

## Database Query Patterns

### Complex Queries in Dedicated Files
```javascript
// queries/runQueries.js
export const runQueries = {
  getRunsWithDetails: `
    SELECT 
      r.id, r.name, r.status, r.notes,
      r.scheduled_date as "scheduledDate",
      r.start_time as "startTime", 
      r.end_time as "endTime",
      r.created_at as "createdAt",
      r.updated_at as "updatedAt",
      rt.name as "routeName",
      rt.color as "routeColor",
      u.name as "createdByName",
      COUNT(DISTINCT rtm.user_id) as "teamSize",
      COUNT(DISTINCT req.id) as "requestCount"
    FROM runs r
    JOIN routes rt ON r.route_id = rt.id
    LEFT JOIN users u ON r.created_by = u.id
    LEFT JOIN run_team_members rtm ON r.id = rtm.run_id
    LEFT JOIN requests req ON r.id = req.run_id
    WHERE ($1::text IS NULL OR r.status = $1)
      AND ($2::date IS NULL OR r.scheduled_date >= $2)
      AND ($3::date IS NULL OR r.scheduled_date <= $3)
    GROUP BY r.id, rt.id, u.id
    ORDER BY r.scheduled_date DESC, r.start_time
  `,

  getRunById: `
    SELECT 
      r.*,
      rt.name as "routeName",
      rt.color as "routeColor", 
      u.name as "createdByName"
    FROM runs r
    JOIN routes rt ON r.route_id = rt.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = $1
  `
};
```

## Testing Patterns

### Service Testing Template
```javascript
describe('EntityService', () => {
  let service;
  let mockDb;
  let mockLogger;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn()
    };
    service = new EntityService(mockDb, mockLogger);
  });

  describe('getById', () => {
    it('should return transformed entity when found', async () => {
      // Arrange
      const mockDbRow = {
        id: 1,
        name: 'Test Entity',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02')
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      // Act
      const result = await service.getById(1);

      // Assert
      expect(result).toEqual({
        id: 1,
        name: 'Test Entity',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z'
      });
    });
  });
});
```

## Logging Strategy

### Structured Logging
```javascript
// utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default logger;
```

These architectural principles ensure:

1. **Consistency** across all services
2. **Testability** through dependency injection
3. **Error Handling** with proper HTTP status codes
4. **Data Transformation** at the right layer
5. **Validation** with clear error messages
6. **Logging** for debugging and monitoring
7. **Security** through permission-based access control