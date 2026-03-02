// Request Repository
// Data access layer for requests table with status history

import BaseRepository from './BaseRepository.js';

class RequestRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'requests');
  }

  /**
   * Get requests with friend and location details
   * @param {Object} options - Query options (status, routeId, limit, offset)
   * @returns {Promise<Array>} Requests with joined data
   */
  async getAllWithDetails(options = {}) {
    const { status, routeId, limit = 50, offset = 0 } = options;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += `r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (routeId) {
      whereClause += (whereClause ? ' AND ' : '') + `rt.id = $${paramIndex}`;
      params.push(routeId);
      paramIndex++;
    }

    const query = `
      SELECT 
        r.*,
        f.first_name,
        f.last_name,
        f.alias,
        f.phone as friend_phone,
        l.name as location_name,
        l.route_id,
        rt.name as route_name
      FROM requests r
      JOIN friends f ON r.friend_id = f.id
      JOIN locations l ON r.location_id = l.id
      JOIN routes rt ON l.route_id = rt.id
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ORDER BY 
        CASE r.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Get single request with all details
   * @param {number} requestId - Request ID
   * @returns {Promise<Object|null>} Request with friend, location, route info
   */
  async getByIdWithDetails(requestId) {
    const query = `
      SELECT 
        r.*,
        f.first_name,
        f.last_name,
        f.alias,
        f.phone as friend_phone,
        f.email as friend_email,
        l.name as location_name,
        l.address as location_address,
        l.city as location_city,
        l.route_id,
        rt.name as route_name
      FROM requests r
      JOIN friends f ON r.friend_id = f.id
      JOIN locations l ON r.location_id = l.id
      JOIN routes rt ON l.route_id = rt.id
      WHERE r.id = $1
    `;

    const result = await this.query(query, [requestId]);
    return result.rows[0] || null;
  }

  /**
   * Get request status history
   * @param {number} requestId - Request ID
   * @returns {Promise<Array>} Status history ordered by date
   */
  async getStatusHistory(requestId) {
    const query = `
      SELECT 
        rsh.*,
        u.name as user_name,
        u.email as user_email
      FROM request_status_history rsh
      LEFT JOIN users u ON rsh.user_id = u.id
      WHERE rsh.request_id = $1
      ORDER BY rsh.created_at DESC
    `;

    const result = await this.query(query, [requestId]);
    return result.rows;
  }

  /**
   * Update request status and record in history
   * @param {number} requestId - Request ID
   * @param {string} newStatus - New status
   * @param {number} userId - User making the change
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated request
   */
  async updateStatus(requestId, newStatus, userId, notes = null) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current status
      const currentReq = await client.query(
        'SELECT status FROM requests WHERE id = $1',
        [requestId]
      );

      if (currentReq.rows.length === 0) {
        throw new Error('Request not found');
      }

      const oldStatus = currentReq.rows[0].status;

      // Update request status
      const updateResult = await client.query(
        'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newStatus, requestId]
      );

      // Record in status history
      await client.query(
        `INSERT INTO request_status_history 
         (request_id, from_status, to_status, user_id, notes) 
         VALUES ($1, $2, $3, $4, $5)`,
        [requestId, oldStatus, newStatus, userId, notes]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get requests for a specific route (via locations)
   * @param {number} routeId - Route ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Requests for the route
   */
  async getByRoute(routeId, status = null) {
    let whereClause = 'rt.id = $1';
    const params = [routeId];

    if (status) {
      whereClause += ' AND r.status = $2';
      params.push(status);
    }

    const query = `
      SELECT 
        r.*,
        f.first_name,
        f.last_name,
        f.alias,
        l.name as location_name,
        l.route_order,
        rt.name as route_name
      FROM requests r
      JOIN friends f ON r.friend_id = f.id
      JOIN locations l ON r.location_id = l.id
      JOIN routes rt ON l.route_id = rt.id
      WHERE ${whereClause}
      ORDER BY 
        l.route_order ASC,
        CASE r.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.created_at ASC
    `;

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Get requests by friend
   * @param {number} friendId - Friend ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Friend's requests
   */
  async getByFriend(friendId, status = null) {
    let whereClause = 'r.friend_id = $1';
    const params = [friendId];

    if (status) {
      whereClause += ' AND r.status = $2';
      params.push(status);
    }

    const query = `
      SELECT 
        r.*,
        l.name as location_name,
        rt.name as route_name
      FROM requests r
      JOIN locations l ON r.location_id = l.id
      JOIN routes rt ON l.route_id = rt.id
      WHERE ${whereClause}
      ORDER BY 
        CASE r.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.created_at DESC
    `;

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Create request and record initial status in history
   * @param {Object} data - Request data
   * @param {number} userId - User creating the request
   * @returns {Promise<Object>} Created request
   */
  async createWithHistory(data, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create request
      const createResult = await client.query(
        `INSERT INTO requests 
         (friend_id, location_id, item_description, quantity, priority, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.friend_id,
          data.location_id,
          data.item_description,
          data.quantity || 1,
          data.priority || 'medium',
          'pending',
          data.notes || null
        ]
      );

      const request = createResult.rows[0];

      // Record initial status in history
      await client.query(
        `INSERT INTO request_status_history 
         (request_id, from_status, to_status, user_id, notes)
         VALUES ($1, NULL, 'pending', $2, 'Request created')`,
        [request.id, userId]
      );

      await client.query('COMMIT');
      return request;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default RequestRepository;
