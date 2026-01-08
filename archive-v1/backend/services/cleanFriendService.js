/**
 * CleanFriendService - Clean Architecture Implementation
 * Follows established patterns from CleanRunService
 * Provides consistent data transformation and error handling
 */

import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';

class CleanFriendService {
  constructor(database, logger = console) {
    this.db = database;
    this.logger = logger;
  }
  /**
   * Transform database friend record to clean API format
   */
  #transformFromDb(dbFriend) {
    if (!dbFriend) return null;

    return {
      id: dbFriend.id,
      name: dbFriend.name,
      nickname: dbFriend.nickname || null,
      email: dbFriend.email || null,
      phone: dbFriend.phone || null,
      notes: dbFriend.notes || null,
      clothingSizes: dbFriend.clothing_sizes || null,
      dietaryRestrictions: dbFriend.dietary_restrictions || null,
      status: dbFriend.status || 'active',
      lastContact: dbFriend.last_contact ? dbFriend.last_contact.toISOString() : null,
      currentLocationId: dbFriend.current_location_id || null,
      locationName: dbFriend.location_name || null,
      requestCount: parseInt(dbFriend.request_count) || 0,
      createdAt: dbFriend.created_at ? dbFriend.created_at.toISOString() : null,
      updatedAt: dbFriend.updated_at ? dbFriend.updated_at.toISOString() : null
    };
  }

  /**
   * Transform API input to database format
   */
  #transformToDb(apiFriend) {
    const dbFriend = {};

    if (apiFriend.name !== undefined) dbFriend.name = apiFriend.name;
    if (apiFriend.nickname !== undefined) dbFriend.nickname = apiFriend.nickname;
    if (apiFriend.email !== undefined) dbFriend.email = apiFriend.email;
    if (apiFriend.phone !== undefined) dbFriend.phone = apiFriend.phone;
    if (apiFriend.notes !== undefined) dbFriend.notes = apiFriend.notes;
    if (apiFriend.clothingSizes !== undefined) {
      dbFriend.clothing_sizes = apiFriend.clothingSizes ? JSON.stringify(apiFriend.clothingSizes) : null;
    }
    if (apiFriend.dietaryRestrictions !== undefined) dbFriend.dietary_restrictions = apiFriend.dietaryRestrictions;
    if (apiFriend.status !== undefined) dbFriend.status = apiFriend.status;
    if (apiFriend.lastContact !== undefined) dbFriend.last_contact = apiFriend.lastContact;
    // Note: currentLocationId is now managed via friend_location_history table

    return dbFriend;
  }

  /**
   * Validate friend data
   */
  #validateFriend(friendData) {
    const errors = [];

    if (!friendData.name || friendData.name.trim().length === 0) {
      errors.push('Name is required');
    }
    if (friendData.name && friendData.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }
    if (friendData.nickname && friendData.nickname.length > 50) {
      errors.push('Nickname must be 50 characters or less');
    }
    if (friendData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(friendData.email)) {
      errors.push('Invalid email format');
    }
    if (friendData.status && !['active', 'inactive', 'moved'].includes(friendData.status)) {
      errors.push('Status must be active, inactive, or moved');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Friend validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get all friends with location and request count information
   */
  async getAll(filters = {}) {
    try {
      let sql = `
        SELECT f.*, 
               flh_current.location_id as current_location_id,
               l.name as location_name,
               COUNT(req.id) as request_count
        FROM friends f
        LEFT JOIN LATERAL (
          SELECT location_id 
          FROM friend_location_history flh 
          WHERE flh.friend_id = f.id 
          ORDER BY flh.date_recorded DESC 
          LIMIT 1
        ) flh_current ON true
        LEFT JOIN locations l ON flh_current.location_id = l.id
        LEFT JOIN requests req ON f.id = req.friend_id
      `;
      
      const params = [];
      const conditions = [];

      // Apply filters
      if (filters.status) {
        conditions.push(`f.status = $${params.length + 1}`);
        params.push(filters.status);
      }
      if (filters.locationId) {
        conditions.push(`flh_current.location_id = $${params.length + 1}`);
        params.push(filters.locationId);
      }
      if (filters.search) {
        conditions.push(`(f.name ILIKE $${params.length + 1} OR f.nickname ILIKE $${params.length + 1})`);
        params.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      sql += `
        GROUP BY f.id, flh_current.location_id, l.name
        ORDER BY f.name
      `;

      const result = await this.db.query(sql, params);
      const friends = result.rows.map(friend => this.#transformFromDb(friend));

      // For each friend, get their location history count and most recent entry (lightweight)
      const friendIds = friends.map(f => f.id);
      if (friendIds.length > 0) {
        const historyResult = await this.db.query(`
          SELECT 
            flh.friend_id,
            COUNT(*) as location_count,
            MAX(flh.date_recorded) as most_recent_date
          FROM friend_location_history flh
          WHERE flh.friend_id = ANY($1)
          GROUP BY flh.friend_id
        `, [friendIds]);

        // Add location summary to friends
        friends.forEach(friend => {
          const historySummary = historyResult.rows.find(h => h.friend_id === friend.id);
          friend.locationHistoryCount = historySummary ? parseInt(historySummary.location_count) : 0;
          friend.mostRecentLocationDate = historySummary?.most_recent_date?.toISOString() || null;
        });
      }

      return friends;
    } catch (error) {
      throw new DatabaseError(`Failed to retrieve friends: ${error.message}`);
    }
  }

  /**
   * Get friend by ID with full details including requests
   */
  async getById(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid friend ID is required');
    }

    try {
      // Get friend with location info
      const friendResult = await this.db.query(`
        SELECT f.*, 
               flh_current.location_id as current_location_id,
               l.name as location_name,
               COUNT(req.id) as request_count
        FROM friends f
        LEFT JOIN LATERAL (
          SELECT location_id 
          FROM friend_location_history flh 
          WHERE flh.friend_id = f.id 
          ORDER BY flh.date_recorded DESC 
          LIMIT 1
        ) flh_current ON true
        LEFT JOIN locations l ON flh_current.location_id = l.id
        LEFT JOIN requests req ON f.id = req.friend_id
        WHERE f.id = $1
        GROUP BY f.id, flh_current.location_id, l.name
      `, [id]);

      if (friendResult.rows.length === 0) {
        throw new NotFoundError(`Friend with ID ${id} not found`);
      }

      const friend = this.#transformFromDb(friendResult.rows[0]);

      // Get friend's requests
      const requestsResult = await this.db.query(`
        SELECT req.*, 
               u.name as taken_by_name, 
               u2.name as delivered_by_name,
               l.name as location_name
        FROM requests req
        LEFT JOIN users u ON req.taken_by = u.id
        LEFT JOIN users u2 ON req.delivered_by = u2.id
        LEFT JOIN locations l ON req.location_id = l.id
        WHERE req.friend_id = $1
        ORDER BY req.created_at DESC
      `, [id]);

      // Transform requests to clean format
      friend.requests = requestsResult.rows.map(req => ({
        id: req.id,
        category: req.category,
        itemName: req.item_name,
        description: req.description,
        quantity: req.quantity,
        priority: req.priority,
        status: req.status,
        notes: req.notes,
        takenBy: req.taken_by_name,
        deliveredBy: req.delivered_by_name,
        locationName: req.location_name,
        createdAt: req.created_at ? req.created_at.toISOString() : null,
        updatedAt: req.updated_at ? req.updated_at.toISOString() : null
      }));

      // Get friend's location history
      const historyResult = await this.db.query(`
        SELECT 
          flh.id,
          flh.location_id,
          flh.date_recorded,
          flh.notes,
          l.name as location_name
        FROM friend_location_history flh
        LEFT JOIN locations l ON flh.location_id = l.id
        WHERE flh.friend_id = $1
        ORDER BY flh.date_recorded DESC
      `, [id]);

      // Transform location history to clean format
      friend.locationHistory = historyResult.rows.map(entry => ({
        id: entry.id,
        locationId: entry.location_id,
        locationName: entry.location_name,
        dateRecorded: entry.date_recorded ? entry.date_recorded.toISOString() : null,
        notes: entry.notes
      }));

      // Add location history count for frontend state management
      friend.locationHistoryCount = historyResult.rows.length;

      return friend;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to retrieve friend: ${error.message}`);
    }
  }

  /**
   * Create new friend
   */
  async create(friendData) {
    this.#validateFriend(friendData);

    try {
      const dbData = this.#transformToDb(friendData);
      
      const sql = `
        INSERT INTO friends (name, nickname, email, phone, notes, clothing_sizes, 
                           dietary_restrictions, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const params = [
        dbData.name,
        dbData.nickname || null,
        dbData.email || null,
        dbData.phone || null,
        dbData.notes || null,
        dbData.clothing_sizes || null,
        dbData.dietary_restrictions || null,
        dbData.status || 'active'
      ];

      const result = await this.db.query(sql, params);
      const newFriend = result.rows[0];

      // If currentLocationId was provided, create initial location history entry
      if (friendData.currentLocationId) {
        try {
          await this.db.query(`
            INSERT INTO friend_location_history (friend_id, location_id, date_recorded, notes)
            VALUES ($1, $2, $3, $4)
          `, [
            newFriend.id,
            friendData.currentLocationId,
            new Date().toISOString(),
            'Initial location recorded during friend creation'
          ]);
        } catch (locationError) {
          console.warn(`Failed to add initial location history for friend ${newFriend.id}:`, locationError.message);
          // Don't fail the friend creation if location history fails
        }
      }

      return this.#transformFromDb(newFriend);
    } catch (error) {
      throw new DatabaseError(`Failed to create friend: ${error.message}`);
    }
  }

  /**
   * Update existing friend
   */
  async update(id, friendData) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid friend ID is required');
    }

    this.#validateFriend({ ...friendData, name: friendData.name || 'placeholder' });

    try {
      const dbData = this.#transformToDb(friendData);
      
      // Build dynamic update query
      const updates = [];
      const params = [id];
      let paramIndex = 2;

      Object.keys(dbData).forEach(key => {
        updates.push(`${key} = $${paramIndex}`);
        params.push(dbData[key]);
        paramIndex++;
      });

      if (updates.length === 0) {
        throw new ValidationError('No valid update data provided');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      const sql = `
        UPDATE friends 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(sql, params);
      
      if (result.rows.length === 0) {
        throw new NotFoundError(`Friend with ID ${id} not found`);
      }

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new DatabaseError(`Failed to update friend: ${error.message}`);
    }
  }

  /**
   * Delete friend (soft delete by setting status to inactive)
   */
  async delete(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid friend ID is required');
    }

    try {
      const result = await this.db.query(
        `UPDATE friends SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status != 'inactive'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Friend with ID ${id} not found or already inactive`);
      }

      return this.#transformFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to delete friend: ${error.message}`);
    }
  }

  /**
   * Search friends by name or nickname
   */
  async search(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    return this.getAll({ search: searchTerm.trim() });
  }

  /**
   * Get location history for a specific friend (for tooltips/on-demand loading)
   */
  async getLocationHistory(friendId) {
    if (!friendId || isNaN(parseInt(friendId))) {
      throw new ValidationError('Valid friend ID is required');
    }

    try {
      const result = await this.db.query(`
        SELECT 
          flh.id,
          flh.location_id,
          flh.date_recorded,
          flh.notes,
          l.name as location_name
        FROM friend_location_history flh
        LEFT JOIN locations l ON flh.location_id = l.id
        WHERE flh.friend_id = $1
        ORDER BY flh.date_recorded DESC
      `, [friendId]);

      return result.rows.map(entry => ({
        id: entry.id,
        locationId: entry.location_id,
        locationName: entry.location_name,
        dateRecorded: entry.date_recorded ? entry.date_recorded.toISOString() : null,
        notes: entry.notes
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to get location history: ${error.message}`);
    }
  }

  /**
   * Add location history entry for a friend
   */
  async addLocationHistory(friendId, locationData) {
    if (!friendId || isNaN(parseInt(friendId))) {
      throw new ValidationError('Valid friend ID is required');
    }

    if (!locationData.locationId || isNaN(parseInt(locationData.locationId))) {
      throw new ValidationError('Valid location ID is required');
    }

    try {
      // Verify friend exists
      const friendCheck = await this.db.query('SELECT id FROM friends WHERE id = $1', [friendId]);
      if (friendCheck.rows.length === 0) {
        throw new NotFoundError('Friend not found');
      }

      // Verify location exists
      const locationCheck = await this.db.query('SELECT id FROM locations WHERE id = $1', [locationData.locationId]);
      if (locationCheck.rows.length === 0) {
        throw new ValidationError('Location not found');
      }

      const result = await this.db.query(`
        INSERT INTO friend_location_history (friend_id, location_id, date_recorded, notes, recorded_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        friendId,
        locationData.locationId,
        new Date().toISOString(), // Always use current timestamp for proper chronological ordering
        locationData.notes || null,
        locationData.recordedBy || null
      ]);

      const newEntry = result.rows[0];

      // Get location name for response
      const locationResult = await this.db.query('SELECT name FROM locations WHERE id = $1', [newEntry.location_id]);
      
      return {
        id: newEntry.id,
        locationId: newEntry.location_id,
        locationName: locationResult.rows[0]?.name || null,
        dateRecorded: newEntry.date_recorded ? newEntry.date_recorded.toISOString() : null,
        notes: newEntry.notes,
        recordedBy: newEntry.recorded_by
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add location history: ${error.message}`);
    }
  }

  /**
   * Delete friend and all associated data
   */
  async delete(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid friend ID is required');
    }

    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Verify friend exists first
      const friendCheck = await this.db.query('SELECT id, name FROM friends WHERE id = $1', [id]);
      if (friendCheck.rows.length === 0) {
        await this.db.query('ROLLBACK');
        throw new NotFoundError(`Friend with ID ${id} not found`);
      }

      const friendName = friendCheck.rows[0].name;

      // Delete location history first (due to foreign key constraint)
      await this.db.query('DELETE FROM friend_location_history WHERE friend_id = $1', [id]);

      // Delete requests associated with the friend
      await this.db.query('DELETE FROM requests WHERE friend_id = $1', [id]);

      // Finally, delete the friend
      await this.db.query('DELETE FROM friends WHERE id = $1', [id]);

      // Commit transaction
      await this.db.query('COMMIT');

      this.logger.log(`Friend ${friendName} (ID: ${id}) and all associated data deleted successfully`);

      return {
        id: parseInt(id),
        name: friendName,
        deleted: true
      };
    } catch (error) {
      // Rollback transaction on error
      await this.db.query('ROLLBACK');
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete friend: ${error.message}`);
    }
  }
}

export default CleanFriendService;