import { query } from '../database.js';

class UserService {
  // Get all users
  async getAllUsers() {
    const result = await query('SELECT id, username, email, role, name, phone, created_at FROM users ORDER BY name');
    return result.rows;
  }

  // Get user by ID
  async getUserById(id) {
    const result = await query('SELECT id, username, email, role, name, phone, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get user by username (for authentication)
  async getUserByUsername(username) {
    const result = await query('SELECT id, username, email, password_hash, role, name, phone FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  // Get user by email (for authentication)
  async getUserByEmail(email) {
    const result = await query('SELECT id, username, email, password_hash, role, name, phone FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Create new user
  async createUser({ username, email, password_hash, role, name, phone }) {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, name, phone, created_at`,
      [username, email, password_hash, role, name, phone]
    );
    return result.rows[0];
  }

  // Update user
  async updateUser(id, { username, email, role, name, phone }) {
    const result = await query(
      `UPDATE users 
       SET username = $2, email = $3, role = $4, name = $5, phone = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, email, role, name, phone, updated_at`,
      [id, username, email, role, name, phone]
    );
    return result.rows[0];
  }

  // Delete user
  async deleteUser(id) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }

  // Check if username exists
  async usernameExists(username, excludeId = null) {
    let sql = 'SELECT COUNT(*) FROM users WHERE username = $1';
    let params = [username];
    
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count) > 0;
  }

  // Check if email exists
  async emailExists(email, excludeId = null) {
    let sql = 'SELECT COUNT(*) FROM users WHERE email = $1';
    let params = [email];
    
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count) > 0;
  }
}

export default new UserService();