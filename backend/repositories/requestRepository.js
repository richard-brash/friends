// RequestRepository.js
// Data access for requests (PostgreSQL, can be swapped for other DBs)

import { query } from '../database.js';

class RequestRepository {
  async getAll({ includeStatusHistory = false } = {}) {
    const requests = await query('SELECT * FROM requests');
    if (!includeStatusHistory) {
      // Just include the count of delivery attempts
      const requestsWithCounts = await Promise.all(requests.rows.map(async (req) => {
        const countResult = await query(
          `SELECT COUNT(*) as delivery_attempt_count 
           FROM request_status_history 
           WHERE request_id = $1 AND status IN ('delivered', 'delivery_attempt_failed')`,
          [req.id]
        );
        return { ...req, deliveryAttemptCount: parseInt(countResult.rows[0].delivery_attempt_count) };
      }));
      return requestsWithCounts;
    }
    // Include full status history
    const requestsWithHistory = await Promise.all(requests.rows.map(async (req) => {
      const history = await this.getStatusHistory(req.id);
      const deliveryAttempts = history.filter(h => 
        h.status === 'delivered' || h.status === 'delivery_attempt_failed'
      );
      return { 
        ...req, 
        statusHistory: history,
        deliveryAttemptCount: deliveryAttempts.length 
      };
    }));
    return requestsWithHistory;
  }

  async getById(id, { includeStatusHistory = false } = {}) {
    const result = await query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = result.rows[0];
    if (!request) return null;
    
    if (!includeStatusHistory) {
      // Just include the count
      const countResult = await query(
        `SELECT COUNT(*) as delivery_attempt_count 
         FROM request_status_history 
         WHERE request_id = $1 AND status IN ('delivered', 'delivery_attempt_failed')`,
        [id]
      );
      return { ...request, deliveryAttemptCount: parseInt(countResult.rows[0].delivery_attempt_count) };
    }
    
    const history = await this.getStatusHistory(id);
    const deliveryAttempts = history.filter(h => 
      h.status === 'delivered' || h.status === 'delivery_attempt_failed'
    );
    return { 
      ...request, 
      statusHistory: history,
      deliveryAttemptCount: deliveryAttempts.length 
    };
  }

  async create(requestData) {
    // Map camelCase API fields to snake_case database fields
    const { 
      friendId, 
      locationId, 
      runId,
      category,
      item_name,
      description, 
      quantity,
      priority,
      status,
      notes,
      takenBy,
      deliveredBy
    } = requestData;
    
    const result = await query(
      `INSERT INTO requests (
        friend_id, location_id, run_id, category, item_name, description, 
        quantity, priority, status, notes, taken_by, delivered_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        friendId, 
        locationId, 
        runId || null,
        category, 
        item_name, 
        description || null, 
        quantity || 1,
        priority || 'medium',
        status || 'pending',
        notes || null,
        takenBy || null,
        deliveredBy || null
      ]
    );
    return result.rows[0];
  }

  async update(id, updateData) {
    const { status } = updateData;
    const result = await query('UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0];
  }

  async delete(id) {
    await query('DELETE FROM requests WHERE id = $1', [id]);
  }

  async addStatusHistory(requestId, historyData) {
    const { status, notes, user_id } = historyData;
    
    // Insert status history entry
    const historyResult = await query(
      'INSERT INTO request_status_history (request_id, status, notes, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [requestId, status, notes, user_id]
    );
    
    // Update request status UNLESS it's a failed delivery attempt
    if (status !== 'delivery_attempt_failed') {
      await query('UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2', [status, requestId]);
    }
    
    return historyResult.rows[0];
  }

  async getStatusHistory(requestId) {
    const result = await query(
      'SELECT * FROM request_status_history WHERE request_id = $1 ORDER BY created_at DESC', 
      [requestId]
    );
    return result.rows;
  }

  async getDeliveryAttempts(requestId) {
    // Returns only delivery-related entries (both successful and failed)
    const result = await query(
      `SELECT * FROM request_status_history 
       WHERE request_id = $1 AND status IN ('delivered', 'delivery_attempt_failed') 
       ORDER BY created_at DESC`,
      [requestId]
    );
    return result.rows;
  }
}

export default RequestRepository;
