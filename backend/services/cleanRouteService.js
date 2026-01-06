/**
 * CleanRouteService - Clean Architecture Implementation
 * Follows established patterns from CleanRunService and CleanFriendService
 * Provides consistent data transformation and error handling
 */

import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';

class CleanRouteService {
  constructor(database, logger = console) {
    this.db = database;
    this.logger = logger;
  }

  /**
   * Transform database route record to clean API format
   */
  #transformFromDb(dbRoute) {
    if (!dbRoute) return null;

    return {
      id: dbRoute.id,
      name: dbRoute.name,
      description: dbRoute.description || null,
      color: dbRoute.color || '#1976d2',
      locationCount: parseInt(dbRoute.location_count) || 0,
      friendCount: parseInt(dbRoute.friend_count) || 0,
      createdAt: dbRoute.created_at ? dbRoute.created_at.toISOString() : null
    };
  }

  /**
   * Transform API input to database format
   */
  #transformToDb(apiRoute) {
    const dbRoute = {};

    if (apiRoute.name !== undefined) dbRoute.name = apiRoute.name;
    if (apiRoute.description !== undefined) dbRoute.description = apiRoute.description;
    if (apiRoute.color !== undefined) dbRoute.color = apiRoute.color;

    return dbRoute;
  }

  /**
   * Validate route data
   */
  #validateRoute(route) {
    const errors = [];

    if (!route.name || typeof route.name !== 'string' || route.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (route.name && route.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }

    if (route.description && route.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (route.color && !/^#[0-9A-Fa-f]{6}$/.test(route.color)) {
      errors.push('Color must be a valid hex color code (e.g., #1976d2)');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Route validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get all routes with location and friend counts
   */
  async getAll() {
    try {
      const result = await this.db.query(`
        SELECT r.*,
               COUNT(DISTINCT l.id) as location_count,
               COUNT(DISTINCT flh.friend_id) as friend_count
        FROM routes r
        LEFT JOIN locations l ON r.id = l.route_id
        LEFT JOIN friend_location_history flh ON l.id = flh.location_id
        GROUP BY r.id, r.name, r.description, r.color, r.created_at
        ORDER BY r.name
      `);

      return result.rows.map(row => this.#transformFromDb(row));
    } catch (error) {
      throw new DatabaseError(`Failed to get routes: ${error.message}`);
    }
  }

  /**
   * Get route by ID with detailed location information
   */
  async getById(id) {
    try {
      // Get route basic info
      const routeResult = await this.db.query(
        'SELECT * FROM routes WHERE id = $1',
        [id]
      );

      if (routeResult.rows.length === 0) {
        throw new NotFoundError(`Route with ID ${id} not found`);
      }

      // Get locations for this route with friend counts
      const locationsResult = await this.db.query(`
        SELECT l.*, 
               COUNT(DISTINCT flh.friend_id) as friend_count,
               MAX(flh.date_recorded) as most_recent_friend_date
        FROM locations l
        LEFT JOIN friend_location_history flh ON l.id = flh.location_id
        WHERE l.route_id = $1
        GROUP BY l.id, l.name, l.address, l.type, l.notes, l.created_at, l.route_id, l.route_order
        ORDER BY l.route_order
      `, [id]);

      const route = this.#transformFromDb(routeResult.rows[0]);
      
      // Add locations with proper transformation
      route.locations = locationsResult.rows.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address || null,
        type: loc.type || 'general',
        notes: loc.notes || null,
        routeOrder: loc.route_order,
        friendCount: parseInt(loc.friend_count) || 0,
        mostRecentFriendDate: loc.most_recent_friend_date ? loc.most_recent_friend_date.toISOString() : null,
        createdAt: loc.created_at ? loc.created_at.toISOString() : null
      }));

      return route;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to get route: ${error.message}`);
    }
  }

  /**
   * Create new route
   */
  async create(routeData) {
    this.#validateRoute(routeData);

    try {
      const dbRoute = this.#transformToDb(routeData);
      
      const result = await this.db.query(`
        INSERT INTO routes (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
        dbRoute.name,
        dbRoute.description || null,
        dbRoute.color || '#1976d2'
      ]);

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ValidationError('Route name already exists');
      }
      throw new DatabaseError(`Failed to create route: ${error.message}`);
    }
  }

  /**
   * Update route
   */
  async update(id, routeData) {
    this.#validateRoute(routeData);

    try {
      const dbRoute = this.#transformToDb(routeData);
      
      const result = await this.db.query(`
        UPDATE routes 
        SET name = $2, description = $3, color = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        id,
        dbRoute.name,
        dbRoute.description || null,
        dbRoute.color || '#1976d2'
      ]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Route with ID ${id} not found`);
      }

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ValidationError('Route name already exists');
      }
      throw new DatabaseError(`Failed to update route: ${error.message}`);
    }
  }

  /**
   * Delete route (only if no locations are assigned)
   */
  async delete(id) {
    try {
      // Check if route has any locations (using new schema)
      const locationCheck = await this.db.query(
        'SELECT COUNT(*) as count FROM locations WHERE route_id = $1',
        [id]
      );

      if (parseInt(locationCheck.rows[0].count) > 0) {
        throw new ValidationError('Cannot delete route that has locations assigned. Please remove all locations first.');
      }

      const result = await this.db.query(
        'DELETE FROM routes WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Route with ID ${id} not found`);
      }

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new DatabaseError(`Failed to delete route: ${error.message}`);
    }
  }

  /**
   * Add location to route at specific position
   */
  async addLocation(routeId, locationId, orderInRoute = null) {
    try {
      // Check if route exists
      const routeCheck = await this.db.query('SELECT id FROM routes WHERE id = $1', [routeId]);
      if (routeCheck.rows.length === 0) {
        throw new NotFoundError(`Route with ID ${routeId} not found`);
      }

      // Check if location exists
      const locationCheck = await this.db.query('SELECT id FROM locations WHERE id = $1', [locationId]);
      if (locationCheck.rows.length === 0) {
        throw new NotFoundError(`Location with ID ${locationId} not found`);
      }

      // If no order specified, add at the end (using new schema)
      if (orderInRoute === null) {
        const maxOrderResult = await this.db.query(
          'SELECT COALESCE(MAX(route_order), 0) as max_order FROM locations WHERE route_id = $1',
          [routeId]
        );
        orderInRoute = maxOrderResult.rows[0].max_order + 1;
      }

      const result = await this.db.query(`
        UPDATE locations 
        SET route_id = $1, route_order = $3
        WHERE id = $2
        RETURNING *
      `, [routeId, locationId, orderInRoute]);

      return {
        routeId: result.rows[0].route_id,
        locationId: result.rows[0].id,
        orderInRoute: result.rows[0].route_order
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ValidationError('Location is already assigned to this route');
      }
      throw new DatabaseError(`Failed to add location to route: ${error.message}`);
    }
  }

  /**
   * Remove location from route
   */
  async removeLocation(routeId, locationId) {
    try {
      const result = await this.db.query(
        'UPDATE locations SET route_id = NULL, route_order = NULL WHERE route_id = $1 AND id = $2 RETURNING *',
        [routeId, locationId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Location ${locationId} not found in route ${routeId}`);
      }

      return {
        routeId: result.rows[0].route_id,
        locationId: result.rows[0].location_id,
        orderInRoute: result.rows[0].order_in_route
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to remove location from route: ${error.message}`);
    }
  }

  /**
   * Reorder locations in route
   */
  async reorderLocations(routeId, locationOrders) {
    // locationOrders should be an array of {locationId, orderInRoute}
    try {
      // Check if route exists
      const routeCheck = await this.db.query('SELECT id FROM routes WHERE id = $1', [routeId]);
      if (routeCheck.rows.length === 0) {
        throw new NotFoundError(`Route with ID ${routeId} not found`);
      }

      // Update each location's order using the new schema (route_id and route_order in locations table)
      for (const { locationId, orderInRoute } of locationOrders) {
        console.log(`Reordering: routeId=${routeId}, locationId=${locationId}, orderInRoute=${orderInRoute}`);
        const result = await this.db.query(
          'UPDATE locations SET route_order = $3 WHERE route_id = $1 AND id = $2 RETURNING *',
          [routeId, locationId, orderInRoute]
        );
        if (result.rows.length === 0) {
          console.warn(`No location updated for id=${locationId} in route=${routeId}`);
        } else {
          console.log(`Updated location:`, result.rows[0]);
        }
      }

      return { success: true, message: 'Location order updated' };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to reorder locations: ${error.message}`);
    }
  }
}

export default CleanRouteService;