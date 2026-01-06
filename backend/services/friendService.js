import { query } from '../database.js';

class FriendService {
  // Get all friends with location info
  async getAllFriends() {
    const result = await query(`
      SELECT f.*, 
             flh_current.location_id as current_location_id,
             l.name as location_name,
             COUNT(req.id) as request_count
      FROM friends f
      LEFT JOIN LATERAL (
        SELECT location_id
        FROM friend_location_history flh
        WHERE flh.friend_id = f.id
        ORDER BY flh.created_at DESC
        LIMIT 1
      ) flh_current ON true
      LEFT JOIN locations l ON flh_current.location_id = l.id
      LEFT JOIN requests req ON f.id = req.friend_id
      GROUP BY f.id, flh_current.location_id, l.name
      ORDER BY f.name
    `);
    return result.rows;
  }

  // Get friends by location ID
  async getFriendsByLocationId(locationId) {
    const result = await query(`
      SELECT f.*, COUNT(req.id) as request_count
      FROM friends f
      LEFT JOIN requests req ON f.id = req.friend_id
      WHERE f.current_location_id = $1
      GROUP BY f.id
      ORDER BY f.name
    `, [locationId]);
    return result.rows;
  }

  // Get friend by ID with requests
  async getFriendById(id) {
    const friendResult = await query(`
      SELECT f.*, l.name as location_name
      FROM friends f
      LEFT JOIN locations l ON f.current_location_id = l.id
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
  async createFriend({ current_location_id, name, nickname, notes, clothing_sizes, dietary_restrictions }) {
    const result = await query(
      `INSERT INTO friends (current_location_id, name, nickname, notes, clothing_sizes, dietary_restrictions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [current_location_id, name, nickname, notes, clothing_sizes ? JSON.stringify(clothing_sizes) : null, dietary_restrictions]
    );
    return result.rows[0];
  }

  // Update friend
  async updateFriend(id, { current_location_id, name, nickname, notes, clothing_sizes, dietary_restrictions }) {
    const result = await query(
      `UPDATE friends 
       SET current_location_id = $2, name = $3, nickname = $4, notes = $5, clothing_sizes = $6, dietary_restrictions = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, current_location_id, name, nickname, notes, clothing_sizes ? JSON.stringify(clothing_sizes) : null, dietary_restrictions]
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
      SELECT f.*, l.name as location_name
      FROM friends f
      LEFT JOIN locations l ON f.current_location_id = l.id
      WHERE f.name ILIKE $1 OR f.nickname ILIKE $1
      ORDER BY f.name
    `, [`%${searchTerm}%`]);
    return result.rows;
  }
}

export default new FriendService();