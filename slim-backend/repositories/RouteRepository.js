// Route Repository
// Data access layer for routes table

import BaseRepository from './BaseRepository.js';

class RouteRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'routes');
  }

  /**
   * Get all active routes
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active routes
   */
  async getAllActive(options = {}) {
    return await this.getAll({
      ...options,
      where: 'is_active = $1',
      params: [true],
    });
  }

  /**
   * Get route with all its locations (ordered)
   * @param {number} routeId - Route ID
   * @returns {Promise<Object|null>} Route with locations array
   */
  async getWithLocations(routeId) {
    const route = await this.getById(routeId);
    if (!route) return null;

    const query = `
      SELECT * FROM locations
      WHERE route_id = $1
      ORDER BY route_order ASC
    `;

    const result = await this.query(query, [routeId]);
    route.locations = result.rows;
    
    return route;
  }

  /**
   * Get route by name
   * @param {string} name - Route name
   * @returns {Promise<Object|null>} Route or null
   */
  async getByName(name) {
    const query = 'SELECT * FROM routes WHERE name = $1';
    const result = await this.query(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * Get routes with location count
   * @returns {Promise<Array>} Routes with locationCount
   */
  async getAllWithLocationCount() {
    const query = `
      SELECT 
        r.*,
        COUNT(l.id) as location_count
      FROM routes r
      LEFT JOIN locations l ON r.id = l.route_id
      WHERE r.is_active = true
      GROUP BY r.id
      ORDER BY r.name ASC
    `;

    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Soft delete route (set is_active = false)
   * @param {number} id - Route ID
   * @returns {Promise<Object|null>} Updated route
   */
  async softDelete(id) {
    return await super.softDelete(id, 'is_active', false);
  }
}

export default RouteRepository;
