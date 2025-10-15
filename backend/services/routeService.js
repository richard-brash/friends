import { query } from '../database.js';

class RouteService {
  // Get all routes
  async getAllRoutes() {
    const result = await query(`
      SELECT r.*, 
             COUNT(l.id) as location_count,
             COUNT(f.id) as friend_count
      FROM routes r
      LEFT JOIN locations l ON r.id = l.route_id
      LEFT JOIN friends f ON l.id = f.location_id
      GROUP BY r.id
      ORDER BY r.name
    `);
    return result.rows;
  }

  // Get route by ID with locations
  async getRouteById(id) {
    const routeResult = await query('SELECT * FROM routes WHERE id = $1', [id]);
    if (routeResult.rows.length === 0) return null;

    const locationsResult = await query(`
      SELECT l.*, COUNT(f.id) as friend_count
      FROM locations l
      LEFT JOIN friends f ON l.id = f.location_id
      WHERE l.route_id = $1
      ORDER BY l.order_in_route
    `, [id]);

    return {
      ...routeResult.rows[0],
      locations: locationsResult.rows
    };
  }

  // Create new route
  async createRoute({ name, description, color = '#1976d2' }) {
    const result = await query(
      'INSERT INTO routes (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description, color]
    );
    return result.rows[0];
  }

  // Update route
  async updateRoute(id, { name, description, color }) {
    const result = await query(
      'UPDATE routes SET name = $2, description = $3, color = $4 WHERE id = $1 RETURNING *',
      [id, name, description, color]
    );
    return result.rows[0];
  }

  // Delete route
  async deleteRoute(id) {
    const result = await query('DELETE FROM routes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

export default new RouteService();