/**
 * Locations V2 API Routes - Clean Architecture
 * Follows established patterns from V2 runs and friends routes
 */

import express from 'express';
import { authenticateToken, authorizeRoles } from '../../src/middleware/auth.js';
import CleanLocationService from '../../services/cleanLocationService.js';
import { query } from '../../database.js';
import errorHandler from '../../middleware/errorHandler.js';

const router = express.Router();

// Initialize service with database dependency
const locationService = new CleanLocationService({ query });

// All location routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v2/locations
 * Get all locations with optional filtering
 * Query params: routeId, type, search
 */
router.get('/', authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res, next) => {
  try {
    const { routeId, type, search } = req.query;
    
    const filters = {};
    if (routeId) filters.routeId = routeId;
    if (type) filters.type = type;
    if (search) filters.search = search;

    const locations = await locationService.getAll(filters);
    
    res.json({
      success: true,
      data: locations,
      count: locations.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/locations/:id
 * Get single location with full details including current friends
 */
router.get('/:id', authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res, next) => {
  try {
    const location = await locationService.getById(req.params.id);
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/locations
 * Create new location
 */
router.post('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const location = await locationService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/locations/:id
 * Update existing location
 */
router.put('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const location = await locationService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v2/locations/:id
 * Delete location (only if no friends currently assigned)
 */
router.delete('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const location = await locationService.delete(req.params.id);
    
    res.json({
      success: true,
      data: location,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/locations/search/:term
 * Search locations by name or address
 */
router.get('/search/:term', authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res, next) => {
  try {
    const locations = await locationService.search(req.params.term);
    
    res.json({
      success: true,
      data: locations,
      count: locations.length
    });
  } catch (error) {
    next(error);
  }
});

// Apply error handler
router.use(errorHandler);

export default router;