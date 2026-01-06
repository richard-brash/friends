import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';

class CleanRunService {
  constructor(repository, logger = console) {
    this.repository = repository;
    this.logger = logger;
  }

  async getAll(filters = {}, options = {}) {
    try {
      this.logger.debug('CleanRunService.getAll', { filters, options });
      
      const runs = await this.repository.getAll(filters);
      
      // If includeTeam is requested, fetch team members for each run
      if (options.includeTeam) {
        const runsWithTeams = await Promise.all(
          runs.map(async (run) => {
            const teamMembers = await this.repository.getTeamMembers(run.id);
            return { ...run, team: teamMembers };
          })
        );
        return runsWithTeams.map(row => this.#transformFromDb(row));
      }
      
      return runs.map(row => this.#transformFromDb(row));
    } catch (error) {
      this.logger.error('CleanRunService.getAll failed', { error, filters });
      throw new DatabaseError('Failed to retrieve runs', error);
    }
  }

  async getById(id, options = {}) {
    try {
      this.logger.debug('CleanRunService.getById', { id, options });
      
      if (!id || isNaN(parseInt(id))) {
        throw new ValidationError('Valid ID is required');
      }

      const run = await this.repository.getById(id);

      if (!run) {
        throw new NotFoundError(`Run with id ${id} not found`);
      }

      // Optionally include team members
      if (options.includeTeam) {
        const teamMembers = await this.repository.getTeamMembers(id);
        run.team = teamMembers;
      }

      return this.#transformFromDb(run);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('CleanRunService.getById failed', { error, id });
      throw new DatabaseError('Failed to retrieve run', error);
    }
  }

  async create(data) {
    try {
      this.logger.debug('CleanRunService.create', { data });
      
      // Validate required fields
      this.#validateCreateInput(data);
      
      // Transform for database
      const dbData = this.#transformToDb(data);
      
      // Create run using repository
      const createdRun = await this.repository.create(dbData);

      const created = this.#transformFromDb(createdRun);
      this.logger.info('Run created successfully', { id: created.id });
      
      return created;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('CleanRunService.create failed', { error, data });
      throw new DatabaseError('Failed to create run', error);
    }
  }

  async update(id, data) {
    try {
      this.logger.debug('CleanRunService.update', { id, data });
      
      // Verify run exists
      await this.getById(id);
      
      // Transform for database
      const dbData = this.#transformToDb(data);
      
      // Update using repository
      const updatedRun = await this.repository.update(id, dbData);

      const updated = this.#transformFromDb(updatedRun);
      this.logger.info('Run updated successfully', { id });
      
      return updated;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('CleanRunService.update failed', { error, id, data });
      throw new DatabaseError('Failed to update run', error);
    }
  }

  async delete(id) {
    try {
      this.logger.debug('CleanRunService.delete', { id });
      
      // Get run before deleting (for return value and existence check)
      const run = await this.getById(id);
      
      // Delete from database using repository
      await this.repository.delete(id);
      
      this.logger.info('Run deleted successfully', { id });
      return run;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('CleanRunService.delete failed', { error, id });
      throw new DatabaseError('Failed to delete run', error);
    }
  }

  // Private transformation methods
  #transformFromDb(dbRow) {
    // Handle the core issue: proper date transformation
    let scheduledDate = null;
    if (dbRow.scheduled_date) {
      const dateStr = dbRow.scheduled_date instanceof Date 
        ? dbRow.scheduled_date.toISOString().split('T')[0]
        : dbRow.scheduled_date;
      
      const timeStr = dbRow.start_time || '00:00:00';
      
      // Create proper ISO date string
      scheduledDate = `${dateStr}T${timeStr}.000Z`;
    }

    const transformed = {
      id: dbRow.id,
      routeId: dbRow.route_id,
      name: dbRow.name,
      scheduledDate,
      startTime: dbRow.start_time,
      endTime: dbRow.end_time,
      mealCount: dbRow.meal_count || 0,
      status: dbRow.status,
      notes: dbRow.notes,
      createdBy: dbRow.created_by,
      createdAt: dbRow.created_at?.toISOString(),
      updatedAt: dbRow.updated_at?.toISOString(),
      // Nested route object if route data is present
      ...(dbRow.route_name && {
        route: {
          name: dbRow.route_name,
          color: dbRow.route_color
        }
      }),
      // Additional fields from joins
      ...(dbRow.created_by_name && { createdByName: dbRow.created_by_name }),
      ...(dbRow.team_size && { teamSize: parseInt(dbRow.team_size) }),
      ...(dbRow.request_count && { requestCount: parseInt(dbRow.request_count) })
    };

    // Include team members if they were attached to the dbRow
    if (dbRow.team && Array.isArray(dbRow.team)) {
      transformed.team = dbRow.team.map(member => this.#transformTeamMemberFromDb(member));
    }

    return transformed;
  }

  #transformToDb(apiData) {
    const dbData = {};
    
    if (apiData.routeId) dbData.route_id = apiData.routeId;
    // Don't allow name to be set from API - it's auto-generated
    // if (apiData.name) dbData.name = apiData.name;
    if (apiData.scheduledDate) {
      // Extract date part from ISO string or date input
      const date = new Date(apiData.scheduledDate);
      dbData.scheduled_date = date.toISOString().split('T')[0];
    }
    if (apiData.startTime) dbData.start_time = apiData.startTime;
    if (apiData.endTime) dbData.end_time = apiData.endTime;
    if (apiData.mealCount !== undefined) dbData.meal_count = apiData.mealCount;
    if (apiData.status) dbData.status = apiData.status;
    if (apiData.notes) dbData.notes = apiData.notes;
    if (apiData.createdBy) dbData.created_by = apiData.createdBy;
    
    return dbData;
  }

  // Team member management methods
  async getTeamMembers(runId) {
    try {
      this.logger.debug('CleanRunService.getTeamMembers', { runId });
      
      if (!runId || isNaN(parseInt(runId))) {
        throw new ValidationError('Valid run ID is required');
      }

      const teamMembers = await this.repository.getTeamMembers(runId);
      return teamMembers.map(member => this.#transformTeamMemberFromDb(member));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('CleanRunService.getTeamMembers failed', { error, runId });
      throw new DatabaseError('Failed to retrieve team members', error);
    }
  }

  async addTeamMember(runId, userId) {
    try {
      this.logger.debug('CleanRunService.addTeamMember', { runId, userId });
      
      if (!runId || isNaN(parseInt(runId))) {
        throw new ValidationError('Valid run ID is required');
      }
      if (!userId || isNaN(parseInt(userId))) {
        throw new ValidationError('Valid user ID is required');
      }

      const member = await this.repository.addTeamMember(runId, userId);
      this.logger.info('Team member added successfully', { runId, userId });
      
      return this.#transformTeamMemberFromDb(member);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('CleanRunService.addTeamMember failed', { error, runId, userId });
      throw new DatabaseError('Failed to add team member', error);
    }
  }

  async removeTeamMember(runId, userId) {
    try {
      this.logger.debug('CleanRunService.removeTeamMember', { runId, userId });
      
      if (!runId || isNaN(parseInt(runId))) {
        throw new ValidationError('Valid run ID is required');
      }
      if (!userId || isNaN(parseInt(userId))) {
        throw new ValidationError('Valid user ID is required');
      }

      const member = await this.repository.removeTeamMember(runId, userId);
      
      if (!member) {
        throw new NotFoundError('Team member not found');
      }
      
      this.logger.info('Team member removed successfully', { runId, userId });
      return this.#transformTeamMemberFromDb(member);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error('CleanRunService.removeTeamMember failed', { error, runId, userId });
      throw new DatabaseError('Failed to remove team member', error);
    }
  }

  #transformTeamMemberFromDb(dbRow) {
    return {
      id: dbRow.id,
      runId: dbRow.run_id,
      userId: dbRow.user_id,
      createdAt: dbRow.created_at?.toISOString(),
      userName: dbRow.user_name,
      userEmail: dbRow.user_email,
      userPhone: dbRow.user_phone
    };
  }

  #validateCreateInput(data) {
    const errors = [];

    if (!data.routeId) {
      errors.push({ field: 'routeId', message: 'Route ID is required' });
    }

    // Name is auto-generated, not required from user
    // if (!data.name || data.name.trim().length === 0) {
    //   errors.push({ field: 'name', message: 'Name is required' });
    // }

    if (!data.scheduledDate) {
      errors.push({ field: 'scheduledDate', message: 'Scheduled date is required' });
    }

    if (data.mealCount !== undefined && data.mealCount < 0) {
      errors.push({ field: 'mealCount', message: 'Meal count cannot be negative' });
    }

    if (errors.length > 0) {
      const error = new ValidationError(errors[0].message);
      error.field = errors[0].field;
      throw error;
    }
  }
}

export default CleanRunService;