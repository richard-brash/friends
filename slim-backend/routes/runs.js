// Runs Routes
// Runs CRUD endpoints with team and execution management

import express from 'express';
import pool from '../database.js';
import RunRepository from '../repositories/RunRepository.js';
import RouteRepository from '../repositories/RouteRepository.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const runRepo = new RunRepository(pool);
const routeRepo = new RouteRepository(pool);

/**
 * GET /api/runs
 * Get all runs with filtering
 * Query params: status, routeId, limit, offset
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, routeId, limit = 50, offset = 0 } = req.query;

  const runs = await runRepo.getAllWithDetails({
    status,
    routeId: routeId ? parseInt(routeId) : undefined,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Get total count
  let countWhere = '';
  const countParams = [];
  if (status) {
    countWhere = 'status = $1';
    countParams.push(status);
  }
  const totalCount = await runRepo.count(countWhere, countParams);

  res.json({
    data: runs.map(r => ({
      id: r.id,
      name: r.name,
      routeId: r.route_id,
      routeName: r.route_name,
      scheduledDate: r.scheduled_date,
      status: r.status,
      currentLocationId: r.current_location_id,
      currentLocationName: r.current_location_name,
      currentStopNumber: r.current_stop_number,
      mealCount: r.meal_count,
      teamSize: parseInt(r.team_size),
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })),
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: totalCount
    }
  });
}));

/**
 * GET /api/runs/:id
 * Get single run with full details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const run = await runRepo.getByIdWithDetails(parseInt(id));
  
  if (!run) {
    throw new NotFoundError('Run', id);
  }

  res.json({
    id: run.id,
    name: run.name,
    routeId: run.route_id,
    routeName: run.route_name,
    routeDescription: run.route_description,
    scheduledDate: run.scheduled_date,
    status: run.status,
    currentLocationId: run.current_location_id,
    currentLocationName: run.current_location_name,
    currentStopNumber: run.current_stop_number,
    mealCount: run.meal_count,
    notes: run.notes,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    team: run.team.map(tm => ({
      id: tm.id,
      userId: tm.user_id,
      userName: tm.user_name,
      userEmail: tm.user_email,
      joinedAt: tm.created_at
    })),
    locations: run.locations.map(l => ({
      id: l.id,
      name: l.name,
      address: l.address,
      city: l.city,
      state: l.state,
      routeOrder: l.route_order,
      notes: l.notes
    })),
    deliveries: run.deliveries.map(d => ({
      id: d.id,
      locationId: d.location_id,
      locationName: d.location_name,
      routeOrder: d.route_order,
      mealsDelivered: d.meals_delivered,
      weeklyItems: d.weekly_items,
      notes: d.notes,
      deliveredBy: d.delivered_by,
      deliveredByName: d.delivered_by_name,
      deliveredAt: d.delivered_at
    }))
  });
}));

/**
 * POST /api/runs
 * Create a new run (auto-generates name)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { routeId, scheduledDate, mealCount, notes } = req.body;

  if (!routeId) {
    throw new ValidationError('Route ID is required');
  }

  if (!scheduledDate) {
    throw new ValidationError('Scheduled date is required');
  }

  // Verify route exists
  const route = await routeRepo.getById(parseInt(routeId));
  if (!route) {
    throw new NotFoundError('Route', routeId);
  }

  // Create run with auto-generated name
  const run = await runRepo.createWithAutoName({
    route_id: parseInt(routeId),
    scheduled_date: scheduledDate,
    meal_count: mealCount ? parseInt(mealCount) : null,
    notes: notes || null
  });

  res.status(201).json({
    id: run.id,
    name: run.name,
    routeId: run.route_id,
    scheduledDate: run.scheduled_date,
    status: run.status,
    mealCount: run.meal_count,
    notes: run.notes,
    createdAt: run.created_at,
    updatedAt: run.updated_at
  });
}));

/**
 * PUT /api/runs/:id
 * Update run details
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mealCount, notes } = req.body;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  // Cannot edit in_progress or completed runs
  if (existing.status === 'in_progress' || existing.status === 'completed') {
    throw new ValidationError(`Cannot edit run with status: ${existing.status}`);
  }

  const updateData = {};
  if (mealCount !== undefined) updateData.meal_count = parseInt(mealCount);
  if (notes !== undefined) updateData.notes = notes;

  const run = await runRepo.update(parseInt(id), updateData);

  res.json({
    id: run.id,
    name: run.name,
    routeId: run.route_id,
    scheduledDate: run.scheduled_date,
    status: run.status,
    mealCount: run.meal_count,
    notes: run.notes,
    updatedAt: run.updated_at
  });
}));

/**
 * DELETE /api/runs/:id
 * Cancel a run (only if not in_progress or completed)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  // Cannot delete in_progress or completed runs
  if (existing.status === 'in_progress' || existing.status === 'completed') {
    throw new ValidationError(`Cannot delete run with status: ${existing.status}`);
  }

  const run = await runRepo.updateStatus(parseInt(id), 'cancelled');

  res.json({
    message: 'Run cancelled successfully',
    id: run.id,
    status: run.status
  });
}));

/**
 * POST /api/runs/:id/team
 * Add user to run team
 */
router.post('/:id/team', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const run = await runRepo.getById(parseInt(id));
  if (!run) {
    throw new NotFoundError('Run', id);
  }

  const teamMember = await runRepo.addTeamMember(parseInt(id), parseInt(userId));

  res.status(201).json({
    id: teamMember.id,
    runId: teamMember.run_id,
    userId: teamMember.user_id,
    joinedAt: teamMember.created_at
  });
}));

/**
 * DELETE /api/runs/:id/team/:userId
 * Remove user from run team
 */
router.delete('/:id/team/:userId', authenticate, asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const run = await runRepo.getById(parseInt(id));
  if (!run) {
    throw new NotFoundError('Run', id);
  }

  // Cannot remove from completed run
  if (run.status === 'completed') {
    throw new ValidationError('Cannot remove team member from completed run');
  }

  const removed = await runRepo.removeTeamMember(parseInt(id), parseInt(userId));

  if (!removed) {
    throw new NotFoundError('Team member');
  }

  res.json({
    message: 'Team member removed successfully',
    runId: parseInt(id),
    userId: parseInt(userId)
  });
}));

/**
 * GET /api/runs/:id/preparation
 * Get run preparation checklist (requests ready for delivery)
 */
router.get('/:id/preparation', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const run = await runRepo.getById(parseInt(id));
  if (!run) {
    throw new NotFoundError('Run', id);
  }

  const checklist = await runRepo.getPreparationChecklist(parseInt(id));

  // Group by location
  const locationMap = new Map();
  
  checklist.forEach(item => {
    if (!locationMap.has(item.location_id)) {
      locationMap.set(item.location_id, {
        locationId: item.location_id,
        locationName: item.location_name,
        routeOrder: item.route_order,
        requests: []
      });
    }
    
    if (item.request_id) {
      locationMap.get(item.location_id).requests.push({
        id: item.request_id,
        itemDescription: item.item_description,
        quantity: item.quantity,
        priority: item.priority,
        status: item.status,
        friendName: [item.first_name, item.last_name, item.alias].filter(Boolean).join(' ') || 'Unknown'
      });
    }
  });

  res.json({
    runId: parseInt(id),
    runName: run.name,
    locations: Array.from(locationMap.values())
  });
}));

/**
 * POST /api/runs/:id/start
 * Start run execution
 */
router.post('/:id/start', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  if (existing.status !== 'prepared') {
    throw new ValidationError('Run must be in "prepared" status to start');
  }

  if (!existing.meal_count) {
    throw new ValidationError('Meal count must be set before starting run');
  }

  const run = await runRepo.startExecution(parseInt(id));

  res.json({
    id: run.id,
    status: run.status,
    currentLocationId: run.current_location_id,
    message: 'Run started successfully'
  });
}));

/**
 * POST /api/runs/:id/next
 * Move to next location
 */
router.post('/:id/next', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  if (existing.status !== 'in_progress') {
    throw new ValidationError('Run must be in progress');
  }

  const run = await runRepo.moveToNextLocation(parseInt(id));

  // If no more locations, complete the run
  if (!run.current_location_id) {
    await runRepo.completeRun(parseInt(id));
    return res.json({
      id: run.id,
      status: 'completed',
      message: 'Run completed - no more locations'
    });
  }

  res.json({
    id: run.id,
    status: run.status,
    currentLocationId: run.current_location_id,
    message: 'Moved to next location'
  });
}));

/**
 * POST /api/runs/:id/complete
 * Complete the run
 */
router.post('/:id/complete', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  if (existing.status !== 'in_progress') {
    throw new ValidationError('Only in-progress runs can be completed');
  }

  const run = await runRepo.completeRun(parseInt(id));

  res.json({
    id: run.id,
    status: run.status,
    message: 'Run completed successfully'
  });
}));

/**
 * POST /api/runs/:id/deliveries
 * Record delivery at a location
 */
router.post('/:id/deliveries', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { locationId, mealsDelivered, weeklyItems, notes } = req.body;

  if (!locationId) {
    throw new ValidationError('Location ID is required');
  }

  if (mealsDelivered === undefined || mealsDelivered < 0) {
    throw new ValidationError('Meals delivered must be a non-negative number');
  }

  const run = await runRepo.getById(parseInt(id));
  if (!run) {
    throw new NotFoundError('Run', id);
  }

  const delivery = await runRepo.recordDelivery({
    run_id: parseInt(id),
    location_id: parseInt(locationId),
    meals_delivered: parseInt(mealsDelivered),
    weekly_items: weeklyItems || null,
    notes: notes || null,
    delivered_by: req.user.id,
    delivered_at: new Date()
  });

  res.status(201).json({
    id: delivery.id,
    runId: delivery.run_id,
    locationId: delivery.location_id,
    mealsDelivered: delivery.meals_delivered,
    weeklyItems: delivery.weekly_items,
    notes: delivery.notes,
    deliveredBy: delivery.delivered_by,
    deliveredAt: delivery.delivered_at
  });
}));

/**
 * PATCH /api/runs/:id/prepare
 * Mark run as prepared (ready to start)
 */
router.patch('/:id/prepare', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await runRepo.getById(parseInt(id));
  if (!existing) {
    throw new NotFoundError('Run', id);
  }

  if (existing.status !== 'planned') {
    throw new ValidationError('Only planned runs can be marked as prepared');
  }

  if (!existing.meal_count) {
    throw new ValidationError('Meal count must be set before preparing run');
  }

  const run = await runRepo.updateStatus(parseInt(id), 'prepared');

  res.json({
    id: run.id,
    status: run.status,
    message: 'Run marked as prepared'
  });
}));

export default router;
