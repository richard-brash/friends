import { query } from '../database.js';

class LocationService {
  // Get all locations with route info
  async getAllLocations() {
    const result = await query(`
      SELECT l.*, 
             COUNT(f.id) as friend_count
      FROM locations l
      LEFT JOIN friends f ON l.id = f.current_location_id
      GROUP BY l.id
      ORDER BY l.name
    `);
    return result.rows;
  }

  // Get locations by route ID
  async getLocationsByRouteId(routeId) {
    const result = await query(`
      SELECT l.*, COUNT(f.id) as friend_count, rl.order_in_route
      FROM locations l
      JOIN route_locations rl ON l.id = rl.location_id
      LEFT JOIN friends f ON l.id = f.current_location_id
      WHERE rl.route_id = $1
      GROUP BY l.id, rl.order_in_route
      ORDER BY rl.order_in_route
    `, [routeId]);
    return result.rows;
  }

  // Get location by ID with friends
  async getLocationById(id) {
    const locationResult = await query(`
      SELECT l.*
      FROM locations l
      WHERE l.id = $1
    `, [id]);
    
    if (locationResult.rows.length === 0) return null;

    const friendsResult = await query('SELECT * FROM friends WHERE current_location_id = $1 ORDER BY name', [id]);

    return {
      ...locationResult.rows[0],
      friends: friendsResult.rows
    };
  }

  // Create new location
  async createLocation({ name, address, type, coordinates, notes }) {
    const result = await query(
      `INSERT INTO locations (name, address, type, coordinates, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, address, type, coordinates ? JSON.stringify(coordinates) : null, notes]
    );
    return result.rows[0];
  }

  // Update location
  async updateLocation(id, { name, address, type, coordinates, notes }) {
    const result = await query(
      `UPDATE locations 
       SET name = $2, address = $3, type = $4, coordinates = $5, notes = $6
       WHERE id = $1
       RETURNING *`,
      [id, name, address, type, coordinates ? JSON.stringify(coordinates) : null, notes]
    );
    return result.rows[0];
  }

  // Delete location
  async deleteLocation(id) {
    const result = await query('DELETE FROM locations WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Get next order number for a route
  async getNextOrderInRoute(routeId) {
    const result = await query(
      'SELECT COALESCE(MAX(order_in_route), 0) + 1 as next_order FROM route_locations WHERE route_id = $1',
      [routeId]
    );
    return result.rows[0].next_order;
  }
}

export default new LocationService();