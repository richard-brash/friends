const { query } = require('../database');

class FriendService {
  // Get all friends with location and route info
  async getAllFriends() {
    const result = await query(`
      SELECT f.*, l.name as location_name, r.name as route_name, r.color as route_color,
             COUNT(req.id) as request_count
      FROM friends f
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN requests req ON f.id = req.friend_id
      GROUP BY f.id, l.name, r.name, r.color
      ORDER BY r.name, l.order_in_route, f.name
    `);
    return result.rows;
  }

  // Get friends by location ID
  async getFriendsByLocationId(locationId) {
    const result = await query(`
      SELECT f.*, COUNT(req.id) as request_count
      FROM friends f
      LEFT JOIN requests req ON f.id = req.friend_id
      WHERE f.location_id = $1
      GROUP BY f.id
      ORDER BY f.name
    `, [locationId]);
    return result.rows;
  }

  // Get friend by ID with requests
  async getFriendById(id) {
    const friendResult = await query(`
      SELECT f.*, l.name as location_name, r.name as route_name
      FROM friends f
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      WHERE f.id = $1
    `, [id]);
    
    if (friendResult.rows.length === 0) return null;

    const requestsResult = await query(`
      SELECT req.*, u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.friend_id = $1
      ORDER BY req.created_at DESC
    `, [id]);

    return {
      ...friendResult.rows[0],
      requests: requestsResult.rows
    };
  }

  // Create new friend
  async createFriend({ location_id, name, nickname, notes, clothing_sizes, dietary_restrictions }) {
    const result = await query(
      `INSERT INTO friends (location_id, name, nickname, notes, clothing_sizes, dietary_restrictions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [location_id, name, nickname, notes, clothing_sizes ? JSON.stringify(clothing_sizes) : null, dietary_restrictions]
    );
    return result.rows[0];
  }

  // Update friend
  async updateFriend(id, { location_id, name, nickname, notes, clothing_sizes, dietary_restrictions }) {
    const result = await query(
      `UPDATE friends 
       SET location_id = $2, name = $3, nickname = $4, notes = $5, clothing_sizes = $6, dietary_restrictions = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, location_id, name, nickname, notes, clothing_sizes ? JSON.stringify(clothing_sizes) : null, dietary_restrictions]
    );
    return result.rows[0];
  }

  // Delete friend
  async deleteFriend(id) {
    const result = await query('DELETE FROM friends WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Search friends by name
  async searchFriendsByName(searchTerm) {
    const result = await query(`
      SELECT f.*, l.name as location_name, r.name as route_name
      FROM friends f
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      WHERE f.name ILIKE $1 OR f.nickname ILIKE $1
      ORDER BY f.name
    `, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = new FriendService();