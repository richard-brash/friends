// RunRepository.js
// Data access layer for runs (PostgreSQL, can be swapped for other DBs)

import { query } from '../database.js';

class RunRepository {
  /**
   * Get all runs with optional filters
   * Returns runs with aggregated counts (team size, request count)
   */
  async getAll(filters = {}) {
    let queryText = `
      SELECT 
        r.id, r.route_id, r.name, r.scheduled_date, r.start_time, r.end_time,
        r.meal_count, r.status, r.notes, r.created_by, r.created_at, r.updated_at,
        rt.name as route_name, rt.color as route_color,
        u.name as created_by_name,
        COUNT(DISTINCT rtm.user_id) as team_size,
        COUNT(DISTINCT req.id) as request_count
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN run_team_members rtm ON r.id = rtm.run_id
      LEFT JOIN locations l ON rt.id = l.route_id
      LEFT JOIN requests req ON l.id = req.location_id AND req.status IN ('ready_for_delivery', 'taken')
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (filters.status) {
      paramCount++;
      queryText += ` AND r.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.fromDate) {
      paramCount++;
      queryText += ` AND r.scheduled_date >= $${paramCount}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      paramCount++;
      queryText += ` AND r.scheduled_date <= $${paramCount}`;
      params.push(filters.toDate);
    }

    queryText += `
      GROUP BY r.id, rt.id, u.id
      ORDER BY r.scheduled_date DESC, r.start_time
    `;

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get a single run by ID with basic details
   * Does NOT include team members or requests (use separate methods for those)
   */
  async getById(id) {
    const result = await query(`
      SELECT 
        r.id, r.route_id, r.name, r.scheduled_date, r.start_time, r.end_time,
        r.meal_count, r.status, r.notes, r.created_by, r.created_at, r.updated_at,
        rt.name as route_name, rt.color as route_color,
        u.name as created_by_name
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  /**
   * Get run with full details including team members and requests
   */
  async getByIdWithDetails(id) {
    const run = await this.getById(id);
    if (!run) return null;

    // Get team members
    const team = await this.getTeamMembers(id);
    
    // Get requests for this run
    const requestsResult = await query(`
      SELECT 
        req.*,
        f.name as friend_name,
        l.name as location_name,
        l.route_order as location_order,
        u1.name as taken_by_name,
        u2.name as delivered_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON req.location_id = l.id
      LEFT JOIN users u1 ON req.taken_by = u1.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.run_id = $1
      ORDER BY l.route_order, f.name
    `, [id]);

    return {
      ...run,
      team: team,
      requests: requestsResult.rows
    };
  }

  /**
   * Create a new run
   * Auto-generates name in format: "{route_name} {day_of_week} {YYYY-MM-DD}"
   */
  async create(runData) {
    const { 
      route_id, 
      scheduled_date, 
      start_time, 
      end_time,
      meal_count = 0,
      status = 'scheduled', 
      notes = '', 
      created_by 
    } = runData;

    // Fetch route name for auto-generation
    const routeResult = await query('SELECT name FROM routes WHERE id = $1', [route_id]);
    if (!routeResult.rows.length) {
      throw new Error(`Route with id ${route_id} not found`);
    }
    const routeName = routeResult.rows[0].name;

    // Generate run name: "{route_name} {day_of_week} {YYYY-MM-DD}"
    const date = new Date(scheduled_date + 'T00:00:00Z'); // Force UTC to avoid timezone issues
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[date.getUTCDay()]; // Use getUTCDay() for UTC
    const name = `${routeName} ${dayOfWeek} ${scheduled_date}`;

    const result = await query(
      `INSERT INTO runs 
       (route_id, name, scheduled_date, start_time, end_time, meal_count, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [route_id, name, scheduled_date, start_time, end_time, meal_count, status, notes, created_by]
    );

    return result.rows[0];
  }

  /**
   * Update a run
   * Only updates fields that are provided
   */
  async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic UPDATE query based on provided fields
    const allowedFields = [
      'route_id', 'name', 'scheduled_date', 'start_time', 
      'end_time', 'meal_count', 'status', 'notes'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        paramCount++;
        fields.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
      }
    });

    if (fields.length === 0) {
      // Nothing to update, just return current record
      return await this.getById(id);
    }

    // Add updated_at (no param, uses SQL function)
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add ID as last parameter
    paramCount++;
    values.push(id);

    const queryText = `
      UPDATE runs 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryText, values);
    return result.rows[0];
  }

  /**
   * Delete a run
   */
  async delete(id) {
    const result = await query('DELETE FROM runs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  /**
   * Get all team members for a run
   * Team members are ordered by created_at ASC - first member = run lead
   */
  async getTeamMembers(runId) {
    const result = await query(`
      SELECT 
        rtm.id, rtm.run_id, rtm.user_id, rtm.created_at,
        u.name as user_name, 
        u.email as user_email, 
        u.phone as user_phone
      FROM run_team_members rtm
      JOIN users u ON rtm.user_id = u.id
      WHERE rtm.run_id = $1
      ORDER BY rtm.created_at ASC
    `, [runId]);

    return result.rows;
  }

  /**
   * Add a team member to a run
   * First team member added (lowest created_at) becomes the run lead
   */
  async addTeamMember(runId, userId) {
    const result = await query(
      `INSERT INTO run_team_members (run_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT (run_id, user_id) 
       DO NOTHING
       RETURNING *`,
      [runId, userId]
    );

    if (!result.rows[0]) {
      return null; // Conflict - member already exists
    }

    // Fetch the full team member details with user info
    const memberResult = await query(
      `SELECT rtm.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM run_team_members rtm
       JOIN users u ON u.id = rtm.user_id
       WHERE rtm.run_id = $1 AND rtm.user_id = $2`,
      [runId, userId]
    );

    return memberResult.rows[0];
  }

  /**
   * Remove a team member from a run
   */
  async removeTeamMember(runId, userId) {
    const result = await query(
      'DELETE FROM run_team_members WHERE run_id = $1 AND user_id = $2 RETURNING *',
      [runId, userId]
    );

    return result.rows[0];
  }

  /**
   * Get requests for a specific run
   */
  async getRunRequests(runId) {
    const result = await query(`
      SELECT 
        req.*,
        f.name as friend_name,
        l.name as location_name,
        l.route_order as location_order
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON req.location_id = l.id
      WHERE req.run_id = $1
      ORDER BY l.route_order, f.name
    `, [runId]);

    return result.rows;
  }
}

export default RunRepository;
