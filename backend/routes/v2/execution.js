import express from 'express';
import RunExecutionService from '../../services/runExecutionService.js';
import { authenticateToken } from '../../src/middleware/auth.js';

const router = express.Router();

/**
 * Run Execution API Routes (V2)
 * Handles field execution: preparation, navigation, delivery tracking, friend spotting
 */

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v2/runs/:id/preparation
 * Get pre-run loading checklist
 */
router.get('/:id/preparation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = new RunExecutionService(req.app.locals.db);
    
    const data = await service.getPreparationData(parseInt(id));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/execution/:id
 * Get full execution context for active run
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = new RunExecutionService(req.app.locals.db);
    
    const data = await service.getExecutionContext(parseInt(id));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/runs/:id/start
 * Start a run (set status to in_progress, move to first stop)
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const service = new RunExecutionService(req.app.locals.db);
    
    const run = await service.startRun(parseInt(id), userId);
    
    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/runs/:id/advance
 * Move to next stop on route
 */
router.post('/:id/advance', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const service = new RunExecutionService(req.app.locals.db);
    
    const run = await service.advanceToNextStop(parseInt(id), userId);
    
    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/runs/:id/previous
 * Go back to previous stop
 */
router.post('/:id/previous', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const service = new RunExecutionService(req.app.locals.db);
    
    const run = await service.returnToPreviousStop(parseInt(id), userId);
    
    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/runs/:id/stop-delivery
 * Record meals delivered at a stop
 */
router.post('/:id/stop-delivery', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { locationId, mealsDelivered, notes } = req.body;
    const userId = req.user.id;
    const service = new RunExecutionService(req.app.locals.db);
    
    const delivery = await service.recordStopDelivery(
      parseInt(id),
      locationId,
      mealsDelivered,
      notes,
      userId
    );
    
    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/runs/:id/spot-friend
 * Record friend spotting at a location
 */
router.post('/:id/spot-friend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { friendId, locationId, notes } = req.body;
    const userId = req.user.id;
    const service = new RunExecutionService(req.app.locals.db);
    
    const spotting = await service.spotFriend(
      parseInt(id),
      friendId,
      locationId,
      notes,
      userId
    );
    
    res.json({
      success: true,
      data: spotting
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/runs/:id/changes
 * Get changes since timestamp (for polling)
 */
router.get('/:id/changes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { since } = req.query;
    
    if (!since) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: since'
      });
    }
    
    const service = new RunExecutionService(req.app.locals.db);
    const changes = await service.getChangesSince(parseInt(id), since);
    
    res.json({
      success: true,
      data: changes
    });
  } catch (error) {
    next(error);
  }
});

export default router;
