import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';

/**
 * Run Execution Service
 * Handles active run operations: starting, navigation, delivery tracking, friend spotting
 */
class RunExecutionService {
  constructor(database, logger = console) {
    this.db = database;
    this.logger = logger;
  }

  /**
   * Get preparation data for loading the vehicle before a run
   * Returns: meal count, requests, supplies needed, route info
   */
  async getPreparationData(runId) {
    try {
      this.logger.debug('RunExecutionService.getPreparationData', { runId });

      // Get run with route info
      const runQuery = `
        SELECT r.*, rt.name as route_name, rt.description as route_description
        FROM runs r
        JOIN routes rt ON r.route_id = rt.id
        WHERE r.id = $1
      `;
      const runResult = await this.db.query(runQuery, [runId]);
      
      if (runResult.rows.length === 0) {
        throw new NotFoundError(`Run with id ${runId} not found`);
      }

      const run = this.#transformRunFromDb(runResult.rows[0]);

      // Get all requests assigned to this run OR unassigned but at a location on this route
      // For preparation: only show ready_for_delivery (items that need to be loaded)
      const requestsQuery = `
        SELECT req.*, 
               f.name as friend_name,
               l.name as location_name
        FROM requests req
        JOIN friends f ON req.friend_id = f.id
        JOIN locations l ON req.location_id = l.id
        WHERE (req.run_id = $1 OR (req.run_id IS NULL AND l.route_id = $2))
          AND req.status = 'ready_for_delivery'
        ORDER BY l.route_order NULLS LAST, f.name
      `;
      const requestsResult = await this.db.query(requestsQuery, [runId, run.routeId]);
      const requests = requestsResult.rows.map(row => this.#transformRequestFromDb(row));

      // Calculate supplies needed
      const supplies = {
        meals: run.mealCount,
        utensils: run.mealCount, // 1:1 ratio
        napkins: run.mealCount,
        requests: requests.length
      };

      return {
        run,
        requests,
        supplies,
        totalStops: await this.#getStopCount(run.routeId)
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      this.logger.error('RunExecutionService.getPreparationData failed', { error, runId });
      throw new DatabaseError('Failed to retrieve preparation data', error);
    }
  }

  /**
   * Get full execution context for active run
   * Returns: route with ordered stops, expected friends per location, assigned requests
   */
  async getExecutionContext(runId) {
    try {
      this.logger.debug('RunExecutionService.getExecutionContext', { runId });

      // Get run with current position
      const runQuery = `
        SELECT r.*, rt.name as route_name
        FROM runs r
        JOIN routes rt ON r.route_id = rt.id
        WHERE r.id = $1
      `;
      const runResult = await this.db.query(runQuery, [runId]);
      
      if (runResult.rows.length === 0) {
        throw new NotFoundError(`Run with id ${runId} not found`);
      }

      const run = this.#transformRunFromDb(runResult.rows[0]);

      // Get ordered stops on this route
      const stopsQuery = `
        SELECT l.*
        FROM locations l
        WHERE l.route_id = $1
        ORDER BY l.route_order NULLS LAST
      `;
      const stopsResult = await this.db.query(stopsQuery, [run.routeId]);
      const stops = stopsResult.rows.map(row => this.#transformLocationFromDb(row));

      // Get expected friends at each location (most recent sighting)
      const friendsQuery = `
        SELECT DISTINCT ON (flh.friend_id, flh.location_id)
               f.id, f.name, f.nickname, flh.location_id,
               flh.date_recorded as last_seen
        FROM friend_location_history flh
        JOIN friends f ON flh.friend_id = f.id
        WHERE flh.location_id = ANY($1)
          AND f.status = 'active'
        ORDER BY flh.friend_id, flh.location_id, flh.date_recorded DESC
      `;
      const locationIds = stops.map(s => s.id);
      const friendsResult = await this.db.query(friendsQuery, [locationIds]);
      
      // Group friends by location
      const friendsByLocation = {};
      friendsResult.rows.forEach(row => {
        const locId = row.location_id;
        if (!friendsByLocation[locId]) friendsByLocation[locId] = [];
        friendsByLocation[locId].push({
          id: row.id,
          name: row.name,
          nickname: row.nickname,
          lastSeen: row.last_seen
        });
      });

      // Get requests by location (assigned to this run OR unassigned but on this route)
      // For active run: only show taken (items loaded on vehicle ready to deliver)
      const requestsQuery = `
        SELECT req.*, f.name as friend_name, l.route_id
        FROM requests req
        JOIN friends f ON req.friend_id = f.id
        JOIN locations l ON req.location_id = l.id
        WHERE (req.run_id = $1 OR (req.run_id IS NULL AND l.route_id = $2))
          AND req.status = 'taken'
        ORDER BY req.location_id, req.priority DESC
      `;
      const requestsResult = await this.db.query(requestsQuery, [runId, run.routeId]);
      
      // Group requests by location
      const requestsByLocation = {};
      requestsResult.rows.forEach(row => {
        const locId = row.location_id;
        if (!requestsByLocation[locId]) requestsByLocation[locId] = [];
        requestsByLocation[locId].push(this.#transformRequestFromDb(row));
      });

      // Get delivery records
      const deliveriesQuery = `
        SELECT * FROM run_stop_deliveries WHERE run_id = $1
      `;
      const deliveriesResult = await this.db.query(deliveriesQuery, [runId]);
      const deliveries = {};
      deliveriesResult.rows.forEach(row => {
        deliveries[row.location_id] = this.#transformDeliveryFromDb(row);
      });

      // Enrich stops with context
      const enrichedStops = stops.map(stop => ({
        ...stop,
        expectedFriends: friendsByLocation[stop.id] || [],
        requests: requestsByLocation[stop.id] || [],
        delivery: deliveries[stop.id] || null
      }));

      return {
        run,
        stops: enrichedStops,
        currentStopIndex: run.currentStopNumber - 1 // 0-indexed for array access
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      this.logger.error('RunExecutionService.getExecutionContext failed', { error, runId });
      throw new DatabaseError('Failed to retrieve execution context', error);
    }
  }

  /**
   * Start a run (set status to in_progress, move to first stop)
   */
  async startRun(runId, userId) {
    try {
      this.logger.debug('RunExecutionService.startRun', { runId, userId });

      // Get first location on route
      const firstLocationQuery = `
        SELECT l.id
        FROM locations l
        JOIN runs r ON l.route_id = r.route_id
        WHERE r.id = $1
        ORDER BY l.route_order NULLS LAST
        LIMIT 1
      `;
      const firstLocationResult = await this.db.query(firstLocationQuery, [runId]);
      
      if (firstLocationResult.rows.length === 0) {
        throw new ValidationError('Cannot start run: route has no locations');
      }

      const firstLocationId = firstLocationResult.rows[0].id;

      // Update run status
      const updateQuery = `
        UPDATE runs
        SET status = 'in_progress',
            current_location_id = $1,
            current_stop_number = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query(updateQuery, [firstLocationId, runId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Run with id ${runId} not found`);
      }

      this.logger.info('Run started', { runId, userId, firstLocationId });
      return this.#transformRunFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      this.logger.error('RunExecutionService.startRun failed', { error, runId, userId });
      throw new DatabaseError('Failed to start run', error);
    }
  }

  /**
   * Advance to next stop on route
   */
  async advanceToNextStop(runId, userId) {
    try {
      this.logger.debug('RunExecutionService.advanceToNextStop', { runId, userId });

      // Get current position and next location
      const nextLocationQuery = `
        SELECT 
          r.current_stop_number,
          l.id as next_location_id,
          l.route_order
        FROM runs r
        JOIN locations l ON l.route_id = r.route_id
        WHERE r.id = $1
          AND l.route_order > (
            SELECT route_order FROM locations WHERE id = r.current_location_id
          )
        ORDER BY l.route_order NULLS LAST
        LIMIT 1
      `;
      const result = await this.db.query(nextLocationQuery, [runId]);

      if (result.rows.length === 0) {
        throw new ValidationError('No more stops on this route');
      }

      const { current_stop_number, next_location_id } = result.rows[0];

      // Update run
      const updateQuery = `
        UPDATE runs
        SET current_location_id = $1,
            current_stop_number = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await this.db.query(updateQuery, [
        next_location_id,
        current_stop_number + 1,
        runId
      ]);

      this.logger.info('Advanced to next stop', { runId, userId, nextLocationId: next_location_id });
      return this.#transformRunFromDb(updateResult.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      this.logger.error('RunExecutionService.advanceToNextStop failed', { error, runId, userId });
      throw new DatabaseError('Failed to advance to next stop', error);
    }
  }

  /**
   * Go back to previous stop
   */
  async returnToPreviousStop(runId, userId) {
    try {
      this.logger.debug('RunExecutionService.returnToPreviousStop', { runId, userId });

      // Get previous location
      const prevLocationQuery = `
        SELECT 
          r.current_stop_number,
          l.id as prev_location_id
        FROM runs r
        JOIN locations l ON l.route_id = r.route_id
        WHERE r.id = $1
          AND l.route_order < (
            SELECT route_order FROM locations WHERE id = r.current_location_id
          )
        ORDER BY l.route_order DESC NULLS LAST
        LIMIT 1
      `;
      const result = await this.db.query(prevLocationQuery, [runId]);

      if (result.rows.length === 0) {
        throw new ValidationError('Already at first stop');
      }

      const { current_stop_number, prev_location_id } = result.rows[0];

      // Update run
      const updateQuery = `
        UPDATE runs
        SET current_location_id = $1,
            current_stop_number = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await this.db.query(updateQuery, [
        prev_location_id,
        current_stop_number - 1,
        runId
      ]);

      this.logger.info('Returned to previous stop', { runId, userId, prevLocationId: prev_location_id });
      return this.#transformRunFromDb(updateResult.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      this.logger.error('RunExecutionService.returnToPreviousStop failed', { error, runId, userId });
      throw new DatabaseError('Failed to return to previous stop', error);
    }
  }

  /**
   * Record meals delivered at current stop
   */
  async recordStopDelivery(runId, locationId, mealsDelivered, notes, userId) {
    try {
      this.logger.debug('RunExecutionService.recordStopDelivery', { runId, locationId, mealsDelivered, userId });

      if (mealsDelivered < 0) {
        throw new ValidationError('Meals delivered cannot be negative');
      }

      const upsertQuery = `
        INSERT INTO run_stop_deliveries (run_id, location_id, meals_delivered, visited_at, notes, recorded_by)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
        ON CONFLICT (run_id, location_id)
        DO UPDATE SET
          meals_delivered = $3,
          visited_at = CURRENT_TIMESTAMP,
          notes = $4,
          recorded_by = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await this.db.query(upsertQuery, [runId, locationId, mealsDelivered, notes, userId]);

      this.logger.info('Stop delivery recorded', { runId, locationId, mealsDelivered, userId });
      return this.#transformDeliveryFromDb(result.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      this.logger.error('RunExecutionService.recordStopDelivery failed', { error, runId, locationId, userId });
      throw new DatabaseError('Failed to record stop delivery', error);
    }
  }

  /**
   * Spot a friend at a location (adds to friend_location_history)
   */
  async spotFriend(runId, friendId, locationId, notes, userId) {
    try {
      this.logger.debug('RunExecutionService.spotFriend', { runId, friendId, locationId, userId });

      const insertQuery = `
        INSERT INTO friend_location_history (friend_id, location_id, notes, recorded_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await this.db.query(insertQuery, [friendId, locationId, notes, userId]);

      // Update friend's last_contact
      await this.db.query(
        'UPDATE friends SET last_contact = CURRENT_TIMESTAMP WHERE id = $1',
        [friendId]
      );

      this.logger.info('Friend spotted', { runId, friendId, locationId, userId });
      return this.#transformFriendSpottingFromDb(result.rows[0]);
    } catch (error) {
      this.logger.error('RunExecutionService.spotFriend failed', { error, runId, friendId, locationId, userId });
      throw new DatabaseError('Failed to record friend spotting', error);
    }
  }

  /**
   * Get changes since timestamp (for polling)
   */
  async getChangesSince(runId, sinceTimestamp) {
    try {
      this.logger.debug('RunExecutionService.getChangesSince', { runId, sinceTimestamp });

      // Get run updates
      const runQuery = 'SELECT * FROM runs WHERE id = $1';
      const runResult = await this.db.query(runQuery, [runId]);
      const run = runResult.rows.length > 0 ? this.#transformRunFromDb(runResult.rows[0]) : null;

      // Get request updates
      const requestsQuery = `
        SELECT * FROM requests 
        WHERE run_id = $1 AND updated_at > $2
        ORDER BY updated_at DESC
      `;
      const requestsResult = await this.db.query(requestsQuery, [runId, sinceTimestamp]);
      const updatedRequests = requestsResult.rows.map(row => this.#transformRequestFromDb(row));

      // Get recent friend spottings
      const spottingsQuery = `
        SELECT flh.*, f.name as friend_name, l.name as location_name
        FROM friend_location_history flh
        JOIN friends f ON flh.friend_id = f.id
        JOIN locations l ON flh.location_id = l.id
        JOIN runs r ON l.route_id = r.route_id
        WHERE r.id = $1 AND flh.created_at > $2
        ORDER BY flh.created_at DESC
      `;
      const spottingsResult = await this.db.query(spottingsQuery, [runId, sinceTimestamp]);
      const recentSpottings = spottingsResult.rows.map(row => this.#transformFriendSpottingFromDb(row));

      // Get delivery updates
      const deliveriesQuery = `
        SELECT * FROM run_stop_deliveries 
        WHERE run_id = $1 AND updated_at > $2
      `;
      const deliveriesResult = await this.db.query(deliveriesQuery, [runId, sinceTimestamp]);
      const updatedDeliveries = deliveriesResult.rows.map(row => this.#transformDeliveryFromDb(row));

      return {
        run,
        updatedRequests,
        recentSpottings,
        updatedDeliveries,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('RunExecutionService.getChangesSince failed', { error, runId, sinceTimestamp });
      throw new DatabaseError('Failed to retrieve changes', error);
    }
  }

  // Helper methods
  async #getStopCount(routeId) {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM locations WHERE route_id = $1',
      [routeId]
    );
    return parseInt(result.rows[0].count);
  }

  #transformRunFromDb(row) {
    return {
      id: row.id,
      routeId: row.route_id,
      name: row.name,
      scheduledDate: row.scheduled_date,
      startTime: row.start_time,
      endTime: row.end_time,
      mealCount: row.meal_count,
      status: row.status,
      notes: row.notes,
      currentLocationId: row.current_location_id,
      currentStopNumber: row.current_stop_number,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      routeName: row.route_name
    };
  }

  #transformLocationFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      type: row.type,
      coordinates: row.coordinates,
      notes: row.notes,
      routeId: row.route_id,
      routeOrder: row.route_order,
      createdAt: row.created_at
    };
  }

  #transformRequestFromDb(row) {
    return {
      id: row.id,
      friendId: row.friend_id,
      locationId: row.location_id,
      runId: row.run_id,
      category: row.category,
      itemName: row.item_name,
      description: row.description,
      quantity: row.quantity,
      priority: row.priority,
      status: row.status,
      notes: row.notes,
      takenBy: row.taken_by,
      deliveredBy: row.delivered_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      friendName: row.friend_name,
      locationName: row.location_name
    };
  }

  #transformDeliveryFromDb(row) {
    return {
      id: row.id,
      runId: row.run_id,
      locationId: row.location_id,
      mealsDelivered: row.meals_delivered,
      visitedAt: row.visited_at,
      notes: row.notes,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  #transformFriendSpottingFromDb(row) {
    return {
      id: row.id,
      friendId: row.friend_id,
      locationId: row.location_id,
      dateRecorded: row.date_recorded,
      notes: row.notes,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
      friendName: row.friend_name,
      locationName: row.location_name
    };
  }
}

export default RunExecutionService;
