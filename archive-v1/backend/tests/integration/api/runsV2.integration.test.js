import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testDb } from '../../utils/testDatabase.js';
import { createTestUser, getAuthToken, createTestRoute } from '../../utils/testHelpers.js';
import runsV2Router from '../../../routes/v2/runs.js';
import errorHandler from '../../../middleware/errorHandler.js';

describe('Runs V2 API Integration', () => {
  let app;
  let authToken;
  let testUser;
  let testRoute;

  beforeAll(async () => {
    // Set up test app
    app = express();
    app.use(express.json());
    
    // Mock auth middleware for testing
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        req.user = testUser;
      }
      next();
    });
    
    app.use('/api/v2/runs', runsV2Router);
    app.use(errorHandler);

    // Set up test database and user
    await testDb.start();
    await testDb.reset();
    
    testUser = await createTestUser('coordinator');
    authToken = await getAuthToken(testUser);
    testRoute = await createTestRoute();
  });

  afterAll(async () => {
    await testDb.stop();
  });

  beforeEach(async () => {
    await testDb.reset();
    testUser = await createTestUser('coordinator');
    testRoute = await createTestRoute();
  });

  describe('GET /api/v2/runs', () => {
    it('should return runs list with proper date formatting', async () => {
      // Create a test run directly in database
      const runResult = await testDb.query(`
        INSERT INTO runs (route_id, name, scheduled_date, start_time, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [testRoute.id, 'Integration Test Run', '2025-10-20', '09:30:00', 'scheduled', testUser.id]);

      const response = await request(app)
        .get('/api/v2/runs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      const run = response.body.data[0];
      
      // Verify proper data transformation
      expect(run).toHaveProperty('id');
      expect(run).toHaveProperty('routeId');
      expect(run).toHaveProperty('scheduledDate');
      expect(run).toHaveProperty('createdAt');
      
      // This should NOT throw "Invalid time value"
      expect(() => new Date(run.scheduledDate)).not.toThrow();
      expect(new Date(run.scheduledDate).getTime()).not.toBeNaN();
      
      // Verify the specific date formatting issue is fixed
      expect(run.scheduledDate).toBe('2025-10-20T09:30:00.000Z');
    });

    it('should handle filters correctly', async () => {
      // Create runs with different statuses
      await testDb.query(`
        INSERT INTO runs (route_id, name, scheduled_date, start_time, status, created_by)
        VALUES 
          ($1, 'Scheduled Run', '2025-10-20', '09:00:00', 'scheduled', $2),
          ($1, 'Completed Run', '2025-10-19', '10:00:00', 'completed', $2)
      `, [testRoute.id, testUser.id]);

      const response = await request(app)
        .get('/api/v2/runs?status=scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('scheduled');
      expect(response.body.meta.filters.status).toBe('scheduled');
    });
  });

  describe('GET /api/v2/runs/:id', () => {
    it('should return single run with proper formatting', async () => {
      // Create test run
      const runResult = await testDb.query(`
        INSERT INTO runs (route_id, name, scheduled_date, start_time, end_time, status, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [testRoute.id, 'Single Run Test', '2025-10-20', '14:30:00', '17:30:00', 'scheduled', 'Test notes', testUser.id]);

      const runId = runResult.rows[0].id;

      const response = await request(app)
        .get(`/api/v2/runs/${runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(runId);
      expect(response.body.data.name).toBe('Single Run Test');
      expect(response.body.data.scheduledDate).toBe('2025-10-20T14:30:00.000Z');
      expect(response.body.data.startTime).toBe('14:30:00');
      expect(response.body.data.endTime).toBe('17:30:00');
      expect(response.body.data.notes).toBe('Test notes');
    });

    it('should return 404 for non-existent run', async () => {
      const response = await request(app)
        .get('/api/v2/runs/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Run with id 999 not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/v2/runs/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v2/runs', () => {
    it('should create new run with proper data transformation', async () => {
      const runData = {
        routeId: testRoute.id,
        name: 'New Integration Test Run',
        scheduledDate: '2025-10-25',
        startTime: '08:00:00',
        endTime: '16:00:00',
        notes: 'Created via integration test'
      };

      const response = await request(app)
        .post('/api/v2/runs')
        .send(runData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(runData.name);
      expect(response.body.data.routeId).toBe(runData.routeId);
      expect(response.body.data.scheduledDate).toBe('2025-10-25T08:00:00.000Z');
      expect(response.body.data.status).toBe('scheduled'); // Default status
      
      // Verify run was actually created in database
      const dbResult = await testDb.query('SELECT * FROM runs WHERE id = $1', [response.body.data.id]);
      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].name).toBe(runData.name);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v2/runs')
        .send({}) // Missing required fields
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.field).toBeTruthy();
    });
  });

  describe('PUT /api/v2/runs/:id', () => {
    it('should update existing run', async () => {
      // Create a run to update
      const runResult = await testDb.query(`
        INSERT INTO runs (route_id, name, scheduled_date, start_time, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [testRoute.id, 'Original Name', '2025-10-20', '09:00:00', 'scheduled', testUser.id]);

      const runId = runResult.rows[0].id;
      const updateData = {
        name: 'Updated Name',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/v2/runs/${runId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(runId);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.status).toBe('in_progress');
    });
  });

  describe('DELETE /api/v2/runs/:id', () => {
    it('should delete existing run', async () => {
      // Create a run to delete
      const runResult = await testDb.query(`
        INSERT INTO runs (route_id, name, scheduled_date, start_time, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [testRoute.id, 'To Delete', '2025-10-20', '09:00:00', 'scheduled', testUser.id]);

      const runId = runResult.rows[0].id;

      const response = await request(app)
        .delete(`/api/v2/runs/${runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(runId);

      // Verify run was actually deleted
      const dbResult = await testDb.query('SELECT * FROM runs WHERE id = $1', [runId]);
      expect(dbResult.rows.length).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error by providing invalid route ID
      const runData = {
        routeId: 99999, // Non-existent route
        name: 'Error Test Run',
        scheduledDate: '2025-10-25'
      };

      const response = await request(app)
        .post('/api/v2/runs')
        .send(runData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });
});