// Location Repository
// Data access layer for locations table

import BaseRepository from './BaseRepository.js';

class LocationRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'locations');
  }

  /**
   * Get all locations for a route (ordered)
   * @param {number} routeId - Route ID
   * @returns {Promise<Array>} Locations ordered by route_order
   */
  async getByRoute(routeId) {
    const query = `
      SELECT * FROM locations
      WHERE route_id = $1
      ORDER BY route_order ASC
    `;

    const result = await this.query(query, [routeId]);
    return result.rows;
  }

  /**
   * Get location with route details
   * @param {number} locationId - Location ID
   * @returns {Promise<Object|null>} Location with route info
   */
  async getWithRoute(locationId) {
    const query = `
      SELECT 
        l.*,
        r.name as route_name,
        r.description as route_description
      FROM locations l
      JOIN routes r ON l.route_id = r.id
      WHERE l.id = $1
    `;

    const result = await this.query(query, [locationId]);
    return result.rows[0] || null;
  }

  /**
   * Get expected friends at a location (based on recent sightings)
   * @param {number} locationId - Location ID
   * @param {number} daysAgo - Look back period (default 30 days)
   * @returns {Promise<Array>} Friends with last seen info
   */
  async getExpectedFriends(locationId, daysAgo = 30) {
    const query = `
      SELECT 
        f.id,
        f.first_name,
        f.last_name,
        f.alias,
        f.phone,
        f.status,
        MAX(flh.spotted_at) as last_seen,
        COUNT(flh.id) as sighting_count
      FROM friends f
      JOIN friend_location_history flh ON f.id = flh.friend_id
      WHERE flh.location_id = $1
        AND flh.spotted_at >= NOW() - INTERVAL '${daysAgo} days'
        AND f.status = 'active'
      GROUP BY f.id
      ORDER BY last_seen DESC
    `;

    const result = await this.query(query, [locationId]);
    return result.rows;
  }

  /**
   * Get pending requests at a location
   * @param {number} locationId - Location ID
   * @returns {Promise<Array>} Requests with friend details
   */
  async getPendingRequests(locationId) {
    const query = `
      SELECT 
        r.*,
        f.first_name,
        f.last_name,
        f.alias
      FROM requests r
      JOIN friends f ON r.friend_id = f.id
      WHERE r.location_id = $1
        AND r.status IN ('pending', 'ready_for_delivery', 'taken')
      ORDER BY 
        CASE r.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.created_at ASC
    `;

    const result = await this.query(query, [locationId]);
    return result.rows;
  }

  /**
   * Get next available route_order for a route
   * @param {number} routeId - Route ID
   * @returns {Promise<number>} Next route_order value
   */
  async getNextRouteOrder(routeId) {
    const query = `
      SELECT COALESCE(MAX(route_order), 0) + 1 as next_order
      FROM locations
      WHERE route_id = $1
    `;

    const result = await this.query(query, [routeId]);
    return result.rows[0].next_order;
  }

  /**
   * Reorder locations on a route
   * @param {number} routeId - Route ID
   * @param {Array<{id: number, route_order: number}>} orderUpdates - New order
   * @returns {Promise<boolean>} Success status
   */
  async reorderLocations(routeId, orderUpdates) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const update of orderUpdates) {
        await client.query(
          'UPDATE locations SET route_order = $1 WHERE id = $2 AND route_id = $3',
          [update.route_order, update.id, routeId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default LocationRepository;
