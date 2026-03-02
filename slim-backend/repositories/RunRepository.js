// Run Repository
// Data access layer for runs with team and execution management

import BaseRepository from './BaseRepository.js';

class RunRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'runs');
  }

  /**
   * Generate run name: "{route_name} {day_of_week} {YYYY-MM-DD}"
   * @param {string} routeName - Route name
   * @param {Date} scheduledDate - Scheduled date
   * @returns {string} Generated run name
   */
  static generateRunName(routeName, scheduledDate) {
    const date = new Date(scheduledDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getDay()];
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${routeName} ${dayOfWeek} ${dateStr}`;
  }

  /**
   * Get all runs with route and team info
   * @param {Object} options - Query options (status, routeId, limit, offset)
   * @returns {Promise<Array>} Runs with joined data
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
      whereClause += (whereClause ? ' AND ' : '') + `r.route_id = $${paramIndex}`;
      params.push(routeId);
      paramIndex++;
    }

    const query = `
      SELECT 
        r.*,
        rt.name as route_name,
        rt.description as route_description,
        COUNT(DISTINCT rtm.user_id) as team_size,
        l.name as current_location_name,
        l.route_order as current_stop_number
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN run_team_members rtm ON r.id = rtm.run_id
      LEFT JOIN locations l ON r.current_location_id = l.id
      ${whereClause ? 'WHERE ' + whereClause : ''}
      GROUP BY r.id, rt.name, rt.description, l.name, l.route_order
      ORDER BY r.scheduled_date DESC, r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Get single run with full details (route, team, locations, deliveries)
   * @param {number} runId - Run ID
   * @returns {Promise<Object|null>} Run with all related data
   */
  async getByIdWithDetails(runId) {
    const query = `
      SELECT 
        r.*,
        rt.name as route_name,
        rt.description as route_description,
        l.name as current_location_name,
        l.route_order as current_stop_number
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN locations l ON r.current_location_id = l.id
      WHERE r.id = $1
    `;

    const result = await this.query(query, [runId]);
    if (result.rows.length === 0) return null;

    const run = result.rows[0];

    // Get team members
    const teamQuery = `
      SELECT 
        rtm.*,
        u.name as user_name,
        u.email as user_email
      FROM run_team_members rtm
      JOIN users u ON rtm.user_id = u.id
      WHERE rtm.run_id = $1
      ORDER BY rtm.created_at ASC
    `;
    const teamResult = await this.query(teamQuery, [runId]);
    run.team = teamResult.rows;

    // Get route locations
    const locationsQuery = `
      SELECT * FROM locations
      WHERE route_id = $1
      ORDER BY route_order ASC
    `;
    const locationsResult = await this.query(locationsQuery, [run.route_id]);
    run.locations = locationsResult.rows;

    // Get delivery records
    const deliveriesQuery = `
      SELECT 
        rsd.*,
        l.name as location_name,
        l.route_order,
        u.name as delivered_by_name
      FROM run_stop_deliveries rsd
      JOIN locations l ON rsd.location_id = l.id
      LEFT JOIN users u ON rsd.delivered_by = u.id
      WHERE rsd.run_id = $1
      ORDER BY l.route_order ASC
    `;
    const deliveriesResult = await this.query(deliveriesQuery, [runId]);
    run.deliveries = deliveriesResult.rows;

    return run;
  }

  /**
   * Create run with auto-generated name
   * @param {Object} data - Run data (must include routeId and scheduledDate)
   * @returns {Promise<Object>} Created run
   */
  async createWithAutoName(data) {
    // Get route name for auto-naming
    const routeQuery = 'SELECT name FROM routes WHERE id = $1';
    const routeResult = await this.query(routeQuery, [data.route_id]);
    
    if (routeResult.rows.length === 0) {
      throw new Error('Route not found');
    }

    const routeName = routeResult.rows[0].name;
    const autoName = RunRepository.generateRunName(routeName, data.scheduled_date);

    return await this.create({
      ...data,
      name: autoName,
      status: 'planned'
    });
  }

  /**
   * Add user to run team
   * @param {number} runId - Run ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Team member record
   */
  async addTeamMember(runId, userId) {
    const query = `
      INSERT INTO run_team_members (run_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await this.query(query, [runId, userId]);
    return result.rows[0];
  }

  /**
   * Remove user from run team
   * @param {number} runId - Run ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async removeTeamMember(runId, userId) {
    const query = `
      DELETE FROM run_team_members
      WHERE run_id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await this.query(query, [runId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get team lead (first member added)
   * @param {number} runId - Run ID
   * @returns {Promise<Object|null>} Team lead user
   */
  async getTeamLead(runId) {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        rtm.created_at as joined_at
      FROM run_team_members rtm
      JOIN users u ON rtm.user_id = u.id
      WHERE rtm.run_id = $1
      ORDER BY rtm.created_at ASC
      LIMIT 1
    `;

    const result = await this.query(query, [runId]);
    return result.rows[0] || null;
  }

  /**
   * Update run status
   * @param {number} runId - Run ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Updated run
   */
  async updateStatus(runId, newStatus) {
    return await this.update(runId, { status: newStatus });
  }

  /**
   * Start run execution (set status to in_progress, set first location)
   * @param {number} runId - Run ID
   * @returns {Promise<Object>} Updated run
   */
  async startExecution(runId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get first location
      const locQuery = `
        SELECT l.id
        FROM locations l
        JOIN runs r ON l.route_id = r.route_id
        WHERE r.id = $1
        ORDER BY l.route_order ASC
        LIMIT 1
      `;
      const locResult = await client.query(locQuery, [runId]);
      
      if (locResult.rows.length === 0) {
        throw new Error('Route has no locations');
      }

      const firstLocationId = locResult.rows[0].id;

      // Update run
      const updateResult = await client.query(
        `UPDATE runs 
         SET status = 'in_progress', 
             current_location_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [firstLocationId, runId]
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
   * Move to next location
   * @param {number} runId - Run ID
   * @returns {Promise<Object>} Updated run with new current location
   */
  async moveToNextLocation(runId) {
    const query = `
      UPDATE runs r
      SET current_location_id = (
        SELECT l.id
        FROM locations l
        WHERE l.route_id = r.route_id
          AND l.route_order > (
            SELECT route_order 
            FROM locations 
            WHERE id = r.current_location_id
          )
        ORDER BY l.route_order ASC
        LIMIT 1
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE r.id = $1
      RETURNING *
    `;

    const result = await this.query(query, [runId]);
    return result.rows[0];
  }

  /**
   * Complete run (set status to completed)
   * @param {number} runId - Run ID
   * @returns {Promise<Object>} Completed run
   */
  async completeRun(runId) {
    return await this.update(runId, { 
      status: 'completed',
      current_location_id: null
    });
  }

  /**
   * Record delivery at location
   * @param {Object} data - Delivery data
   * @returns {Promise<Object>} Delivery record
   */
  async recordDelivery(data) {
    const query = `
      INSERT INTO run_stop_deliveries 
        (run_id, location_id, meals_delivered, weekly_items, notes, delivered_by, delivered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (run_id, location_id) 
      DO UPDATE SET
        meals_delivered = EXCLUDED.meals_delivered,
        weekly_items = EXCLUDED.weekly_items,
        notes = EXCLUDED.notes,
        delivered_by = EXCLUDED.delivered_by,
        delivered_at = EXCLUDED.delivered_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await this.query(query, [
      data.run_id,
      data.location_id,
      data.meals_delivered,
      data.weekly_items ? JSON.stringify(data.weekly_items) : null,
      data.notes || null,
      data.delivered_by || null,
      data.delivered_at || new Date()
    ]);

    return result.rows[0];
  }

  /**
   * Get run preparation checklist (requests ready for delivery on this route)
   * @param {number} runId - Run ID
   * @returns {Promise<Array>} Requests grouped by location
   */
  async getPreparationChecklist(runId) {
    const query = `
      SELECT 
        l.id as location_id,
        l.name as location_name,
        l.route_order,
        r.id as request_id,
        r.item_description,
        r.quantity,
        r.priority,
        r.status,
        f.first_name,
        f.last_name,
        f.alias
      FROM runs run
      JOIN locations l ON run.route_id = l.route_id
      LEFT JOIN requests r ON r.location_id = l.id 
        AND r.status IN ('ready_for_delivery', 'taken')
      LEFT JOIN friends f ON r.friend_id = f.id
      WHERE run.id = $1
      ORDER BY l.route_order ASC, r.priority ASC, r.created_at ASC
    `;

    const result = await this.query(query, [runId]);
    return result.rows;
  }
}

export default RunRepository;
