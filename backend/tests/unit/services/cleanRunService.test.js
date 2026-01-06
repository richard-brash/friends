import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationError, NotFoundError, DatabaseError } from '../../../utils/errors.js';

// We'll implement this clean service following our architecture
// This test defines the contract for the new RunService
describe('CleanRunService', () => {
  let runService;
  let mockRepository;
  let mockLogger;

  beforeEach(async () => {
    // Mock repository
    mockRepository = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getTeamMembers: vi.fn()
    };
    
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    };

    // Import and instantiate service
    const { default: RunService } = await import('../../../services/cleanRunService.js');
    runService = new RunService(mockRepository, mockLogger);
  });

  describe('getAll', () => {
    it('should return array of transformed runs', async () => {
      // Arrange - mock repository response
      const mockDbRows = [
        {
          id: 1,
          route_id: 1,
          name: 'Downtown Delivery',
          scheduled_date: '2025-10-20',
          start_time: '09:00:00',
          end_time: '12:00:00',
          meal_count: 35,
          status: 'scheduled',
          notes: 'Morning run',
          created_at: new Date('2025-10-16T10:00:00Z'),
          updated_at: new Date('2025-10-16T10:00:00Z'),
          route_name: 'Downtown Route',
          route_color: '#1976d2',
          created_by_name: 'John Coordinator',
          team_size: '2',
          request_count: '5'
        }
      ];
      
      mockRepository.getAll.mockResolvedValueOnce(mockDbRows);

      // Act
      const runs = await runService.getAll();

      // Assert
      expect(runs).toHaveLength(1);
      expect(runs[0]).toEqual({
        id: 1,
        routeId: 1,
        name: 'Downtown Delivery',
        scheduledDate: '2025-10-20T09:00:00.000Z', // Properly formatted ISO date
        startTime: '09:00:00',
        endTime: '12:00:00',
        mealCount: 35,
        status: 'scheduled',
        notes: 'Morning run',
        createdAt: '2025-10-16T10:00:00.000Z',
        updatedAt: '2025-10-16T10:00:00.000Z',
        route: {
          name: 'Downtown Route',
          color: '#1976d2'
        },
        createdByName: 'John Coordinator',
        teamSize: 2, // Converted to number
        requestCount: 5 // Converted to number
      });

      // Verify repository was called
      expect(mockRepository.getAll).toHaveBeenCalledWith({});
    });

    it('should handle filters correctly', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      const filters = {
        status: 'scheduled',
        fromDate: '2025-10-20',
        toDate: '2025-10-25'
      };

      // Act
      await runService.getAll(filters);

      // Assert - verify filters were passed to query
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['scheduled', '2025-10-20', '2025-10-25'])
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Connection lost');
      mockDb.query.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(runService.getAll()).rejects.toThrow(DatabaseError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'CleanRunService.getAll failed',
        expect.objectContaining({ error: dbError })
      );
    });
  });

  describe('getById', () => {
    it('should return transformed run when found', async () => {
      // Arrange
      const mockDbRow = {
        id: 1,
        route_id: 1,
        name: 'Test Run',
        scheduled_date: '2025-10-20',
        start_time: '09:00:00',
        status: 'scheduled',
        created_at: new Date('2025-10-16T10:00:00Z'),
        route_name: 'Test Route',
        route_color: '#1976d2'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      // Act
      const run = await runService.getById(1);

      // Assert
      expect(run).toMatchObject({
        id: 1,
        routeId: 1,
        name: 'Test Run',
        scheduledDate: '2025-10-20T09:00:00.000Z',
        status: 'scheduled'
      });
    });

    it('should throw NotFoundError when run not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] }); // Use mockResolvedValue (no "Once")

      // Act & Assert
      await expect(runService.getById(999)).rejects.toThrow(NotFoundError);
      await expect(runService.getById(999)).rejects.toThrow('Run with id 999 not found');
    });

    it('should throw ValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(runService.getById(null)).rejects.toThrow(ValidationError);
      await expect(runService.getById('invalid')).rejects.toThrow(ValidationError);
      await expect(runService.getById('')).rejects.toThrow(ValidationError);
    });
  });

  describe('create', () => {
    it('should create and return transformed run', async () => {
      // Arrange
      const inputData = {
        routeId: 1,
        name: 'New Run',
        scheduledDate: '2025-10-20',
        startTime: '09:00:00',
        endTime: '17:00:00',
        notes: 'Test run'
      };

      const mockCreatedRow = {
        id: 1,
        route_id: 1,
        name: 'New Run',
        scheduled_date: '2025-10-20',
        start_time: '09:00:00',
        end_time: '17:00:00',
        status: 'scheduled',
        notes: 'Test run',
        created_at: new Date('2025-10-16T10:00:00Z'),
        updated_at: new Date('2025-10-16T10:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedRow] });

      // Act
      const created = await runService.create(inputData);

      // Assert
      expect(created).toMatchObject({
        id: 1,
        routeId: 1,
        name: 'New Run',
        scheduledDate: '2025-10-20T09:00:00.000Z',
        status: 'scheduled'
      });

      // Verify INSERT query was called
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO runs'),
        expect.any(Array)
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Run created successfully',
        { id: 1 }
      );
    });

    it('should validate required fields', async () => {
      // Act & Assert - missing required fields
      await expect(runService.create({})).rejects.toThrow(ValidationError);
      await expect(runService.create({ name: 'Test' })).rejects.toThrow(ValidationError);
      
      // Should specifically mention missing field
      try {
        await runService.create({});
      } catch (error) {
        expect(error.field).toBeDefined();
      }
    });
  });

  describe('update', () => {
    it('should update and return transformed run', async () => {
      // Arrange - mock getById call (to verify exists)
      const existingRun = { id: 1, name: 'Existing Run' };
      const getByIdSpy = vi.spyOn(runService, 'getById');
      getByIdSpy.mockResolvedValueOnce(existingRun);

      const updateData = { name: 'Updated Run', status: 'in_progress' };
      const mockUpdatedRow = {
        id: 1,
        route_id: 1,
        name: 'Updated Run',
        status: 'in_progress',
        scheduled_date: '2025-10-20',
        start_time: '09:00:00',
        created_at: new Date('2025-10-16T10:00:00Z'),
        updated_at: new Date('2025-10-16T11:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockUpdatedRow] });

      // Act
      const updated = await runService.update(1, updateData);

      // Assert
      expect(updated).toMatchObject({
        id: 1,
        name: 'Updated Run',
        status: 'in_progress'
      });

      expect(getByIdSpy).toHaveBeenCalledWith(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE runs'),
        expect.any(Array)
      );
    });

    it('should throw NotFoundError when updating non-existent run', async () => {
      // Arrange
      const getByIdSpy = vi.spyOn(runService, 'getById');
      getByIdSpy.mockRejectedValueOnce(new NotFoundError('Run not found'));

      // Act & Assert
      await expect(runService.update(999, { name: 'Test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete run and return the deleted entity', async () => {
      // Arrange
      const existingRun = { id: 1, name: 'Run to Delete' };
      const getByIdSpy = vi.spyOn(runService, 'getById');
      getByIdSpy.mockResolvedValueOnce(existingRun);

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const deleted = await runService.delete(1);

      // Assert
      expect(deleted).toEqual(existingRun);
      expect(getByIdSpy).toHaveBeenCalledWith(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM runs WHERE id = $1',
        [1]
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Run deleted successfully',
        { id: 1 }
      );
    });
  });

  describe('data transformation', () => {
    it('should properly transform scheduledDate from database format', async () => {
      // This is the core issue we're fixing - proper date handling
      const mockDbRow = {
        id: 1,
        scheduled_date: '2025-10-20',
        start_time: '14:30:00',
        created_at: new Date('2025-10-16T10:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const run = await runService.getById(1);

      // Should create proper ISO date string from date + time
      expect(run.scheduledDate).toBe('2025-10-20T14:30:00.000Z');
      
      // Should be a valid date that doesn't throw "Invalid time value"
      expect(() => new Date(run.scheduledDate)).not.toThrow();
      expect(new Date(run.scheduledDate).getTime()).not.toBeNaN();
    });

    it('should handle missing start_time gracefully', async () => {
      const mockDbRow = {
        id: 1,
        scheduled_date: '2025-10-20',
        start_time: null, // Missing time
        created_at: new Date('2025-10-16T10:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const run = await runService.getById(1);

      // Should default to start of day if no time provided
      expect(run.scheduledDate).toBe('2025-10-20T00:00:00.000Z');
    });

    it('should include meal_count in transformed run', async () => {
      const mockDbRow = {
        id: 1,
        route_id: 1,
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        meal_count: 35,
        created_at: new Date('2025-10-17T10:00:00Z')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const run = await runService.getById(1);

      expect(run.mealCount).toBe(35);
    });
  });

  describe('auto-name generation', () => {
    it('should NOT allow user to provide run name during creation', async () => {
      // Arrange
      const inputData = {
        routeId: 1,
        name: 'User Provided Name', // This should be ignored
        scheduledDate: '2025-10-24',
        startTime: '09:00:00',
        endTime: '12:00:00',
        mealCount: 35
      };

      // Mock route fetch for name generation
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'AACo', color: '#1976d2' }] 
      });

      // Mock run creation
      const mockCreatedRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24', // Auto-generated name
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        end_time: '12:00:00',
        meal_count: 35,
        status: 'scheduled',
        created_at: new Date('2025-10-17T10:00:00Z')
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runService.create(inputData);

      // Assert - name should be auto-generated, not user-provided
      expect(created.name).toBe('AACo Friday 2025-10-24');
      expect(created.name).not.toBe('User Provided Name');
    });

    it('should generate name in format "{route_name} {day_of_week} {YYYY-MM-DD}"', async () => {
      // Arrange - Friday
      const inputData = {
        routeId: 1,
        scheduledDate: '2025-10-24', // This is a Friday
        startTime: '09:00:00',
        endTime: '12:00:00',
        mealCount: 35
      };

      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'AACo', color: '#1976d2' }] 
      });

      const mockCreatedRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        meal_count: 35,
        created_at: new Date('2025-10-17T10:00:00Z')
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runService.create(inputData);

      // Assert
      expect(created.name).toBe('AACo Friday 2025-10-24');
    });

    it('should generate name for different days of week', async () => {
      // Test Monday
      const mondayData = {
        routeId: 2,
        scheduledDate: '2025-10-20', // Monday
        startTime: '09:00:00',
        mealCount: 32
      };

      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 2, name: 'Baltimore City 1' }] 
      });

      const mockMondayRun = {
        id: 2,
        route_id: 2,
        name: 'Baltimore City 1 Monday 2025-10-20',
        scheduled_date: '2025-10-20',
        start_time: '09:00:00',
        meal_count: 32,
        created_at: new Date()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockMondayRun] });

      const mondayRun = await runService.create(mondayData);
      expect(mondayRun.name).toBe('Baltimore City 1 Monday 2025-10-20');

      // Test Wednesday
      const wednesdayData = {
        routeId: 3,
        scheduledDate: '2025-10-22', // Wednesday
        startTime: '14:00:00',
        mealCount: 38
      };

      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 3, name: 'Baltimore City 2' }] 
      });

      const mockWednesdayRun = {
        id: 3,
        route_id: 3,
        name: 'Baltimore City 2 Wednesday 2025-10-22',
        scheduled_date: '2025-10-22',
        start_time: '14:00:00',
        meal_count: 38,
        created_at: new Date()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockWednesdayRun] });

      const wednesdayRun = await runService.create(wednesdayData);
      expect(wednesdayRun.name).toBe('Baltimore City 2 Wednesday 2025-10-22');
    });

    it('should NOT allow updating run name (read-only field)', async () => {
      // Arrange
      const existingRun = {
        id: 1,
        routeId: 1,
        name: 'AACo Friday 2025-10-24',
        scheduledDate: '2025-10-24T09:00:00.000Z',
        mealCount: 35
      };

      const getByIdSpy = vi.spyOn(runService, 'getById');
      getByIdSpy.mockResolvedValueOnce(existingRun);

      const updateData = {
        name: 'Attempted Name Change', // This should be ignored
        mealCount: 40 // This is allowed
      };

      const mockUpdatedRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24', // Name unchanged
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        meal_count: 40, // Updated
        created_at: new Date('2025-10-17T10:00:00Z'),
        updated_at: new Date('2025-10-17T11:00:00Z')
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockUpdatedRun] });

      // Act
      const updated = await runService.update(1, updateData);

      // Assert - name should remain unchanged
      expect(updated.name).toBe('AACo Friday 2025-10-24');
      expect(updated.name).not.toBe('Attempted Name Change');
      expect(updated.mealCount).toBe(40); // But meal count was updated
    });
  });

  describe('meal count management', () => {
    it('should include mealCount in create data', async () => {
      // Arrange
      const inputData = {
        routeId: 1,
        scheduledDate: '2025-10-24',
        startTime: '09:00:00',
        endTime: '12:00:00',
        mealCount: 42
      };

      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'AACo' }] 
      });

      const mockCreatedRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        meal_count: 42,
        created_at: new Date()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runService.create(inputData);

      // Assert
      expect(created.mealCount).toBe(42);
      
      // Verify repository was called with meal_count
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO runs'),
        expect.arrayContaining([42]) // meal_count value
      );
    });

    it('should default mealCount to 0 if not provided', async () => {
      // Arrange
      const inputData = {
        routeId: 1,
        scheduledDate: '2025-10-24',
        startTime: '09:00:00'
        // No mealCount provided
      };

      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'AACo' }] 
      });

      const mockCreatedRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        scheduled_date: '2025-10-24',
        meal_count: 0, // Default
        created_at: new Date()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runService.create(inputData);

      // Assert
      expect(created.mealCount).toBe(0);
    });

    it('should allow updating mealCount', async () => {
      // Arrange
      const existingRun = {
        id: 1,
        mealCount: 35
      };

      const getByIdSpy = vi.spyOn(runService, 'getById');
      getByIdSpy.mockResolvedValueOnce(existingRun);

      const updateData = { mealCount: 45 };

      const mockUpdatedRun = {
        id: 1,
        route_id: 1,
        meal_count: 45,
        scheduled_date: '2025-10-24',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockUpdatedRun] });

      // Act
      const updated = await runService.update(1, updateData);

      // Assert
      expect(updated.mealCount).toBe(45);
    });

    it('should validate mealCount is non-negative', async () => {
      // Arrange
      const inputData = {
        routeId: 1,
        scheduledDate: '2025-10-24',
        startTime: '09:00:00',
        mealCount: -10 // Invalid
      };

      // Act & Assert
      await expect(runService.create(inputData)).rejects.toThrow(ValidationError);
      await expect(runService.create(inputData)).rejects.toThrow('Meal count cannot be negative');
    });
  });
});

