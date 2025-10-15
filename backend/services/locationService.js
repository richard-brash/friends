const { query } = require('../database');

class LocationService {
  // Get all locations with route info
  async getAllLocations() {
    const result = await query(`
      SELECT l.*, r.name as route_name, r.color as route_color,
             COUNT(f.id) as friend_count
      FROM locations l
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN friends f ON l.id = f.location_id
      GROUP BY l.id, r.name, r.color
      ORDER BY r.name, l.order_in_route
    `);
    return result.rows;
  }

  // Get locations by route ID
  async getLocationsByRouteId(routeId) {
    const result = await query(`
      SELECT l.*, COUNT(f.id) as friend_count
      FROM locations l
      LEFT JOIN friends f ON l.id = f.location_id
      WHERE l.route_id = $1
      GROUP BY l.id
      ORDER BY l.order_in_route
    `, [routeId]);
    return result.rows;
  }

  // Get location by ID with friends
  async getLocationById(id) {
    const locationResult = await query(`
      SELECT l.*, r.name as route_name
      FROM locations l
      JOIN routes r ON l.route_id = r.id
      WHERE l.id = $1
    `, [id]);
    
    if (locationResult.rows.length === 0) return null;

    const friendsResult = await query('SELECT * FROM friends WHERE location_id = $1 ORDER BY name', [id]);

    return {
      ...locationResult.rows[0],
      friends: friendsResult.rows
    };
  }

  // Create new location
  async createLocation({ route_id, name, address, coordinates, order_in_route }) {
    const result = await query(
      `INSERT INTO locations (route_id, name, address, coordinates, order_in_route)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [route_id, name, address, coordinates ? JSON.stringify(coordinates) : null, order_in_route]
    );
    return result.rows[0];
  }

  // Update location
  async updateLocation(id, { route_id, name, address, coordinates, order_in_route }) {
    const result = await query(
      `UPDATE locations 
       SET route_id = $2, name = $3, address = $4, coordinates = $5, order_in_route = $6
       WHERE id = $1
       RETURNING *`,
      [id, route_id, name, address, coordinates ? JSON.stringify(coordinates) : null, order_in_route]
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
      'SELECT COALESCE(MAX(order_in_route), 0) + 1 as next_order FROM locations WHERE route_id = $1',
      [routeId]
    );
    return result.rows[0].next_order;
  }
}

module.exports = new LocationService();