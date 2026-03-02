// Base Repository
// Abstract base class with common CRUD operations for all repositories

class BaseRepository {
  constructor(pool, tableName) {
    this.pool = pool;
    this.tableName = tableName;
  }

  /**
   * Execute a query with error handling
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(query, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Get all records with optional filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async getAll(options = {}) {
    const {
      where = '',
      params = [],
      orderBy = 'created_at DESC',
      limit = 50,
      offset = 0
    } = options;

    const whereClause = where ? `WHERE ${where}` : '';
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await this.query(query, [...params, limit, offset]);
    return result.rows;
  }

  /**
   * Get single record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async getById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * Delete a record by ID (hard delete)
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Soft delete a record (set is_active = false or status = 'inactive')
   * @param {number} id - Record ID
   * @param {string} field - Field to update (default: 'is_active')
   * @param {*} value - Value to set (default: false)
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async softDelete(id, field = 'is_active', value = false) {
    return await this.update(id, { [field]: value });
  }

  /**
   * Count records with optional filtering
   * @param {string} where - WHERE clause
   * @param {Array} params - Query parameters
   * @returns {Promise<number>} Count of records
   */
  async count(where = '', params = []) {
    const whereClause = where ? `WHERE ${where}` : '';
    const query = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const result = await this.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if record exists by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
    const result = await this.query(query, [id]);
    return result.rows[0].exists;
  }
}

export default BaseRepository;
