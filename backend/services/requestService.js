const { query } = require('../database');

class RequestService {
  // Get all requests with friend, location, and run info
  async getAllRequests() {
    const result = await query(`
      SELECT req.*, f.name as friend_name, l.name as location_name, r.name as route_name,
             run.name as run_name, u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN runs run ON req.run_id = run.id
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      ORDER BY req.created_at DESC
    `);
    return result.rows;
  }

  // Get requests by status
  async getRequestsByStatus(status) {
    const result = await query(`
      SELECT req.*, f.name as friend_name, l.name as location_name, r.name as route_name,
             run.name as run_name, u.name as taken_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN runs run ON req.run_id = run.id
      LEFT JOIN users u ON req.taken_by = u.id
      WHERE req.status = $1
      ORDER BY req.priority DESC, req.created_at
    `, [status]);
    return result.rows;
  }

  // Get requests by run ID
  async getRequestsByRunId(runId) {
    const result = await query(`
      SELECT req.*, f.name as friend_name, l.name as location_name, l.order_in_route,
             u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON f.location_id = l.id
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.run_id = $1
      ORDER BY l.order_in_route, f.name
    `, [runId]);
    return result.rows;
  }

  // Get requests by friend ID
  async getRequestsByFriendId(friendId) {
    const result = await query(`
      SELECT req.*, run.name as run_name, u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      LEFT JOIN runs run ON req.run_id = run.id
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.friend_id = $1
      ORDER BY req.created_at DESC
    `, [friendId]);
    return result.rows;
  }

  // Get request by ID
  async getRequestById(id) {
    const result = await query(`
      SELECT req.*, f.name as friend_name, l.name as location_name, r.name as route_name,
             run.name as run_name, u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON f.location_id = l.id
      JOIN routes r ON l.route_id = r.id
      LEFT JOIN runs run ON req.run_id = run.id
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Create new request
  async createRequest({ friend_id, category, item_name, description, quantity = 1, priority = 'medium', notes }) {
    const result = await query(
      `INSERT INTO requests (friend_id, category, item_name, description, quantity, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [friend_id, category, item_name, description, quantity, priority, notes]
    );
    return result.rows[0];
  }

  // Update request
  async updateRequest(id, { friend_id, category, item_name, description, quantity, priority, status, notes, run_id }) {
    const result = await query(
      `UPDATE requests 
       SET friend_id = $2, category = $3, item_name = $4, description = $5, quantity = $6, 
           priority = $7, status = $8, notes = $9, run_id = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, friend_id, category, item_name, description, quantity, priority, status, notes, run_id]
    );
    return result.rows[0];
  }

  // Take request (assign to user)
  async takeRequest(id, userId) {
    const result = await query(
      `UPDATE requests 
       SET status = 'taken', taken_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }

  // Mark request as ready for delivery
  async markReadyForDelivery(id, runId) {
    const result = await query(
      `UPDATE requests 
       SET status = 'ready_for_delivery', run_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, runId]
    );
    return result.rows[0];
  }

  // Deliver request
  async deliverRequest(id, deliveredBy) {
    const result = await query(
      `UPDATE requests 
       SET status = 'delivered', delivered_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, deliveredBy]
    );
    return result.rows[0];
  }

  // Delete request
  async deleteRequest(id) {
    const result = await query('DELETE FROM requests WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Get ready-for-delivery requests by location IDs
  async getReadyForDeliveryByLocationIds(locationIds) {
    if (!locationIds || locationIds.length === 0) return [];
    
    const placeholders = locationIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`
      SELECT req.*, f.name as friend_name, f.location_id
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      WHERE req.status = 'ready_for_delivery' AND f.location_id IN (${placeholders})
      ORDER BY f.name
    `, locationIds);
    return result.rows;
  }
}

module.exports = new RequestService();