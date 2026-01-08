/**
 * Friends V2 API Routes - Clean Architecture
 * Follows established patterns from V2 runs routes
 */

import express from 'express';
import { authenticateToken, authorizeRoles } from '../../src/middleware/auth.js';
import CleanFriendService from '../../services/cleanFriendService.js';
import { query } from '../../database.js';
import errorHandler from '../../middleware/errorHandler.js';

const router = express.Router();

// Initialize service with database dependency
const friendService = new CleanFriendService({ query });

// All friends routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v2/friends
 * Get all friends with optional filtering
 * Query params: status, locationId, search
 */
router.get('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const { status, locationId, search } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (locationId) filters.locationId = parseInt(locationId);
    if (search) filters.search = search;

    const friends = await friendService.getAll(filters);
    
    res.json({
      success: true,
      data: friends,
      count: friends.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/friends/:id
 * Get single friend with full details including requests
 */
router.get('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const friend = await friendService.getById(req.params.id);
    
    res.json({
      success: true,
      data: friend
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/friends
 * Create new friend
 */
router.post('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const friend = await friendService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: friend,
      message: 'Friend created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/friends/:id
 * Update existing friend
 */
router.put('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const friend = await friendService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: friend,
      message: 'Friend updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v2/friends/:id
 * Soft delete friend (set status to inactive)
 */
router.delete('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const friend = await friendService.delete(req.params.id);
    
    res.json({
      success: true,
      data: friend,
      message: 'Friend deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/friends/search/:term
 * Search friends by name or nickname
 */
router.get('/search/:term', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const friends = await friendService.search(req.params.term);
    
    res.json({
      success: true,
      data: friends,
      count: friends.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/friends/:id/location-history
 * Get location history for a specific friend
 */
router.get('/:id/location-history', authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res, next) => {
  try {
    const locationHistory = await friendService.getLocationHistory(req.params.id);
    
    res.json({
      success: true,
      data: locationHistory,
      count: locationHistory.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/friends/:id/location-history
 * Add new location history entry for a friend
 */
router.post('/:id/location-history', authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res, next) => {
  try {
    const locationHistory = await friendService.addLocationHistory(req.params.id, req.body);
    
    res.status(201).json({
      success: true,
      data: locationHistory,
      message: 'Location history added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Apply error handler
router.use(errorHandler);

export default router;
