const { query } = require('../database');

class RunService {
  // Get all runs with route and team info
  async getAllRuns() {
    const result = await query(`
      SELECT r.*, rt.name as route_name, rt.color as route_color,
             u.name as created_by_name,
             COUNT(DISTINCT rtm.user_id) as team_size,
             COUNT(DISTINCT req.id) as request_count
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN run_team_members rtm ON r.id = rtm.run_id
      LEFT JOIN requests req ON r.id = req.run_id
      GROUP BY r.id, rt.name, rt.color, u.name
      ORDER BY r.scheduled_date DESC, r.start_time
    `);
    return result.rows;
  }

  // Get run by ID with full details
  async getRunById(id) {
    const runResult = await query(`
      SELECT r.*, rt.name as route_name, rt.color as route_color, u.name as created_by_name
      FROM runs r
      JOIN routes rt ON r.route_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [id]);
    
    if (runResult.rows.length === 0) return null;

    // Get team members
    const teamResult = await query(`
      SELECT rtm.*, u.name as user_name, u.email as user_email
      FROM run_team_members rtm
      JOIN users u ON rtm.user_id = u.id
      WHERE rtm.run_id = $1
      ORDER BY rtm.role DESC, u.name
    `, [id]);

    // Get requests
    const requestsResult = await query(`
      SELECT req.*, f.name as friend_name, l.name as location_name,
             u.name as taken_by_name, u2.name as delivered_by_name
      FROM requests req
      JOIN friends f ON req.friend_id = f.id
      JOIN locations l ON f.location_id = l.id
      LEFT JOIN users u ON req.taken_by = u.id
      LEFT JOIN users u2 ON req.delivered_by = u2.id
      WHERE req.run_id = $1
      ORDER BY l.order_in_route, f.name
    `, [id]);

    return {
      ...runResult.rows[0],
      team: teamResult.rows,
      requests: requestsResult.rows
    };
  }

  // Create new run
  async createRun({ route_id, name, scheduled_date, start_time, end_time, notes, created_by }) {
    const result = await query(
      `INSERT INTO runs (route_id, name, scheduled_date, start_time, end_time, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [route_id, name, scheduled_date, start_time, end_time, notes, created_by]
    );
    return result.rows[0];
  }

  // Update run
  async updateRun(id, { route_id, name, scheduled_date, start_time, end_time, status, notes }) {
    const result = await query(
      `UPDATE runs 
       SET route_id = $2, name = $3, scheduled_date = $4, start_time = $5, end_time = $6, status = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, route_id, name, scheduled_date, start_time, end_time, status, notes]
    );
    return result.rows[0];
  }

  // Delete run
  async deleteRun(id) {
    const result = await query('DELETE FROM runs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Add team member to run
  async addTeamMember(runId, userId, role = 'volunteer') {
    const result = await query(
      'INSERT INTO run_team_members (run_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (run_id, user_id) DO UPDATE SET role = $3 RETURNING *',
      [runId, userId, role]
    );
    return result.rows[0];
  }

  // Remove team member from run
  async removeTeamMember(runId, userId) {
    const result = await query(
      'DELETE FROM run_team_members WHERE run_id = $1 AND user_id = $2 RETURNING *',
      [runId, userId]
    );
    return result.rows[0];
  }

  // Get team members for a run
  async getTeamMembers(runId) {
    const result = await query(`
      SELECT rtm.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM run_team_members rtm
      JOIN users u ON rtm.user_id = u.id
      WHERE rtm.run_id = $1
      ORDER BY rtm.role DESC, u.name
    `, [runId]);
    return result.rows;
  }
}

module.exports = new RunService();