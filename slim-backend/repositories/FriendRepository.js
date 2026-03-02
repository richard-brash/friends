// Friend Repository
// Data access layer for friends table

import BaseRepository from './BaseRepository.js';

class FriendRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'friends');
  }

  /**
   * Get all active friends
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active friends
   */
  async getAllActive(options = {}) {
    return await this.getAll({
      ...options,
      where: 'status = $1',
      params: ['active'],
    });
  }

  /**
   * Search friends by name (first_name, last_name, or alias)
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching friends
   */
  async search(searchTerm, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const query = `
      SELECT * FROM friends
      WHERE 
        to_tsvector('english', 
          COALESCE(first_name, '') || ' ' || 
          COALESCE(last_name, '') || ' ' || 
          COALESCE(alias, '')
        ) @@ plainto_tsquery('english', $1)
        OR LOWER(COALESCE(first_name, '')) LIKE LOWER($2)
        OR LOWER(COALESCE(last_name, '')) LIKE LOWER($2)
        OR LOWER(COALESCE(alias, '')) LIKE LOWER($2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await this.query(query, [
      searchTerm,
      `%${searchTerm}%`,
      limit,
      offset
    ]);
    return result.rows;
  }

  /**
   * Get friend's location history
   * @param {number} friendId - Friend ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Location history with location details
   */
  async getLocationHistory(friendId, limit = 10) {
    const query = `
      SELECT 
        flh.id,
        flh.friend_id,
        flh.location_id,
        flh.spotted_by,
        flh.spotted_at,
        flh.notes,
        l.name as location_name,
        l.address,
        l.city,
        l.state,
        r.name as route_name,
        u.name as spotted_by_name
      FROM friend_location_history flh
      JOIN locations l ON flh.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN users u ON flh.spotted_by = u.id
      WHERE flh.friend_id = $1
      ORDER BY flh.spotted_at DESC
      LIMIT $2
    `;

    const result = await this.query(query, [friendId, limit]);
    return result.rows;
  }

  /**
   * Get friend's last known location
   * @param {number} friendId - Friend ID
   * @returns {Promise<Object|null>} Last location or null
   */
  async getLastKnownLocation(friendId) {
    const history = await this.getLocationHistory(friendId, 1);
    return history[0] || null;
  }

  /**
   * Get friends by location (who have been spotted there)
   * @param {number} locationId - Location ID
   * @param {number} daysAgo - Number of days to look back (default: 30)
   * @returns {Promise<Array>} Friends spotted at location
   */
  async getByLocation(locationId, daysAgo = 30) {
    const query = `
      SELECT DISTINCT
        f.*,
        MAX(flh.spotted_at) as last_seen
      FROM friends f
      JOIN friend_location_history flh ON f.id = flh.friend_id
      WHERE flh.location_id = $1
        AND flh.spotted_at >= NOW() - INTERVAL '${daysAgo} days'
      GROUP BY f.id
      ORDER BY last_seen DESC
    `;

    const result = await this.query(query, [locationId]);
    return result.rows;
  }

  /**
   * Record friend sighting at location
   * @param {Object} data - Sighting data
   * @returns {Promise<Object>} Created sighting record
   */
  async recordSighting(data) {
    const { friendId, locationId, spottedBy, spottedAt, notes } = data;
    
    const query = `
      INSERT INTO friend_location_history 
        (friend_id, location_id, spotted_by, spotted_at, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await this.query(query, [
      friendId,
      locationId,
      spottedBy,
      spottedAt || new Date(),
      notes || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Get friend with their pending requests
   * @param {number} friendId - Friend ID
   * @returns {Promise<Object|null>} Friend with requests
   */
  async getWithRequests(friendId) {
    const friend = await this.getById(friendId);
    if (!friend) return null;

    const query = `
      SELECT 
        r.*,
        l.name as location_name,
        rt.name as route_name
      FROM requests r
      JOIN locations l ON r.location_id = l.id
      JOIN routes rt ON l.route_id = rt.id
      WHERE r.friend_id = $1
        AND r.status != 'delivered'
        AND r.status != 'cancelled'
      ORDER BY 
        CASE r.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.created_at ASC
    `;

    const result = await this.query(query, [friendId]);
    friend.requests = result.rows;
    
    return friend;
  }

  /**
   * Get friend's display name (prioritizes first_name, then alias, then last_name)
   * @param {Object} friend - Friend object
   * @returns {string} Display name
   */
  static getDisplayName(friend) {
    if (friend.first_name && friend.last_name) {
      return `${friend.first_name} ${friend.last_name}`;
    }
    if (friend.first_name) {
      return friend.first_name;
    }
    if (friend.alias) {
      return friend.alias;
    }
    if (friend.last_name) {
      return friend.last_name;
    }
    return 'Unknown';
  }

  /**
   * Soft delete friend (set status to 'inactive')
   * @param {number} id - Friend ID
   * @returns {Promise<Object|null>} Updated friend
   */
  async softDelete(id) {
    return await super.softDelete(id, 'status', 'inactive');
  }
}

export default FriendRepository;
