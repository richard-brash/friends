import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { query } from '../../../database.js';
import RunRepository from '../../../repositories/runRepository.js';

// Mock the database module
vi.mock('../../../database.js', () => ({
  query: vi.fn()
}));

describe('RunRepository', () => {
  let runRepository;

  beforeEach(() => {
    runRepository = new RunRepository();
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all runs with aggregated counts', async () => {
      // Arrange
      const mockRuns = [
        {
          id: 1,
          route_id: 1,
          name: 'AACo Friday 2025-10-24',
          scheduled_date: '2025-10-24',
          start_time: '09:00:00',
          end_time: '12:00:00',
          meal_count: 35,
          status: 'scheduled',
          notes: 'Regular Friday run',
          created_by: 1,
          created_at: new Date('2025-10-17T10:00:00Z'),
          updated_at: new Date('2025-10-17T10:00:00Z'),
          route_name: 'AACo',
          route_color: '#1976d2',
          created_by_name: 'Admin User',
          team_size: '3',
          request_count: '5'
        }
      ];

      query.mockResolvedValueOnce({ rows: mockRuns });

      // Act
      const runs = await runRepository.getAll();

      // Assert
      expect(runs).toHaveLength(1);
      expect(runs[0]).toMatchObject({
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        meal_count: 35,
        status: 'scheduled'
      });
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        []
      );
    });

    it('should filter by status', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await runRepository.getAll({ status: 'scheduled' });

      // Assert
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.status = $1'),
        ['scheduled']
      );
    });

    it('should filter by date range', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await runRepository.getAll({
        fromDate: '2025-10-20',
        toDate: '2025-10-25'
      });

      // Assert
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/scheduled_date >= \$1.*scheduled_date <= \$2/),
        ['2025-10-20', '2025-10-25']
      );
    });
  });

  describe('getById', () => {
    it('should return run when found', async () => {
      // Arrange
      const mockRun = {
        id: 1,
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        scheduled_date: '2025-10-24',
        meal_count: 35,
        status: 'scheduled'
      };

      query.mockResolvedValueOnce({ rows: [mockRun] });

      // Act
      const run = await runRepository.getById(1);

      // Assert
      expect(run).toMatchObject(mockRun);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.id = $1'),
        [1]
      );
    });

    it('should return null when not found', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      const run = await runRepository.getById(999);

      // Assert
      expect(run).toBeNull();
    });
  });

  describe('create', () => {
    it('should create run with all fields including meal_count', async () => {
      // Arrange
      const runData = {
        route_id: 1,
        name: 'AACo Friday 2025-10-24',
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        end_time: '12:00:00',
        meal_count: 35,
        status: 'scheduled',
        notes: 'Regular Friday run',
        created_by: 1
      };

      const mockCreatedRun = { id: 1, ...runData };
      query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runRepository.create(runData);

      // Assert
      expect(created).toMatchObject(mockCreatedRun);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO runs'),
        expect.arrayContaining([
          1, // route_id
          'AACo Friday 2025-10-24', // name
          '2025-10-24', // scheduled_date
          '09:00:00', // start_time
          '12:00:00', // end_time
          35, // meal_count
          'scheduled', // status
          'Regular Friday run', // notes
          1 // created_by
        ])
      );
    });

    it('should use default meal_count of 0 if not provided', async () => {
      // Arrange
      const runData = {
        route_id: 1,
        name: 'Test Run',
        scheduled_date: '2025-10-24',
        start_time: '09:00:00',
        created_by: 1
      };

      const mockCreatedRun = { id: 1, ...runData, meal_count: 0 };
      query.mockResolvedValueOnce({ rows: [mockCreatedRun] });

      // Act
      const created = await runRepository.create(runData);

      // Assert
      expect(created.meal_count).toBe(0);
    });
  });

  describe('update', () => {
    it('should update run including meal_count', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Run',
        meal_count: 40,
        status: 'in_progress'
      };

      const mockUpdatedRun = { id: 1, ...updateData };
      query.mockResolvedValueOnce({ rows: [mockUpdatedRun] });

      // Act
      const updated = await runRepository.update(1, updateData);

      // Assert
      expect(updated).toMatchObject(mockUpdatedRun);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE runs'),
        expect.arrayContaining([
          'Updated Run', // name
          40, // meal_count
          'in_progress', // status
          1 // id
        ])
      );
    });

    it('should return current record if nothing to update', async () => {
      // Arrange
      const mockRun = { id: 1, name: 'Test Run' };
      query.mockResolvedValueOnce({ rows: [mockRun] });

      // Act
      const result = await runRepository.update(1, {});

      // Assert
      expect(result).toEqual(mockRun);
      // Should call getById, not UPDATE
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.id = $1'),
        [1]
      );
    });
  });

  describe('delete', () => {
    it('should delete run and return deleted record', async () => {
      // Arrange
      const mockDeletedRun = { id: 1, name: 'Deleted Run' };
      query.mockResolvedValueOnce({ rows: [mockDeletedRun] });

      // Act
      const deleted = await runRepository.delete(1);

      // Assert
      expect(deleted).toEqual(mockDeletedRun);
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM runs WHERE id = $1 RETURNING *',
        [1]
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return team members ordered by created_at ASC for lead identification', async () => {
      // Arrange
      const mockTeamMembers = [
        {
          id: 1,
          run_id: 1,
          user_id: 2,
          created_at: new Date('2025-10-17T10:01:00Z'), // First = lead
          user_name: 'John Coordinator',
          user_email: 'john@example.com',
          user_phone: '555-0001'
        },
        {
          id: 2,
          run_id: 1,
          user_id: 3,
          created_at: new Date('2025-10-17T10:02:00Z'), // Second = regular member
          user_name: 'Sarah Volunteer',
          user_email: 'sarah@example.com',
          user_phone: '555-0002'
        }
      ];

      query.mockResolvedValueOnce({ rows: mockTeamMembers });

      // Act
      const team = await runRepository.getTeamMembers(1);

      // Assert
      expect(team).toHaveLength(2);
      expect(team[0].user_name).toBe('John Coordinator'); // Lead (first)
      expect(team[1].user_name).toBe('Sarah Volunteer'); // Regular member
      
      // Critical: verify ORDER BY created_at ASC for lead identification
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY rtm.created_at ASC'),
        [1]
      );
    });

    it('should NOT reference removed role field', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await runRepository.getTeamMembers(1);

      // Assert - query should NOT select or order by role field
      const calledQuery = query.mock.calls[0][0];
      expect(calledQuery).not.toContain('rtm.role');
      expect(calledQuery).not.toContain('ORDER BY rtm.role');
    });
  });

  describe('addTeamMember', () => {
    it('should add team member with timestamp for lead tracking', async () => {
      // Arrange
      const mockTeamMember = {
        id: 1,
        run_id: 1,
        user_id: 2,
        created_at: new Date('2025-10-17T10:01:00Z')
      };

      query.mockResolvedValueOnce({ rows: [mockTeamMember] });

      // Act
      const member = await runRepository.addTeamMember(1, 2);

      // Assert
      expect(member).toMatchObject({
        run_id: 1,
        user_id: 2,
        created_at: expect.any(Date)
      });

      // Should NOT reference role field (we removed it)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO run_team_members'),
        expect.not.arrayContaining([expect.stringContaining('role')])
      );
    });

    it('should NOT accept role parameter (field was removed)', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [{ id: 1, run_id: 1, user_id: 2 }] });

      // Act
      await runRepository.addTeamMember(1, 2);

      // Assert - should only pass run_id and user_id, NO role
      const calledQuery = query.mock.calls[0][0];
      expect(calledQuery).not.toContain('role');
      
      const calledParams = query.mock.calls[0][1];
      expect(calledParams).toHaveLength(2); // Only run_id and user_id
    });
  });

  describe('removeTeamMember', () => {
    it('should remove team member', async () => {
      // Arrange
      const mockRemovedMember = { id: 1, run_id: 1, user_id: 2 };
      query.mockResolvedValueOnce({ rows: [mockRemovedMember] });

      // Act
      const removed = await runRepository.removeTeamMember(1, 2);

      // Assert
      expect(removed).toEqual(mockRemovedMember);
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM run_team_members WHERE run_id = $1 AND user_id = $2 RETURNING *',
        [1, 2]
      );
    });
  });

  describe('getRunRequests', () => {
    it('should return requests ordered by location route_order', async () => {
      // Arrange
      const mockRequests = [
        {
          id: 1,
          friend_id: 1,
          location_id: 8,
          friend_name: 'David',
          location_name: "Ollie's",
          location_order: 1
        },
        {
          id: 2,
          friend_id: 2,
          location_id: 13,
          friend_name: 'Danielle',
          location_name: 'Village Liquors',
          location_order: 2
        }
      ];

      query.mockResolvedValueOnce({ rows: mockRequests });

      // Act
      const requests = await runRepository.getRunRequests(1);

      // Assert
      expect(requests).toHaveLength(2);
      expect(requests[0].location_order).toBe(1);
      expect(requests[1].location_order).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY l.route_order'),
        [1]
      );
    });
  });
});
