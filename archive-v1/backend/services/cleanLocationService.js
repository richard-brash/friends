/**
 * Clean Location Service - Clean Architecture Implementation
 * Follows the same patterns as CleanFriendService and CleanRunService
 */

export default class CleanLocationService {
  constructor({ query }) {
    this.query = query;
  }

  /**
   * Get all locations with optional filtering
   * @param {Object} filters - Optional filters
   * @param {string} filters.routeId - Filter by route ID
   * @param {string} filters.type - Filter by location type
   * @param {string} filters.search - Search in name or address
   * @returns {Promise<Array>} Array of location objects
   */
  async getAll(filters = {}) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Build WHERE clause based on filters
    if (filters.routeId) {
      whereConditions.push(`rl.route_id = $${paramIndex}`);
      params.push(parseInt(filters.routeId));
      paramIndex++;
    }

    if (filters.type) {
      whereConditions.push(`l.type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.search) {
      whereConditions.push(`(l.name ILIKE $${paramIndex} OR l.address ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // If filtering by route, order by route_order; otherwise order by name
    const orderByClause = filters.routeId 
      ? 'ORDER BY l.route_order NULLS LAST, l.name'
      : 'ORDER BY l.name';

    const result = await this.query(`
      SELECT 
        l.*,
        r.name as route_name,
        COUNT(DISTINCT flh.friend_id) as current_friend_count
      FROM locations l
      LEFT JOIN routes r ON l.route_id = r.id
      LEFT JOIN LATERAL (
        SELECT DISTINCT flh.friend_id
        FROM friend_location_history flh
        WHERE flh.location_id = l.id
        AND flh.id = (
          SELECT MAX(flh2.id)
          FROM friend_location_history flh2
          WHERE flh2.friend_id = flh.friend_id
        )
      ) flh ON true
      ${whereClause}
      GROUP BY l.id, l.name, l.address, l.type, l.coordinates, l.notes, l.route_id, l.route_order, l.created_at, r.name
      ${orderByClause}
    `, params);

    return result.rows.map(this.mapLocationFromDb);
  }

  /**
   * Get single location by ID with full details
   * @param {string|number} id - Location ID
   * @returns {Promise<Object>} Location object with friends
   */
  async getById(id) {
    const locationResult = await this.query(`
      SELECT 
        l.*,
        r.name as route_name
      FROM locations l
      LEFT JOIN routes r ON l.route_id = r.id
      WHERE l.id = $1
    `, [id]);

    if (locationResult.rows.length === 0) {
      throw new Error(`Location with ID ${id} not found`);
    }

    // Get current friends at this location
    const friendsResult = await this.query(`
      SELECT 
        f.id,
        f.name,
        f.nickname,
        flh.created_at as moved_in_at
      FROM friends f
      INNER JOIN friend_location_history flh ON f.id = flh.friend_id
      WHERE flh.location_id = $1
      AND flh.id = (
        SELECT MAX(flh2.id)
        FROM friend_location_history flh2
        WHERE flh2.friend_id = f.id
      )
      ORDER BY f.name
    `, [id]);

    const location = this.mapLocationFromDb(locationResult.rows[0]);
    location.currentFriends = friendsResult.rows;
    location.currentFriendCount = friendsResult.rows.length;

    return location;
  }

  /**
   * Create new location
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Created location
   */
  async create(locationData) {
    const { name, address, type, notes, coordinates, routeId, routeOrder } = locationData;

    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }

    // If routeOrder is provided, use it; otherwise calculate next order if routeId is provided
    let finalRouteOrder = routeOrder || null;
    if (routeId && !routeOrder) {
      const orderResult = await this.query(`
        SELECT COALESCE(MAX(route_order), 0) + 1 as next_order
        FROM locations 
        WHERE route_id = $1
      `, [routeId]);
      finalRouteOrder = orderResult.rows[0].next_order;
    }

    const result = await this.query(`
      INSERT INTO locations (name, address, type, notes, coordinates, route_id, route_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name.trim(), 
      address || null, 
      type || null, 
      notes || null, 
      coordinates || null,
      routeId || null,
      finalRouteOrder
    ]);

    return this.mapLocationFromDb(result.rows[0]);
  }

  /**
   * Update existing location
   * @param {number} id - Location ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated location
   */
  async update(id, updates) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('Valid location ID is required');
    }

    // Map camelCase to database fields
    const fieldMap = {
      name: 'name',
      address: 'address',
      type: 'type',
      notes: 'notes',
      coordinates: 'coordinates',
      routeId: 'route_id',
      routeOrder: 'route_order'
    };

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.keys(updates).forEach(key => {
      if (fieldMap[key] && updates[key] !== undefined) {
        updateFields.push(`${fieldMap[key]} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    values.push(id);
    
    const result = await this.query(`
      UPDATE locations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error(`Location with ID ${id} not found`);
    }

    return this.mapLocationFromDb(result.rows[0]);
  }

  /**
   * Delete location (hard delete for now - could be soft delete)
   * @param {string|number} id - Location ID
   * @returns {Promise<Object>} Deleted location
   */
  async delete(id) {
    // Check if location has current friends
    const friendsCheck = await this.query(`
      SELECT COUNT(*) as friend_count
      FROM friend_location_history flh
      WHERE flh.location_id = $1
      AND flh.id = (
        SELECT MAX(flh2.id)
        FROM friend_location_history flh2
        WHERE flh2.friend_id = flh.friend_id
      )
    `, [id]);

    if (parseInt(friendsCheck.rows[0].friend_count) > 0) {
      throw new Error('Cannot delete location that currently has friends assigned to it');
    }

    const result = await this.query(`
      DELETE FROM locations 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error(`Location with ID ${id} not found`);
    }

    return this.mapLocationFromDb(result.rows[0]);
  }

  /**
   * Search locations by name or address
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching locations
   */
  async search(searchTerm) {
    const result = await this.query(`
      SELECT 
        l.*,
        STRING_AGG(r.name, ', ' ORDER BY r.name) as route_names,
        COUNT(DISTINCT flh.friend_id) as current_friend_count
      FROM locations l
      LEFT JOIN route_locations rl ON l.id = rl.location_id
      LEFT JOIN routes r ON rl.route_id = r.id
      LEFT JOIN LATERAL (
        SELECT DISTINCT flh.friend_id
        FROM friend_location_history flh
        WHERE flh.location_id = l.id
        AND flh.id = (
          SELECT MAX(flh2.id)
          FROM friend_location_history flh2
          WHERE flh2.friend_id = flh.friend_id
        )
      ) flh ON true
      WHERE l.name ILIKE $1 OR l.address ILIKE $1
      GROUP BY l.id
      ORDER BY l.name
    `, [`%${searchTerm}%`]);

    return result.rows.map(this.mapLocationFromDb);
  }

  /**
   * Map database location row to domain object
   * @param {Object} dbLocation - Raw database row
   * @returns {Object} Mapped location object
   */
  mapLocationFromDb(dbLocation) {
    return {
      id: dbLocation.id,
      name: dbLocation.name,
      address: dbLocation.address,
      type: dbLocation.type,
      coordinates: dbLocation.coordinates,
      notes: dbLocation.notes,
      routeId: dbLocation.route_id || null,
      routeOrder: dbLocation.route_order || null,
      routeName: dbLocation.route_name || null,
      currentFriendCount: parseInt(dbLocation.current_friend_count) || 0,
      createdAt: dbLocation.created_at
    };
  }
}